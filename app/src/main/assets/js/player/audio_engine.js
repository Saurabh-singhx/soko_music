// ============================================================
// CORE AUDIO PLAYBACK ENGINE
// ============================================================
function isRadioHomeShelf(shelf) {
  if (!shelf) return false;
  if (shelf.id === 'quick_picks') return true;
  const title = (shelf.title || '').toLowerCase();
  const badge = (shelf.badge || '').toLowerCase();
  return (title.includes('quick') || badge.includes('start radio')) &&
         !title.includes('forgot') && !title.includes('together') && !title.includes('trend');
}

function selectTrackToPlay(trackId, startRadio = false, contextShelfId = null) {
  if (typeof window !== 'undefined' && window.__isAppOutdated) {
    if (typeof showToast === 'function') {
      showToast('⚠️ App is outdated. Please update to continue.', '⛔');
    }
    return;
  }
  let track = findTrackAcrossAllSources(trackId);
  if (!track && trackId) {
    track = {
      id: trackId,
      title: "Streaming Song",
      artist: "YouTube Music",
      duration: 215,
      cover: `https://i.ytimg.com/vi/${trackId}/hqdefault.jpg`,
      audioUrl: "",
      bitrate: "160k Opus"
    };
    CATALOG.push(track);
  } else if (!track) {
    track = CATALOG[0] || null;
  }
  if (!track) return;

  const filterFn = (typeof isPodcastOrLongTrack === 'function')
    ? isPodcastOrLongTrack
    : (typeof window !== 'undefined' && typeof window.isPodcastOrLongTrack === 'function' ? window.isPodcastOrLongTrack : null);
  if (filterFn && filterFn(track)) {
    if (typeof showToast === 'function') {
      showToast('⚠️ Tracks longer than 10 minutes are excluded', '⏱️');
    }
    if (typeof playNextTrack === 'function') {
      playNextTrack();
    }
    return;
  }

  const curPlaylist = (typeof window !== 'undefined' && window.activePlaylist) || activePlaylist;
  const isPlayingActivePlaylist = !startRadio && curPlaylist && curPlaylist.songIds && curPlaylist.songIds.includes(track.id);

  const homeShelves = (typeof window !== 'undefined' && window.currentHomeShelves) || currentHomeShelves;
  let matchingShelf = null;
  if (!isPlayingActivePlaylist && homeShelves && homeShelves.length > 0) {
    if (contextShelfId) {
      matchingShelf = homeShelves.find(s => s.id === contextShelfId);
    }
    if (!matchingShelf) {
      matchingShelf = homeShelves.find(s => s.tracks && s.tracks.some(t => t.id === track.id));
    }
  }
  const isRadioShelf = !isPlayingActivePlaylist && startRadio;

  if (isPlayingActivePlaylist) {
    activePlaylist = curPlaylist;
    window.activePlaylist = curPlaylist;
    if (!window.activeQueueList || !window.activeQueueList.some(t => t.id === track.id)) {
      window.activeQueueList = curPlaylist.songIds.map(id => findTrackAcrossAllSources(id)).filter(Boolean);
    }
    window.isRadioActive = false;
  } else if (!startRadio && window.activeQueueList && window.activeQueueList.length > 1 && window.activeQueueList.some(t => t.id === track.id)) {
    // Track is already part of the active queue - keep queue progression intact!
  } else if (isRadioShelf) {
    // Quick picks or explicit radio launch
    activePlaylist = null;
    window.activePlaylist = null;
    window.activeQueueList = [track];
    window.isRadioActive = true;
  } else if (matchingShelf && matchingShelf.tracks && matchingShelf.tracks.length > 0) {
    // Multi-track home shelf (e.g. Forgotten favorites, Trending songs for you, Listen together)
    // Queue MUST preserve all 16 tracks from this shelf!
    activePlaylist = {
      id: 'shelf_' + matchingShelf.id,
      name: matchingShelf.title,
      songIds: matchingShelf.tracks.map(t => t.id)
    };
    window.activePlaylist = activePlaylist;
    window.activeQueueList = matchingShelf.tracks;
    window.isRadioActive = false;
  } else if (currentYtmSearchResults && currentYtmSearchResults.some(t => t.id === track.id)) {
    activePlaylist = null;
    window.activePlaylist = null;
    window.activeQueueList = currentYtmSearchResults;
    window.isRadioActive = false;
  } else if (REGIONAL_CHARTS && currentChartRegion && REGIONAL_CHARTS[currentChartRegion]?.some(t => t.id === track.id)) {
    activePlaylist = {
      id: 'chart_' + currentChartRegion,
      name: currentChartRegion + ' Chart',
      songIds: REGIONAL_CHARTS[currentChartRegion].map(t => t.id)
    };
    window.activePlaylist = activePlaylist;
    window.activeQueueList = REGIONAL_CHARTS[currentChartRegion];
    window.isRadioActive = false;
  } else if (personalShelves && personalShelves.length > 0) {
    let foundInShelf = false;
    for (const shelf of personalShelves) {
      if (shelf.items && shelf.items.some(t => t.id === track.id)) {
        activePlaylist = {
          id: 'shelf_' + (shelf.id || 'personal'),
          name: shelf.title || 'Personal Shelf',
          songIds: shelf.items.map(t => t.id)
        };
        window.activePlaylist = activePlaylist;
        window.activeQueueList = shelf.items;
        window.isRadioActive = false;
        foundInShelf = true;
        break;
      }
    }
    if (!foundInShelf) {
      activePlaylist = null;
      window.activePlaylist = null;
      window.activeQueueList = [track];
      window.isRadioActive = isRadioShelf;
    }
  } else {
    activePlaylist = null;
    window.activePlaylist = null;
    window.activeQueueList = [track];
    window.isRadioActive = isRadioShelf;
  }

  playRealTrack(track);
  scheduleLookAhead(track.id);

  // Trigger YouTube Music Radio:
  // ONLY if this is a radio launch (Quick picks or startRadio=true) OR single isolated track with no queue!
  if (isRadioShelf || (window.activeQueueList && window.activeQueueList.length <= 1)) {
    fetchAndApplyYtmRadioQueue(track.id, 'replace');
  }
}

function playRealTrack(track) {
  if (typeof window !== 'undefined' && window.__isAppOutdated) {
    return;
  }
  const filterFn = (typeof isPodcastOrLongTrack === 'function')
    ? isPodcastOrLongTrack
    : (typeof window !== 'undefined' && typeof window.isPodcastOrLongTrack === 'function' ? window.isPodcastOrLongTrack : null);
  if (filterFn && filterFn(track)) {
    if (typeof showToast === 'function') {
      showToast('⚠️ Tracks longer than 10 minutes are excluded', '⏱️');
    }
    if (typeof playNextTrack === 'function') {
      playNextTrack();
    }
    return;
  }

  stopAllAudioEngines();
  currentTrack = track;
  window.currentTrack = track;
  if (typeof recordLruPlay === 'function') recordLruPlay(track.id);
  startPlaybackTelemetry(track);
  if (window.SokoNative && typeof window.SokoNative.setActivePlaybackId === 'function') {
    try { window.SokoNative.setActivePlaybackId(track.id); } catch (e) {}
  }
  const miniPlayer = document.getElementById('miniPlayer');
  if (miniPlayer) miniPlayer.style.display = 'flex';
  updatePlayerUI(track);

  let diskPath = "";
  if (window.SokoNative && typeof window.SokoNative.getDownloadedTrackPath === 'function') {
    diskPath = window.SokoNative.getDownloadedTrackPath(track.id);
  }
  const isDownloadedOnDisk = (diskPath && diskPath.length > 0) || (window.SokoNative && window.SokoNative.isTrackDownloaded && window.SokoNative.isTrackDownloaded(track.id));
  const isBundledAsset = GENUINE_BUNDLED_IDS.has(track.id);
  const isAlreadyOffline = isDownloadedOnDisk || isBundledAsset;

  if (isAlreadyOffline) {
    // 1. PLAY GENUINE LOCAL AUDIO FROM DISK OR BUNDLE
    let targetSrc = diskPath;
    if (!targetSrc || targetSrc.trim() === '') {
      targetSrc = `assets/music/${track.id}.opus`;
    }

    if (window.SokoNative && typeof window.SokoNative.playAudio === 'function') {
      window.SokoNative.playAudio(targetSrc, track.title, track.artist, track.cover);
      isPlaying = true;
      window.isPlaying = true;
      updatePlayIcons(true);
      startRealVisualizer();
    } else if (audioEl) {
      if (audioEl.src !== targetSrc && !audioEl.src.endsWith(targetSrc)) {
        audioEl.src = targetSrc;
      }
      audioEl.volume = 1.0;
      audioEl.play().then(() => {
        isPlaying = true;
        window.isPlaying = true;
        updatePlayIcons(true);
        startRealVisualizer();
      }).catch(e => {
        console.warn('Playback pending user gesture:', e);
      });
    }
    showToast(`⚡ Playing offline: "${track.title}"`, '⚡');
  } else {
    // 2. REAL ON-DEVICE DOWNLOAD FIRST, THEN PLAY (Strictly <= 10 min, excluding podcasts)
    const filterFn = (typeof isPodcastOrLongTrack === 'function')
      ? isPodcastOrLongTrack
      : (typeof window !== 'undefined' && typeof window.isPodcastOrLongTrack === 'function' ? window.isPodcastOrLongTrack : null);
    if (filterFn && filterFn(track)) {
      if (typeof showToast === 'function') showToast('⚠️ Tracks longer than 10 minutes are excluded', '⏱️');
      if (typeof playNextTrack === 'function') playNextTrack();
      return;
    } else if (window.SokoNative && typeof window.SokoNative.downloadAndPlayTrack === 'function') {
      activeDownloads.set(track.id, 5);
      updateDownloadBannerUI(track, 5, false);
      showToast(`📥 Downloading "${track.title}" (128k AAC)...`, '📥');
      window.SokoNative.downloadAndPlayTrack(track.id, track.title, track.artist, track.cover);
    } else {
      // Fallback in browser outside APK: stream directly
      playOnlineYouTubeStream(track);
    }
  }

  track.plays = (track.plays || 0) + 1;
  updateMediaSession(track);
  persistLastPlayedTrack(track);
  autoPrefetchNextTrack(track.id);
}

function stopAllAudioEngines() {
  stopOnlineYouTubeStream();
  if (window.SokoNative && typeof window.SokoNative.stopAudio === 'function') {
    try { window.SokoNative.stopAudio(); } catch (e) {}
  } else if (window.SokoNative && typeof window.SokoNative.pauseAudio === 'function') {
    try { window.SokoNative.pauseAudio(); } catch (e) {}
  }
  if (audioEl) {
    try {
      audioEl.pause();
      audioEl.currentTime = 0;
      audioEl.src = '';
    } catch (e) {}
  }
  isPlaying = false;
  window.isPlaying = false;
  updatePlayIcons(false);
  stopRealVisualizer();
}

function togglePlayPause() {
  if (currentTrack && activeDownloads.has(currentTrack.id)) {
    if (window.SokoNative && typeof window.SokoNative.setActivePlaybackId === 'function') {
      window.SokoNative.setActivePlaybackId(currentTrack.id);
    }
    showToast(`Loading "${currentTrack.title}"...`, '⏳');
    return;
  }

  if (isOnlineYtPlaying) {
    if (isPlaying) {
      if (ytPlayer && typeof ytPlayer.pauseVideo === 'function') {
        try { ytPlayer.pauseVideo(); } catch (e) {}
      }
      isPlaying = false;
      window.isPlaying = false;
      updatePlayIcons(false);
      stopRealVisualizer();
      stopOnlineProgressUpdater();
    } else {
      if (ytPlayer && typeof ytPlayer.playVideo === 'function') {
        try { ytPlayer.playVideo(); } catch (e) {}
      }
      isPlaying = true;
      window.isPlaying = true;
      updatePlayIcons(true);
      startRealVisualizer();
      startOnlineProgressUpdater();
    }
    if (window.SokoNative && typeof window.SokoNative.updateNativePlayer === 'function' && currentTrack) {
      window.SokoNative.updateNativePlayer(currentTrack.title, currentTrack.artist, isPlaying, currentTrack.duration || 215, 0, currentTrack.cover);
    }
    return;
  }

  // Offline local playback toggle
  if (window.SokoNative && typeof window.SokoNative.pauseAudio === 'function') {
    if (isPlaying) {
      window.SokoNative.pauseAudio();
      isPlaying = false;
      window.isPlaying = false;
      updatePlayIcons(false);
      stopRealVisualizer();
    } else {
      let isNativeRunning = false;
      if (typeof window.SokoNative.isAudioPlaying === 'function') {
        try { isNativeRunning = window.SokoNative.isAudioPlaying(); } catch (e) {}
      }
      if (!isNativeRunning && currentTrack && isTrackOffline(currentTrack.id)) {
        playRealTrack(currentTrack);
      } else {
        window.SokoNative.resumeAudio();
        isPlaying = true;
        window.isPlaying = true;
        updatePlayIcons(true);
        startRealVisualizer();
      }
    }
  } else if (audioEl) {
    if (audioEl.paused) {
      audioEl.play().then(() => {
        isPlaying = true;
        window.isPlaying = true;
        updatePlayIcons(true);
        startRealVisualizer();
      }).catch(e => {
        console.warn('Playback error:', e);
      });
    } else {
      audioEl.pause();
      isPlaying = false;
      window.isPlaying = false;
      updatePlayIcons(false);
      stopRealVisualizer();
    }
  }
  recordPlaybackStateChangeTelemetry(isPlaying);
}

function updatePlayIcons(playing) {
  const miniIcon = document.getElementById('miniPlayIcon');
  const modalIcon = document.getElementById('modalMainPlayIcon');
  const playSvg = '<path d="M8 5v14l11-7z"></path>';
  const pauseSvg = '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"></path>';

  if (miniIcon) miniIcon.innerHTML = playing ? pauseSvg : playSvg;
  if (modalIcon) modalIcon.innerHTML = playing ? pauseSvg : playSvg;
}

function handleSeek(val) {
  const percent = parseFloat(val);
  if (isOnlineYtPlaying) {
    if (ytPlayer && typeof ytPlayer.seekTo === 'function') {
      const dur = (ytPlayer.getDuration && ytPlayer.getDuration() > 0) ? ytPlayer.getDuration() : (currentTrack ? currentTrack.duration : 215);
      const targetSec = (percent / 100) * dur;
      ytPlayer.seekTo(targetSec, true);
    }
    return;
  }

  if (window.SokoNative && typeof window.SokoNative.seekAudio === 'function' && currentTrack) {
    const targetSec = Math.floor((percent / 100) * (currentTrack.duration || 215));
    window.SokoNative.seekAudio(targetSec);
  } else if (audioEl && audioEl.duration) {
    audioEl.currentTime = (percent / 100) * audioEl.duration;
  }
}

function seekTrack(val) {
  handleSeek(val);
}

function seekToSeconds(targetSec) {
  if (isOnlineYtPlaying) {
    if (ytPlayer && typeof ytPlayer.seekTo === 'function') {
      ytPlayer.seekTo(targetSec, true);
    }
  } else {
    if (window.SokoNative && typeof window.SokoNative.seekAudio === 'function') {
      window.SokoNative.seekAudio(targetSec);
    } else if (audioEl && audioEl.duration) {
      audioEl.currentTime = targetSec;
    }
  }
}

function setupAudioListeners() {
  if (!audioEl) return;

  audioEl.addEventListener('timeupdate', () => {
    if (isOnlineYtPlaying) return;
    const cur = audioEl.currentTime;
    const dur = audioEl.duration;
    const percent = dur ? (cur / dur) * 100 : 0;

    const slider = document.getElementById('modalSeekSlider');
    const curTime = document.getElementById('modalTimeCurrent');
    const durTime = document.getElementById('modalTimeDuration');
    const miniFill = document.getElementById('miniProgressFill');

    if (curTime) curTime.innerText = formatTime(Math.floor(cur));
    if (durTime && dur) durTime.innerText = formatTime(Math.floor(dur));
    if (slider && !slider.matches(':active')) {
      slider.value = percent;
    }
    if (miniFill) miniFill.style.width = `${percent}%`;
  });

  audioEl.addEventListener('ended', () => {
    if (isRepeat) {
      audioEl.currentTime = 0;
      audioEl.play();
    } else {
      playNextTrack();
    }
  });
}

window.selectTrackToPlay = selectTrackToPlay;
window.playRealTrack = playRealTrack;
window.stopAllAudioEngines = stopAllAudioEngines;
window.togglePlayPause = togglePlayPause;
window.updatePlayIcons = updatePlayIcons;
window.handleSeek = handleSeek;
window.seekTrack = seekTrack;
window.seekToSeconds = seekToSeconds;
window.setupAudioListeners = setupAudioListeners;
