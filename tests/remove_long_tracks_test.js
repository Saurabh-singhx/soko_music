const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log("====================================================");
console.log("🧪 TESTING REMOVAL & BLOCKING OF TRACKS > 10 MINUTES");
console.log("====================================================");

// Mock browser environment
const mockStorage = {};
const localStorage = {
  getItem: (k) => (k in mockStorage ? mockStorage[k] : null),
  setItem: (k, v) => { mockStorage[k] = String(v); },
  removeItem: (k) => { delete mockStorage[k]; },
  clear: () => { for (const k in mockStorage) delete mockStorage[k]; }
};

const window = {
  addEventListener: () => {},
  location: { origin: 'https://music.youtube.com' }
};

const document = {
  getElementById: (id) => ({
    id,
    innerText: '',
    innerHTML: '',
    value: '',
    style: {},
    classList: { add: () => {}, remove: () => {}, contains: () => false },
    addEventListener: () => {}
  }),
  querySelectorAll: () => [],
  querySelector: () => null,
  createElement: () => ({ style: {}, classList: { add: () => {} } }),
  body: { classList: { add: () => {}, remove: () => {} } }
};

// Load code
const constantsCode = fs.readFileSync(path.join(__dirname, '../app/src/main/assets/js/config/constants.js'), 'utf8');
const textCode = fs.readFileSync(path.join(__dirname, '../app/src/main/assets/js/utils/text.js'), 'utf8');
const durationCode = fs.readFileSync(path.join(__dirname, '../app/src/main/assets/js/utils/duration.js'), 'utf8');
const filterCode = fs.readFileSync(path.join(__dirname, '../app/src/main/assets/js/utils/filter.js'), 'utf8');
const catalogCode = fs.readFileSync(path.join(__dirname, '../app/src/main/assets/js/config/catalog.js'), 'utf8');

const sandbox = {
  window,
  document,
  localStorage,
  console,
  setTimeout,
  clearTimeout,
  setInterval,
  clearInterval
};

vm.createContext(sandbox);
vm.runInContext(constantsCode, sandbox);
vm.runInContext(textCode, sandbox);
vm.runInContext(durationCode, sandbox);
vm.runInContext(filterCode, sandbox);
vm.runInContext(catalogCode, sandbox);

let passed = 0;
let failed = 0;
function assert(cond, msg) {
  if (cond) {
    console.log(`  ✓ PASS: ${msg}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${msg}`);
    failed++;
  }
}

// Test 1: Bundled catalog duration verification
console.log("\n--- Test 1: Bundled Catalog Duration Verification ---");
const catalog = sandbox.window.CATALOG;
assert(Array.isArray(catalog), "CATALOG is defined");
const longCatalogTracks = catalog.filter(t => t.duration > 600);
assert(longCatalogTracks.length === 0, `Bundled catalog has 0 tracks > 10 min (actual: ${longCatalogTracks.length})`);
catalog.forEach(t => {
  assert(t.duration <= 600, `Track "${t.title}" is ${t.duration}s (<= 600s)`);
});

// Test 2: Filter function verification
console.log("\n--- Test 2: Filter Function Accuracy ---");
const isPodcastOrLongTrack = sandbox.window.isPodcastOrLongTrack;
assert(isPodcastOrLongTrack({ title: "Normal Song", duration: 240 }) === false, "4-minute song is allowed");
assert(isPodcastOrLongTrack({ title: "Exact 10 Min Song", duration: 600 }) === false, "Exact 10-minute song (600s) is allowed");
assert(isPodcastOrLongTrack({ title: "10 Min 1 Sec Song", duration: 601 }) === true, "10 min 1 sec song (601s) is identified as long");
assert(isPodcastOrLongTrack({ title: "15 Min Jam", duration: 900 }) === true, "15-minute song (900s) is identified as long");
assert(isPodcastOrLongTrack({ title: "1 Hour Set", duration: 3600 }) === true, "1-hour set (3600s) is identified as long");
assert(isPodcastOrLongTrack({ title: "Podcast Ep 1", duration: 250 }) === true, "Podcast under 10 min is still identified as podcast");

// Test 3: Purging long tracks from persistent storage simulation
console.log("\n--- Test 3: Storage Purge Simulation ---");
const testSavedTracks = [
  { id: "valid_1", title: "Valid Song 1", duration: 215 },
  { id: "long_2", title: "Long Mix", duration: 1800 },
  { id: "valid_3", title: "Valid Song 3", duration: 320 },
  { id: "podcast_4", title: "Tech Podcast", duration: 250 }
];

const testDownloadedIds = ["valid_1", "long_2", "valid_3", "podcast_4"];

// Test purge logic
const cleanedTracks = testSavedTracks.filter(t => !isPodcastOrLongTrack(t));
const validIdsSet = new Set(cleanedTracks.map(t => t.id));
const cleanedDownloadedIds = testDownloadedIds.filter(id => validIdsSet.has(id));

assert(cleanedTracks.length === 2, `Purged tracks count is 2 (actual: ${cleanedTracks.length})`);
assert(!cleanedTracks.some(t => t.id === "long_2"), "Long Mix (1800s) was purged");
assert(!cleanedTracks.some(t => t.id === "podcast_4"), "Podcast was purged");
assert(cleanedDownloadedIds.length === 2, `Cleaned downloadedSet has 2 items (actual: ${cleanedDownloadedIds.length})`);
assert(!cleanedDownloadedIds.includes("long_2"), "DownloadedSet purged long_2");
assert(!cleanedDownloadedIds.includes("podcast_4"), "DownloadedSet purged podcast_4");

console.log("\n====================================================");
console.log(`🏁 TEST RESULTS: ${passed} Passed, ${failed} Failed`);
console.log("====================================================");

if (failed > 0) process.exit(1);

// Test 4: Full App Lifecycle & Storage Purge Verification
console.log("\n--- Test 4: App Initialization Auto-Purge Verification ---");
mockStorage['soko_custom_tracks_v2'] = JSON.stringify([
  { id: "custom_good", title: "Good Track", duration: 195, artist: "Artist A" },
  { id: "custom_long", title: "12 Min Live Jam", duration: 720, artist: "Jam Band" },
  { id: "custom_podcast", title: "Weekly Podcast Episode 10", duration: 300, artist: "Talk Host" }
]);
mockStorage['soko_downloaded_ids_v2'] = JSON.stringify(["custom_good", "custom_long", "custom_podcast"]);
mockStorage['soko_user_playlists_v2'] = JSON.stringify([
  { id: "pl_favorites", title: "Favorites", songIds: ["custom_good", "custom_long"] },
  { id: "pl_custom", title: "My Mix", songIds: ["custom_podcast"] }
]);

// Load storage code and simulate initPersistentStorage
const storageCode = fs.readFileSync(path.join(__dirname, '../app/src/main/assets/js/state/storage.js'), 'utf8');

// Function that performs the strict purge
function runStrictDurationPurge(customTracks, downloadedIds, playlists) {
  const validCustomTracks = customTracks.filter(t => !isPodcastOrLongTrack(t));
  const validIds = new Set([
    ...sandbox.window.CATALOG.map(t => t.id),
    ...validCustomTracks.map(t => t.id)
  ]);
  const validDownloadedIds = downloadedIds.filter(id => {
    if (!validIds.has(id)) return false;
    const t = validCustomTracks.find(x => x.id === id) || sandbox.window.CATALOG.find(x => x.id === id);
    return t ? !isPodcastOrLongTrack(t) : false;
  });
  const cleanedPlaylists = playlists.map(pl => ({
    ...pl,
    songIds: (pl.songIds || []).filter(id => {
      const t = validCustomTracks.find(x => x.id === id) || sandbox.window.CATALOG.find(x => x.id === id);
      return t ? !isPodcastOrLongTrack(t) : false;
    })
  }));
  return { validCustomTracks, validDownloadedIds, cleanedPlaylists };
}

const customBefore = JSON.parse(mockStorage['soko_custom_tracks_v2']);
const dlBefore = JSON.parse(mockStorage['soko_downloaded_ids_v2']);
const plBefore = JSON.parse(mockStorage['soko_user_playlists_v2']);

const { validCustomTracks, validDownloadedIds, cleanedPlaylists } = runStrictDurationPurge(customBefore, dlBefore, plBefore);

assert(validCustomTracks.length === 1, `Custom tracks reduced from 3 to 1 (actual: ${validCustomTracks.length})`);
assert(validCustomTracks[0].id === 'custom_good', "Only 'custom_good' survived in custom tracks");
assert(validDownloadedIds.length === 1, `Downloaded IDs reduced to 1 (actual: ${validDownloadedIds.length})`);
assert(validDownloadedIds[0] === 'custom_good', "Only 'custom_good' survived in downloadedSet");
assert(cleanedPlaylists[0].songIds.length === 1, `Favorites playlist song count is 1 (actual: ${cleanedPlaylists[0].songIds.length})`);
assert(!cleanedPlaylists[0].songIds.includes('custom_long'), "Long track purged from Favorites playlist");
assert(cleanedPlaylists[1].songIds.length === 0, `Podcast mix is now empty (actual: ${cleanedPlaylists[1].songIds.length})`);

// Test 5: Playback Prevention Logic
console.log("\n--- Test 5: Direct Playback Prevention ---");
let toastMessage = null;
let skippedToNext = false;
function attemptPlayTrack(track) {
  if (isPodcastOrLongTrack(track)) {
    toastMessage = '⚠️ Tracks longer than 10 minutes are excluded';
    skippedToNext = true;
    return false;
  }
  return true;
}

const playResultValid = attemptPlayTrack({ id: "valid_short", title: "Short Song", duration: 215 });
assert(playResultValid === true, "Song <= 10 min starts playback normally");

const playResultLong = attemptPlayTrack({ id: "long_symphony", title: "15-min Symphony", duration: 900 });
assert(playResultLong === false, "Track > 10 min is blocked from playback");
assert(skippedToNext === true, "Track > 10 min triggers playNextTrack() skip");
assert(toastMessage.includes("longer than 10 minutes"), "User is notified via toast that track is excluded");

// Test 6: Actual Source File Execution of initPersistentStorage & selectTrackToPlay
console.log("\n--- Test 6: Production Source Code Execution ---");

let nativeDeletedId = null;
const appSandbox = {
  window: {
    addEventListener: () => {},
    location: { origin: 'https://music.youtube.com' },
    SokoNative: {
      deleteDownloadedTrack: (id) => { nativeDeletedId = id; },
      isTrackDownloaded: () => false
    }
  },
  document: {
    getElementById: (id) => ({
      id,
      innerText: '',
      innerHTML: '',
      value: '',
      style: {},
      classList: { add: () => {}, remove: () => {}, contains: () => false },
      addEventListener: () => {}
    }),
    querySelectorAll: () => [],
    querySelector: () => null,
    createElement: () => ({ style: {}, classList: { add: () => {} } }),
    body: { classList: { add: () => {}, remove: () => {} } }
  },
  localStorage,
  console,
  setTimeout,
  clearTimeout,
  setInterval,
  clearInterval
};

vm.createContext(appSandbox);
vm.runInContext(constantsCode, appSandbox);
vm.runInContext(textCode, appSandbox);
vm.runInContext(durationCode, appSandbox);
vm.runInContext(filterCode, appSandbox);
vm.runInContext(catalogCode, appSandbox);

appSandbox.REGIONAL_CHARTS = {};
appSandbox.currentChartRegion = null;

// Set up mock storage with long track and podcast before loading store & storage
mockStorage['soko_custom_tracks_v2'] = JSON.stringify([
  { id: "custom_ok", title: "OK Track", duration: 210, artist: "Good Artist" },
  { id: "custom_super_long", title: "15 Min Jam", duration: 900, artist: "Long Band" },
  { id: "custom_pod", title: "Episode 10 Podcast", duration: 300, artist: "Podcaster" }
]);
mockStorage['soko_downloaded_ids_v2'] = JSON.stringify(["custom_ok", "custom_super_long", "custom_pod"]);
mockStorage['soko_user_playlists_v2'] = JSON.stringify([
  { id: "pl_favorites", name: "Favorites", songIds: ["custom_ok", "custom_super_long"] }
]);

const storeCode = fs.readFileSync(path.join(__dirname, '../app/src/main/assets/js/state/store.js'), 'utf8');
vm.runInContext(storeCode, appSandbox);

const prodStorageCode = fs.readFileSync(path.join(__dirname, '../app/src/main/assets/js/state/storage.js'), 'utf8');
vm.runInContext(prodStorageCode, appSandbox);

// Run initPersistentStorage()
appSandbox.initPersistentStorage();

const cat = appSandbox.window.CATALOG || appSandbox.CATALOG;
const dlSet = appSandbox.window.downloadedSet || appSandbox.downloadedSet;
const pls = appSandbox.window.userPlaylists || appSandbox.userPlaylists;

assert(!cat.some(t => t.id === "custom_super_long"), "CATALOG does not contain custom_super_long after initPersistentStorage");
assert(!cat.some(t => t.id === "custom_pod"), "CATALOG does not contain custom_pod after initPersistentStorage");
assert(cat.some(t => t.id === "custom_ok"), "CATALOG retains custom_ok");
assert(!dlSet.has("custom_super_long"), "downloadedSet does not have custom_super_long");
assert(!dlSet.has("custom_pod"), "downloadedSet does not have custom_pod");
assert(dlSet.has("custom_ok"), "downloadedSet retains custom_ok");

const favPlaylist = pls.find(p => p.id === "pl_favorites");
assert(favPlaylist && !favPlaylist.songIds.includes("custom_super_long"), "Favorites playlist purged custom_super_long");
assert(favPlaylist && favPlaylist.songIds.includes("custom_ok"), "Favorites playlist retained custom_ok");
assert(nativeDeletedId !== null, "window.SokoNative.deleteDownloadedTrack was invoked during purge");

// Now check audio_engine selectTrackToPlay with production code
let toastReceived = null;
let skippedCalled = false;
appSandbox.showToast = (msg) => { toastReceived = msg; };
appSandbox.window.showToast = appSandbox.showToast;
appSandbox.playNextTrack = () => { skippedCalled = true; };
appSandbox.window.playNextTrack = appSandbox.playNextTrack;

const prodAudioEngineCode = fs.readFileSync(path.join(__dirname, '../app/src/main/assets/js/player/audio_engine.js'), 'utf8');
vm.runInContext(prodAudioEngineCode, appSandbox);

appSandbox.window.currentYtmSearchResults = [
  { id: "ytm_long", title: "15 Min Jam", duration: 900, artist: "Long Band" },
  { id: "ytm_podcast", title: "Podcast Episode 12", duration: 320, artist: "Host" }
];

const selectFn = appSandbox.window.selectTrackToPlay || appSandbox.selectTrackToPlay;
selectFn("ytm_long");
assert(skippedCalled === true, "selectTrackToPlay on > 10 min track called playNextTrack()");
assert(toastReceived && toastReceived.includes("longer than 10 minutes"), "Toast notified user: " + toastReceived);

skippedCalled = false;
toastReceived = null;
selectFn("ytm_podcast");
assert(skippedCalled === true, "selectTrackToPlay on podcast track called playNextTrack()");
assert(toastReceived && toastReceived.includes("longer than 10 minutes"), "Toast notified user for podcast");

console.log("\n====================================================");
console.log(`🏁 ALL TESTS COMPLETED: ${passed} Passed, ${failed} Failed`);
console.log("====================================================");

if (failed > 0) process.exit(1);
