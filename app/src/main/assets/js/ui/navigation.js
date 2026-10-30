// ============================================================
// NAVIGATION & TAB SWITCHING
// ============================================================
function switchTab(tabName) {
  const tabs = ['home', 'charts', 'search', 'library', 'settings'];
  const idx = tabs.indexOf(tabName);
  const navItems = document.querySelectorAll('.nav-tab-item');
  switchNavTab(tabName, idx >= 0 && navItems[idx] ? navItems[idx] : null);
}

function switchNavTab(tabName, el) {
  document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-tab-item').forEach(t => t.classList.remove('active'));

  const targetPane = document.getElementById(`pane-${tabName}`);
  if (targetPane) targetPane.classList.add('active');
  if (el) el.classList.add('active');

  if (tabName === 'charts') {
    renderCharts(currentChartRegion);
  } else if (tabName === 'library') {
    backToPlaylists();
    renderPlaylists();
    renderLibraryTracks();
  } else if (tabName === 'settings') {
    updateStorageMetrics();
    updateAuthHeaderUI();
  }
}

window.switchTab = switchTab;
window.switchNavTab = switchNavTab;
