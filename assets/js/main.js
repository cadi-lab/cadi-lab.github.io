// CADI Lab — Main JavaScript
(function () {
  'use strict';

  /* -------------------------------------------------- */
  /*  Mobile Navigation Toggle                          */
  /* -------------------------------------------------- */
  const navToggle = document.querySelector('.nav-toggle');
  const navMenu   = document.querySelector('.site-nav');

  if (navToggle && navMenu) {
    navToggle.addEventListener('click', function () {
      const expanded = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', String(!expanded));
      navMenu.classList.toggle('is-open');
    });

    // Close menu when clicking a link (mobile)
    navMenu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        navMenu.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });

    // Close menu on outside click
    document.addEventListener('click', function (e) {
      if (!navToggle.contains(e.target) && !navMenu.contains(e.target)) {
        navMenu.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* -------------------------------------------------- */
  /*  Dark / Light Theme Toggle                         */
  /* -------------------------------------------------- */
  const THEME_KEY = 'cadi-theme';
  const html      = document.documentElement;
  const toggle    = document.querySelector('.theme-toggle');

  // Icons
  const ICON_DARK  = '<i class="fa-solid fa-moon"></i>';
  const ICON_LIGHT = '<i class="fa-solid fa-sun"></i>';

  function setFavicon(theme) {
    var faviconLink = document.querySelector("link[rel='icon'][type='image/svg+xml']");
    if (!faviconLink) return;
    if (theme === 'dark') {
      faviconLink.href = '/assets/img/favicon.svg';
    } else {
      faviconLink.href = '/assets/img/favicon_dark.svg';
    }
  }

  function applyTheme(theme) {
    html.setAttribute('data-theme', theme);
    setFavicon(theme);
    if (toggle) {
      toggle.innerHTML = theme === 'dark' ? ICON_LIGHT : ICON_DARK;
      toggle.setAttribute('aria-label',
        theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    }
  }

  // Initialise: localStorage > always dark default
  var saved = localStorage.getItem(THEME_KEY);
  if (!saved) {
    saved = 'dark';
  }
  applyTheme(saved);

  if (toggle) {
    toggle.addEventListener('click', function () {
      var current = html.getAttribute('data-theme') || 'dark';
      var next    = current === 'dark' ? 'light' : 'dark';
      localStorage.setItem(THEME_KEY, next);
      applyTheme(next);
    });
  }

  /* -------------------------------------------------- */
  /*  Smooth scroll for anchor links                    */
  /* -------------------------------------------------- */
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      var target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  /* -------------------------------------------------- */
  /*  Footer brand typing effect                        */
  /* -------------------------------------------------- */
  (function initFooterTyping() {
    var brand = document.getElementById('footer-brand');
    if (!brand) return;

    var TEXT      = 'CADI Lab';
    var SPLIT     = 4;               // "CADI" = first 4 chars
    var TYPE_MS   = 120;
    var DELETE_MS  = 60;
    var PAUSE_FULL = 3000;           // pause after fully typed
    var PAUSE_EMPTY = 500;           // pause after fully deleted
    var started   = false;

    function buildHTML(len) {
      if (len === 0) return '';
      var str = TEXT.substring(0, len);
      if (len <= SPLIT) {
        return '<span class="logo-mark">' + str + '</span>';
      }
      return '<span class="logo-mark">' + TEXT.substring(0, SPLIT) + '</span> ' +
             '<span class="logo-text">' + str.substring(SPLIT + 1) + '</span>';
    }

    function run() {
      // Replace static content with typed container + cursor
      brand.innerHTML = '<span id="footer-typed"></span><span class="footer-cursor"></span>';
      var el = document.getElementById('footer-typed');
      var i = 0;
      var deleting = false;

      function tick() {
        if (!deleting) {
          if (i <= TEXT.length) {
            el.innerHTML = buildHTML(i);
            i++;
            setTimeout(tick, TYPE_MS);
          } else {
            setTimeout(function () { deleting = true; tick(); }, PAUSE_FULL);
          }
        } else {
          if (i > 0) {
            i--;
            el.innerHTML = buildHTML(i);
            setTimeout(tick, DELETE_MS);
          } else {
            setTimeout(function () { deleting = false; tick(); }, PAUSE_EMPTY);
          }
        }
      }
      tick();
    }

    // Start only when footer scrolls into view
    if ('IntersectionObserver' in window) {
      var obs = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting && !started) {
          started = true;
          run();
        }
      }, { threshold: 0.3 });
      obs.observe(brand);
    } else {
      run(); // fallback for old browsers
    }
  })();

  /* -------------------------------------------------- */
  /*  Header shrink on scroll                           */
  /* -------------------------------------------------- */
  var header = document.querySelector('.site-header');
  if (header) {
    window.addEventListener('scroll', function () {
      if (window.scrollY > 60) {
        header.classList.add('is-scrolled');
      } else {
        header.classList.remove('is-scrolled');
      }
    }, { passive: true });
  }
})();
