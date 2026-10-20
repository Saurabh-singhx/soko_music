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
    subTitle.innerText = "Connected to YouTube Music. Recommendations and feed synced.";
    profileName.innerText = userSession.name || "YouTube Music User";
    profileEmail.innerText = userSession.email || "Active InnerTube Session";
  } else {
    loggedOutView.style.display = 'block';
    loggedInView.style.display = 'none';
    subTitle.innerText = "Connect your YouTube Music account to fetch personal recommendations, history, and playlists.";
  }
}

function updateAuthHeaderUI() {
  const badgeStatusText = document.getElementById('badgeStatusText');
  const settingsYtmSubtitle = document.getElementById('settingsYtmSubtitle');
  const settingsAuthActionBtn = document.getElementById('settingsAuthActionBtn');

  if (userSession && userSession.isLoggedIn) {
    if (badgeStatusText) {
      badgeStatusText.innerText = userSession.name ? userSession.name.split(' ')[0] : 'Synced';
    }
    if (settingsYtmSubtitle) {
      settingsYtmSubtitle.innerText = userSession.name ? `Connected • ${userSession.name}` : 'Connected • Active Session';
    }
    if (settingsAuthActionBtn) {
      settingsAuthActionBtn.innerText = 'Manage Account';
    }
  } else {
    if (badgeStatusText) {
      badgeStatusText.innerText = 'Sync / Login';
    }
    if (settingsYtmSubtitle) {
      settingsYtmSubtitle.innerText = 'Not Connected • Guest Mode';
    }
    if (settingsAuthActionBtn) {
      settingsAuthActionBtn.innerText = 'Sign In / Connect';
    }
  }
}

window.openAuthModal = openAuthModal;
window.closeAuthModal = closeAuthModal;
window.updateAuthModalContent = updateAuthModalContent;
window.updateAuthHeaderUI = updateAuthHeaderUI;
