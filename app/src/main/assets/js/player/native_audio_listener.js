// ============================================================
// NATIVE AUDIO EVENT LISTENERS & BROADCAST RECEIVERS
// ============================================================
window.onNativePlayerStateChange = function(playing, durationSec) {
  isPlaying = playing;
  window.isPlaying = playing;
  updatePlayIcons(playing);
  if (playing) startRealVisualizer();
  else stopRealVisualizer();
  if (currentTrack && durationSec > 0) {
    currentTrack.duration = durationSec;
    const durTime = document.getElementById('modalTimeDuration');
    if (durTime) durTime.innerText = formatTime(durationSec);
  }
};

window.onNativePlayerProgress = function(currentSec, durationSec) {
  window.currentPlaybackTime = currentSec;
  if (isOnlineYtPlaying) return;
  updatePlaybackTelemetry(currentSec, durationSec);
  const slider = document.getElementById('modalSeekSlider');
  const curTime = document.getElementById('modalTimeCurrent');
  const durTime = document.getElementById('modalTimeDuration');
  const miniFill = document.getElementById('miniProgressFill');

  if (curTime) curTime.innerText = formatTime(currentSec);
  if (durTime && durationSec > 0) durTime.innerText = formatTime(durationSec);

  const percent = durationSec > 0 ? (currentSec / durationSec) * 100 : 0;
  if (slider && !slider.matches(':active')) {
    slider.value = percent;
  }
  if (miniFill) miniFill.style.width = `${percent}%`;
};

window.onNativeTrackEnded = function() {
  recordTrackCompletionTelemetry();
  if (isRepeat) {
    if (currentTrack) {
      if (window.SokoNative && typeof window.SokoNative.seekAudio === 'function') {
        window.SokoNative.seekAudio(0);
        window.SokoNative.resumeAudio();
      } else {
        playRealTrack(currentTrack);
      }
    }
  } else {
    playNextTrack();
  }
};

window.onNativePlaybackError = function(errorCode) {
  console.warn('Native playback error code:', errorCode);
  if (currentTrack) {
    showToast('Playback error, switching to stream...', '⚠️');
    playOnlineYouTubeStream(currentTrack);
  }
};

window.handleBecomingNoisy = function() {
  if (isOnlineYtPlaying) {
    if (ytPlayer && typeof ytPlayer.pauseVideo === 'function') {
      try { ytPlayer.pauseVideo(); } catch (e) {}
    }
  }
  if (window.SokoNative && typeof window.SokoNative.pauseAudio === 'function') {
    try { window.SokoNative.pauseAudio(); } catch (e) {}
  } else if (audioEl) {
    try { audioEl.pause(); } catch (e) {}
  }
  isPlaying = false;
  window.isPlaying = false;
  updatePlayIcons(false);
  stopRealVisualizer();
  stopOnlineProgressUpdater();
};

window.onNativeAudioFocusLost = function() {
  if (isOnlineYtPlaying) {
    if (ytPlayer && typeof ytPlayer.pauseVideo === 'function') {
      try { ytPlayer.pauseVideo(); } catch (e) {}
    }
  }
  if (window.SokoNative && typeof window.SokoNative.pauseAudio === 'function') {
    try { window.SokoNative.pauseAudio(); } catch (e) {}
  } else if (audioEl) {
    try { audioEl.pause(); } catch (e) {}
  }
  isPlaying = false;
  window.isPlaying = false;
  updatePlayIcons(false);
  stopRealVisualizer();
  stopOnlineProgressUpdater();
};

window.syncNativePlaybackState = function(playing, curSec, durSec, title, artist, cover, videoId) {
  isPlaying = playing;
  window.isPlaying = playing;
  if (typeof updatePlayIcons === 'function') {
    updatePlayIcons(playing);
  }
  if (playing && typeof startRealVisualizer === 'function') {
    startRealVisualizer();
  } else if (!playing && typeof stopRealVisualizer === 'function') {
    stopRealVisualizer();
  }

  let track = (typeof findTrackAcrossAllSources === 'function' && videoId) ? findTrackAcrossAllSources(videoId) : null;
  if (!track && currentTrack && currentTrack.id === videoId) {
    track = currentTrack;
  }
  if (!track && (title || videoId)) {
    track = {
      id: videoId || (currentTrack ? currentTrack.id : 'unknown'),
      title: title || (currentTrack ? currentTrack.title : 'Soko Music'),
      artist: artist || (currentTrack ? currentTrack.artist : 'Offline Storage'),
      cover: cover || (currentTrack ? currentTrack.cover : 'assets/logo.png'),
      duration: durSec || (currentTrack ? currentTrack.duration : 215)
    };
  }

  if (track) {
    currentTrack = track;
    window.currentTrack = track;
    if (typeof updatePlayerUI === 'function') {
      updatePlayerUI(track);
    }
    const miniPlayer = document.getElementById('miniPlayer');
    if (miniPlayer) miniPlayer.style.display = 'flex';
  }

  if (durSec > 0 && typeof window.onNativePlayerProgress === 'function') {
    window.onNativePlayerProgress(curSec, durSec);
  }
};

function checkAndSyncNativePlayback() {
  if (window.SokoNative && typeof window.SokoNative.getPlaybackStatusJson === 'function') {
    try {
      const statusJson = window.SokoNative.getPlaybackStatusJson();
      const status = JSON.parse(statusJson);
      if (status && status.isPlaying) {
        window.syncNativePlaybackState(
          true,
          status.position || 0,
          status.duration || 215,
          status.title,
          status.artist,
          status.cover,
          status.id
        );
      }
    } catch (e) {}
  }
}
window.checkAndSyncNativePlayback = checkAndSyncNativePlayback;

if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
  document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'visible') {
      checkAndSyncNativePlayback();
    }
  });
}
if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
  window.addEventListener('focus', function() {
    checkAndSyncNativePlayback();
  });
}
