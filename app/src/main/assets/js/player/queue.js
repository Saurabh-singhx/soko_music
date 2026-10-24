// ============================================================
// PLAYBACK QUEUE & LOOKAHEAD ENGINE
// ============================================================
function autoPrefetchNextTrack(currentId) {
  try {
    const chk = document.getElementById('chkLookAhead');
    if (chk && chk.checked === false) return;

    let pool = (window.activeQueueList && window.activeQueueList.length > 1)
      ? window.activeQueueList
      : (activePlaylist ? activePlaylist.songIds.map(id => findTrackAcrossAllSources(id)).filter(Boolean) : CATALOG);
    if (!pool || pool.length <= 1) pool = CATALOG;
    const curIdx = pool.findIndex(t => t.id === currentId);
    const nextIdx = curIdx >= 0 ? (curIdx + 1) % pool.length : 0;
    const nextTrack = pool[nextIdx];
    if (!nextTrack || !nextTrack.id) return;

    // Skip pre-fetching if next track is a podcast or longer than 10 minutes (600s)
    if (isPodcastOrLongTrack(nextTrack)) return;

    if (isTrackOffline(nextTrack.id) || activeDownloads.has(nextTrack.id)) return;

    console.log('[Auto-Prefetch] Pre-caching next song in background:', nextTrack.title, nextTrack.id);
    if (window.SokoNative && typeof window.SokoNative.downloadTrack === 'function') {
      window.SokoNative.downloadTrack(nextTrack.id, nextTrack.title, nextTrack.artist, nextTrack.cover);
    }
  } catch (err) {
    console.warn('[Auto-Prefetch] Notice:', err);
  }
}

function toggleShuffle() {
  isShuffle = !isShuffle;
  window.isShuffle = isShuffle;
  const btn = document.getElementById('btnShuffle');
  if (btn) btn.style.color = isShuffle ? 'var(--accent-primary)' : 'var(--text-dim)';
  showToast(isShuffle ? 'Shuffle Enabled' : 'Shuffle Off', isShuffle ? '🔀' : '➡️');
}

function toggleRepeat() {
  isRepeat = !isRepeat;
  window.isRepeat = isRepeat;
  const btn = document.getElementById('btnRepeat');
  if (btn) btn.style.color = isRepeat ? 'var(--accent-primary)' : 'var(--text-dim)';
  showToast(isRepeat ? 'Repeat Enabled' : 'Repeat Off', isRepeat ? '🔁' : '➡️');
}

function playNextTrack() {
  let pool = (window.activeQueueList && window.activeQueueList.length > 1)
    ? window.activeQueueList
    : (activePlaylist && activePlaylist.songIds && activePlaylist.songIds.length > 0
        ? activePlaylist.songIds.map(id => findTrackAcrossAllSources(id)).filter(Boolean)
        : (typeof CATALOG !== 'undefined' && CATALOG.length > 1 ? CATALOG : (window.activeQueueList || [])));
  if (!pool || pool.length <= 1) {
    if (typeof CATALOG !== 'undefined' && CATALOG.length > 1) {
      pool = CATALOG;
    }
  }
  
  // NEVER fall back to charts! If queue is empty, notify user and stop.
  if (!pool || pool.length === 0) {
    if (typeof showToast === 'function') {
      showToast('No more tracks in queue', 'ℹ️');
    }
    stopAllAudioEngines();
    return;
  }

  const filterFn = (typeof isPodcastOrLongTrack === 'function')
    ? isPodcastOrLongTrack
    : (typeof window !== 'undefined' && typeof window.isPodcastOrLongTrack === 'function' ? window.isPodcastOrLongTrack : null);
  if (filterFn) {
    const validPool = pool.filter(t => t && !filterFn(t));
    if (validPool.length > 0) pool = validPool;
  }

  // If pool has only 1 track and it is the current track, attempt to fetch dynamic radio queue
  if (pool.length === 1 && pool[0].id === currentTrack?.id) {
    if (typeof fetchAndApplyYtmRadioQueue === 'function') {
      fetchAndApplyYtmRadioQueue(currentTrack.id, true).then(() => {
        if (window.activeQueueList && window.activeQueueList.length > 1) {
          const nextIdx = window.activeQueueList.findIndex(t => t.id !== currentTrack.id);
          if (nextIdx >= 0) selectTrackToPlay(window.activeQueueList[nextIdx].id);
        } else {
          if (typeof showToast === 'function') showToast('No more tracks in radio queue', 'ℹ️');
          stopAllAudioEngines();
        }
      }).catch(() => {
        if (typeof showToast === 'function') showToast('Unable to load next radio track', '⚠️');
        stopAllAudioEngines();
      });
    } else {
      if (typeof showToast === 'function') showToast('No more tracks in queue', 'ℹ️');
      stopAllAudioEngines();
    }
    return;
  }

  let nextTrack;
  const shuffleActive = (typeof window !== 'undefined' && window.isShuffle !== undefined) ? window.isShuffle : isShuffle;
  const repeatActive = (typeof window !== 'undefined' && window.isRepeat !== undefined) ? window.isRepeat : isRepeat;

  if (repeatActive && currentTrack) {
    nextTrack = currentTrack;
  } else if (shuffleActive) {
    const otherTracks = pool.filter(t => t.id !== currentTrack?.id);
    nextTrack = otherTracks.length > 0 ? otherTracks[Math.floor(Math.random() * otherTracks.length)] : pool[0];
  } else {
    const curIdx = pool.findIndex(t => t.id === currentTrack?.id);
    const nextIdx = curIdx >= 0 ? (curIdx + 1) : 0;
    if (nextIdx < pool.length) {
      nextTrack = pool[nextIdx];
    } else {
      nextTrack = null;
    }
  }

  // If we reached the end of the pool:
  if (!nextTrack) {
    // End of playlist/shelf reached! Seamlessly append radio recommendations
    if (typeof fetchAndApplyYtmRadioQueue === 'function' && currentTrack) {
      fetchAndApplyYtmRadioQueue(currentTrack.id, 'append').then(() => {
        if (window.activeQueueList && window.activeQueueList.length > pool.length) {
          const newTrack = window.activeQueueList[pool.length];
          if (newTrack) selectTrackToPlay(newTrack.id);
        } else {
          if (typeof showToast === 'function') showToast('End of queue reached', 'ℹ️');
          stopAllAudioEngines();
        }
      }).catch(() => {
        if (typeof showToast === 'function') showToast('End of queue', 'ℹ️');
        stopAllAudioEngines();
      });
    } else {
      if (typeof showToast === 'function') showToast('End of queue', 'ℹ️');
      stopAllAudioEngines();
    }
    return;
  }

  // Look-ahead radio continuation:
  // 1. If radio is active and approaching end of radio queue (within 3 tracks)
  // 2. OR if playing a shelf/playlist and within 2 tracks of the end
  if (typeof fetchAndApplyYtmRadioQueue === 'function') {
    const curPos = pool.findIndex(t => t.id === nextTrack.id);
    if (window.isRadioActive && curPos >= pool.length - 3) {
      fetchAndApplyYtmRadioQueue(nextTrack.id, 'append');
    } else if (!window.isRadioActive && curPos >= pool.length - 2) {
      // Nearing end of shelf/playlist - prefetch radio recommendations so playback never stops
      fetchAndApplyYtmRadioQueue(nextTrack.id, 'append');
    }
  }

  selectTrackToPlay(nextTrack.id);
}

function getActivePlaybackCurrentTime() {
  if (isOnlineYtPlaying && typeof ytPlayer !== 'undefined' && ytPlayer && typeof ytPlayer.getCurrentTime === 'function') {
    try { return ytPlayer.getCurrentTime() || 0; } catch (e) { return 0; }
  }
  if (audioEl && !audioEl.paused && audioEl.currentTime > 0) {
    return audioEl.currentTime;
  }
  if (typeof window !== 'undefined' && window.currentPlaybackTime !== undefined && window.currentPlaybackTime > 0) {
    return window.currentPlaybackTime;
  }
  return 0;
}

function playPreviousTrack() {
  const curPos = getActivePlaybackCurrentTime();
  if (curPos > 3) {
    if (isOnlineYtPlaying && typeof ytPlayer !== 'undefined' && ytPlayer && typeof ytPlayer.seekTo === 'function') {
      try { ytPlayer.seekTo(0, true); } catch (e) {}
    } else if (audioEl && audioEl.src) {
      audioEl.currentTime = 0;
    }
    if (typeof window !== 'undefined' && window.SokoNative && typeof window.SokoNative.seekAudio === 'function') {
      try { window.SokoNative.seekAudio(0); } catch (e) {}
    }
    if (typeof window !== 'undefined') window.currentPlaybackTime = 0;
    return;
  }
  let pool = (window.activeQueueList && window.activeQueueList.length > 1)
    ? window.activeQueueList
    : (activePlaylist && activePlaylist.songIds && activePlaylist.songIds.length > 0
        ? activePlaylist.songIds.map(id => findTrackAcrossAllSources(id)).filter(Boolean)
        : (typeof CATALOG !== 'undefined' && CATALOG.length > 1 ? CATALOG : (window.activeQueueList || [])));
  if (!pool || pool.length <= 1) {
    if (typeof CATALOG !== 'undefined' && CATALOG.length > 1) {
      pool = CATALOG;
    }
  }
  if (!pool || pool.length === 0) {
    if (typeof showToast === 'function') {
      showToast('No previous tracks in queue', 'ℹ️');
    }
    return;
  }
  const filterFn = (typeof isPodcastOrLongTrack === 'function')
    ? isPodcastOrLongTrack
    : (typeof window !== 'undefined' && typeof window.isPodcastOrLongTrack === 'function' ? window.isPodcastOrLongTrack : null);
  if (filterFn) {
    const validPool = pool.filter(t => t && !filterFn(t));
    if (validPool.length > 0) pool = validPool;
  }

  const curIdx = pool.findIndex(t => t.id === currentTrack?.id);
  const prevIdx = curIdx > 0 ? (curIdx - 1) : 0;
  const prevTrack = pool[prevIdx];
  if (prevTrack) {
    selectTrackToPlay(prevTrack.id);
  }
}

function scheduleLookAhead(currentId) {
  let pool = (window.activeQueueList && window.activeQueueList.length > 1)
    ? window.activeQueueList
    : (activePlaylist && activePlaylist.songIds && activePlaylist.songIds.length > 0
        ? activePlaylist.songIds.map(id => findTrackAcrossAllSources(id)).filter(Boolean)
        : (typeof CATALOG !== 'undefined' && CATALOG.length > 1 ? CATALOG : (window.activeQueueList || [])));
  if (!pool || pool.length <= 1) {
    if (typeof CATALOG !== 'undefined' && CATALOG.length > 1) {
      pool = CATALOG;
    }
  }
  if (!pool || pool.length === 0) {
    lookAheadNextTrack = null;
    window.lookAheadNextTrack = null;
    updateLookAheadUI();
    return;
  }
  const validPool = pool.filter(t => !isPodcastOrLongTrack(t));
  const poolToUse = validPool.length > 0 ? validPool : pool;
  const curIdx = poolToUse.findIndex(t => t.id === currentId);
  const nextIdx = curIdx >= 0 ? (curIdx + 1) % poolToUse.length : 0;
  lookAheadNextTrack = poolToUse[nextIdx] || null;
  window.lookAheadNextTrack = lookAheadNextTrack;
  updateLookAheadUI();
}

window.autoPrefetchNextTrack = autoPrefetchNextTrack;
window.toggleShuffle = toggleShuffle;
window.toggleRepeat = toggleRepeat;
window.playNextTrack = playNextTrack;
window.playPreviousTrack = playPreviousTrack;
window.getActivePlaybackCurrentTime = getActivePlaybackCurrentTime;
window.scheduleLookAhead = scheduleLookAhead;
