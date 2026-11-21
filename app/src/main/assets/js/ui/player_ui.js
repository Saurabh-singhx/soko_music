// ============================================================
// PLAYER UI & MODAL MANAGEMENT - Vibrant Light Redesign
// ============================================================

function updateLookAheadUI() {
  const titleEl = document.getElementById('nextTitle');
  const artistEl = document.getElementById('nextArtist');
  const artEl = document.getElementById('nextArt');
  const preCacheStatus = document.getElementById('preCacheStatus');

  if (!lookAheadNextTrack) {
    if (titleEl) titleEl.innerText = 'End of Queue';
    if (artistEl) artistEl.innerText = 'No more tracks';
    if (artEl) artEl.src = '';
    if (preCacheStatus) {
      preCacheStatus.innerText = '● Queue End';
      preCacheStatus.style.color = 'var(--text-dim)';
    }
    return;
  }

  if (titleEl) titleEl.innerText = lookAheadNextTrack.title || 'Unknown Title';
  if (artistEl) artistEl.innerText = lookAheadNextTrack.artist || 'Unknown Artist';
  if (artEl) {
    const fallbackArt = (typeof getSvgArtworkFallback === 'function') ? getSvgArtworkFallback(lookAheadNextTrack.id, '♫') : 'assets/logo.png';
    artEl.src = lookAheadNextTrack.cover || fallbackArt;
    artEl.onerror = () => { if (typeof handleImageLoadError === 'function') handleImageLoadError(artEl, lookAheadNextTrack.id); else artEl.src = 'assets/logo.png'; };
  }

  const isNextCached = isTrackOffline(lookAheadNextTrack.id);
  if (preCacheStatus) {
    preCacheStatus.innerText = isNextCached ? '● Offline Ready' : '● Online Stream';
    preCacheStatus.style.color = isNextCached ? 'var(--brand-green)' : 'var(--brand-orange)';
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
      percentEl.style.color = '#FF5A1F';
    }
    if (fillEl) {
      fillEl.style.width = `${percent}%`;
      fillEl.style.background = 'linear-gradient(90deg, #FF6B00, #FF5A1F)';
    }
  }
}

function updatePlayerUI(track) {
  if (!track) return;

  const fallbackArt = (typeof getSvgArtworkFallback === 'function') ? getSvgArtworkFallback(track.id, '♫') : 'assets/logo.png';

  const miniArt = document.getElementById('miniArt');
  const miniTitle = document.getElementById('miniTitle');
  const miniArtist = document.getElementById('miniArtist');
  if (miniArt) {
    miniArt.src = track.cover || fallbackArt;
    miniArt.onerror = () => { if (typeof handleImageLoadError === 'function') handleImageLoadError(miniArt, track.id); else miniArt.src = 'assets/logo.png'; };
  }
  if (miniTitle) miniTitle.innerText = track.title;
  if (miniArtist) miniArtist.innerText = track.artist;

  const modalArt = document.getElementById('modalArt');
  const modalTitle = document.getElementById('modalTitle');
  const modalArtist = document.getElementById('modalArtist');
  const modalDuration = document.getElementById('modalTimeDuration');
  const modalHeart = document.getElementById('modalHeartIcon');
  const modalHeartBtn = document.querySelector('.modal-heart-btn');
  const modalDlIcon = document.getElementById('modalDownloadIcon');
  const modalDlBtn = document.querySelector('.modal-dl-btn');

  if (modalArt) {
    const heroCover = (typeof getHighResArtworkUrl === 'function') ? getHighResArtworkUrl(track.cover, 800) : track.cover;
    modalArt.src = heroCover || fallbackArt;
    modalArt.onerror = () => { if (typeof handleImageLoadError === 'function') handleImageLoadError(modalArt, track.id); else modalArt.src = 'assets/logo.png'; };
    updateModalDynamicBackdrop(heroCover || track.cover || fallbackArt);
  }
  if (modalTitle) modalTitle.innerText = track.title;
  if (modalArtist) modalArtist.innerText = track.artist;
  if (modalDuration && track.duration) modalDuration.innerText = formatTime(track.duration);

  if (modalHeart) {
    modalHeart.style.fill = track.favorite ? '#EF4444' : 'none';
    modalHeart.style.stroke = track.favorite ? '#EF4444' : 'currentColor';
  }
  if (modalHeartBtn) {
    modalHeartBtn.classList.toggle('active', !!track.favorite);
  }

  const isCached = downloadedSet.has(track.id);
  if (modalDlIcon) {
    modalDlIcon.style.stroke = isCached ? '#16A34A' : 'currentColor';
  }
  if (modalDlBtn) {
    modalDlBtn.style.color = isCached ? '#16A34A' : 'var(--text-dim)';
  }

  // Synchronize player theme and source switcher (Red theme scoped ONLY to player when streaming)
  const isStreaming = Boolean((typeof isOnlineYtPlaying !== 'undefined' && isOnlineYtPlaying) || (typeof window !== 'undefined' && window.isOnlineYtPlaying));
  const playerModal = document.getElementById('nowPlayingModal');
  const miniPlayer = document.getElementById('miniPlayer');

  if (playerModal) {
    if (isStreaming) {
      playerModal.classList.add('streaming-mode');
    } else {
      playerModal.classList.remove('streaming-mode');
    }
  }

  if (miniPlayer) {
    if (isStreaming) {
      miniPlayer.classList.add('streaming-mode');
    } else {
      miniPlayer.classList.remove('streaming-mode');
    }
  }

  const sourceBtn = document.getElementById('playerSourceToggleBtn');
  const sourceLabel = document.getElementById('playerSourceLabel');
  if (sourceBtn) {
    if (isStreaming) {
      sourceBtn.className = 'player-source-btn source-streaming';
      sourceBtn.innerText = '📡 Streaming ⇄';
      sourceBtn.title = 'Streaming online (Tap to switch to offline cache)';
    } else {
      sourceBtn.className = 'player-source-btn source-offline';
      sourceBtn.innerText = '⚡ Offline ⇄';
      sourceBtn.title = 'Playing downloaded audio offline (Tap to switch to stream)';
    }
  }
  if (sourceLabel) {
    sourceLabel.innerText = isStreaming ? '📡 Streaming' : '⚡ Offline';
  }

  const miniSourceBadge = document.getElementById('miniSourceBadge');
  if (miniSourceBadge) {
    if (isStreaming) {
      miniSourceBadge.className = 'mini-source-badge source-streaming';
      miniSourceBadge.innerText = '📡 Stream';
    } else {
      miniSourceBadge.className = 'mini-source-badge source-offline';
      miniSourceBadge.innerText = '⚡ Offline';
    }
  }

  // Synchronize YouTube Radio UI Status indicators
  const isRadio = Boolean((typeof window !== 'undefined' && window.isRadioActive) || (typeof isRadioActive !== 'undefined' && isRadioActive));

  const modalSourceBadge = document.getElementById('modalSourceBadge');
  if (modalSourceBadge) {
    if (isStreaming) {
      modalSourceBadge.className = 'modal-source-pill source-streaming';
      modalSourceBadge.innerText = '📡 Streaming';
    } else {
      modalSourceBadge.className = 'modal-source-pill source-offline';
      modalSourceBadge.innerText = '⚡ Offline';
    }
  }

  const modalRadioBadge = document.getElementById('modalRadioBadge');
  if (modalRadioBadge) {
    modalRadioBadge.style.display = isRadio ? 'inline-flex' : 'none';
  }

  const modalRadioBtn = document.getElementById('modalRadioBtn');
  const miniRadioBtn = document.getElementById('miniRadioBtn');
  const queueRadioBtn = document.getElementById('queueStartRadioBtn');
  const queueStartRadioText = document.getElementById('queueStartRadioText');
  const playerRadioBadge = document.getElementById('playerRadioBadge');
  const miniRadioBadge = document.getElementById('miniRadioBadge');

  if (modalRadioBtn) {
    if (isRadio) {
      modalRadioBtn.classList.add('active');
      modalRadioBtn.title = 'Dynamic Radio is Active (Tap to re-sync)';
    } else {
      modalRadioBtn.classList.remove('active');
      modalRadioBtn.title = 'Start Dynamic Radio';
    }
  }

  if (miniRadioBtn) {
    if (isRadio) {
      miniRadioBtn.classList.add('active');
      miniRadioBtn.title = 'Dynamic Radio is Active (Tap to re-sync)';
    } else {
      miniRadioBtn.classList.remove('active');
      miniRadioBtn.title = 'Start Dynamic Radio';
    }
  }

  if (queueRadioBtn) {
    if (isRadio) {
      queueRadioBtn.classList.add('active');
      queueRadioBtn.title = 'Dynamic Radio is Active';
    } else {
      queueRadioBtn.classList.remove('active');
      queueRadioBtn.title = 'Start Dynamic Radio';
    }
  }

  if (queueStartRadioText) {
    queueStartRadioText.innerText = isRadio ? 'Radio Active' : 'Start Radio';
  }

  if (playerRadioBadge) {
    playerRadioBadge.style.display = isRadio ? 'inline-flex' : 'none';
  }

  if (miniRadioBadge) {
    miniRadioBadge.style.display = isRadio ? 'inline-flex' : 'none';
  }
}

function updateModalDynamicBackdrop(coverUrl) {
  if (typeof document === 'undefined') return;
  const artEl = document.getElementById('modalBackdropArt');
  const prevArtEl = document.getElementById('modalBackdropArtPrev');
  if (!artEl) return;

  const newSrc = coverUrl || 'assets/logo.png';
  if (artEl.getAttribute && artEl.getAttribute('data-src') === newSrc) return;
  if (artEl.setAttribute) artEl.setAttribute('data-src', newSrc);

  if (prevArtEl) {
    if (artEl.src && typeof window !== 'undefined' && artEl.src !== window.location.href) {
      prevArtEl.src = artEl.src;
      if (prevArtEl.classList && prevArtEl.classList.add) prevArtEl.classList.add('active');
    }
  }

  if (artEl.classList && artEl.classList.remove) artEl.classList.remove('active');

  if (typeof Image === 'function') {
    try {
      const img = new Image();
      img.onload = () => {
        artEl.src = newSrc;
        if (artEl.classList && artEl.classList.add) artEl.classList.add('active');
        if (prevArtEl) {
          setTimeout(() => {
            if (prevArtEl && prevArtEl.classList && prevArtEl.classList.remove) {
              prevArtEl.classList.remove('active');
            }
          }, 650);
        }
      };
      img.onerror = () => {
        artEl.src = 'assets/logo.png';
        if (artEl.classList && artEl.classList.add) artEl.classList.add('active');
        if (prevArtEl && prevArtEl.classList && prevArtEl.classList.remove) {
          prevArtEl.classList.remove('active');
        }
      };
      img.src = newSrc;
      return;
    } catch (e) {}
  }

  artEl.src = newSrc;
  if (artEl.classList && artEl.classList.add) artEl.classList.add('active');
  if (prevArtEl && prevArtEl.classList && prevArtEl.classList.remove) {
    prevArtEl.classList.remove('active');
  }
}

function openNowPlayingModal() {
  const modal = document.getElementById('nowPlayingModal');
  if (modal) {
    modal.classList.add('active');
    document.body.classList.add('modal-open');
    if (typeof currentTrack !== 'undefined' && currentTrack) {
      const heroCover = (typeof getHighResArtworkUrl === 'function') ? getHighResArtworkUrl(currentTrack.cover, 800) : currentTrack.cover;
      updateModalDynamicBackdrop(heroCover || currentTrack.cover);
    }
    if (typeof isPlaying !== 'undefined' && isPlaying) {
      if (typeof startRealVisualizer === 'function') startRealVisualizer();
      if (typeof startSmoothProgressLoop === 'function') startSmoothProgressLoop();
    } else {
      if (typeof stopRealVisualizer === 'function') stopRealVisualizer();
    }
  }
}

function closeNowPlayingModal() {
  const modal = document.getElementById('nowPlayingModal');
  if (modal) {
    modal.classList.remove('active');
    document.body.classList.remove('modal-open');
  }
}

function setStatsRange(range) {
  if (window.listeningTracker && typeof window.listeningTracker.setRange === 'function') {
    window.listeningTracker.setRange(range);
  }
}

// Auto-wire range buttons in settings tab
if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
  document.addEventListener('DOMContentLoaded', () => {
    if (typeof document.querySelectorAll === 'function') {
      document.querySelectorAll('.range-btn').forEach(btn => {
        if (typeof btn.addEventListener === 'function') {
          btn.addEventListener('click', () => {
            const r = btn.getAttribute('data-range');
            if (r) setStatsRange(r);
          });
        }
      });
    }
  });
}

window.updateLookAheadUI = updateLookAheadUI;
window.updateDownloadBannerUI = updateDownloadBannerUI;
window.updatePlayerUI = updatePlayerUI;
window.openNowPlayingModal = openNowPlayingModal;
window.closeNowPlayingModal = closeNowPlayingModal;
window.setStatsRange = setStatsRange;
window.updateModalDynamicBackdrop = updateModalDynamicBackdrop;
