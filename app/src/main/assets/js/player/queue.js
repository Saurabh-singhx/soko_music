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
    : (activePlaylist ? activePlaylist.songIds.map(id => findTrackAcrossAllSources(id)).filter(Boolean) : CATALOG);
  if (!pool || pool.length <= 1) pool = CATALOG;

  let nextTrack;
  if (isShuffle) {
    const otherTracks = pool.filter(t => t.id !== currentTrack?.id);
    nextTrack = otherTracks.length > 0 ? otherTracks[Math.floor(Math.random() * otherTracks.length)] : pool[0];
  } else {
    const curIdx = pool.findIndex(t => t.id === currentTrack?.id);
    const nextIdx = curIdx >= 0 ? (curIdx + 1) % pool.length : 0;
    nextTrack = pool[nextIdx];
  }
  if (nextTrack) {
    selectTrackToPlay(nextTrack.id);
  }
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
    : (activePlaylist ? activePlaylist.songIds.map(id => findTrackAcrossAllSources(id)).filter(Boolean) : CATALOG);
  if (!pool || pool.length <= 1) pool = CATALOG;

  const curIdx = pool.findIndex(t => t.id === currentTrack?.id);
  const prevIdx = curIdx > 0 ? curIdx - 1 : pool.length - 1;
  const prevTrack = pool[prevIdx];
  if (prevTrack) {
    selectTrackToPlay(prevTrack.id);
  }
}

function scheduleLookAhead(currentId) {
  let pool = (window.activeQueueList && window.activeQueueList.length > 1)
    ? window.activeQueueList
    : (activePlaylist ? activePlaylist.songIds.map(id => findTrackAcrossAllSources(id)).filter(Boolean) : CATALOG);
  if (!pool || pool.length <= 1) pool = CATALOG;
  const validPool = pool.filter(t => !isPodcastOrLongTrack(t));
  const poolToUse = validPool.length > 0 ? validPool : pool;
  const curIdx = poolToUse.findIndex(t => t.id === currentId);
  const nextIdx = curIdx >= 0 ? (curIdx + 1) % poolToUse.length : 0;
  lookAheadNextTrack = poolToUse[nextIdx] || CATALOG[0];
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
