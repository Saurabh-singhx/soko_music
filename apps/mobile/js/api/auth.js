// ============================================================
// YOUTUBE MUSIC AUTHENTICATION & ACCOUNT SYNC
// ============================================================
function loginWithGoogle() {
  if (window.SokoNative && (typeof window.SokoNative.launchGoogleLogin === 'function' || typeof window.SokoNative.startGoogleLoginFlow === 'function')) {
    if (typeof window.SokoNative.launchGoogleLogin === 'function') {
      window.SokoNative.launchGoogleLogin();
    } else {
      window.SokoNative.startGoogleLoginFlow();
    }
    closeAuthModal();
    showToast("Opening Google Sign-In...", "🔑");
  } else {
    const cookie = prompt("Paste your cloud session cookie or auth token string:");
    if (cookie) {
      const cookieInput = document.getElementById('ytmCookieInput');
      if (cookieInput) cookieInput.value = cookie;
      loginWithCookie();
    }
  }
}

function loginWithCookie() {
  const cookieInput = document.getElementById('ytmCookieInput');
  const cookieVal = cookieInput ? cookieInput.value.trim() : '';
  if (!cookieVal) return;

  userSession = {
    isLoggedIn: true,
    cookie: cookieVal,
    name: "Cloud Music Member",
    email: "Connected Session"
  };
  window.userSession = userSession;
  localStorage.setItem('soko_ytm_session', JSON.stringify(userSession));
  if (window.SokoNative && typeof window.SokoNative.setStoredYtmCookies === 'function') {
    window.SokoNative.setStoredYtmCookies(cookieVal);
  }
  updateAuthModalContent();
  updateAuthHeaderUI();
  showToast("Cloud Account Connected!", "✓");
  syncYTMFeed();
}

function loginDemoAccount() {
  userSession = {
    isLoggedIn: true,
    isDemo: true,
    name: "Demo Audiophile",
    email: "demo@soko.music"
  };
  window.userSession = userSession;
  localStorage.setItem('soko_ytm_session', JSON.stringify(userSession));
  updateAuthModalContent();
  updateAuthHeaderUI();
  showToast("Demo Account Active!", "✓");
  syncYTMFeed();
}

function logoutAccount() {
  userSession = null;
  window.userSession = null;
  localStorage.removeItem('soko_ytm_session');
  localStorage.removeItem('soko_ytm_cached_feed_v2');
  if (window.SokoNative && typeof window.SokoNative.clearStoredYtmCookies === 'function') {
    window.SokoNative.clearStoredYtmCookies();
  }
  personalShelves = null;
  window.personalShelves = null;
  loadHomeFeed();
  updateAuthModalContent();
  updateAuthHeaderUI();
  showToast("Signed Out", "👋");
}

async function syncYTMFeed() {
  showToast("Syncing Music Feed...", "⏳");
  await fetchYouTubeMusicFeed();
  showToast("Feed Synced!", "✓");
}

async function syncUserData() {
  await syncYTMFeed();
}

// Native Bridge Hooks
window.onLoginSuccess = function(cookies, displayName, email, visitorData) {
  userSession = {
    isLoggedIn: true,
    cookie: cookies,
    name: displayName || "Cloud Music Member",
    email: email || "Connected Google Account",
    visitorData: visitorData || ""
  };
  window.userSession = userSession;
  localStorage.setItem('soko_ytm_session', JSON.stringify(userSession));
  localStorage.removeItem('soko_ytm_cached_feed_v2');
  personalShelves = null;
  window.personalShelves = null;
  window.lastYtmVisitorData = visitorData || null;

  if (window.SokoNative && typeof window.SokoNative.setStoredYtmCookies === 'function') {
    window.SokoNative.setStoredYtmCookies(cookies);
  }
  updateAuthModalContent();
  updateAuthHeaderUI();
  showToast(`Welcome, ${userSession.name}!`, "🎉");
  loadHomeFeed();
};
window.onGoogleLoginSuccess = window.onLoginSuccess;

window.loginWithGoogle = loginWithGoogle;
window.loginWithCookie = loginWithCookie;
window.loginDemoAccount = loginDemoAccount;
window.logoutAccount = logoutAccount;
window.syncYTMFeed = syncYTMFeed;
window.syncUserData = syncUserData;
