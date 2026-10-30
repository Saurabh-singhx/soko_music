// ============================================================
// MEDIASESSION INTEGRATION (Android Lock Screen)
// ============================================================
function setupMediaSession() {
  if ('mediaSession' in navigator) {
    navigator.mediaSession.setActionHandler('play', () => togglePlayPause());
    navigator.mediaSession.setActionHandler('pause', () => togglePlayPause());
    navigator.mediaSession.setActionHandler('previoustrack', () => playPreviousTrack());
    navigator.mediaSession.setActionHandler('nexttrack', () => playNextTrack());
  }
}

function updateMediaSession(track) {
  if ('mediaSession' in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      artist: track.artist,
      album: 'Soko Music Library',
      artwork: [
        { src: track.cover, sizes: '512x512', type: 'image/jpeg' }
      ]
    });
  }
  if (window.SokoNative && typeof window.SokoNative.updateNativePlayer === 'function') {
    window.SokoNative.updateNativePlayer(
      track.title,
      track.artist,
      isPlaying,
      track.duration || 215,
      audioEl ? Math.floor(audioEl.currentTime) : 0,
      track.cover
    );
  }
}

window.handleNativeMediaAction = function(action) {
  if (action === 'toggle') togglePlayPause();
  else if (action === 'next') playNextTrack();
  else if (action === 'prev') playPreviousTrack();
};

window.setupMediaSession = setupMediaSession;
window.updateMediaSession = updateMediaSession;
