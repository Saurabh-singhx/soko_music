// ============================================================
// PLAYLIST MANAGEMENT
// ============================================================
function renderPlaylists() {
  const grid = document.getElementById('userPlaylistsGrid');
  if (!grid) return;

  grid.innerHTML = userPlaylists.map(pl => {
    let count = pl.songIds ? pl.songIds.length : (pl.tracks ? pl.tracks.length : 0);
    let firstSongArt = 'assets/logo.png';
    if (pl.songIds && pl.songIds.length > 0) {
      const firstSong = findTrackAcrossAllSources(pl.songIds[0]);
      if (firstSong && firstSong.cover) firstSongArt = firstSong.cover;
    } else if (pl.tracks && pl.tracks.length > 0) {
      firstSongArt = pl.tracks[0].cover;
    }

    return `
      <div class="playlist-card" onclick="openPlaylistDetail('${pl.id}')">
        <img class="playlist-card-art" src="${firstSongArt}" alt="${pl.name}" onerror="this.onerror=null; this.src='assets/logo.png';" />
        <div class="playlist-card-info">
          <div class="playlist-card-title">${pl.name}</div>
          <div class="playlist-card-count">${count} tracks ${pl.isSystem ? '• System' : ''}</div>
        </div>
      </div>
    `;
  }).join('');
}

function openPlaylistDetail(plId) {
  const pl = userPlaylists.find(p => p.id === plId);
  if (!pl) return;

  activePlaylist = pl;
  window.activePlaylist = pl;
  window.activeQueueList = null;

  document.getElementById('mainLibraryView').style.display = 'none';
  const detailView = document.getElementById('playlistDetailView');
  detailView.style.display = 'block';

  document.getElementById('plDetailTitle').innerText = pl.name;
  const tracks = pl.songIds ? pl.songIds.map(id => findTrackAcrossAllSources(id)).filter(Boolean) : (pl.tracks || []);
  document.getElementById('plDetailSubtitle').innerText = `${tracks.length} tracks`;

  const trackListEl = document.getElementById('plDetailTrackList');
  if (tracks.length === 0) {
    trackListEl.innerHTML = '<div style="text-align: center; color: var(--text-dim); padding: 30px;">This playlist is empty. Add songs using the + button!</div>';
  } else {
    trackListEl.innerHTML = tracks.map(t => createTrackRowHtml(t, !pl.isSystem)).join('');
  }
}

function backToPlaylists() {
  activePlaylist = null;
  window.activePlaylist = null;
  document.getElementById('playlistDetailView').style.display = 'none';
  document.getElementById('mainLibraryView').style.display = 'block';
}

function playActivePlaylist(shuffle = false) {
  if (!activePlaylist) return;
  const tracks = activePlaylist.songIds ? activePlaylist.songIds.map(id => findTrackAcrossAllSources(id)).filter(Boolean) : (activePlaylist.tracks || []);
  if (tracks.length === 0) return;

  isShuffle = shuffle;
  window.isShuffle = shuffle;
  const btn = document.getElementById('btnShuffle');
  if (btn) btn.style.color = isShuffle ? 'var(--accent-primary)' : 'var(--text-dim)';

  const firstTrack = isShuffle ? tracks[Math.floor(Math.random() * tracks.length)] : tracks[0];
  selectTrackToPlay(firstTrack.id);
  showToast(`Playing ${activePlaylist.name}`, '▶');
}

function openCreatePlaylistDialog() {
  document.getElementById('createPlaylistModal').style.display = 'flex';
  const input = document.getElementById('newPlaylistNameInput');
  if (input) {
    input.value = '';
    setTimeout(() => input.focus(), 100);
  }
}

function closeCreatePlaylistDialog() {
  document.getElementById('createPlaylistModal').style.display = 'none';
}

function confirmCreatePlaylist() {
  const input = document.getElementById('newPlaylistNameInput');
  const name = input ? input.value.trim() : '';
  if (!name) return;

  const newPl = {
    id: 'pl_' + Date.now(),
    name: name,
    isSystem: false,
    songIds: []
  };

  userPlaylists.push(newPl);
  persistDownloadState();
  renderPlaylists();
  closeCreatePlaylistDialog();
  showToast(`Created playlist "${name}"`, '📁');
}

function promptAddSongToPlaylist(songId) {
  songPendingAddToPlaylist = songId;
  window.songPendingAddToPlaylist = songId;
  const modal = document.getElementById('addToPlaylistModal');
  const listEl = document.getElementById('targetPlaylistsList');
  modal.style.display = 'flex';

  const eligiblePlaylists = userPlaylists.filter(p => p.id !== 'pl_offline');
  listEl.innerHTML = eligiblePlaylists.map(pl => `
    <div class="track-row" style="padding: 10px;" onclick="addSongToPlaylistTarget('${pl.id}')">
      <div style="font-size: 20px;">📁</div>
      <div class="track-meta">
        <div class="track-title">${pl.name}</div>
        <div class="track-desc">${pl.songIds ? pl.songIds.length : 0} tracks</div>
      </div>
    </div>
  `).join('');
}

function closeAddToPlaylistDialog() {
  songPendingAddToPlaylist = null;
  window.songPendingAddToPlaylist = null;
  document.getElementById('addToPlaylistModal').style.display = 'none';
}

function addSongToPlaylistTarget(plId) {
  if (!songPendingAddToPlaylist) return;
  const pl = userPlaylists.find(p => p.id === plId);
  if (pl) {
    if (!pl.songIds.includes(songPendingAddToPlaylist)) {
      pl.songIds.push(songPendingAddToPlaylist);
      persistDownloadState();
      renderPlaylists();
      showToast(`Added to "${pl.name}"`, '✓');
    } else {
      showToast(`Already in "${pl.name}"`, 'ℹ️');
    }
  }
  closeAddToPlaylistDialog();
}

function removeSongFromActivePlaylist(songId) {
  if (!activePlaylist || activePlaylist.isSystem) return;
  activePlaylist.songIds = activePlaylist.songIds.filter(id => id !== songId);
  persistDownloadState();
  renderPlaylists();
  openPlaylistDetail(activePlaylist.id);
  showToast('Removed from playlist', '🗑️');
}

window.renderPlaylists = renderPlaylists;
window.openPlaylistDetail = openPlaylistDetail;
window.backToPlaylists = backToPlaylists;
window.playActivePlaylist = playActivePlaylist;
window.openCreatePlaylistDialog = openCreatePlaylistDialog;
window.closeCreatePlaylistDialog = closeCreatePlaylistDialog;
window.confirmCreatePlaylist = confirmCreatePlaylist;
window.promptAddSongToPlaylist = promptAddSongToPlaylist;
window.closeAddToPlaylistDialog = closeAddToPlaylistDialog;
window.addSongToPlaylistTarget = addSongToPlaylistTarget;
window.removeSongFromActivePlaylist = removeSongFromActivePlaylist;
