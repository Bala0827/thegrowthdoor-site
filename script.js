// The Growth Door v3 — header shadow, year, hero entrance, scroll reveals,
// progress bar, magnetic CTAs. Vanilla JS only; page content is fully
// visible when JS is disabled (the inline head script adds a `js` class
// and only then does CSS hide pre-reveal states).
(function () {
  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Sticky header shadow once the page scrolls.
  var header = document.querySelector('.site-header');
  if (header) {
    var onHeaderScroll = function () {
      header.style.boxShadow = window.scrollY > 8 ? '0 4px 18px rgba(22,40,63,0.10)' : 'none';
    };
    window.addEventListener('scroll', onHeaderScroll, { passive: true });
    onHeaderScroll();
  }

  // Footer year auto-update.
  var year = document.querySelector('.copyright');
  if (year) {
    year.textContent = year.textContent.replace('2026', String(new Date().getFullYear()));
  }

  // Scroll progress bar (rAF-throttled, transform-only).
  var progress = document.getElementById('scrollProgress');
  if (progress) {
    var ticking = false;
    var updateProgress = function () {
      var max = root.scrollHeight - window.innerHeight;
      var ratio = max > 0 ? window.scrollY / max : 0;
      progress.style.transform = 'scaleX(' + Math.min(ratio, 1) + ')';
      ticking = false;
    };
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(updateProgress); }
    }, { passive: true });
    updateProgress();
  }

  // Hero entrance: staggered fade-up once the DOM is ready.
  var heroItems = document.querySelectorAll('.hero-anim');
  heroItems.forEach(function (el, i) { el.style.setProperty('--d', i * 110); });
  window.requestAnimationFrame(function () {
    window.requestAnimationFrame(function () {
      heroItems.forEach(function (el) { el.classList.add('in'); });
    });
  });
  // Safety net: if rAF is throttled (background tab), show the hero anyway.
  window.setTimeout(function () {
    heroItems.forEach(function (el) { el.classList.add('in'); });
  }, 600);

  // Scroll reveals with per-group stagger. Elements are revealed as soon as
  // they approach the viewport; a fallback reveals anything missed.
  var revealEls = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
  if (revealEls.length) {
    if (reduceMotion || !('IntersectionObserver' in window)) {
      revealEls.forEach(function (el) { el.classList.add('in'); });
    } else {
      var staggerGroups = {};
      var dirs = ['from-left', 'from-up', 'from-right', 'from-zoom'];
      revealEls.forEach(function (el) {
        var parent = el.parentElement;
        var key = parent ? Array.prototype.indexOf.call(document.querySelectorAll('*'), parent) : 0;
        staggerGroups[key] = (staggerGroups[key] || 0) + 1;
        el.style.setProperty('--d', Math.min(staggerGroups[key] - 1, 5) * 90);
        if (!el.classList.contains('from-left') && !el.classList.contains('from-right') && !el.classList.contains('from-zoom')) {
          el.classList.add(dirs[(staggerGroups[key] - 1) % 4]);
        }
      });
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
      revealEls.forEach(function (el) { observer.observe(el); });
      // Safety net: never leave content hidden if the observer misfires.
      window.setTimeout(function () {
        revealEls.forEach(function (el) {
          if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add('in');
        });
      }, 2500);
    }
  }

  // Magnetic effect on primary CTAs — desktop fine pointers only.
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (finePointer && !reduceMotion) {
    document.querySelectorAll('.magnetic').forEach(function (btn) {
      btn.addEventListener('pointermove', function (e) {
        var r = btn.getBoundingClientRect();
        var x = (e.clientX - r.left - r.width / 2) / r.width;
        var y = (e.clientY - r.top - r.height / 2) / r.height;
        btn.style.transform = 'translate(' + (x * 8).toFixed(1) + 'px,' + (y * 6).toFixed(1) + 'px)';
      });
      btn.addEventListener('pointerleave', function () { btn.style.transform = ''; });
    });
  }
})();

// Mobile menu toggle (header hamburger) — no-op on pages without one.
(function () {
  var btn = document.getElementById('menuToggle');
  var nav = document.getElementById('mobileNav');
  if (!btn || !nav) return;
  btn.addEventListener('click', function () {
    var open = nav.classList.toggle('open');
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  });
  nav.addEventListener('click', function (e) {
    if (e.target.tagName === 'A') { nav.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); }
  });
})();

// Hero sliders: any .gd-slider box rotates its .gd-stack children together.
(function () {
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('.gd-slider').forEach(function (box) {
    var stacks = box.querySelectorAll('.gd-stack');
    if (!stacks.length || !stacks[0].children.length) return;
    var n = stacks[0].children.length;
    if (n < 2) return;
    var dots = box.querySelector('.slider-dots');
    var idx = 0, timer = null;
    function show(i) {
      idx = ((i % n) + n) % n;
      stacks.forEach(function (st) {
        for (var k = 0; k < st.children.length; k++) st.children[k].classList.toggle('active', k === idx);
      });
      if (dots) for (var d = 0; d < dots.children.length; d++) dots.children[d].classList.toggle('active', d === idx);
    }
    if (dots) {
      for (var d = 0; d < n; d++) {
        var b = document.createElement('button');
        b.type = 'button';
        b.setAttribute('aria-label', 'Show slide ' + (d + 1));
        (function (dd) { b.addEventListener('click', function () { show(dd); restart(); }); })(d);
        dots.appendChild(b);
      }
    }
    function restart() {
      if (timer) clearInterval(timer);
      if (!reduceMotion) timer = setInterval(function () { show(idx + 1); }, 5200);
    }
    box.addEventListener('pointerenter', function () { if (timer) clearInterval(timer); });
    box.addEventListener('pointerleave', restart);
    show(0); restart();
  });
})();
