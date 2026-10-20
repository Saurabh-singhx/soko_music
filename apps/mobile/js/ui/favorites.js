// ============================================================
// FAVORITES & LIKED SONGS
// ============================================================
function toggleFavorite(id) {
  let t = findTrackAcrossAllSources(id);
  if (t) {
    t.favorite = !t.favorite;
    syncFavoriteToYouTubeMusic(id, t.favorite);
    const favPl = userPlaylists.find(p => p.id === 'pl_favorites');
    if (favPl) {
      if (t.favorite && !favPl.songIds.includes(id)) {
        favPl.songIds.push(id);
      } else if (!t.favorite) {
        favPl.songIds = favPl.songIds.filter(x => x !== id);
      }
    }
    persistDownloadState();
    showToast(t.favorite ? 'Added to Liked Songs (Synced to YouTube Music ❤️)' : 'Removed from Liked Songs', t.favorite ? '❤️' : '💔');
    renderShelves();
    renderPlaylists();
    if (currentTrack && currentTrack.id === id) {
      updatePlayerUI(currentTrack);
    }
  }
}

function toggleCurrentFavorite() {
  if (currentTrack) toggleFavorite(currentTrack.id);
}

window.toggleFavorite = toggleFavorite;
window.toggleCurrentFavorite = toggleCurrentFavorite;
