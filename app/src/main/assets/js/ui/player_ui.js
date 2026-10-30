// ============================================================
// PLAYER UI & MODAL MANAGEMENT
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
  if (artEl) artEl.src = lookAheadNextTrack.cover || '';

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
