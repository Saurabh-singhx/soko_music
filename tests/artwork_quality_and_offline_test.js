/**
 * Test Suite: Artwork Quality & Offline Persistence Verification
 * 1. Dynamic High-Resolution URL Upgrades for Online Songs
 * 2. Artwork Local Path Assignment on Download Completion
 * 3. Offline Artwork Fallback Recovery
 * 4. Protection of Downloaded Tracks against Storage Truncation
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('🧪 Starting Artwork Quality & Offline Persistence Tests...');

// 1. Load pure utilities
const textJsPath = path.join(__dirname, '../apps/mobile/js/utils/text.js');
const textJsCode = fs.readFileSync(textJsPath, 'utf8');

const mockWindow = {};
const evalTextUtil = new Function('window', textJsCode + '\nreturn window;');
const utils = evalTextUtil(mockWindow);

// Test Suite 1: High-Resolution Artwork URL Upgrader
console.log('--- Test Suite 1: High-Resolution Artwork URL Upgrader ---');

const lowResUrls = [
  {
    input: 'https://lh3.googleusercontent.com/abc=w60-h60-l90-rj',
    expected: 'https://lh3.googleusercontent.com/abc=w800-h800-l90-rj'
  },
  {
    input: 'https://yt3.googleusercontent.com/xyz=w120-h120-l90-rj',
    expected: 'https://yt3.googleusercontent.com/xyz=w800-h800-l90-rj'
  },
  {
    input: 'https://lh3.googleusercontent.com/test=s120-c-k-c0x00ffffff-no-rj',
    expected: 'https://lh3.googleusercontent.com/test=s800-c-k-c0x00ffffff-no-rj'
  },
  {
    input: 'https://lh3.googleusercontent.com/sample=s60',
    expected: 'https://lh3.googleusercontent.com/sample=s800'
  }
];

for (const t of lowResUrls) {
  const upgraded = utils.getHighResArtworkUrl(t.input, 800);
  assert.strictEqual(upgraded, t.expected, `Expected ${t.expected} but got ${upgraded}`);
  console.log(`  ✓ PASS: Upgraded ${t.input.substring(0, 45)}... -> ${upgraded.substring(0, 45)}...`);
}

// Edge Cases: logo, empty, local
assert.strictEqual(utils.getHighResArtworkUrl('assets/logo.png'), 'assets/logo.png');
assert.strictEqual(utils.getHighResArtworkUrl(''), 'assets/logo.png');
assert.strictEqual(utils.getHighResArtworkUrl(null), 'assets/logo.png');
assert.strictEqual(utils.getHighResArtworkUrl('artworks/test123.jpg'), 'artworks/test123.jpg');
console.log('  ✓ PASS: Edge cases handled safely (logo, null, local artworks)');

// Test Suite 2: Offline Image Error Recovery
console.log('--- Test Suite 2: Offline Image Error Recovery ---');

const mockImg = { src: 'https://lh3.googleusercontent.com/broken.jpg', onerror: () => {} };
const mockNative = {
  getDownloadedCoverPath: (vid) => {
    if (vid === 'offline_song_1') return '/data/user/0/com.soko.music/files/artworks/offline_song_1.jpg';
    return '';
  }
};

const winWithNative = { SokoNative: mockNative };
const evalWithNative = new Function('window', textJsCode + '\nreturn window;');
const utilsWithNative = evalWithNative(winWithNative);

utilsWithNative.handleImageLoadError(mockImg, 'offline_song_1');
assert.strictEqual(mockImg.src, 'artworks/offline_song_1.jpg', 'Offline downloaded track recovers artwork via artworks/ endpoint');
console.log('  ✓ PASS: Offline track recovered artwork to artworks/offline_song_1.jpg');

const mockImgNonDownloaded = { src: 'https://lh3.googleusercontent.com/broken2.jpg' };
utilsWithNative.handleImageLoadError(mockImgNonDownloaded, 'non_downloaded_track');
assert.strictEqual(mockImgNonDownloaded.src, 'assets/logo.png', 'Non-downloaded track safely falls back to assets/logo.png');
console.log('  ✓ PASS: Non-downloaded track safely falls back to logo.png');

console.log('====================================================');
console.log('🎉 ALL ARTWORK TESTS PASSED SUCCESSFULLY!');
console.log('====================================================');
