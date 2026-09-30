(function () {
    'use strict';

    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ---------- Brand hover: split the site title into letters (CSS does the animation) ---------- */
    var brand = document.querySelector('[data-brand]');
    var brandText = brand && brand.querySelector('.brand-text');
    if (brandText) {
        var title = brandText.textContent;
        brand.setAttribute('aria-label', title);
        brandText.setAttribute('aria-hidden', 'true');
        brandText.textContent = '';
        var k = 0;
        Array.from(title).forEach(function (ch) {
            if (ch === ' ') { brandText.appendChild(document.createTextNode(' ')); return; }
            var outer = document.createElement('span');
            var inner = document.createElement('span');
            outer.className = 'brand-char';
            outer.style.setProperty('--i', String(k++));
            inner.textContent = ch;
            outer.appendChild(inner);
            brandText.appendChild(outer);
        });
    }

    /* ---------- Mobile menu ---------- */
    var toggle = document.querySelector('[data-menu-toggle]');
    var panel = document.getElementById('hd-panel');
    if (toggle && panel) {
        var labelOpen = toggle.getAttribute('data-label-open') || 'Menu';
        var labelClose = toggle.getAttribute('data-label-close') || 'Close';
        toggle.addEventListener('click', function () {
            var open = panel.hasAttribute('hidden');
            if (open) { panel.removeAttribute('hidden'); } else { panel.setAttribute('hidden', ''); }
            toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
            toggle.textContent = open ? labelClose : labelOpen;
        });
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && !panel.hasAttribute('hidden')) {
                panel.setAttribute('hidden', '');
                toggle.setAttribute('aria-expanded', 'false');
                toggle.textContent = labelOpen;
                toggle.focus();
            }
        });
    }

    /* ---------- Reveal on scroll ---------- */
    // Only elements that start below the fold get hidden, so nothing already on screen flickers.
    if (!reduceMotion && 'IntersectionObserver' in window) {
        var targets = document.querySelectorAll('.feat, .grid > .card, .author, .band, .post-next, .page-head');
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (en) {
                if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
            });
        }, { rootMargin: '0px 0px -8% 0px' });
        var col = 0;
        [].forEach.call(targets, function (el) {
            if (el.getBoundingClientRect().top < window.innerHeight) { return; }
            // cards in the same row come in one after the other
            el.style.setProperty('--d', el.classList.contains('card') ? (col++ % 2) * 0.08 + 's' : '0s');
            el.classList.add('will-reveal');
            io.observe(el);
        });
    }

    /* ---------- Scrollbar (desktop mouse only), same as the portfolio ---------- */
    // Native scrolling stays in charge (wheel, keys, anchors); this only draws the thumb, at a fixed size.
    var bar = document.getElementById('scrollbar');
    var thumb = bar && bar.querySelector('.scrollbar__thumb');
    if (bar && thumb && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
        var root = document.documentElement;
        root.classList.add('has-scrollbar');
        var size = 0, travel = 0, max = 0, idle = 0, ticking = false;
        var measure = function () {
            var view = window.innerHeight;
            max = Math.max(0, root.scrollHeight - view);
            size = max > 0 ? Math.max(48, (view / root.scrollHeight) * (view - 16)) : 0;
            travel = view - 16 - size;
            thumb.style.height = size + 'px';
            bar.classList.toggle('is-empty', max <= 0);
        };
        var place = function () {
            var p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
            thumb.style.transform = 'translateY(' + (p * travel) + 'px)';
        };
        var frame = function () { ticking = false; place(); };
        window.addEventListener('scroll', function () {
            bar.classList.add('is-active');
            window.clearTimeout(idle);
            idle = window.setTimeout(function () { bar.classList.remove('is-active'); }, 900);
            if (!ticking) { ticking = true; window.requestAnimationFrame(frame); }
        }, { passive: true });
        measure();
        place();
        if ('ResizeObserver' in window) { new ResizeObserver(function () { measure(); place(); }).observe(document.body); }
        window.addEventListener('resize', function () { measure(); place(); });

        var dragFrom = -1, scrollFrom = 0;
        thumb.addEventListener('pointerdown', function (e) {
            e.preventDefault();
            thumb.setPointerCapture(e.pointerId);
            dragFrom = e.clientY;
            scrollFrom = window.scrollY;
            bar.classList.add('is-dragging');
        });
        thumb.addEventListener('pointermove', function (e) {
            if (dragFrom < 0 || travel <= 0) { return; }
            window.scrollTo(0, scrollFrom + ((e.clientY - dragFrom) / travel) * max);
        });
        var release = function () { dragFrom = -1; bar.classList.remove('is-dragging'); };
        thumb.addEventListener('pointerup', release);
        thumb.addEventListener('pointercancel', release);
        bar.addEventListener('pointerdown', function (e) {
            if (e.target === thumb || travel <= 0) { return; }
            var y = e.clientY - bar.getBoundingClientRect().top - size / 2;
            window.scrollTo({ top: (Math.min(Math.max(y, 0), travel) / travel) * max, behavior: reduceMotion ? 'auto' : 'smooth' });
        });
    }

    /* ---------- Project deck ---------- */
    // The step bar of the current card fills with a CSS animation; when it ends, the next card comes forward.
    // Hover, keyboard focus, the pause button and leaving the viewport all pause that one animation, so the
    // timing can never drift. With reduced motion the animation does not exist and nothing auto-advances.
    var deck = document.querySelector('[data-deck]');
    if (!deck) { return; }
    var cards = [].slice.call(deck.querySelectorAll('[data-deck-card]'));
    var stage = deck.querySelector('[data-deck-stage]');
    var stepsBox = deck.querySelector('[data-deck-steps]');
    var pauseBtn = deck.querySelector('[data-deck-pause]');
    var link = deck.querySelector('[data-deck-link]');
    var nameEl = deck.querySelector('[data-deck-name]');
    var descEl = deck.querySelector('[data-deck-desc]');
    var n = cards.length;
    var current = 0;
    if (n < 2) { return; }

    var steps = cards.map(function (card, k) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'deck-step';
        b.setAttribute('aria-label', deck.getAttribute('data-l-show') + ': ' + card.getAttribute('data-name'));
        b.addEventListener('click', function () { show(k, true); });
        b.addEventListener('animationend', function () { if (k === current) { show((current + 1) % n, false); } });
        stepsBox.appendChild(b);
        return b;
    });

    function render() {
        cards.forEach(function (card, k) {
            var pos = (k - current + n) % n;
            card.setAttribute('data-pos', String(pos));
            card.setAttribute('aria-hidden', pos === 0 ? 'false' : 'true');
            card.tabIndex = pos === 0 ? 0 : -1;
        });
        steps.forEach(function (s, k) {
            s.classList.toggle('is-done', k < current);
            s.removeAttribute('aria-current');
        });
        // restart the fill animation on the active step
        void steps[current].offsetWidth;
        steps[current].setAttribute('aria-current', 'true');
        var card = cards[current];
        link.href = card.href;
        nameEl.textContent = card.getAttribute('data-name');
        descEl.textContent = card.getAttribute('data-desc');
    }

    function show(k, byUser) {
        if (k === current) { return; }
        var leaving = cards[current];
        leaving.classList.add('is-leaving');
        window.setTimeout(function () { leaving.classList.remove('is-leaving'); }, 700);
        current = k;
        // announce only what the visitor asked for, never the automatic rotation
        link.setAttribute('aria-live', byUser ? 'polite' : 'off');
        render();
    }

    // a card peeking from behind comes forward on click instead of opening its link
    cards.forEach(function (card, k) {
        card.addEventListener('click', function (e) {
            if (k !== current) { e.preventDefault(); show(k, true); }
        });
    });

    pauseBtn.addEventListener('click', function () {
        var paused = deck.classList.toggle('is-paused');
        pauseBtn.setAttribute('aria-pressed', paused ? 'true' : 'false');
        pauseBtn.setAttribute('aria-label', deck.getAttribute(paused ? 'data-l-play' : 'data-l-pause'));
    });

    if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (entries) {
            deck.classList.toggle('is-offscreen', !entries[0].isIntersecting);
        }).observe(deck);
    }

    // a light tilt that follows the mouse (desktop pointers only, never with reduced motion)
    if (!reduceMotion && window.matchMedia('(pointer: fine)').matches) {
        stage.addEventListener('pointermove', function (e) {
            var r = stage.getBoundingClientRect();
            var x = (e.clientX - r.left) / r.width - 0.5;
            var y = (e.clientY - r.top) / r.height - 0.5;
            stage.style.setProperty('--ry', (x * 6).toFixed(2) + 'deg');
            stage.style.setProperty('--rx', (-y * 5).toFixed(2) + 'deg');
        });
        stage.addEventListener('pointerleave', function () {
            stage.style.setProperty('--ry', '0deg');
            stage.style.setProperty('--rx', '0deg');
        });
    }

    deck.classList.add('is-ready');
    render();
})();
