// Profile thumbnails are independent of optional, cancellable lightbox downloads.
(function () {
  'use strict';

  const lightbox = document.getElementById('photoLightbox');
  if (!lightbox) return;
  const view = document.getElementById('lightboxImg');
  const status = document.getElementById('lightboxStatus');
  const closeButton = lightbox.querySelector('.lightbox-close');
  const photos = Array.from(document.querySelectorAll('.photo-clickable'));
  const loaded = new Map();
  const failed = new Set();
  const variants = new Map(photos.map(photo => [photo, JSON.parse(photo.dataset.fullVariants || '[]')]));
  const connection = navigator.connection;
  const backgroundBudget = 1024 * 1024;
  let backgroundBytes = 0;
  let active = null;
  let selected = null;
  let selection = 0;
  let previousOverflow = '';
  let timer;
  let intentTimer;
  let resizeTimer;
  let pageLoaded = document.readyState === 'complete';
  let slowThumbnails = false;

  function nearScreen(photo, margin = 0) {
    const box = photo.getBoundingClientRect();
    return box.bottom > -margin && box.top < innerHeight + margin;
  }

  function dimensions(photo) {
    const width = Number(photo.dataset.photoWidth) || photo.naturalWidth;
    const height = Number(photo.dataset.photoHeight) || photo.naturalHeight;
    const scale = Math.min(innerWidth * 0.85 / width, innerHeight * 0.85 / height, 1);
    return { width: width * scale, height: height * scale };
  }

  function target(photo) {
    const full = variants.get(photo);
    const width = dimensions(photo).width * (devicePixelRatio || 1);
    return full.find(item => item.width >= width) || full[full.length - 1] || {
      path: photo.dataset.original, width: Number(photo.dataset.photoWidth), bytes: Infinity
    };
  }

  function cached(photo, wanted) {
    const full = variants.get(photo);
    const currentPath = new URL(photo.currentSrc || photo.src, location.href).pathname;
    const current = full.find(item => item.path === currentPath && item.width >= wanted.width);
    if (current && photo.complete && photo.naturalWidth) return { url: photo.currentSrc || photo.src, width: current.width };
    const available = full.find(item => item.width >= wanted.width && loaded.has(item.path));
    return available ? loaded.get(available.path) : loaded.get(wanted.path);
  }

  function cancelSpeculation() {
    if (active && active.kind !== 'click') active.controller.abort();
  }

  function schedule(delay = 1000) {
    clearTimeout(timer);
    timer = setTimeout(warmVisiblePhoto, delay);
  }

  function download(photo, kind) {
    const wanted = target(photo);
    const existing = cached(photo, wanted);
    if (existing) return Promise.resolve(existing);
    if (active && !active.controller.signal.aborted && active.path === wanted.path) {
      if (kind === 'click') active.kind = 'click';
      return active.promise;
    }
    if (active) active.controller.abort();
    const request = { path: wanted.path, photo, kind, controller: new AbortController() };
    // Reserve the whole request, including bytes potentially transferred before an abort.
    if (kind !== 'click') backgroundBytes += wanted.bytes;
    active = request;
    request.promise = fetch(wanted.path, {
      signal: request.controller.signal,
      priority: kind === 'click' ? 'high' : 'low',
      cache: 'force-cache'
    }).then(response => {
      if (!response.ok) throw new Error('Photo download failed');
      return response.blob();
    }).then(blob => {
      if (request.controller.signal.aborted) throw new DOMException('Aborted', 'AbortError');
      const result = { url: URL.createObjectURL(blob), width: wanted.width };
      loaded.set(wanted.path, result);
      return result;
    }).catch(error => {
      if (error.name !== 'AbortError') failed.add(wanted.path);
      throw error;
    }).finally(() => {
      if (active === request) active = null;
      schedule();
    });
    return request.promise;
  }

  function speculationAllowed() {
    if (!pageLoaded || document.hidden || selected || slowThumbnails) return false;
    if (connection && (connection.saveData || /(^|-)2g$|3g/.test(connection.effectiveType))) return false;
    // Do not compete with thumbnails about to enter the viewport.
    return !photos.some(photo => nearScreen(photo, 600) && !photo.complete);
  }

  function eligible(photo) {
    const wanted = target(photo);
    return nearScreen(photo) && photo.complete && photo.naturalWidth &&
      !cached(photo, wanted) && !failed.has(wanted.path) &&
      wanted.bytes <= 512 * 1024 && backgroundBytes + wanted.bytes <= backgroundBudget;
  }

  function warmVisiblePhoto() {
    if (active || !speculationAllowed()) return;
    const photo = photos.find(eligible);
    if (photo) download(photo, 'background').catch(() => {});
  }

  function fit(photo) {
    const size = dimensions(photo);
    view.style.width = size.width + 'px';
    view.style.height = size.height + 'px';
  }

  async function sharpen(photo, token) {
    try {
      const image = await download(photo, 'click');
      const decoded = new Image();
      decoded.src = image.url;
      await decoded.decode();
      if (selected === photo && selection === token) {
        view.src = image.url;
        status.hidden = true;
      }
    } catch (_) {
      // Keep the already-visible thumbnail if the larger image is unavailable.
      if (selected === photo && selection === token) status.textContent = 'Could not load the full photo.';
    }
  }

  function open(photo) {
    if (!photo.naturalWidth) return;
    clearTimeout(intentTimer);
    if (!selected) previousOverflow = document.body.style.overflow;
    selected = photo;
    const token = ++selection;
    fit(photo);
    view.src = photo.currentSrc || photo.src;
    view.alt = photo.alt;
    status.textContent = 'Loading photo…';
    status.hidden = false;
    lightbox.setAttribute('aria-label', 'Enlarged photo of ' + photo.alt);
    lightbox.setAttribute('aria-hidden', 'false');
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
    closeButton.focus({ preventScroll: true });
    sharpen(photo, token);
  }

  function close() {
    const previous = selected;
    selected = null;
    selection++;
    if (active) active.controller.abort();
    lightbox.classList.remove('active');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = previousOverflow;
    view.removeAttribute('src');
    status.hidden = true;
    if (previous) previous.focus({ preventScroll: true });
    clearTimeout(intentTimer);
    schedule();
  }

  function intent(photo) {
    clearTimeout(intentTimer);
    intentTimer = setTimeout(() => {
      if (speculationAllowed() && eligible(photo)) download(photo, 'intent').catch(() => {});
    }, 180);
  }

  function stopIntent(photo) {
    clearTimeout(intentTimer);
    if (active && active.kind === 'intent' && active.photo === photo) active.controller.abort();
  }

  function recordSpeed(photo) {
    const timing = performance.getEntriesByName(photo.currentSrc).pop();
    if (timing && timing.duration > 1500) {
      slowThumbnails = true;
      cancelSpeculation();
    }
  }

  photos.forEach(photo => {
    photo.addEventListener('click', () => open(photo));
    photo.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        open(photo);
      }
    });
    photo.addEventListener('pointerenter', event => {
      if (event.pointerType !== 'touch') intent(photo);
    });
    photo.addEventListener('pointerleave', () => stopIntent(photo));
    photo.addEventListener('focus', () => intent(photo));
    photo.addEventListener('blur', () => stopIntent(photo));
    photo.addEventListener('load', () => {
      recordSpeed(photo);
      schedule();
    });
    if (photo.complete) recordSpeed(photo);
  });
  closeButton.addEventListener('click', close);
  lightbox.addEventListener('click', event => { if (event.target === lightbox) close(); });
  document.addEventListener('keydown', event => {
    if (!selected) return;
    if (event.key === 'Escape') close();
    if (event.key === 'Tab') {
      event.preventDefault();
      closeButton.focus();
    }
  });
  window.addEventListener('scroll', () => {
    clearTimeout(intentTimer);
    cancelSpeculation();
    schedule(1200);
  }, { passive: true });
  window.addEventListener('resize', () => {
    cancelSpeculation();
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (selected) { fit(selected); sharpen(selected, ++selection); }
      else schedule();
    }, 180);
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) cancelSpeculation();
    else schedule();
  });
  if (!pageLoaded) window.addEventListener('load', () => { pageLoaded = true; schedule(1500); });
  else schedule(1500);
})();
