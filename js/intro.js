/* ==========================================================================
   Welcome Intro Splash Screen Controller
   Pure logic is exposed at window.PCS.introLogic for node:test unit testing.
   ========================================================================== */
(function (root) {
  'use strict';

  var INTERNAL_SUBPAGES = /^\/(?:shop|product|build|cart|contact|policies)(?:\.html)?$/i;

  function shouldShowIntro(opts) {
    var search = (opts && opts.search) || '';
    var referrer = (opts && opts.referrer) || '';
    var origin = (opts && opts.origin) || '';

    try {
      var params = new URLSearchParams(search);
      if (params.get('nointro') === '1' || params.get('intro') === '0') {
        return false;
      }
    } catch (_e) {
      // Ignore malformed query string
    }

    if (referrer && origin) {
      try {
        var refUrl = new URL(referrer);
        if (refUrl.origin === origin && INTERNAL_SUBPAGES.test(refUrl.pathname)) {
          return false;
        }
      } catch (_e2) {
        // Ignore invalid referrer
      }
    }

    return true;
  }

  root.PCS = root.PCS || {};
  root.PCS.introLogic = {
    shouldShowIntro: shouldShowIntro
  };

  if (typeof document === 'undefined') return;

  var splash = document.getElementById('intro-splash');
  if (!splash) return;

  var show = shouldShowIntro({
    search: root.location ? root.location.search : '',
    referrer: document.referrer || '',
    origin: root.location ? root.location.origin : ''
  });

  if (!show) {
    document.documentElement.classList.remove('intro-active');
    splash.remove();
    return;
  }

  var video = document.getElementById('intro-video');
  var skipBtn = document.getElementById('intro-skip');
  var muteBtn = document.getElementById('intro-mute');
  var progressFill = document.getElementById('intro-progress');
  var finished = false;
  var safetyTimer = 0;

  function dismissIntro() {
    if (finished) return;
    finished = true;
    clearTimeout(safetyTimer);
    document.removeEventListener('keydown', onKeyDown);

    try {
      if (video && !video.paused) video.pause();
    } catch (_e) {
      // Ignore pause errors
    }

    document.documentElement.classList.remove('intro-active');
    splash.classList.add('is-leaving');
    if (root.scrollTo) root.scrollTo(0, 0);

    var removeDelay = 460;
    try {
      if (root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        removeDelay = 0;
      }
    } catch (_e2) {
      // Ignore matchMedia issues
    }

    setTimeout(function () {
      if (splash.parentNode) splash.parentNode.removeChild(splash);
    }, removeDelay);
  }

  function onKeyDown(e) {
    if (e.key === 'Escape') {
      dismissIntro();
    }
  }

  function syncMuteLabel() {
    if (!muteBtn || !video) return;
    var isMuted = Boolean(video.muted);
    muteBtn.setAttribute('aria-pressed', String(!isMuted));
    muteBtn.setAttribute('aria-label', isMuted ? 'Unmute intro audio' : 'Mute intro audio');
    var label = muteBtn.querySelector('span');
    if (label) label.textContent = isMuted ? 'Sound Off' : 'Sound On';
  }

  if (skipBtn) {
    skipBtn.addEventListener('click', dismissIntro);
  }

  if (muteBtn && video) {
    syncMuteLabel();
    muteBtn.addEventListener('click', function () {
      video.muted = !video.muted;
      if (!video.muted && video.paused) {
        try {
          var p = video.play();
          if (p && typeof p.catch === 'function') p.catch(function () {});
        } catch (_e) {
          // Ignore play errors
        }
      }
      syncMuteLabel();
    });
  }

  document.addEventListener('keydown', onKeyDown);

  if (!video) {
    dismissIntro();
    return;
  }

  video.addEventListener('ended', dismissIntro);
  video.addEventListener('error', dismissIntro);
  video.addEventListener('timeupdate', function () {
    if (!progressFill || !video.duration) return;
    var pct = Math.min(100, Math.max(0, (video.currentTime / video.duration) * 100));
    progressFill.style.width = pct.toFixed(1) + '%';
  });

  // Fallback guard so a stalled or slow video never locks the store
  safetyTimer = setTimeout(dismissIntro, 11000);

  try {
    var playPromise = video.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(function () {
        if (skipBtn) {
          var lbl = skipBtn.querySelector('span');
          if (lbl) lbl.textContent = 'Enter Website';
        }
      });
    }
  } catch (_e) {
    // Wait for user skip or safety timer
  }
})(typeof window !== 'undefined' ? window : globalThis);
