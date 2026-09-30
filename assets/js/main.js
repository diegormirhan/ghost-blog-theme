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

    /* ---------- "Subscribe" on the home page: go to the hero form and focus the email field ---------- */
    [].forEach.call(document.querySelectorAll('[data-to-newsletter]'), function (link) {
        link.addEventListener('click', function (e) {
            var box = document.getElementById('assinar');
            var input = box && box.querySelector('input[type="email"]');
            if (!input) { return; }
            e.preventDefault();
            if (panel && !panel.hasAttribute('hidden')) { toggle.click(); }
            box.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
            input.focus({ preventScroll: true });
        });
    });

    /* ---------- Hero animation: pause button + pause while off screen ---------- */
    var hero = document.querySelector('[data-hero]');
    var heroBtn = hero && hero.querySelector('[data-hero-pause]');
    if (hero && heroBtn) {
        heroBtn.addEventListener('click', function () {
            var paused = hero.classList.toggle('is-paused');
            heroBtn.setAttribute('aria-pressed', paused ? 'true' : 'false');
            heroBtn.setAttribute('aria-label', heroBtn.getAttribute(paused ? 'data-l-play' : 'data-l-pause'));
        });
        if ('IntersectionObserver' in window) {
            new IntersectionObserver(function (entries) {
                hero.classList.toggle('is-offscreen', !entries[0].isIntersecting);
            }).observe(hero);
        }
    }

    /* ---------- Carousel ---------- */
    var ICONS =
        '<svg class="ip" viewBox="0 0 10 10" aria-hidden="true"><rect x="1" y="0.5" width="3" height="9"/><rect x="6" y="0.5" width="3" height="9"/></svg>' +
        '<svg class="ipl" viewBox="0 0 10 10" aria-hidden="true"><path d="M1.5 0.5v9l7.5-4.5z"/></svg>';

    var banner = document.querySelector('[data-carousel]');
    if (!banner) { return; }

    var slides = [].slice.call(banner.querySelectorAll('[data-slide]'));
    var dots = banner.querySelector('.dots');
    var pp = banner.querySelector('.pp');
    var arrows = [].slice.call(banner.querySelectorAll('[data-dir]'));
    if (!slides.length) { banner.hidden = true; return; }

    var L = {
        pause: banner.getAttribute('data-l-pause') || 'Pause carousel',
        play: banner.getAttribute('data-l-play') || 'Play carousel',
        goto: banner.getAttribute('data-l-goto') || 'Go to item'
    };

    var seconds = parseInt(banner.getAttribute('data-seconds'), 10);
    var duration = seconds > 0 ? seconds * 1000 : 0;
    var index = 0;
    var timer = null;
    var playing = duration > 0 && !reduceMotion;
    var hover = false;
    var focus = false;
    var visible = true;

    banner.classList.add('is-ready');

    if (slides.length < 2) {
        // Nothing to rotate: hide the controls, keep the animated background.
        dots.hidden = true;
        arrows.forEach(function (a) { a.hidden = true; });
        go(0);
        return;
    }

    slides.forEach(function (_, k) {
        var b = document.createElement('button');
        b.type = 'button';
        b.setAttribute('aria-label', L.goto + ' ' + (k + 1));
        b.addEventListener('click', function () { go(k); });
        dots.appendChild(b);
    });

    if (duration === 0) { pp.hidden = true; }
    pp.innerHTML = ICONS;

    function renderState() {
        banner.classList.toggle('paused', !visible || !playing);
        pp.setAttribute('aria-label', playing ? L.pause : L.play);
        pp.setAttribute('aria-pressed', playing ? 'false' : 'true');
    }

    function schedule() {
        clearTimeout(timer);
        if (playing && !hover && !focus && visible && !document.hidden && duration) {
            timer = setTimeout(function () { go(index + 1); }, duration);
        }
    }

    function go(n) {
        index = (n + slides.length) % slides.length;
        slides.forEach(function (s, k) {
            s.classList.toggle('on', k === index);
            s.setAttribute('aria-hidden', k === index ? 'false' : 'true');
        });
        [].forEach.call(dots.querySelectorAll('button:not(.pp)'), function (d, k) {
            d.setAttribute('aria-current', k === index ? 'true' : 'false');
        });
        banner.setAttribute('data-tone', slides[index].getAttribute('data-tone') || '1');
        schedule();
    }

    arrows.forEach(function (b) {
        b.addEventListener('click', function () { go(index + parseInt(b.getAttribute('data-dir'), 10)); });
    });

    pp.addEventListener('click', function () {
        playing = !playing;
        renderState();
        schedule();
    });

    banner.addEventListener('mouseenter', function () { hover = true; schedule(); });
    banner.addEventListener('mouseleave', function () { hover = false; schedule(); });
    banner.addEventListener('focusin', function (e) {
        focus = !!(e.target.matches && e.target.matches(':focus-visible'));
        schedule();
    });
    banner.addEventListener('focusout', function () { focus = false; schedule(); });
    document.addEventListener('visibilitychange', schedule);

    banner.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowLeft') { go(index - 1); }
        if (e.key === 'ArrowRight') { go(index + 1); }
    });

    if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (entries) {
            visible = entries[0].isIntersecting;
            renderState();
            schedule();
        }).observe(banner);
    }

    renderState();
    go(0);
})();
