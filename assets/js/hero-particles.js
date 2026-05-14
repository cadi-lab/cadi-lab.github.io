(function () {
  var el = document.getElementById('particles-hero');
  if (!el || typeof particlesJS === 'undefined') return;

  particlesJS('particles-hero', {
    particles: {
      number:  { value: 90, density: { enable: true, value_area: 600 } },
      color:   { value: '#ffffff' },
      shape:   { type: 'circle' },
      opacity: {
        value: 0.7,
        random: true,
        anim: { enable: true, speed: 0.4, opacity_min: 0.1, sync: false }
      },
      size: {
        value: 1.8,
        random: true,
        anim: { enable: false }
      },
      line_linked: { enable: false },
      move: {
        enable: true,
        speed: 0.15,
        direction: 'none',
        random: true,
        straight: false,
        out_mode: 'out'
      }
    },
    interactivity: {
      detect_on: 'canvas',
      events: {
        onhover: { enable: true, mode: 'grab' },
        onclick: { enable: true, mode: 'push' },
        resize: true
      },
      modes: {
        grab: { distance: 120, line_linked: { opacity: 0.25 } },
        push: { particles_nb: 2 }
      }
    },
    retina_detect: true
  });

  // Let particles canvas receive pointer events
  var canvas = el.querySelector('canvas');
  if (canvas) canvas.style.pointerEvents = 'auto';
})();
