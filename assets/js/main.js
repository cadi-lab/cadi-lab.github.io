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

  // Initialise: localStorage > system preference > dark fallback
  var saved = localStorage.getItem(THEME_KEY);
  if (!saved) {
    saved = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
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
