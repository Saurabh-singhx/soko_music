// ============================================================
// AUTH MODAL, USER PROFILE & AVATAR ENGINE (GIF & IMAGE SUPPORT)
// ============================================================

// IndexedDB Helper for Large Profile Picture & Animated GIF Storage
function openProfileIDB() {
  return new Promise((resolve) => {
    if (typeof indexedDB === 'undefined') return resolve(null);
    try {
      const req = indexedDB.open('soko_profile_store', 1);
      req.onupgradeneeded = function(e) {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('profile')) {
          db.createObjectStore('profile');
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch (e) {
      resolve(null);
    }
  });
}

async function saveAvatarToIDB(dataUrl, mimeType) {
  const db = await openProfileIDB();
  if (!db) return;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction('profile', 'readwrite');
      const store = tx.objectStore('profile');
      store.put(dataUrl, 'customAvatar');
      store.put(mimeType, 'customAvatarType');
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch (e) {
      resolve();
    }
  });
}

async function getAvatarFromIDB() {
  const db = await openProfileIDB();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction('profile', 'readonly');
      const store = tx.objectStore('profile');
      const req = store.get('customAvatar');
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    } catch (e) {
      resolve(null);
    }
  });
}

async function deleteAvatarFromIDB() {
  const db = await openProfileIDB();
  if (!db) return;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction('profile', 'readwrite');
      const store = tx.objectStore('profile');
      store.delete('customAvatar');
      store.delete('customAvatarType');
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch (e) {
      resolve();
    }
  });
}

// Check if a URL or MIME type corresponds to an animated GIF
function isGifAvatar(url, type) {
  if (type && typeof type === 'string' && type.toLowerCase().includes('gif')) {
    return true;
  }
  if (typeof url === 'string') {
    if (url.startsWith('data:image/gif') || url.includes('base64,R0lGOD')) return true;
    if (/\.gif(\?.*)?$/i.test(url)) return true;
  }
  return false;
}

// Retrieve current avatar metadata (custom upload or cloud provider)
function getUserAvatar() {
  const custom = (typeof window !== 'undefined' && window.customAvatar) ? window.customAvatar : customAvatar;
  const customType = (typeof window !== 'undefined' && window.customAvatarType) ? window.customAvatarType : customAvatarType;

  if (custom) {
    return {
      url: custom,
      isCustom: true,
      isGif: isGifAvatar(custom, customType)
    };
  }

  const session = (typeof window !== 'undefined' && window.userSession) ? window.userSession : userSession;
  if (session && (session.customAvatar || session.avatar || session.photoUrl)) {
    const url = session.customAvatar || session.avatar || session.photoUrl;
    const type = session.customAvatarType || '';
    return {
      url: url,
      isCustom: !!session.customAvatar,
      isGif: isGifAvatar(url, type)
    };
  }

  return null;
}

// Retrieve current user display name
function getUserDisplayName() {
  const customName = (typeof window !== 'undefined' && window.customProfileName) ? window.customProfileName : customProfileName;
  if (customName && customName.trim()) {
    return customName.trim();
  }
  const session = (typeof window !== 'undefined' && window.userSession) ? window.userSession : userSession;
  if (session && session.name && session.name.trim()) {
    return session.name.trim();
  }
  return "Guest Audiophile";
}

// Center-crop and downscale static images to square canvas (bypassed for animated GIFs)
function resizeStaticImage(dataUrl, maxW = 512, maxH = 512) {
  return new Promise((resolve) => {
    if (typeof Image === 'undefined' || typeof document === 'undefined') {
      return resolve(dataUrl);
    }
    const img = new Image();
    img.onload = function() {
      const width = img.naturalWidth || img.width;
      const height = img.naturalHeight || img.height;
      if (!width || !height) return resolve(dataUrl);

      const minDim = Math.min(width, height);
      const targetSize = Math.min(minDim, maxW);

      const canvas = document.createElement('canvas');
      canvas.width = targetSize;
      canvas.height = targetSize;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(dataUrl);

      const sx = (width - minDim) / 2;
      const sy = (height - minDim) / 2;

      ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, targetSize, targetSize);
      try {
        const compressed = canvas.toDataURL('image/jpeg', 0.9);
        resolve(compressed);
      } catch (e) {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

// Persist uploaded avatar into localStorage, IndexedDB, and state
async function applyAndPersistAvatar(dataUrl, mimeType) {
  customAvatar = dataUrl;
  customAvatarType = mimeType;
  if (typeof window !== 'undefined') {
    window.customAvatar = dataUrl;
    window.customAvatarType = mimeType;
  }

  // 1. Try localStorage
  try {
    localStorage.setItem(STORAGE_KEY_CUSTOM_AVATAR, dataUrl);
    localStorage.setItem(STORAGE_KEY_CUSTOM_AVATAR_TYPE, mimeType);
  } catch (err) {
    console.warn('[Avatar] localStorage quota exceeded, saving to IndexedDB fallback', err);
  }

  // 2. Also persist to IndexedDB
  try {
    await saveAvatarToIDB(dataUrl, mimeType);
  } catch (e) {
    console.warn('[Avatar] IDB save error:', e);
  }

  // 3. Keep userSession in sync
  const session = (typeof window !== 'undefined' && window.userSession) ? window.userSession : userSession;
  if (session) {
    session.customAvatar = dataUrl;
    session.customAvatarType = mimeType;
    session.avatar = dataUrl;
    try {
      localStorage.setItem('soko_ytm_session', JSON.stringify(session));
    } catch (e) {}
  }

  updateAuthHeaderUI();
  updateAuthModalContent();
  updateSettingsProfileUI();
}

// Save uploaded profile picture / GIF from File object
async function saveUserProfilePicture(file) {
  if (!file) return;

  const fileName = file.name || '';
  const fileType = file.type || '';
  let isGif = fileType === 'image/gif' || /\.gif$/i.test(fileName);
  let isImage = isGif || fileType.startsWith('image/') || /\.(png|jpe?g|webp|svg)$/i.test(fileName);

  // If mime is generic or missing (e.g. Android ContentProvider / PhotoPicker), allow reading bytes
  const isGenericMime = !fileType || fileType === 'application/octet-stream' || fileType === 'image/*';
  if (!isImage && !isGenericMime) {
    if (typeof showToast === 'function') {
      showToast('Please choose an image or animated GIF file', '⚠️');
    }
    return;
  }

  // 10 MB maximum upload check
  if (file.size > 10 * 1024 * 1024) {
    if (typeof showToast === 'function') {
      showToast('⚠️ Image too large. Please select a file under 10MB', '⚠️');
    }
    return;
  }

  if (typeof FileReader === 'undefined') {
    return;
  }

  const reader = new FileReader();
  reader.onload = async function(e) {
    let dataUrl = e.target.result;
    if (!dataUrl) return;

    // Detect image format from dataUrl header or base64 magic bytes
    if (dataUrl.startsWith('data:image/gif') || dataUrl.includes('base64,R0lGOD')) {
      isGif = true;
      isImage = true;
    } else if (dataUrl.startsWith('data:image/') || dataUrl.includes('base64,/9j/') || dataUrl.includes('base64,iVBORw0KGgo') || dataUrl.includes('base64,UklGR')) {
      isImage = true;
    }

    if (!isImage && !dataUrl.startsWith('data:image/')) {
      if (typeof showToast === 'function') {
        showToast('Please choose an image or animated GIF file', '⚠️');
      }
      return;
    }

    // Preserve animated GIF byte stream directly (canvas drawImage loses GIF animation frames!)
    if (!isGif && file.size > 1024 * 1024) {
      try {
        dataUrl = await resizeStaticImage(dataUrl, 512, 512);
      } catch (err) {
        console.warn('[Avatar] Resize fallback:', err);
      }
    }

    let mime = 'image/jpeg';
    if (isGif) {
      mime = 'image/gif';
    } else if (dataUrl.startsWith('data:image/')) {
      const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);/);
      if (match && match[1]) mime = match[1];
    } else if (fileType && fileType.startsWith('image/')) {
      mime = fileType;
    }

    if (isGif && (dataUrl.startsWith('data:application/') || !dataUrl.startsWith('data:image/gif'))) {
      dataUrl = dataUrl.replace(/^data:[^;]+;/, 'data:image/gif;');
    } else if (isImage && dataUrl.startsWith('data:application/')) {
      dataUrl = dataUrl.replace(/^data:[^;]+;/, `data:${mime};`);
    }

    await applyAndPersistAvatar(dataUrl, mime);

    if (typeof showToast === 'function') {
      showToast(isGif ? '🎬 Animated GIF Profile Picture Set!' : '📸 Profile Picture Updated!', '✓');
    }
  };

  reader.onerror = function() {
    if (typeof showToast === 'function') {
      showToast('Failed to read image file', '⚠️');
    }
  };

  reader.readAsDataURL(file);
}

// Remove custom profile picture and revert to cloud provider or default
async function removeUserProfilePicture() {
  customAvatar = null;
  customAvatarType = null;
  if (typeof window !== 'undefined') {
    window.customAvatar = null;
    window.customAvatarType = null;
  }

  try {
    localStorage.removeItem(STORAGE_KEY_CUSTOM_AVATAR);
    localStorage.removeItem(STORAGE_KEY_CUSTOM_AVATAR_TYPE);
  } catch (e) {}

  try {
    await deleteAvatarFromIDB();
  } catch (e) {}

  const session = (typeof window !== 'undefined' && window.userSession) ? window.userSession : userSession;
  if (session) {
    delete session.customAvatar;
    delete session.customAvatarType;
    session.avatar = session.photoUrl || null;
    try {
      localStorage.setItem('soko_ytm_session', JSON.stringify(session));
    } catch (e) {}
  }

  updateAuthHeaderUI();
  updateAuthModalContent();
  updateSettingsProfileUI();

  if (typeof showToast === 'function') {
    showToast('Profile picture removed', '🗑️');
  }
}

// Trigger hidden file picker input
function triggerProfilePicUpload(event) {
  if (event && event.target && (event.target.id === 'profilePicInput' || event.target.id === 'profileUploadLabel' || event.target.closest('#profileUploadLabel'))) {
    return;
  }
  const input = document.getElementById('profilePicInput');
  if (input) {
    try {
      input.value = '';
    } catch (e) {}
    input.click();
  }
}

// Handle change event on file input
function handleProfilePicUpload(event) {
  const files = event && event.target && event.target.files;
  if (!files || !files[0]) return;
  saveUserProfilePicture(files[0]);
  try {
    if (event.target) event.target.value = '';
  } catch (e) {}
}

// Drag & drop support for profile picture
function handleProfilePicDrop(event) {
  if (event) {
    event.preventDefault();
    if (event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0]) {
      saveUserProfilePicture(event.dataTransfer.files[0]);
    }
  }
}

// Keyboard accessibility for file picker label and avatar wrapper
function initProfilePickerAccessibility() {
  if (typeof document === 'undefined') return;
  const label = document.getElementById('profileUploadLabel');
  if (label && !label._hasA11yListener && typeof label.addEventListener === 'function') {
    label._hasA11yListener = true;
    label.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        triggerProfilePicUpload();
      }
    });
  }

  const avatarWrapper = document.getElementById('modalAvatarWrapper');
  if (avatarWrapper && !avatarWrapper._hasA11yListener && typeof avatarWrapper.addEventListener === 'function') {
    avatarWrapper._hasA11yListener = true;
    avatarWrapper.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        triggerProfilePicUpload();
      }
    });
  }
}

function openAuthModal() {
  updateAuthModalContent();
  initProfilePickerAccessibility();
  const modal = document.getElementById('authModal');
  if (modal) modal.style.display = 'flex';
}

function closeAuthModal() {
  const modal = document.getElementById('authModal');
  if (modal) modal.style.display = 'none';
}

function updateAuthModalContent() {
  const loggedOutView = document.getElementById('authLoggedOutView');
  const loggedInView = document.getElementById('authLoggedInView');
  const subTitle = document.getElementById('authModalSubtitle');
  const profileName = document.getElementById('authProfileName');
  const profileEmail = document.getElementById('authProfileEmail');
  const modalAvatar = document.getElementById('authModalAvatar');
  const btnRemove = document.getElementById('btnRemoveAvatar');
  const gifBadge = document.getElementById('avatarGifBadge');

  const avatar = getUserAvatar();
  const session = (typeof window !== 'undefined' && window.userSession) ? window.userSession : userSession;
  const isLoggedIn = !!(session && session.isLoggedIn);
  const displayName = getUserDisplayName();

  // Update Avatar Preview
  if (modalAvatar) {
    if (avatar && avatar.url) {
      modalAvatar.innerHTML = `<img src="${avatar.url}" alt="Profile Avatar" class="modal-profile-img" onerror="this.onerror=null; this.parentNode.innerHTML='<svg width=\\'28\\' height=\\'28\\' viewBox=\\'0 0 24 24\\' fill=\\'#FFFFFF\\'><path d=\\'M12 12c2.67 0 4.8-2.13 4.8-4.8S14.67 2.4 12 2.4 7.2 4.53 7.2 7.2 9.33 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z\\'/></svg>';" />`;
    } else {
      modalAvatar.innerHTML = `
        <svg width="28" height="28" viewBox="0 0 24 24" fill="#FFFFFF">
          <path d="M12 12c2.67 0 4.8-2.13 4.8-4.8S14.67 2.4 12 2.4 7.2 4.53 7.2 7.2 9.33 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
        </svg>
      `;
    }
  }

  // Update animated GIF badge
  if (gifBadge) {
    gifBadge.style.display = (avatar && avatar.isGif) ? 'inline-block' : 'none';
  }

  // Update Remove Avatar Button
  if (btnRemove) {
    btnRemove.style.display = (avatar && avatar.isCustom) ? 'inline-flex' : 'none';
  }

  // Update Profile Name & Subtitle
  if (profileName) {
    profileName.innerText = displayName;
  }
  if (profileEmail) {
    if (isLoggedIn) {
      profileEmail.innerText = session.email || "Active Cloud Session";
    } else {
      profileEmail.innerText = "Offline / Local Profile";
    }
  }

  // Update Login Views & Subtitles
  if (isLoggedIn) {
    if (loggedOutView) loggedOutView.style.display = 'none';
    if (loggedInView) loggedInView.style.display = 'block';
    if (subTitle) subTitle.innerText = "Connected to Cloud Provider. Recommendations and feed synced.";
  } else {
    if (loggedOutView) loggedOutView.style.display = 'block';
    if (loggedInView) loggedInView.style.display = 'none';
    if (subTitle) subTitle.innerText = "Connect your cloud provider account to fetch personal recommendations, history, and playlists.";
  }
}

function updateAuthHeaderUI() {
  const badgeStatusText = document.getElementById('badgeStatusText');
  const avatarEl = document.getElementById('headerProfileAvatar');
  const settingsYtmSubtitle = document.getElementById('settingsYtmSubtitle');
  const settingsAuthActionBtn = document.getElementById('settingsAuthActionBtn');

  const session = (typeof window !== 'undefined' && window.userSession) ? window.userSession : userSession;
  const isLoggedIn = !!(session && session.isLoggedIn);
  const avatar = getUserAvatar();
  const displayName = getUserDisplayName();

  if (avatarEl) {
    if (avatar && avatar.url) {
      avatarEl.classList.add('has-avatar');
      if (isLoggedIn) {
        avatarEl.classList.add('logged-in');
      } else {
        avatarEl.classList.remove('logged-in');
      }
      const onlineDotHtml = isLoggedIn ? '<span class="avatar-online-dot"></span>' : '';
      const gifDotHtml = avatar.isGif ? '<span class="avatar-gif-dot" title="GIF Avatar"></span>' : '';
      avatarEl.innerHTML = `
        <div class="avatar-profile-icon-wrap">
          <img class="header-avatar-img" src="${avatar.url}" alt="${displayName}" onerror="this.onerror=null; this.parentNode.innerHTML='<svg width=\\'18\\' height=\\'18\\' viewBox=\\'0 0 24 24\\' fill=\\'currentColor\\'><path d=\\'M12 12c2.67 0 4.8-2.13 4.8-4.8S14.67 2.4 12 2.4 7.2 4.53 7.2 7.2 9.33 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z\\'/></svg>';" />
          ${onlineDotHtml}
          ${gifDotHtml}
        </div>
      `;
      avatarEl.title = isLoggedIn ? `Signed in as ${displayName}` : `Profile: ${displayName}`;
      if (typeof avatarEl.setAttribute === 'function') {
        avatarEl.setAttribute('aria-label', isLoggedIn ? `Signed in as ${displayName}` : `Profile: ${displayName}`);
      }
    } else if (isLoggedIn) {
      avatarEl.classList.add('logged-in');
      avatarEl.classList.remove('has-avatar');
      avatarEl.innerHTML = `
        <div class="avatar-profile-icon-wrap">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 12c2.67 0 4.8-2.13 4.8-4.8S14.67 2.4 12 2.4 7.2 4.53 7.2 7.2 9.33 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
          </svg>
          <span class="avatar-online-dot"></span>
        </div>
      `;
      avatarEl.title = `Signed in as ${displayName}`;
      if (typeof avatarEl.setAttribute === 'function') {
        avatarEl.setAttribute('aria-label', `Signed in as ${displayName}`);
      }
    } else {
      avatarEl.classList.remove('logged-in');
      avatarEl.classList.remove('has-avatar');
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
    badgeStatusText.innerText = isLoggedIn
      ? (session.name ? session.name.split(' ')[0] : 'Synced')
      : 'Sync / Login';
  }
  if (settingsYtmSubtitle) {
    settingsYtmSubtitle.innerText = isLoggedIn
      ? (session.name ? `Connected • ${session.name}` : 'Connected • Active Session')
      : 'Not Connected • Guest Mode';
  }
  if (settingsAuthActionBtn) {
    settingsAuthActionBtn.innerText = isLoggedIn ? 'Manage Account' : 'Sign In / Connect';
  }
}

function updateSettingsProfileUI() {
  const avatarContainer = document.getElementById('settingsAvatarContainer');
  const avatar = getUserAvatar();
  if (avatarContainer) {
    if (avatar && avatar.url) {
      avatarContainer.innerHTML = `<img src="${avatar.url}" alt="Avatar" style="width: 100%; height: 100%; object-fit: cover; border-radius: 10px;" />`;
    } else {
      avatarContainer.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"></path></svg>`;
    }
  }
}

// Background rehydration from IndexedDB for large avatars/GIFs
if (typeof window !== 'undefined' && typeof indexedDB !== 'undefined') {
  setTimeout(async () => {
    if (!customAvatar && !window.customAvatar) {
      try {
        const idbAvatar = await getAvatarFromIDB();
        if (idbAvatar) {
          customAvatar = idbAvatar;
          window.customAvatar = idbAvatar;
          updateAuthHeaderUI();
          updateAuthModalContent();
          updateSettingsProfileUI();
        }
      } catch (e) {}
    }
  }, 50);
}

// Window exports
window.openAuthModal = openAuthModal;
window.closeAuthModal = closeAuthModal;
window.updateAuthModalContent = updateAuthModalContent;
window.updateAuthHeaderUI = updateAuthHeaderUI;
window.updateSettingsProfileUI = updateSettingsProfileUI;
window.getUserAvatar = getUserAvatar;
window.isGifAvatar = isGifAvatar;
window.getUserDisplayName = getUserDisplayName;
window.saveUserProfilePicture = saveUserProfilePicture;
window.removeUserProfilePicture = removeUserProfilePicture;
window.triggerProfilePicUpload = triggerProfilePicUpload;
window.handleProfilePicUpload = handleProfilePicUpload;
window.handleProfilePicDrop = handleProfilePicDrop;
window.resizeStaticImage = resizeStaticImage;
window.initProfilePickerAccessibility = initProfilePickerAccessibility;
