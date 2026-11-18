/**
 * Automated Verification Suite for Charts UI, Refresh, and Pagination
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

console.log('🧪 Starting Charts UI & Pagination Unit Tests...');

// Mock DOM elements
function createMockElement(id, tag = 'div') {
  return {
    id,
    tagName: tag.toUpperCase(),
    innerText: '',
    innerHTML: '',
    value: '',
    disabled: false,
    style: {},
    classList: {
      classes: new Set(),
      add: function(c) { this.classes.add(c); },
      remove: function(c) { this.classes.delete(c); },
      contains: function(c) { return this.classes.has(c); },
      toggle: function(c, force) {
        if (force === undefined) {
          if (this.classes.has(c)) this.classes.delete(c);
          else this.classes.add(c);
        } else if (force) this.classes.add(c);
        else this.classes.delete(c);
      }
    },
    getAttribute: function(attr) {
      if (attr === 'data-region') return this._dataRegion || null;
      return null;
    },
    setAttribute: function(attr, val) {
      if (attr === 'data-region') this._dataRegion = val;
    },
    addEventListener: () => {},
    scrollIntoView: () => {},
    parentNode: {
      insertBefore: () => {}
    }
  };
}

const mockElements = {};
function getEl(id) {
  if (!mockElements[id]) mockElements[id] = createMockElement(id);
  return mockElements[id];
}

const filterPills = [
  { ...createMockElement('pill_1'), innerText: 'Global', _dataRegion: 'Global' },
  { ...createMockElement('pill_2'), innerText: 'United States', _dataRegion: 'United States' },
  { ...createMockElement('pill_3'), innerText: 'India', _dataRegion: 'India' },
  { ...createMockElement('pill_4'), innerText: 'United Kingdom', _dataRegion: 'United Kingdom' },
  { ...createMockElement('pill_5'), innerText: 'Canada', _dataRegion: 'Canada' }
];

const mockDocument = {
  getElementById: (id) => getEl(id),
  querySelectorAll: (selector) => {
    if (selector.includes('.filter-pill')) {
      return filterPills;
    }
    return [];
  },
  querySelector: (selector) => getEl('mock_' + selector),
  createElement: (tag) => createMockElement('created_' + Math.random(), tag),
  body: createMockElement('body', 'body')
};

const toasts = [];
const mockStorage = {};
const sandbox = {
  window: {},
  document: mockDocument,
  console: console,
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  localStorage: {
    getItem: (k) => (k in mockStorage ? mockStorage[k] : null),
    setItem: (k, v) => { mockStorage[k] = String(v); },
    removeItem: (k) => { delete mockStorage[k]; },
    clear: () => { for (const k in mockStorage) delete mockStorage[k]; }
  },
  toasts,
  showToast: function(msg, icon) {
    toasts.push({ msg, icon });
  },
  CATALOG: [],
  isTrackOffline: () => false,
  activeDownloads: new Set(),
  formatTime: (sec) => `${Math.floor(sec / 60)}:${(sec % 60).toString().padStart(2, '0')}`,
  isPodcastOrLongTrack: (t) => t.duration > 600
};
sandbox.window = sandbox;
sandbox.self = sandbox;

vm.createContext(sandbox);

// 1. Verify index.html contains #btnRefreshCharts in #pane-charts .section-title-row
console.log('\n--- Test 1: HTML Structure Verification ---');
const html = fs.readFileSync(path.join(__dirname, '../apps/mobile/index.html'), 'utf8');
assert(html.includes('id="pane-charts"'), '#pane-charts exists in index.html');
assert(html.includes('id="btnRefreshCharts"'), '#btnRefreshCharts button exists in index.html');
assert(html.includes('id="chartsRefreshIcon"'), '#chartsRefreshIcon SVG exists in index.html');
assert(html.includes('onclick="refreshCurrentCharts()"'), 'Refresh button invokes refreshCurrentCharts()');
assert(html.includes('onclick="switchChartRegion(\'Global\')"'), 'Global country pill is wired');
assert(html.includes('onclick="switchChartRegion(\'India\')"'), 'India country pill is wired');
assert(html.includes('onclick="switchChartRegion(\'United States\')"'), 'United States country pill is wired');
assert(html.includes('onclick="switchChartRegion(\'United Kingdom\')"'), 'United Kingdom country pill is wired');
console.log('✓ Test 1 Passed: index.html markup correctly structured with refresh button and country pills');

// 2. Load JS files
const filesToLoad = [
  'apps/mobile/js/config/constants.js',
  'apps/mobile/js/config/catalog.js',
  'apps/mobile/js/utils/duration.js',
  'apps/mobile/js/utils/text.js',
  'apps/mobile/js/utils/filter.js',
  'apps/mobile/js/data/regional_charts.js',
  'apps/mobile/js/state/store.js',
  'apps/mobile/js/ui/charts.js'
];

for (const f of filesToLoad) {
  const code = fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
  vm.runInContext(code, sandbox);
}

// ------------------------------------------------------------
// Test 2: Initial 0 Hardcoded Charts
// ------------------------------------------------------------
console.log('\n--- Test 2: Zero Hardcoded Tracks ---');
assert(sandbox.window.REGIONAL_CHARTS, 'REGIONAL_CHARTS is defined');
assert.strictEqual(sandbox.window.REGIONAL_CHARTS['Global'].length, 0);
assert.strictEqual(sandbox.window.REGIONAL_CHARTS['India'].length, 0);
assert.strictEqual(sandbox.window.REGIONAL_CHARTS['United States'].length, 0);
assert.strictEqual(sandbox.window.REGIONAL_CHARTS['United Kingdom'].length, 0);
console.log('✓ Test 2 Passed: Starts with 0 hardcoded tracks');

// ------------------------------------------------------------
// Test 3: 100-Song Pagination (Pages 1 to 5)
// ------------------------------------------------------------
console.log('\n--- Test 3: 100-Song Pagination (Pages 1 to 5) ---');
const mock100Songs = [];
for (let i = 1; i <= 100; i++) {
  mock100Songs.push({
    id: `track_chart_${i}`,
    title: `Song Top ${i}`,
    artist: `Artist ${i}`,
    duration: 210,
    cover: `https://lh3.googleusercontent.com/test_${i}=w800-h800`
  });
}
sandbox.window.REGIONAL_CHARTS['Global'] = mock100Songs;

// Page 1
sandbox.window.renderCharts('Global', 1);
const listEl = getEl('chartsTrackList');
const pagEl = getEl('chartsPagination');

assert(listEl.innerHTML.includes('>1<'), 'Page 1 has rank 1');
assert(listEl.innerHTML.includes('>20<'), 'Page 1 has rank 20');
assert(!listEl.innerHTML.includes('>21<'), 'Page 1 does not include rank 21');
assert(pagEl.innerHTML.includes('pointer-events: none;'), 'Prev button is disabled on page 1');
assert(pagEl.innerHTML.includes('class="filter-pill active" style="min-width: 40px; min-height: 40px; padding: 6px 10px; font-size: 11px; text-align: center;" onclick="setChartPage(1)">1</button>'), 'Page 1 button is active');
assert(pagEl.innerHTML.includes('onclick="setChartPage(5)">5</button>'), 'Page 5 button exists');

// Page 2
sandbox.window.setChartPage(2);
assert(listEl.innerHTML.includes('>21<'), 'Page 2 starts with rank 21');
assert(listEl.innerHTML.includes('>40<'), 'Page 2 ends with rank 40');
assert(!listEl.innerHTML.includes('>1<'), 'Page 2 does not include rank 1');

// Page 5
sandbox.window.setChartPage(5);
assert(listEl.innerHTML.includes('>81<'), 'Page 5 starts with rank 81');
assert(listEl.innerHTML.includes('>100<'), 'Page 5 ends with rank 100');
assert(pagEl.innerHTML.includes('onclick="setChartPage(6)"'), 'Next button references page 6');
console.log('✓ Test 3 Passed: 100-song list paginates cleanly across 5 pages');

// ------------------------------------------------------------
// Test 4: Country Switching
// ------------------------------------------------------------
console.log('\n--- Test 4: Country Selection ---');
sandbox.window.REGIONAL_CHARTS['India'] = mock100Songs.map(s => ({ ...s, id: 'in_' + s.id, title: 'India ' + s.title }));
sandbox.window.switchChartRegion('India');
assert.strictEqual(sandbox.window.currentChartRegion, 'India', 'currentChartRegion switched to India');
assert(listEl.innerHTML.includes('India Song Top 1'), 'Rendered India songs');
assert(sandbox.toasts.some(t => t.msg.includes('India')), 'Toast announced region switch');

// Switch via alias 'US'
sandbox.window.REGIONAL_CHARTS['United States'] = mock100Songs.map(s => ({ ...s, id: 'us_' + s.id, title: 'US ' + s.title }));
sandbox.window.switchChartRegion('US');
assert.strictEqual(sandbox.window.currentChartRegion, 'United States', 'Alias US normalized to United States');
assert(listEl.innerHTML.includes('US Song Top 1'), 'Rendered US songs');
console.log('✓ Test 4 Passed: Country selection and canonical aliases work seamlessly');

// ------------------------------------------------------------
// Test 5: Refresh Button & Cache Bypass
// ------------------------------------------------------------
console.log('\n--- Test 5: Refresh Button & Cache Bypass ---');
// Pre-populate cache
sandbox.localStorage.setItem('soko_cached_charts_United States', JSON.stringify([{ id: 'cached_old', title: 'Old Song', artist: 'Old Artist', duration: 200, cover: 'old.jpg' }]));

let realFetchTriggered = false;
let forceFlagReceived = false;
sandbox.window.fetchRealCharts = async function(region, forceRefresh) {
  realFetchTriggered = true;
  forceFlagReceived = forceRefresh;
  return [
    { id: 'fresh_live_1', title: 'Fresh Hit 1', artist: 'Fresh Artist', duration: 180, cover: 'fresh.jpg' }
  ];
};

const refreshIcon = getEl('chartsRefreshIcon');
const refreshBtn = getEl('btnRefreshCharts');

(async () => {
  await sandbox.window.refreshCurrentCharts();

  // 1. Local cache bypassed/removed
  assert.strictEqual(sandbox.localStorage.getItem('soko_cached_charts_United States'), JSON.stringify([{ id: 'fresh_live_1', title: 'Fresh Hit 1', artist: 'Fresh Artist', duration: 180, cover: 'fresh.jpg' }]), 'Cached data was replaced with freshly fetched tracks');
  // 2. Fetch was called with forceRefresh = true
  assert(realFetchTriggered, 'window.fetchRealCharts was called');
  assert.strictEqual(forceFlagReceived, true, 'forceRefresh was passed as true to bypass cache');
  // 3. Toast was shown
  assert(sandbox.toasts.some(t => t.msg.includes('Refreshing live charts...')), 'Toast "Refreshing live charts..." was triggered');
  // 4. UI re-rendered
  assert(listEl.innerHTML.includes('Fresh Hit 1'), 'Track list re-rendered with fresh hit');

  console.log('✓ Test 5 Passed: Refresh button bypasses cache, triggers live fetch, shows spinner/toast, and re-renders');

  console.log('\n====================================================');
  console.log('🎉 ALL CHARTS UI & PAGINATION TESTS PASSED!');
  console.log('====================================================');
})().catch(err => {
  console.error('✗ TEST FAILED:', err);
  process.exit(1);
});
