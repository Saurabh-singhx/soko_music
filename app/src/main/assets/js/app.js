// ============================================================
// APPLICATION INITIALIZATION & BOOTSTRAP
// ============================================================
function initApp() {
  audioEl = document.getElementById('audioPlayer');
  initPersistentStorage();
  initYouTubeIframeApi();
  setupAudioListeners();
  renderShelves();
  initPullToRefresh();
  renderCharts('Global', 1);
  renderPlaylists();
  renderLibraryTracks();
  updateStorageMetrics();
  setupMediaSession();
  updateAuthHeaderUI();

  // Check last played track
  const savedLastTrack = getLastPlayedTrack();
  const miniPlayer = document.getElementById('miniPlayer');
  if (savedLastTrack && savedLastTrack.id) {
    currentTrack = savedLastTrack;
    isPlaying = false;
    updatePlayerUI(currentTrack);
    updatePlayIcons(false);
    scheduleLookAhead(currentTrack.id);
    if (miniPlayer) miniPlayer.style.display = 'flex';
  } else {
    currentTrack = null;
    isPlaying = false;
    if (miniPlayer) miniPlayer.style.display = 'none';
  }

  // Prevent modal touch events from scrolling background page
  const modalEl = document.getElementById('nowPlayingModal');
  if (modalEl) {
    modalEl.addEventListener('touchmove', (e) => {
      if (!e.target.closest('#modalSeekSlider')) {
        e.stopPropagation();
      }
    }, { passive: false });
  }

  if (window.SokoNative && typeof window.SokoNative.getStoredYtmCookies === 'function') {
    const storedCookies = window.SokoNative.getStoredYtmCookies();
    if (storedCookies && storedCookies.length > 20) {
      if (!userSession) {
        userSession = {
          isLoggedIn: true,
          cookie: storedCookies,
          name: "YouTube Music Member",
          email: "Saved Android Session"
        };
        localStorage.setItem('soko_ytm_session', JSON.stringify(userSession));
        updateAuthHeaderUI();
      }
    }
  }
}

window.addEventListener('DOMContentLoaded', initApp);
window.initApp = initApp;
