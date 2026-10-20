// ============================================================
// PLAYER UI & MODAL MANAGEMENT
// ============================================================
function updateLookAheadUI() {
  const titleEl = document.getElementById('nextTitle');
  const artistEl = document.getElementById('nextArtist');
  const artEl = document.getElementById('nextArt');
  const preCacheStatus = document.getElementById('preCacheStatus');

  if (titleEl) titleEl.innerText = lookAheadNextTrack.title;
  if (artistEl) artistEl.innerText = lookAheadNextTrack.artist;
  if (artEl) artEl.src = lookAheadNextTrack.cover;

  const isNextCached = isTrackOffline(lookAheadNextTrack.id);
  if (preCacheStatus) {
    preCacheStatus.innerText = isNextCached ? '● Offline Ready' : '● Online Stream';
    preCacheStatus.style.color = isNextCached ? 'var(--success)' : 'var(--accent-cyan)';
  }
}

function updateDownloadBannerUI(track, percent, complete) {
  const banner = document.getElementById('activeDownloadBanner');
  const titleEl = document.getElementById('dlBannerTitle');
  const percentEl = document.getElementById('dlBannerPercent');
  const fillEl = document.getElementById('dlBannerFill');
  if (!banner) return;

  if (complete) {
    if (titleEl) titleEl.innerText = `✓ Downloaded ${track.title}`;
    if (percentEl) {
      percentEl.innerText = `100%`;
      percentEl.style.color = '#10B981';
    }
    if (fillEl) {
      fillEl.style.width = '100%';
      fillEl.style.background = '#10B981';
    }
    setTimeout(() => {
      if (activeDownloads.size === 0) {
        banner.style.display = 'none';
      }
    }, 2500);
  } else {
    banner.style.display = 'block';
    if (titleEl) titleEl.innerText = `Downloading: ${track.title}`;
    if (percentEl) {
      percentEl.innerText = `${percent}%`;
      percentEl.style.color = '#F59E0B';
    }
    if (fillEl) {
      fillEl.style.width = `${percent}%`;
      fillEl.style.background = 'linear-gradient(90deg, #F59E0B, #10B981)';
    }
  }
}

function updatePlayerUI(track) {
  if (!track) return;

  const miniArt = document.getElementById('miniArt');
  const miniTitle = document.getElementById('miniTitle');
  const miniArtist = document.getElementById('miniArtist');
  if (miniArt) miniArt.src = track.cover;
  if (miniTitle) miniTitle.innerText = track.title;
  if (miniArtist) miniArtist.innerText = track.artist;

  const modalArt = document.getElementById('modalArt');
  const modalTitle = document.getElementById('modalTitle');
  const modalArtist = document.getElementById('modalArtist');
  const modalDuration = document.getElementById('modalTimeDuration');
  const modalHeart = document.getElementById('modalHeartIcon');
  const modalDlIcon = document.getElementById('modalDownloadIcon');

  if (modalArt) modalArt.src = track.cover;
  if (modalTitle) modalTitle.innerText = track.title;
  if (modalArtist) modalArtist.innerText = track.artist;
  if (modalDuration && track.duration) modalDuration.innerText = formatTime(track.duration);

  if (modalHeart) {
    modalHeart.style.fill = track.favorite ? '#EF4444' : 'none';
    modalHeart.style.stroke = track.favorite ? '#EF4444' : 'currentColor';
  }

  if (modalDlIcon) {
    const isCached = downloadedSet.has(track.id);
    modalDlIcon.style.stroke = isCached ? '#10B981' : 'currentColor';
  }
}

function openNowPlayingModal() {
  const modal = document.getElementById('nowPlayingModal');
  if (modal) {
    modal.classList.add('active');
    document.body.classList.add('modal-open');
  }
}

function closeNowPlayingModal() {
  const modal = document.getElementById('nowPlayingModal');
  if (modal) {
    modal.classList.remove('active');
    document.body.classList.remove('modal-open');
  }
}

window.updateLookAheadUI = updateLookAheadUI;
window.updateDownloadBannerUI = updateDownloadBannerUI;
window.updatePlayerUI = updatePlayerUI;
window.openNowPlayingModal = openNowPlayingModal;
window.closeNowPlayingModal = closeNowPlayingModal;
