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
