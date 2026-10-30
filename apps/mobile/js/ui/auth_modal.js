// ============================================================
// AUTH MODAL & HEADER UI
// ============================================================
function openAuthModal() {
  updateAuthModalContent();
  document.getElementById('authModal').style.display = 'flex';
}

function closeAuthModal() {
  document.getElementById('authModal').style.display = 'none';
}

function updateAuthModalContent() {
  const loggedOutView = document.getElementById('authLoggedOutView');
  const loggedInView = document.getElementById('authLoggedInView');
  const subTitle = document.getElementById('authModalSubtitle');
  const profileName = document.getElementById('authProfileName');
  const profileEmail = document.getElementById('authProfileEmail');

  if (userSession && userSession.isLoggedIn) {
    loggedOutView.style.display = 'none';
    loggedInView.style.display = 'block';
    subTitle.innerText = "Connected to Cloud Provider. Recommendations and feed synced.";
    profileName.innerText = userSession.name || "Cloud Music Member";
    profileEmail.innerText = userSession.email || "Active Cloud Session";

    const modalAvatar = document.getElementById('authModalAvatar');
    if (modalAvatar) {
      if (userSession.photoUrl || userSession.avatar) {
        modalAvatar.innerHTML = `<img src="${userSession.photoUrl || userSession.avatar}" alt="Avatar" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;" onerror="this.onerror=null; this.parentNode.innerHTML='<svg width=\\'22\\' height=\\'22\\' viewBox=\\'0 0 24 24\\' fill=\\'#FFFFFF\\'><path d=\\'M12 12c2.67 0 4.8-2.13 4.8-4.8S14.67 2.4 12 2.4 7.2 4.53 7.2 7.2 9.33 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z\\'/></svg>';" />`;
      } else {
        modalAvatar.innerHTML = `
          <svg width="22" height="22" viewBox="0 0 24 24" fill="#FFFFFF">
            <path d="M12 12c2.67 0 4.8-2.13 4.8-4.8S14.67 2.4 12 2.4 7.2 4.53 7.2 7.2 9.33 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
          </svg>
        `;
      }
    }
  } else {
    loggedOutView.style.display = 'block';
    loggedInView.style.display = 'none';
    subTitle.innerText = "Connect your cloud provider account to fetch personal recommendations, history, and playlists.";
  }
}

function updateAuthHeaderUI() {
  const badgeStatusText = document.getElementById('badgeStatusText');
  const avatarEl = document.getElementById('headerProfileAvatar');
  const settingsYtmSubtitle = document.getElementById('settingsYtmSubtitle');
  const settingsAuthActionBtn = document.getElementById('settingsAuthActionBtn');

  if (avatarEl) {
    if (userSession && userSession.isLoggedIn) {
      avatarEl.classList.add('logged-in');
      if (userSession.photoUrl || userSession.avatar) {
        avatarEl.innerHTML = `<img class="header-avatar-img" src="${userSession.photoUrl || userSession.avatar}" alt="${userSession.name || 'User'}" onerror="this.onerror=null; this.parentNode.innerHTML='<div class=\\'avatar-profile-icon-wrap\\'><svg width=\\'18\\' height=\\'18\\' viewBox=\\'0 0 24 24\\' fill=\\'currentColor\\'><path d=\\'M12 12c2.67 0 4.8-2.13 4.8-4.8S14.67 2.4 12 2.4 7.2 4.53 7.2 7.2 9.33 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z\\'/></svg><span class=\\'avatar-online-dot\\'></span></div>';" />`;
      } else {
        avatarEl.innerHTML = `
          <div class="avatar-profile-icon-wrap">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 12c2.67 0 4.8-2.13 4.8-4.8S14.67 2.4 12 2.4 7.2 4.53 7.2 7.2 9.33 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
            </svg>
            <span class="avatar-online-dot"></span>
          </div>
        `;
      }
      avatarEl.title = `Signed in as ${userSession.name || 'User'}`;
      if (typeof avatarEl.setAttribute === 'function') {
        avatarEl.setAttribute('aria-label', `Signed in as ${userSession.name || 'User'}`);
      }
    } else {
      avatarEl.classList.remove('logged-in');
      avatarEl.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
      `;
      avatarEl.title = 'Sign In / Connect Cloud Account';
      if (typeof avatarEl.setAttribute === 'function') {
        avatarEl.setAttribute('aria-label', 'Sign In / Connect Cloud Account');
      }
    }
  }

  if (badgeStatusText) {
    badgeStatusText.innerText = (userSession && userSession.isLoggedIn)
      ? (userSession.name ? userSession.name.split(' ')[0] : 'Synced')
      : 'Sync / Login';
  }
  if (settingsYtmSubtitle) {
    settingsYtmSubtitle.innerText = (userSession && userSession.isLoggedIn)
      ? (userSession.name ? `Connected • ${userSession.name}` : 'Connected • Active Session')
      : 'Not Connected • Guest Mode';
  }
  if (settingsAuthActionBtn) {
    settingsAuthActionBtn.innerText = (userSession && userSession.isLoggedIn) ? 'Manage Account' : 'Sign In / Connect';
  }
}

window.openAuthModal = openAuthModal;
window.closeAuthModal = closeAuthModal;
window.updateAuthModalContent = updateAuthModalContent;
window.updateAuthHeaderUI = updateAuthHeaderUI;
