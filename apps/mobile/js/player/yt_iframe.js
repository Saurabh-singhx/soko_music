// ============================================================
// REAL YOUTUBE AUDIO STREAMING ENGINE (IFRAME API)
// ============================================================
let ytPlayer = null;
let ytPlayerReady = false;
let isOnlineYtPlaying = false;
let onlineProgressTimer = null;

function initYouTubeIframeApi() {
  if (window.YT && window.YT.Player) {
    setupYtPlayer();
    return;
  }
  const tag = document.createElement('script');
  tag.src = "https://www.youtube.com/iframe_api";
  const firstScriptTag = document.getElementsByTagName('script')[0];
  if (firstScriptTag && firstScriptTag.parentNode) {
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
  } else {
    document.head.appendChild(tag);
  }
}

window.onYouTubeIframeAPIReady = function() {
  setupYtPlayer();
};

function setupYtPlayer() {
  if (ytPlayer) return;
  try {
    const originVal = (window.location.origin && window.location.origin !== 'null' && !window.location.origin.startsWith('file:')) ? window.location.origin : 'https://music.youtube.com';
    ytPlayer = new YT.Player('ytOnlinePlayer', {
      height: '200',
      width: '200',
      playerVars: {
        'autoplay': 0,
        'controls': 0,
        'disablekb': 1,
        'fs': 0,
        'playsinline': 1,
        'origin': originVal
      },
      events: {
        'onReady': (event) => {
          ytPlayerReady = true;
          window.ytPlayerReady = true;
          if (isOnlineYtPlaying && currentTrack) {
            event.target.loadVideoById(currentTrack.id);
            event.target.playVideo();
          }
        },
        'onStateChange': onYtPlayerStateChange,
        'onError': (event) => {
          console.warn("YouTube player notice (code " + event.data + ")");
        }
      }
    });
    window.ytPlayer = ytPlayer;
  } catch (e) {
    console.warn("setupYtPlayer notice:", e);
  }
}

function playOnlineYouTubeStream(track) {
  if (window.SokoNative && typeof window.SokoNative.stopAudio === 'function') {
    try { window.SokoNative.stopAudio(); } catch (e) {}
  } else if (window.SokoNative && typeof window.SokoNative.pauseAudio === 'function') {
    try { window.SokoNative.pauseAudio(); } catch (e) {}
  }
  if (audioEl) {
    try { audioEl.pause(); audioEl.currentTime = 0; audioEl.src = ''; } catch (e) {}
  }
  if (window.SokoNative && typeof window.SokoNative.setActivePlaybackId === 'function') {
    try { window.SokoNative.setActivePlaybackId(track.id); } catch (e) {}
  }

  isOnlineYtPlaying = true;
  window.isOnlineYtPlaying = true;
  const wrapper = document.getElementById('ytOnlinePlayerWrapper');
  const originVal = (window.location.origin && window.location.origin !== 'null' && !window.location.origin.startsWith('file:')) ? window.location.origin : 'https://music.youtube.com';

  if (ytPlayer && ytPlayerReady && typeof ytPlayer.loadVideoById === 'function') {
    try {
      ytPlayer.loadVideoById(track.id);
      ytPlayer.playVideo();
    } catch (e) {
      if (wrapper) {
        wrapper.innerHTML = `<iframe id="ytDirectIframe" src="https://www.youtube-nocookie.com/embed/${track.id}?autoplay=1&enablejsapi=1&playsinline=1&origin=${encodeURIComponent(originVal)}" allow="autoplay; encrypted-media" style="width:200px; height:200px; border:none;"></iframe>`;
      }
    }
  } else {
    if (wrapper) {
      wrapper.innerHTML = `<iframe id="ytDirectIframe" src="https://www.youtube-nocookie.com/embed/${track.id}?autoplay=1&enablejsapi=1&playsinline=1&origin=${encodeURIComponent(originVal)}" allow="autoplay; encrypted-media" style="width:200px; height:200px; border:none;"></iframe>`;
    }
  }

  isPlaying = true;
  window.isPlaying = true;
  updatePlayIcons(true);
  startRealVisualizer();
  startOnlineProgressUpdater();

  if (window.SokoNative && typeof window.SokoNative.updateNativePlayer === 'function') {
    window.SokoNative.updateNativePlayer(track.title, track.artist, true, track.duration || 215, 0, track.cover);
  }
}

function stopOnlineYouTubeStream() {
  isOnlineYtPlaying = false;
  window.isOnlineYtPlaying = false;
  stopOnlineProgressUpdater();
  if (ytPlayer && typeof ytPlayer.pauseVideo === 'function') {
    try { ytPlayer.pauseVideo(); } catch (e) {}
    try { ytPlayer.stopVideo(); } catch (e) {}
  }
  const directIframe = document.getElementById('ytDirectIframe');
  if (directIframe) {
    directIframe.src = 'about:blank';
  }
}

function onYtPlayerStateChange(event) {
  if (event.data === 1) { // PLAYING
    isPlaying = true;
    window.isPlaying = true;
    updatePlayIcons(true);
    startRealVisualizer();
    startOnlineProgressUpdater();
    recordPlaybackStateChangeTelemetry(true);
    if (window.SokoNative && typeof window.SokoNative.updateNativePlayer === 'function' && currentTrack) {
      let cur = 0;
      let dur = currentTrack.duration || 215;
      if (ytPlayer && typeof ytPlayer.getCurrentTime === 'function') {
        try { cur = ytPlayer.getCurrentTime() || 0; } catch (e) {}
      }
      window.SokoNative.updateNativePlayer(currentTrack.title, currentTrack.artist, true, Math.floor(dur), Math.floor(cur), currentTrack.cover);
    }
  } else if (event.data === 2) { // PAUSED
    isPlaying = false;
    window.isPlaying = false;
    updatePlayIcons(false);
    stopRealVisualizer();
    stopOnlineProgressUpdater();
    recordPlaybackStateChangeTelemetry(false);
    if (window.SokoNative && typeof window.SokoNative.updateNativePlayer === 'function' && currentTrack) {
      let cur = 0;
      let dur = currentTrack.duration || 215;
      if (ytPlayer && typeof ytPlayer.getCurrentTime === 'function') {
        try { cur = ytPlayer.getCurrentTime() || 0; } catch (e) {}
      }
      window.SokoNative.updateNativePlayer(currentTrack.title, currentTrack.artist, false, Math.floor(dur), Math.floor(cur), currentTrack.cover);
    }
  } else if (event.data === 0) { // ENDED
    recordTrackCompletionTelemetry();
    stopOnlineProgressUpdater();
    if (isRepeat) {
      if (currentTrack) playRealTrack(currentTrack);
    } else {
      playNextTrack();
    }
  }
}

function startOnlineProgressUpdater() {
  stopOnlineProgressUpdater();
  onlineProgressTimer = setInterval(() => {
    if (!isOnlineYtPlaying) return;
    let cur = 0;
    let dur = currentTrack ? currentTrack.duration : 215;

    if (ytPlayer && typeof ytPlayer.getCurrentTime === 'function') {
      try {
        cur = ytPlayer.getCurrentTime() || 0;
        const realDur = ytPlayer.getDuration();
        if (realDur > 0) dur = realDur;
      } catch (e) {}
    }
    updatePlaybackTelemetry(cur, dur);

    const slider = document.getElementById('modalSeekSlider');
    const curTime = document.getElementById('modalTimeCurrent');
    const durTime = document.getElementById('modalTimeDuration');
    const miniFill = document.getElementById('miniProgressFill');

    if (curTime) curTime.innerText = formatTime(Math.floor(cur));
    if (durTime && dur > 0) durTime.innerText = formatTime(Math.floor(dur));

    const percent = dur > 0 ? (cur / dur) * 100 : 0;
    if (slider && !slider.matches(':active')) {
      slider.value = percent;
    }
    if (miniFill) miniFill.style.width = `${percent}%`;

    if (window.SokoNative && typeof window.SokoNative.updateNativePlayer === 'function' && currentTrack) {
      if (!window._lastYtNativeUpdate || (Date.now() - window._lastYtNativeUpdate) > 2500) {
        window._lastYtNativeUpdate = Date.now();
        window.SokoNative.updateNativePlayer(currentTrack.title, currentTrack.artist, isPlaying, Math.floor(dur), Math.floor(cur), currentTrack.cover);
      }
    }
  }, 500);
}

function stopOnlineProgressUpdater() {
  if (onlineProgressTimer) {
    clearInterval(onlineProgressTimer);
    onlineProgressTimer = null;
  }
}

window.ytPlayer = ytPlayer;
window.ytPlayerReady = ytPlayerReady;
window.isOnlineYtPlaying = isOnlineYtPlaying;
window.onlineProgressTimer = onlineProgressTimer;

window.initYouTubeIframeApi = initYouTubeIframeApi;
window.setupYtPlayer = setupYtPlayer;
window.playOnlineYouTubeStream = playOnlineYouTubeStream;
window.stopOnlineYouTubeStream = stopOnlineYouTubeStream;
window.onYtPlayerStateChange = onYtPlayerStateChange;
window.startOnlineProgressUpdater = startOnlineProgressUpdater;
window.stopOnlineProgressUpdater = stopOnlineProgressUpdater;
