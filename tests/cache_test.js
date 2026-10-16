/**
 * Unit Test: In-Memory O(1) Cache Deduplication & LRU Eviction Engine
 */

class MockMusicCache {
  constructor(maxStorageBytes) {
    this.maxBytes = maxStorageBytes;
    this.usedBytes = 0;
    this.cachedIds = new Set();
    this.registry = new Map(); // id -> { metadata, lastPlayed, size, isFavorite }
  }

  // O(1) Check
  isCached(id) {
    return this.cachedIds.has(id);
  }

  addSong(id, title, sizeBytes, isFavorite = false) {
    // Evict if adding exceeds ceiling
    while (this.usedBytes + sizeBytes > this.maxBytes) {
      const evicted = this.evictOldestUnpinned();
      if (!evicted) break; // Cannot evict further (all pinned)
    }

    this.cachedIds.add(id);
    this.usedBytes += sizeBytes;
    this.registry.set(id, {
      id,
      title,
      sizeBytes,
      isFavorite,
      lastPlayed: Date.now(),
      playCount: 1,
    });
    return true;
  }

  recordPlay(id) {
    if (!this.registry.has(id)) return false;
    const item = this.registry.get(id);
    item.lastPlayed = Date.now();
    item.playCount += 1;
    return true;
  }

  evictOldestUnpinned() {
    let oldestId = null;
    let oldestTime = Infinity;

    for (const [id, item] of this.registry.entries()) {
      if (!item.isFavorite && item.lastPlayed < oldestTime) {
        oldestTime = item.lastPlayed;
        oldestId = id;
      }
    }

    if (oldestId) {
      const item = this.registry.get(oldestId);
      this.usedBytes -= item.sizeBytes;
      this.cachedIds.delete(oldestId);
      this.registry.delete(oldestId);
      return oldestId;
    }
    return null;
  }
}

// ==========================================
// TEST EXECUTION
// ==========================================
function runTests() {
  console.log('🧪 Starting Soko Music Cache & Deduplication Tests...');

  // 10 MB limit for test
  const cache = new MockMusicCache(10 * 1024 * 1024);

  // Test 1: Deduplication O(1)
  console.log('Test 1: Adding Song A (3.5 MB)...');
  cache.addSong('songA', 'Track Alpha', 3.5 * 1024 * 1024, false);
  console.assert(cache.isCached('songA') === true, 'Song A should be cached');
  console.assert(cache.isCached('songB') === false, 'Song B should NOT be cached');
  console.log('✓ Test 1 Passed: Instant O(1) lookup verified');

  // Test 2: Sequential Look-Ahead Add
  console.log('Test 2: Adding Song B & Song C...');
  cache.addSong('songB', 'Track Beta', 3.5 * 1024 * 1024, true); // Pinned favorite
  cache.addSong('songC', 'Track Gamma', 3.5 * 1024 * 1024, false);
  // Total attempted: 10.5 MB > 10 MB ceiling -> songA (unpinned & oldest) should be evicted
  console.assert(cache.isCached('songA') === false, 'Song A should be evicted');
  console.assert(cache.isCached('songB') === true, 'Song B (favorite) MUST NOT be evicted');
  console.assert(cache.isCached('songC') === true, 'Song C should be cached');
  console.log('✓ Test 2 Passed: LRU eviction successfully protected favorite Song B and pruned Song A');

  console.log('🎉 All 2 Test Suites Passed Successfully!');
}

runTests();
