# Architecture & Implementation Plan: Soko Music App Structural Refactor

## Executive Summary
This document outlines the pure structural refactoring plan for the Android application `com.soko.music`. The current application concentrates nearly all its logic in monolithic files:
- `apps/mobile/index.html` (9,068 lines: 1,544 lines of CSS + 560 lines of HTML + 6,953 lines of JavaScript)
- `scripts/build_apk.sh` (1,651 lines, which includes an embedded 1,472-line `MainActivity.java` heredoc)

This refactoring splits these monolithic files into modular, single-responsibility files (strictly under ~300 lines, soft limit 400 lines) adhering to modern Android project architecture (`app/src/main/java/` and `app/src/main/assets/`) with classic script tag ordering in WebView, preserved public APIs, zero logic changes, incremental verification, and continuous git commits.

---

## Baseline State & Verification

| Metric | Baseline Count | Target Status |
|---|---|---|
| Automated Test Suites | 13 Suites, 204 unit & integration assertions | 100% Pass (204/204) |
| Standalone Cache Tests | 2 Suites, LRU eviction & O(1) checks | 100% Pass (2/2) |
| Native Android APK | 140 MB signed, aligned, verified APK | Built & verified via aapt2/javac/d8/zipalign/apksigner |
| Max File Length | 9,068 lines (`apps/mobile/index.html`) | Max <= 400 lines (target <= 300 lines) |
| JavaScript Functions | 135 functions | Exactly 135 functions preserved |
| Java Bridge Methods | 23 `@JavascriptInterface` methods | Exactly 23 methods preserved under `"SokoNative"` |

---

## Target Project Directory Tree

```
app/
  src/main/
    AndroidManifest.xml
    res/
      values/
        strings.xml
        styles.xml
      drawable/
        ic_launcher.png
      mipmap-mdpi/
        ic_launcher.png
      mipmap-hdpi/
        ic_launcher.png
      mipmap-xhdpi/
        ic_launcher.png
      mipmap-xxhdpi/
        ic_launcher.png
      mipmap-xxxhdpi/
        ic_launcher.png
    java/com/soko/music/
      MainActivity.java                # ~120 lines: Activity lifecycle & WebView setup
      bridge/
        SokoNativeBridge.java          # ~120 lines: Composite bridge registered as "SokoNative"
        PlayerBridge.java              # ~70 lines: Playback control bridge methods
        StorageBridge.java             # ~90 lines: Download & disk cache bridge methods
        AuthBridge.java                # ~75 lines: InnerTube API & Google login bridge methods
        TelemetryBridge.java           # ~30 lines: Telemetry beacon bridge methods
      audio/
        AudioEngine.java               # ~160 lines: MediaPlayer playback, state, progress updates
        AudioFocusManager.java         # ~50 lines: AudioManager focus listener & audio focus request
        NoisyAudioReceiver.java        # ~30 lines: Becoming-noisy broadcast receiver
        MediaNotificationManager.java  # ~140 lines: MediaSession, lock screen controls, notifications
      cache/
        TrackDownloader.java           # ~250 lines: InnerTube stream download & progress callback
        DiskCacheManager.java          # ~110 lines: Disk usage metrics, file storage, deletions
      util/
        CryptoUtil.java                # ~40 lines: SAPISIDHASH generation & SHA-1
        HttpUtil.java                  # ~120 lines: InnerTube HTTP requests & visitorData extraction
    assets/
      index.html                       # ~580 lines: HTML markup only + stylesheet links + script tags
      assets/                          # icon.png, logo.png, logo.svg, regional_charts.json
      music/                           # 16 bundled Opus audio tracks & album art covers
      css/
        tokens.css                     # ~25 lines: CSS custom properties / design tokens
        base.css                       # ~65 lines: Universal reset, scrollbar hiding, modal lock
        layout.css                     # ~120 lines: App viewport, top header, content scroll container
        animations.css                 # ~50 lines: Keyframes (pulse, spin, fadeIn, slideUp, dialogPop)
        components/
          header.css                   # ~90 lines: Top bar, brand logo, status badge
          shelves.css                  # ~290 lines: Dynamic feed horizontal shelves & 4-row grids
          library.css                  # ~240 lines: Offline track rows, sort bar, filter pills
          ptr.css                      # ~80 lines: Swipe-down pull-to-refresh spinner & indicator
          search.css                   # ~165 lines: Search bar, track cards, floating download banner
          playlists.css                # ~85 lines: Playlist cards grid, storage meter
          miniplayer.css               # ~100 lines: Mini bottom player dock
          player.css                   # ~210 lines: Fullscreen modal player, hero art, seek bar
          navigation.css               # ~45 lines: Bottom navigation dock (4 tabs)
          settings.css                 # ~70 lines: Settings items, cache limits
          modal.css                    # ~40 lines: Dialog backdrop, create/add playlist modals
          toast.css                    # ~35 lines: Global toast notifications
      js/
        config/
          constants.js                 # ~45 lines: Storage keys, duration ceiling, page limits
          catalog.js                   # ~190 lines: CATALOG (16 bundled tracks) & BUNDLED_TRACKS
        data/
          charts_global.js             # ~290 lines: 50 Global tracks
          charts_global_2.js           # ~290 lines: 50 Global tracks
          charts_india.js              # ~290 lines: 50 India tracks
          charts_india_2.js            # ~290 lines: 50 India tracks
          charts_us.js                 # ~290 lines: 50 US tracks
          charts_us_2.js               # ~290 lines: 50 US tracks
          charts_uk.js                 # ~290 lines: 50 UK tracks
          charts_uk_2.js               # ~290 lines: 50 UK tracks
          regional_charts.js           # ~35 lines: Assembles window.REGIONAL_CHARTS
        utils/
          duration.js                  # ~50 lines: parseDurationStringToSeconds, formatTime
          text.js                      # ~30 lines: extractTextString
          filter.js                    # ~150 lines: isPodcastOrLongTrack, isInnerTubePodcastItem
          crypto.js                    # ~20 lines: generateCpn
        state/
          store.js                     # ~120 lines: Reactive app state, lookup across sources
          storage.js                   # ~180 lines: Persistent storage hydration & persistence
        cache/
          lru_cache.js                 # ~120 lines: updateStorageMetrics, clearUnpinnedCache
          downloader.js                # ~100 lines: startDownloadTrack, download callbacks
        api/
          innertube.js                 # ~120 lines: callInnerTubeApi, onYtmNativeApiResponse
          browse.js                    # ~250 lines: fetchYouTubeMusicFeed, parseBrowseShelves
          search.js                    # ~180 lines: executeSearch, debounced search
          radio.js                     # ~80 lines: fetchAndApplyYtmRadioQueue
          auth.js                      # ~120 lines: Google login, cookie login, demo, sync
        player/
          yt_iframe.js                 # ~140 lines: Online IFrame API, online streaming
          audio_engine.js              # ~160 lines: Core playback, track switching, lookahead
          native_audio_listener.js     # ~70 lines: Bridge callbacks for native playback & audio focus
          mediasession.js              # ~60 lines: MediaSession API integration
          telemetry.js                 # ~100 lines: Watchtime beacons, completion telemetry
        ui/
          navigation.js                # ~40 lines: Tab switching logic
          home.js                      # ~220 lines: Shelf HTML cards, mix playback
          gestures/
            pull_to_refresh.js         # ~180 lines: Touch gesture engine for PTR
          charts.js                    # ~100 lines: Region switching, pagination, charts rendering
          search.js                    # ~120 lines: Search results rendering, category filters
          playlists.js                 # ~170 lines: Playlist creation, detail modal, add/remove songs
          library.js                   # ~180 lines: Offline songs rendering, sorting, pagination
          player_ui.js                 # ~110 lines: Fullscreen modal, mini player, lookahead UI
          visualizer.js                # ~40 lines: Real-time frequency equalizer visualizer
          toast.js                     # ~30 lines: Toast banner notifications
          auth_modal.js                # ~50 lines: Google login & cookie dialog UI
          favorites.js                 # ~40 lines: Toggle favorites & storage synchronization
        app.js                         # ~90 lines: DOMContentLoaded initialization bootstrap
tools/
  generate_icons.py                    # ~55 lines: Android mipmap icon generator using Pillow
  fetch_real_charts.js                 # ~120 lines: Tooling script for InnerTube charts fetching
scripts/
  build.sh                             # ~25 lines: Standalone web distribution packaging
  build_apk.sh                         # ~120 lines: Main APK orchestrator
  compile_res.sh                       # ~30 lines: AAPT2 compile and link
  compile_java.sh                      # ~30 lines: Javac compilation of all Java classes
  dex.sh                               # ~25 lines: D8 DEX bytecode generation
  sign_apk.sh                          # ~30 lines: Zipalign and apksigner
  preview.sh                           # ~25 lines: Local web preview server
tests/
  cache_test.js                        # ~97 lines: Standalone LRU cache engine unit test
  comprehensive_test.js                # ~1,363 lines: 13-suite automated test runner
REFACTOR_NOTES.md                      # Code notes, function checklist, preserved quirks
REFACTOR_PLAN.md                       # This plan document
```

---

## Detailed Module Breakdown

### 1. Java Native Layer

#### `MainActivity.java` (`com.soko.music`)
- **Responsibility**: Android Activity lifecycle (`onCreate`, `onDestroy`), window flags (dark theme, immersive styling), and WebView initialization.
- **Dependencies**: Composes `AudioEngine`, `AudioFocusManager`, `NoisyAudioReceiver`, `MediaNotificationManager`, `DiskCacheManager`, `TrackDownloader`, and `SokoNativeBridge`.
- **Target Size**: ~120 lines.

#### `bridge/SokoNativeBridge.java`
- **Responsibility**: Unified facade registered via `webView.addJavascriptInterface(..., "SokoNative")`.
- **Methods**: Implements all 23 `@JavascriptInterface` methods by delegating to domain-specific bridges:
  - Delegates playback to `PlayerBridge`
  - Delegates storage and downloads to `StorageBridge`
  - Delegates auth and InnerTube calls to `AuthBridge`
  - Delegates beacon pings to `TelemetryBridge`
- **Target Size**: ~120 lines.

#### `bridge/PlayerBridge.java`
- **Responsibility**: `@JavascriptInterface` playback control endpoints: `playAudio`, `pauseAudio`, `stopAudio`, `resumeAudio`, `seekAudio`, `setActivePlaybackId`, `getActivePlaybackId`, `updateNativePlayer`.
- **Target Size**: ~70 lines.

#### `bridge/StorageBridge.java`
- **Responsibility**: `@JavascriptInterface` storage and download endpoints: `downloadTrack`, `downloadAndPlayTrack`, `isTrackDownloaded`, `getDownloadedTrackPath`, `deleteDownloadedTrack`, `clearAllDownloadedTracks`, `getDiskStorageUsedBytes`.
- **Target Size**: ~90 lines.

#### `bridge/AuthBridge.java`
- **Responsibility**: `@JavascriptInterface` auth endpoints: `launchGoogleLogin`, `startGoogleLoginFlow`, `fetchYtmApi`, `getStoredYtmCookies`, `clearStoredYtmCookies`.
- **Target Size**: ~75 lines.

#### `bridge/TelemetryBridge.java`
- **Responsibility**: `@JavascriptInterface` telemetry ping: `sendTelemetryPing`.
- **Target Size**: ~30 lines.

#### `audio/AudioEngine.java`
- **Responsibility**: Manages `MediaPlayer` instance, AudioAttributes, async/sync preparation, start, stop, pause, seek, audio progress runnable (posting to `window.onNativePlayerProgress`), completion listener (`window.onNativeTrackEnded`), and error listener (`window.onNativePlaybackError`).
- **Target Size**: ~160 lines.

#### `audio/AudioFocusManager.java`
- **Responsibility**: Wraps `AudioManager.requestAudioFocus` and `abandonAudioFocus` with `OnAudioFocusChangeListener` notifying WebView (`window.onNativeAudioFocusLost`).
- **Target Size**: ~50 lines.

#### `audio/NoisyAudioReceiver.java`
- **Responsibility**: Listens for `AudioManager.ACTION_AUDIO_BECOMING_NOISY` and evaluates `window.handleBecomingNoisy()`.
- **Target Size**: ~30 lines.

#### `audio/MediaNotificationManager.java`
- **Responsibility**: Manages Android `MediaSession` (callbacks: `onPlay`, `onPause`, `onSkipToNext`, `onSkipToPrevious`), NotificationChannel (`soko_music_playback`), media action broadcast receiver (`ACTION_TOGGLE`, `ACTION_NEXT`, `ACTION_PREV`), and lock screen media style notifications.
- **Target Size**: ~140 lines.

#### `cache/TrackDownloader.java`
- **Responsibility**: Resolves InnerTube `/player` streaming endpoint for a video ID, streams Opus/audio packets to disk, posts progress events `window.onNativeDownloadProgress`, and completion `window.onNativeDownloadComplete`.
- **Target Size**: ~250 lines.

#### `cache/DiskCacheManager.java`
- **Responsibility**: Manages files under `getFilesDir()/music/`, calculates total disk storage bytes used, handles single and bulk deletions.
- **Target Size**: ~110 lines.

#### `util/CryptoUtil.java`
- **Responsibility**: Generates SAPISIDHASH (`epoch_time + " " + sapisid + " " + origin`) with SHA-1 hex digest.
- **Target Size**: ~40 lines.

#### `util/HttpUtil.java`
- **Responsibility**: Background HTTP execution for InnerTube calls, header injection (`X-YouTube-Client-Name`, `X-Goog-Visitor-Id`, `Authorization`), visitor data and STS caching.
- **Target Size**: ~120 lines.

---

### 2. Frontend CSS Layer

1. `css/tokens.css` (~25 lines): `:root` CSS custom properties (colors, safe areas, layout heights, border radiuses).
2. `css/base.css` (~65 lines): Reset, zero-width scrollbar suppression, fixed body, `modal-open` viewport lock.
3. `css/layout.css` (~120 lines): `.app-viewport`, `.top-header`, `.content-scroll`, `.tab-pane` containers.
4. `css/animations.css` (~50 lines): Keyframe definitions (`pulse`, `fadeIn`, `spin`, `slideUp`, `dialogPop`).
5. `css/components/`:
   - `header.css` (~90 lines): Header logo, auth status badge, action icon buttons.
   - `shelves.css` (~290 lines): Shelves header, 4-row horizontal scrolling grid shelf, line-like cards.
   - `library.css` (~240 lines): Track list rows, rank badges, library sort bar, filter pills.
   - `ptr.css` (~80 lines): Native swipe-down pull-to-refresh spinner, rotation, arrow.
   - `search.css` (~165 lines): Responsive search input, search track cards, floating download progress banner.
   - `playlists.css` (~85 lines): 2-column playlist card grid, playlist detail view, storage meter card.
   - `miniplayer.css` (~100 lines): Mini bottom player dock, progress strip, play/pause toggle.
   - `player.css` (~210 lines): Fullscreen now playing modal sheet, hero art, seek slider, playback buttons, equalizer bars.
   - `navigation.css` (~45 lines): Fixed bottom navigation bar with 4 tabs and active indicators.
   - `settings.css` (~70 lines): Settings options, cache quota selector, clear cache action.
   - `modal.css` (~40 lines): Dialog backdrops, playlist creation modal, add-to-playlist picker.
   - `toast.css` (~35 lines): Global floating toast notification.

---

### 3. Frontend JavaScript Layer & Dependency Graph

WebView loads via `file:///android_asset/index.html`. ES modules over `file://` encounter security restrictions in WebViews; hence, **classic script tags in strict dependency order** are used.

All symbols are bound directly to `window` (and optionally namespaced under `window.Soko`) to ensure 100% interoperability with inline HTML `onclick` handlers, Java bridge `evaluateJavascript` calls, and the Node test runner sandbox.

#### Script Loading Order in `index.html`:

```html
<!-- Layer 1: Configuration & Static Data (no dependencies) -->
<script src="js/config/constants.js"></script>
<script src="js/config/catalog.js"></script>
<script src="js/data/charts_global.js"></script>
<script src="js/data/charts_global_2.js"></script>
<script src="js/data/charts_india.js"></script>
<script src="js/data/charts_india_2.js"></script>
<script src="js/data/charts_us.js"></script>
<script src="js/data/charts_us_2.js"></script>
<script src="js/data/charts_uk.js"></script>
<script src="js/data/charts_uk_2.js"></script>
<script src="js/data/regional_charts.js"></script>

<!-- Layer 2: Pure Utilities (depends on constants) -->
<script src="js/utils/duration.js"></script>
<script src="js/utils/text.js"></script>
<script src="js/utils/filter.js"></script>
<script src="js/utils/crypto.js"></script>

<!-- Layer 3: State & Storage (depends on config, utils) -->
<script src="js/state/store.js"></script>
<script src="js/state/storage.js"></script>

<!-- Layer 4: Cache & Downloader (depends on state, storage) -->
<script src="js/cache/lru_cache.js"></script>
<script src="js/cache/downloader.js"></script>

<!-- Layer 5: InnerTube API Clients (depends on state, utils, config) -->
<script src="js/api/innertube.js"></script>
<script src="js/api/browse.js"></script>
<script src="js/api/search.js"></script>
<script src="js/api/radio.js"></script>
<script src="js/api/auth.js"></script>

<!-- Layer 6: Audio & Playback Engines (depends on state, cache, api) -->
<script src="js/player/telemetry.js"></script>
<script src="js/player/mediasession.js"></script>
<script src="js/player/yt_iframe.js"></script>
<script src="js/player/audio_engine.js"></script>
<script src="js/player/native_audio_listener.js"></script>

<!-- Layer 7: UI Components & Gestures (depends on player, state, api) -->
<script src="js/ui/toast.js"></script>
<script src="js/ui/visualizer.js"></script>
<script src="js/ui/favorites.js"></script>
<script src="js/ui/player_ui.js"></script>
<script src="js/ui/navigation.js"></script>
<script src="js/ui/auth_modal.js"></script>
<script src="js/ui/gestures/pull_to_refresh.js"></script>
<script src="js/ui/home.js"></script>
<script src="js/ui/charts.js"></script>
<script src="js/ui/search.js"></script>
<script src="js/ui/playlists.js"></script>
<script src="js/ui/library.js"></script>

<!-- Layer 8: Bootstrap (initializes everything on DOM ready) -->
<script src="js/app.js"></script>
```

---

## Step-by-Step Incremental Execution Plan

Each step is completely self-contained. After each step, `npm test` and `./scripts/build_apk.sh` are run. A git commit is created upon success before moving to the next step.

### Step 0: Baseline Verification & Baseline Commit
- Commit existing working baseline: `chore: establish clean working baseline before refactoring`.
- Confirm tests pass (204/204) and APK builds without errors.

### Step 1: Java Extraction & Modularization
- Create `app/src/main/java/com/soko/music/`:
  - `audio/AudioEngine.java`, `audio/AudioFocusManager.java`, `audio/NoisyAudioReceiver.java`, `audio/MediaNotificationManager.java`
  - `cache/TrackDownloader.java`, `cache/DiskCacheManager.java`
  - `util/CryptoUtil.java`, `util/HttpUtil.java`
  - `bridge/PlayerBridge.java`, `bridge/StorageBridge.java`, `bridge/AuthBridge.java`, `bridge/TelemetryBridge.java`, `bridge/SokoNativeBridge.java`
  - `MainActivity.java`
- Create `app/src/main/res/` and copy strings, styles, mipmaps.
- Create `app/src/main/AndroidManifest.xml`.
- Update `scripts/build_apk.sh` to compile source `.java` files from `app/src/main/java/`.
- **Verification**: Run `npm test` and `bash scripts/build_apk.sh`.
- **Git Commit**: `refactor(native): extract Java monolith into modular domain packages and bridges`.

### Step 2: CSS Modularization
- Create `app/src/main/assets/css/` directory.
- Extract `tokens.css`, `base.css`, `layout.css`, `animations.css`.
- Extract component stylesheets into `css/components/`: `header.css`, `shelves.css`, `library.css`, `ptr.css`, `search.css`, `playlists.css`, `miniplayer.css`, `player.css`, `navigation.css`, `settings.css`, `modal.css`, `toast.css`.
- Update `apps/mobile/index.html` to link to these external stylesheets and remove the inline `<style>` block.
- **Verification**: Run `npm test` and `bash scripts/build_apk.sh`.
- **Git Commit**: `refactor(css): split monolithic styles into design tokens, layout, and component stylesheets`.

### Step 3: Config, Data, and Utility JavaScript Extraction
- Create `app/src/main/assets/js/config/`, `js/data/`, `js/utils/`.
- Extract `constants.js`, `catalog.js`, `charts_*.js`, `regional_charts.js`.
- Extract `duration.js`, `text.js`, `filter.js`, `crypto.js`.
- Replace corresponding lines in `index.html` with `<script src="...">` tags.
- Update test runner script loader if needed to evaluate included `<script>` files in order.
- **Verification**: Run `npm test` and `bash scripts/build_apk.sh`.
- **Git Commit**: `refactor(js): extract config constants, regional charts data, and utility functions`.

### Step 4: State and Cache Modules Extraction
- Create `app/src/main/assets/js/state/` and `js/cache/`.
- Extract `store.js`, `storage.js`.
- Extract `lru_cache.js`, `downloader.js`.
- Replace corresponding lines in `index.html` with `<script src="...">` tags.
- **Verification**: Run `npm test` and `bash scripts/build_apk.sh`.
- **Git Commit**: `refactor(js): extract reactive state store, persistent storage, LRU cache, and downloader`.

### Step 5: API & InnerTube Clients Extraction
- Create `app/src/main/assets/js/api/`.
- Extract `innertube.js`, `browse.js`, `search.js`, `radio.js`, `auth.js`.
- Replace corresponding lines in `index.html` with `<script src="...">` tags.
- **Verification**: Run `npm test` and `bash scripts/build_apk.sh`.
- **Git Commit**: `refactor(js): extract InnerTube API clients for browse, search, radio, and auth`.

### Step 6: Player, Audio Engine, and Telemetry Extraction
- Create `app/src/main/assets/js/player/`.
- Extract `yt_iframe.js`, `audio_engine.js`, `native_audio_listener.js`, `mediasession.js`, `telemetry.js`.
- Replace corresponding lines in `index.html` with `<script src="...">` tags.
- **Verification**: Run `npm test` and `bash scripts/build_apk.sh`.
- **Git Commit**: `refactor(js): extract audio engine, online IFrame player, media session, and telemetry`.

### Step 7: UI Screens, Components, and Touch Gestures Extraction
- Create `app/src/main/assets/js/ui/` and `js/ui/gestures/`.
- Extract `toast.js`, `visualizer.js`, `favorites.js`, `player_ui.js`, `navigation.js`, `auth_modal.js`, `pull_to_refresh.js`, `home.js`, `charts.js`, `search.js`, `playlists.js`, `library.js`.
- Replace corresponding lines in `index.html` with `<script src="...">` tags.
- **Verification**: Run `npm test` and `bash scripts/build_apk.sh`.
- **Git Commit**: `refactor(js): extract UI screens, components, and pull-to-refresh gestures`.

### Step 8: App Bootstrap & Target Directory Finalization
- Extract `app.js` (DOMContentLoaded and global lifecycle bindings).
- Organize `app/src/main/assets/` as the canonical web asset location with bundled assets and audio.
- Update `scripts/build.sh`, `scripts/build_apk.sh`, and `package.json`.
- Organize build stages in `scripts/`: `compile_res.sh`, `compile_java.sh`, `dex.sh`, `sign_apk.sh`.
- Move icon generation tool to `tools/generate_icons.py`.
- Ensure `tests/comprehensive_test.js` resolves scripts dynamically from `app/src/main/assets/index.html`.
- **Verification**: Run `npm test` and `bash scripts/build_apk.sh`.
- **Git Commit**: `refactor(structure): finalize clean directory hierarchy and modular build stages`.

### Step 9: Final Verification, Checklists & Line Count Audit
- Run full test suite: 204 assertions pass with 0 failures.
- Run APK build: signed APK produced and verified.
- Confirm every single file in the project is <= 300 lines (soft ceiling <= 400 lines).
- Verify all 135 JS functions and 23 Java bridge methods exist verbatim.
- Grep verify all shared strings (DOM IDs, storage keys, bridge methods).
- Document before/after line counts in `REFACTOR_NOTES.md`.

---

## Verification Criteria Checklist

- [ ] `npm test` passes 100% of tests (all 204 tests in `comprehensive_test.js` + 2 tests in `cache_test.js`).
- [ ] `bash scripts/build_apk.sh` produces a signed APK that passes `apksigner verify`.
- [ ] Every file in `app/src/main/` is under ~300 lines (soft limit 400 lines).
- [ ] No public APIs, JavascriptInterface method names, localStorage keys, or DOM IDs changed.
- [ ] No circular dependencies in JavaScript modules.
- [ ] Script load order explicitly documented in `index.html`.
- [ ] Git history reflects incremental atomic commits with clear messages.
