// ============================================================
// AUTO-UPDATE & OUTDATED ENFORCEMENT ENGINE
// ============================================================

const SOKO_UPDATE_CONFIG = {
  gistUrl: 'https://gist.githubusercontent.com/Saurabh-singhx/04c5db7f1bed9206d1b858cd44bfb8eb/raw/soko-music-version.json',
  defaultVersion: '1.0.0',
  defaultBuildNumber: 1
};

if (typeof window !== 'undefined') {
  window.__isAppOutdated = false;
}

function parseVersionNumbers(v) {
  if (!v) return [0];
  const cleaned = String(v).replace(/^v/i, '').split('-')[0].trim();
  return cleaned.split('.').map(part => parseInt(part, 10) || 0);
}

function compareAppVersions(v1, v2) {
  const p1 = parseVersionNumbers(v1);
  const p2 = parseVersionNumbers(v2);
  const maxLen = Math.max(p1.length, p2.length);
  for (let i = 0; i < maxLen; i++) {
    const n1 = p1[i] || 0;
    const n2 = p2[i] || 0;
    if (n1 > n2) return 1;
    if (n1 < n2) return -1;
  }
  return 0;
}

function getCurrentAppVersion() {
  if (typeof window !== 'undefined' && window.SokoNative && typeof window.SokoNative.getAppVersion === 'function') {
    try {
      const v = window.SokoNative.getAppVersion();
      if (v) return v;
    } catch (e) {}
  }
  return SOKO_UPDATE_CONFIG.defaultVersion;
}

function getCurrentAppVersionCode() {
  if (typeof window !== 'undefined' && window.SokoNative && typeof window.SokoNative.getAppVersionCode === 'function') {
    try {
      const code = window.SokoNative.getAppVersionCode();
      if (typeof code === 'number' && code > 0) return code;
    } catch (e) {}
  }
  return SOKO_UPDATE_CONFIG.defaultBuildNumber;
}

function stopApplicationDueToOutdated(updateData) {
  if (typeof window !== 'undefined') {
    window.__isAppOutdated = true;
  }

  // 1. Signal native Android bridge to mark outdated and stop background audio
  if (typeof window !== 'undefined' && window.SokoNative) {
    if (typeof window.SokoNative.setAppOutdated === 'function') {
      try { window.SokoNative.setAppOutdated(true); } catch (e) {}
    }
    if (typeof window.SokoNative.stopAudio === 'function') {
      try { window.SokoNative.stopAudio(); } catch (e) {}
    }
  }

  // 2. Stop HTML5 audio player
  if (typeof audioEl !== 'undefined' && audioEl) {
    try {
      audioEl.pause();
      audioEl.src = '';
    } catch (e) {}
  } else if (typeof document !== 'undefined') {
    const el = document.getElementById('audioPlayer');
    if (el) {
      try {
        el.pause();
        el.src = '';
      } catch (e) {}
    }
  }

  // 3. Stop YouTube iframe player if streaming
  if (typeof window !== 'undefined' && window.ytIframePlayer && typeof window.ytIframePlayer.stopVideo === 'function') {
    try { window.ytIframePlayer.stopVideo(); } catch (e) {}
  }

  // 4. Update UI play icons & hide miniplayer
  if (typeof updatePlayIcons === 'function') {
    try { updatePlayIcons(false); } catch (e) {}
  }
  if (typeof document !== 'undefined') {
    const miniPlayer = document.getElementById('miniPlayer');
    if (miniPlayer) miniPlayer.style.display = 'none';

    const nowPlayingModal = document.getElementById('nowPlayingModal');
    if (nowPlayingModal) nowPlayingModal.classList.remove('active');
    const authModal = document.getElementById('authModal');
    if (authModal) authModal.classList.remove('active');
  }

  // 5. Render full-screen blocking overlay
  renderOutdatedBlockerModal(updateData);
}

function renderOutdatedBlockerModal(updateData) {
  if (typeof document === 'undefined') return;

  let modal = document.getElementById('appOutdatedModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'appOutdatedModal';
    modal.className = 'outdated-modal-backdrop';
    document.body.appendChild(modal);
  }

  const currentVersion = updateData.currentVersion || getCurrentAppVersion();
  const latestVersion = updateData.targetVersion || updateData.version || updateData.releaseTag || '1.0.0';
  const releaseNotes = updateData.releaseNotes || 'A new update of Soko Music is required to keep streaming and downloading music.';
  const downloadUrl = (updateData.downloads && updateData.downloads.androidApk) ||
                      updateData.downloadUrl ||
                      updateData.releaseUrl ||
                      'https://github.com/Saurabh-singhx/soko_music/releases';

  modal.innerHTML = `
    <div class="outdated-card" role="dialog" aria-modal="true">
      <div class="outdated-icon-wrapper">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
      </div>

      <div class="outdated-badge">Update Required</div>
      <h2 class="outdated-title">Application Outdated</h2>
      <p class="outdated-desc">
        Your installed version (<strong style="color: #fff;">v${escapeHtml(currentVersion)}</strong>) is no longer supported. Please update to <strong style="color: var(--accent-primary, #6366f1);">v${escapeHtml(latestVersion)}</strong> to continue using Soko Music.
      </p>

      <div class="outdated-notes-box">
        <div class="outdated-notes-title">What's New in v${escapeHtml(latestVersion)}:</div>
        <div class="outdated-notes-content">${escapeHtml(releaseNotes)}</div>
      </div>

      <div class="outdated-actions">
        <button id="btnDownloadUpdate" class="outdated-btn-primary" type="button">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          Download Update (APK)
        </button>
        <button id="btnExitApp" class="outdated-btn-secondary" type="button">
          Exit Application
        </button>
      </div>
    </div>
  `;

  modal.style.display = 'flex';

  const btnDownload = document.getElementById('btnDownloadUpdate');
  if (btnDownload) {
    btnDownload.onclick = () => {
      if (window.SokoNative && typeof window.SokoNative.openExternalUrl === 'function') {
        window.SokoNative.openExternalUrl(downloadUrl);
      } else {
        window.open(downloadUrl, '_blank');
      }
    };
  }

  const btnExit = document.getElementById('btnExitApp');
  if (btnExit) {
    btnExit.onclick = () => {
      if (window.SokoNative && typeof window.SokoNative.exitApp === 'function') {
        window.SokoNative.exitApp();
      } else {
        window.close();
      }
    };
  }

  // Prevent event bubbling or dismissals
  modal.addEventListener('touchmove', (e) => e.stopPropagation(), { passive: false });
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function checkForAppUpdates() {
  try {
    const url = `${SOKO_UPDATE_CONFIG.gistUrl}?_t=${Date.now()}`;
    const response = await fetch(url, {
      cache: 'no-store',
      headers: { 'Accept': 'application/json' }
    });
    if (!response.ok) return null;
    const data = await response.json();
    const currentVersion = getCurrentAppVersion();
    const currentCode = getCurrentAppVersionCode();

    const targetVersion = data.version || data.releaseTag || '1.0.0';
    const minVersion = data.minVersion || targetVersion;
    const targetCode = data.buildNumber || 1;

    // Outdated criteria:
    // 1. Current version is strictly less than minVersion (mandatory floor)
    // 2. OR current version is strictly less than targetVersion
    // 3. OR data.mandatory is true and targetCode > currentCode
    const isOutdated = (
      compareAppVersions(currentVersion, minVersion) < 0 ||
      compareAppVersions(currentVersion, targetVersion) < 0 ||
      (data.mandatory && targetCode > currentCode)
    );

    if (isOutdated) {
      console.warn(`[Updater] Current version v${currentVersion} (build ${currentCode}) is outdated. Required: v${targetVersion}. Halting application.`);
      stopApplicationDueToOutdated({
        ...data,
        currentVersion,
        targetVersion
      });
      return { outdated: true, data };
    }

    return { outdated: false, data };
  } catch (err) {
    console.warn('[Updater] Auto-update check skipped/offline:', err.message || err);
    return null;
  }
}

if (typeof window !== 'undefined') {
  window.SOKO_UPDATE_CONFIG = SOKO_UPDATE_CONFIG;
  window.compareAppVersions = compareAppVersions;
  window.getCurrentAppVersion = getCurrentAppVersion;
  window.getCurrentAppVersionCode = getCurrentAppVersionCode;
  window.stopApplicationDueToOutdated = stopApplicationDueToOutdated;
  window.renderOutdatedBlockerModal = renderOutdatedBlockerModal;
  window.checkForAppUpdates = checkForAppUpdates;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    SOKO_UPDATE_CONFIG,
    compareAppVersions,
    getCurrentAppVersion,
    getCurrentAppVersionCode,
    stopApplicationDueToOutdated,
    renderOutdatedBlockerModal,
    checkForAppUpdates
  };
}
