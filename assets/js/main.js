(function () {
    'use strict';

    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
