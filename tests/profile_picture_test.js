const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log("====================================================");
console.log("🧪 TESTING USER PROFILE PICTURE & ANIMATED GIF UPLOAD");
console.log("====================================================");

// Mock Storage
const mockStorage = {};
const localStorage = {
  getItem: (k) => (k in mockStorage ? mockStorage[k] : null),
  setItem: (k, v) => { mockStorage[k] = String(v); },
  removeItem: (k) => { delete mockStorage[k]; },
  clear: () => { for (const k in mockStorage) delete mockStorage[k]; }
};

// Mock Elements Store
const mockElements = {};
function getOrCreateEl(id) {
  if (!mockElements[id]) {
    mockElements[id] = {
      id,
      innerText: '',
      innerHTML: '',
      value: '',
      title: '',
      style: {},
      classList: {
        classes: new Set(),
        add: function(c) { this.classes.add(c); },
        remove: function(c) { this.classes.delete(c); },
        contains: function(c) { return this.classes.has(c); },
        toggle: function(c) {
          if (this.classes.has(c)) this.classes.delete(c);
          else this.classes.add(c);
        }
      },
      setAttribute: function(attr, val) { this[attr] = val; },
      getAttribute: function(attr) { return this[attr] || null; },
      click: function() { this.clicked = true; },
      addEventListener: function() {}
    };
  }
  return mockElements[id];
}

const document = {
  getElementById: (id) => getOrCreateEl(id),
  querySelector: (sel) => getOrCreateEl('qs_' + sel),
  querySelectorAll: () => [],
  createElement: (tag) => getOrCreateEl('created_' + tag),
  body: getOrCreateEl('body')
};

const window = {
  addEventListener: () => {},
  location: { origin: 'https://music.youtube.com' },
  localStorage
};

// Mock FileReader
class MockFileReader {
  constructor() {
    this.onload = null;
    this.onerror = null;
    this.result = null;
  }
  readAsDataURL(file) {
    if (file && file._mockError) {
      if (this.onerror) this.onerror(new Error('Mock file read error'));
      return;
    }
    const mime = file.type || 'image/png';
    const b64 = file._mockBase64 || Buffer.from(file._mockContent || 'sample_bytes_123').toString('base64');
    this.result = `data:${mime};base64,${b64}`;
    if (this.onload) {
      this.onload({ target: { result: this.result } });
    }
  }
}

let lastToastMessage = '';
function showToast(msg, icon) {
  lastToastMessage = msg;
}

// Load source scripts in order
const constantsCode = fs.readFileSync(path.join(__dirname, '../apps/mobile/js/config/constants.js'), 'utf8');
const storeCode = fs.readFileSync(path.join(__dirname, '../apps/mobile/js/state/store.js'), 'utf8');
const authModalCode = fs.readFileSync(path.join(__dirname, '../apps/mobile/js/ui/auth_modal.js'), 'utf8');

const sandbox = {
  window,
  document,
  localStorage,
  FileReader: MockFileReader,
  showToast,
  console: {
    log: () => {},
    warn: () => {},
    error: console.error
  },
  setTimeout: (fn) => fn(),
  clearTimeout: () => {},
  Image: class {
    constructor() {
      this.onload = null;
      this.width = 100;
      this.height = 100;
    }
    set src(v) {
      if (this.onload) this.onload();
    }
  }
};

vm.createContext(sandbox);
vm.runInContext(constantsCode, sandbox);
vm.runInContext(storeCode, sandbox);
vm.runInContext(authModalCode, sandbox);

let passedCount = 0;
function pass(msg) {
  passedCount++;
  console.log(`  ✓ PASS: ${msg}`);
}

// -------------------------------------------------------------
// Test 1: Animated GIF Detection
// -------------------------------------------------------------
console.log('\n--- Test Suite 1: Animated GIF Detection & Validation ---');
const isGifAvatar = sandbox.window.isGifAvatar;

assert(isGifAvatar('data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'image/gif') === true, 'Data URL GIF should be detected');
pass('Data URL with image/gif correctly identified');

assert(isGifAvatar('https://media.giphy.com/media/v1/giphy.gif', 'image/gif') === true, 'External .gif URL should be detected');
pass('External GIF URL correctly identified');

assert(isGifAvatar('https://example.com/animated_avatar.GIF', '') === true, 'Uppercase .GIF file extension detected');
pass('Case-insensitive GIF file extension correctly identified');

assert(isGifAvatar('data:image/png;base64,iVBORw0KGgo...', 'image/png') === false, 'PNG image should NOT be detected as GIF');
pass('PNG image correctly not identified as GIF');

assert(isGifAvatar('https://example.com/avatar.jpg', 'image/jpeg') === false, 'JPEG should NOT be detected as GIF');
pass('JPEG image correctly not identified as GIF');

// -------------------------------------------------------------
// Test 2: Uploading a Static Profile Picture (PNG / JPEG)
// -------------------------------------------------------------
console.log('\n--- Test Suite 2: Static Profile Picture Upload ---');
const saveUserProfilePicture = sandbox.window.saveUserProfilePicture;
const getUserAvatar = sandbox.window.getUserAvatar;

const pngFile = {
  name: 'my_photo.png',
  type: 'image/png',
  size: 50 * 1024, // 50 KB
  _mockContent: 'png_image_binary_data'
};

saveUserProfilePicture(pngFile);

const avatarStatic = getUserAvatar();
assert(avatarStatic !== null, 'Avatar should exist after upload');
assert(avatarStatic.isCustom === true, 'Avatar should be marked as custom');
assert(avatarStatic.isGif === false, 'Static avatar should not be GIF');
assert(avatarStatic.url.startsWith('data:image/png;base64,'), 'Avatar URL should be a PNG data URL');
pass('Static PNG profile picture successfully stored');

// Check persistence in localStorage
const storedAvatar = localStorage.getItem(sandbox.window.STORAGE_KEY_CUSTOM_AVATAR);
assert(storedAvatar === avatarStatic.url, 'localStorage should contain avatar data URL');
pass('Avatar successfully written to localStorage');

// -------------------------------------------------------------
// Test 3: Uploading an Animated GIF Profile Picture
// -------------------------------------------------------------
console.log('\n--- Test Suite 3: Animated GIF Upload & Badge Rendering ---');

const gifFile = {
  name: 'dance_loop.gif',
  type: 'image/gif',
  size: 350 * 1024, // 350 KB
  _mockContent: 'GIF89a_animated_frames_payload'
};

saveUserProfilePicture(gifFile);

const avatarGif = getUserAvatar();
assert(avatarGif !== null, 'GIF avatar should exist after upload');
assert(avatarGif.isCustom === true, 'GIF avatar should be marked as custom');
assert(avatarGif.isGif === true, 'isGif flag should be TRUE for GIF avatar');
assert(avatarGif.url.startsWith('data:image/gif;base64,'), 'Avatar URL should be a GIF data URL');
pass('Animated GIF profile picture stored with isGif=true');

// Check Modal & Header UI updates
sandbox.window.updateAuthModalContent();
sandbox.window.updateAuthHeaderUI();

const modalAvatarEl = getOrCreateEl('authModalAvatar');
const gifBadgeEl = getOrCreateEl('avatarGifBadge');
const btnRemoveEl = getOrCreateEl('btnRemoveAvatar');
const headerAvatarEl = getOrCreateEl('headerProfileAvatar');

assert(modalAvatarEl.innerHTML.includes('modal-profile-img'), 'Modal avatar should render <img class="modal-profile-img">');
assert(modalAvatarEl.innerHTML.includes(avatarGif.url), 'Modal avatar should embed GIF data URL');
pass('Modal avatar preview renders animated GIF image');

assert(gifBadgeEl.style.display === 'inline-block', 'GIF badge should be visible for animated GIF');
pass('Glowing GIF badge is displayed when GIF avatar is active');

assert(btnRemoveEl.style.display === 'inline-flex', 'Remove avatar button should be visible');
pass('Remove button displayed when custom avatar is present');

assert(headerAvatarEl.classList.contains('has-avatar'), 'Header avatar should have has-avatar class');
assert(headerAvatarEl.innerHTML.includes('header-avatar-img'), 'Header avatar should render <img class="header-avatar-img">');
assert(headerAvatarEl.innerHTML.includes('avatar-gif-dot'), 'Header should render avatar-gif-dot for GIF avatars');
pass('Header renders animated GIF with avatar-gif-dot indicator');

// -------------------------------------------------------------
// Test 4: Removing Custom Profile Picture
// -------------------------------------------------------------
console.log('\n--- Test Suite 4: Custom Profile Picture Removal ---');
const removeUserProfilePicture = sandbox.window.removeUserProfilePicture;

removeUserProfilePicture();

assert(getUserAvatar() === null, 'Avatar should be null after removal in guest mode');
assert(localStorage.getItem(sandbox.window.STORAGE_KEY_CUSTOM_AVATAR) === null, 'localStorage should be cleared');
pass('Custom avatar cleanly purged from storage');

sandbox.window.updateAuthModalContent();
sandbox.window.updateAuthHeaderUI();

assert(gifBadgeEl.style.display === 'none', 'GIF badge should be hidden after removal');
assert(btnRemoveEl.style.display === 'none', 'Remove button should be hidden after removal');
assert(!headerAvatarEl.classList.contains('has-avatar'), 'Header avatar should not have has-avatar class');
assert(headerAvatarEl.innerHTML.includes('<svg'), 'Header avatar should revert to default SVG icon');
pass('UI seamlessly reverts to default state when avatar is removed');

// -------------------------------------------------------------
// Test 5: Logged-in Google User with Custom Avatar Override
// -------------------------------------------------------------
console.log('\n--- Test Suite 5: Cloud User Avatar & Custom Override ---');

// Set logged-in session with Google photo
sandbox.window.userSession = {
  isLoggedIn: true,
  name: 'Saurabh Soko',
  email: 'saurabh@soko.music',
  photoUrl: 'https://lh3.googleusercontent.com/a/google_default_photo.jpg'
};

sandbox.window.updateAuthHeaderUI();
sandbox.window.updateAuthModalContent();

let currentAvatar = getUserAvatar();
assert(currentAvatar !== null, 'Cloud user avatar should exist');
assert(currentAvatar.url === 'https://lh3.googleusercontent.com/a/google_default_photo.jpg', 'Should use Google photo by default');
assert(currentAvatar.isCustom === false, 'Cloud photo should NOT be flagged as custom upload');
pass('Cloud account defaults to Google photo');

// Now upload a custom GIF avatar overriding Google photo
saveUserProfilePicture(gifFile);
currentAvatar = getUserAvatar();
assert(currentAvatar.isCustom === true, 'Custom avatar should override cloud photo');
assert(currentAvatar.isGif === true, 'Custom avatar is an animated GIF');
assert(headerAvatarEl.classList.contains('logged-in'), 'Header retains logged-in styling');
assert(headerAvatarEl.innerHTML.includes('avatar-online-dot'), 'Online dot is preserved alongside GIF');
pass('Custom GIF avatar cleanly overrides cloud photo while maintaining online session state');

// Remove custom avatar: should fall back to Google photo!
removeUserProfilePicture();
currentAvatar = getUserAvatar();
assert(currentAvatar !== null, 'Should fall back to Google photo after removing custom avatar');
assert(currentAvatar.url === 'https://lh3.googleusercontent.com/a/google_default_photo.jpg', 'Fell back to Google photo');
assert(currentAvatar.isCustom === false, 'Fallback photo is marked as non-custom');
pass('Removing custom avatar smoothly reverts back to Google account photo');

// -------------------------------------------------------------
// Test 6: File Size Limit (10MB) & Invalid File Types
// -------------------------------------------------------------
console.log('\n--- Test Suite 6: File Validation & Size Enforcement ---');

lastToastMessage = '';
const giantFile = {
  name: 'huge_video_clip.gif',
  type: 'image/gif',
  size: 15 * 1024 * 1024, // 15 MB (exceeds 10MB limit)
  _mockContent: 'huge_data'
};

saveUserProfilePicture(giantFile);
assert(lastToastMessage.includes('too large'), 'Should trigger warning toast for oversized file');
pass('Files exceeding 10MB are rejected with toast warning');

lastToastMessage = '';
const nonImageFile = {
  name: 'song.mp3',
  type: 'audio/mpeg',
  size: 3 * 1024 * 1024,
  _mockContent: 'mp3_data'
};

saveUserProfilePicture(nonImageFile);
assert(lastToastMessage.includes('Please choose an image or animated GIF'), 'Should reject non-image file');
pass('Non-image files are rejected with guidance toast');

// -------------------------------------------------------------
// Test 7: Persistence Across Cold App Boot
// -------------------------------------------------------------
console.log('\n--- Test Suite 7: Cold Boot State Rehydration ---');

// Save a custom GIF avatar
saveUserProfilePicture(gifFile);
const savedDataUrl = localStorage.getItem(sandbox.window.STORAGE_KEY_CUSTOM_AVATAR);
const savedMimeType = localStorage.getItem(sandbox.window.STORAGE_KEY_CUSTOM_AVATAR_TYPE);

assert(savedDataUrl && savedDataUrl.startsWith('data:image/gif'), 'GIF data URL is persisted in localStorage');
assert(savedMimeType === 'image/gif', 'GIF MIME type is persisted in localStorage');

// Simulate cold app boot in a brand new context
const coldSandbox = {
  window: { addEventListener: () => {}, location: { origin: 'https://music.youtube.com' } },
  document,
  localStorage,
  FileReader: MockFileReader,
  showToast,
  console: { log: () => {}, warn: () => {}, error: console.error },
  setTimeout: (fn) => fn(),
  clearTimeout: () => {}
};
vm.createContext(coldSandbox);
vm.runInContext(constantsCode, coldSandbox);
vm.runInContext(storeCode, coldSandbox);
vm.runInContext(authModalCode, coldSandbox);

const rehydratedAvatar = coldSandbox.window.getUserAvatar();
assert(rehydratedAvatar !== null, 'Avatar rehydrated after cold boot');
assert(rehydratedAvatar.isCustom === true, 'Rehydrated avatar is custom');
assert(rehydratedAvatar.isGif === true, 'Rehydrated avatar is recognized as animated GIF');
assert(rehydratedAvatar.url === savedDataUrl, 'Rehydrated avatar URL matches saved data');
pass('Avatar and GIF metadata survive complete cold restart');

// -------------------------------------------------------------
// Test 8: Trigger File Picker & Label Native Activation
// -------------------------------------------------------------
console.log('\n--- Test Suite 8: Trigger File Picker & Label Activation ---');
const triggerProfilePicUpload = sandbox.window.triggerProfilePicUpload;
const fileInputEl = getOrCreateEl('profilePicInput');
fileInputEl.value = 'dummy_old_path.jpg';
fileInputEl.clicked = false;

// Trigger upload via avatar wrapper or programmatic call
triggerProfilePicUpload();
assert(fileInputEl.value === '', 'File input value should be cleared to allow re-selecting same file');
assert(fileInputEl.clicked === true, 'File input click() should have been called');
pass('triggerProfilePicUpload cleanly resets value and calls input.click()');

// Ensure event from label does not recursively call input.click() again
fileInputEl.clicked = false;
const mockLabelEl = getOrCreateEl('profileUploadLabel');
triggerProfilePicUpload({ target: mockLabelEl });
assert(fileInputEl.clicked === false, 'Click originating from label should not double-invoke input.click()');
pass('Label click event prevents duplicate synthetic click invocation');

// -------------------------------------------------------------
// Test 9: Android Photo Picker (Extensionless & Missing MIME)
// -------------------------------------------------------------
console.log('\n--- Test Suite 9: Android Photo Picker Resiliency ---');
// Simulate Android 13+ MediaStore/PhotoPicker returning content URI:
// name: '100000042', type: '' or 'application/octet-stream' with JPEG bytes (/9j/)
const androidPickerFile = {
  name: '100000042',
  type: '',
  size: 80 * 1024,
  _mockBase64: '/9j/4AAQSkZJRgABAQEASABIAAD_photo_picker_bytes'
};

sandbox.window.saveUserProfilePicture(androidPickerFile);
const androidAvatar = sandbox.window.getUserAvatar();
assert(androidAvatar !== null, 'Android photo picker image should be accepted');
assert(androidAvatar.isCustom === true, 'Avatar should be marked custom');
assert(androidAvatar.isGif === false, 'JPEG should not be flagged as GIF');
pass('Android photo picker file without extension/type successfully identified and persisted');

// Simulate Android PhotoPicker returning animated GIF without extension:
const androidPickerGif = {
  name: '100000099',
  type: 'application/octet-stream',
  size: 250 * 1024,
  _mockBase64: 'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
};

sandbox.window.saveUserProfilePicture(androidPickerGif);
const androidGifAvatar = sandbox.window.getUserAvatar();
assert(androidGifAvatar !== null, 'Android GIF file should be accepted');
assert(androidGifAvatar.isGif === true, 'Android GIF with octet-stream MIME correctly recognized as animated GIF');
pass('Android GIF without extension correctly recognized via magic bytes');

// -------------------------------------------------------------
// Test 10: HTML & CSS File Input Markup & Accessibility
// -------------------------------------------------------------
console.log('\n--- Test Suite 10: HTML & CSS File Input Markup Verification ---');
const mobileHtml = fs.readFileSync(path.join(__dirname, '../apps/mobile/index.html'), 'utf8');
const assetsHtml = fs.readFileSync(path.join(__dirname, '../app/src/main/assets/index.html'), 'utf8');

assert(mobileHtml.includes('class="visually-hidden-file-input"'), 'Mobile index.html should use visually-hidden-file-input');
assert(assetsHtml.includes('class="visually-hidden-file-input"'), 'Assets index.html should use visually-hidden-file-input');
assert(!mobileHtml.includes('id="profilePicInput" style="display: none;"'), 'Mobile index.html should not use display: none on file input');
assert(!assetsHtml.includes('id="profilePicInput" style="display: none;"'), 'Assets index.html should not use display: none on file input');
assert(mobileHtml.includes('label for="profilePicInput" class="profile-btn-upload" id="profileUploadLabel"'), 'Mobile index.html should bind label for profilePicInput');
assert(assetsHtml.includes('label for="profilePicInput" class="profile-btn-upload" id="profileUploadLabel"'), 'Assets index.html should bind label for profilePicInput');
assert(mobileHtml.includes('<span>Upload Photo / GIF</span>'), 'Mobile index.html should render Upload Photo / GIF');
assert(assetsHtml.includes('<span>Upload Photo / GIF</span>'), 'Assets index.html should render Upload Photo / GIF');
pass('HTML markup uses accessible label and avoids display: none on file input');

console.log("\n====================================================");
console.log(`🏁 ALL PROFILE PICTURE TESTS PASSED: ${passedCount} Passed, 0 Failed`);
console.log("====================================================");
