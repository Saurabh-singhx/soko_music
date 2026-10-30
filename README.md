# 🎵 Soko Music Mobile (Offline-First Audio & Cache Architecture)

> **Experimental Mobile Media Engine & Predictive Cache Architecture**: Engineered with a **Client-Side Look-Ahead Caching Pipeline** designed to study zero-latency audio playback, in-memory stream deduplication, smart content duration filtering (excluding podcasts and tracks > 10 min), and resilient local storage management for modern web and hybrid mobile platforms.

---

## 🌟 Key Architectural Highlights

1. **Standalone Hybrid Architecture**:
   - Zero external proxy or workstation dependency. Dynamic feed parsing, client-side caching, and DSP audio offload occur natively within the client environment.
2. **Predictive Look-Ahead Cache Pipeline**:
   - **Track 1**: Instant playback via direct stream or local cache.
   - **Track 2+ (Up-Next Queue)**: While Track 1 plays, a background worker pre-fetches upcoming queue items to local cache for 0ms gapless track transitions.
3. **Smart Content Filtering Engine (10-Minute & Podcast Exclusion)**:
   - Enforces a 600-second (10-minute) ceiling across the ingestion and cache pipeline to preserve device storage and mobile bandwidth.
   - Automatically filters out talk shows, podcasts, full episodes, and long audio mixes from Browse Shelves, Search, and Radio Queues.
4. **Sub-Millisecond O(1) In-Memory Deduplication**:
   - Indexed by immutable 11-character content identifiers.
   - Rapid `< 0.05ms` `Set` lookup verifies local cache availability before initiating network calls, saving mobile data.
5. **Dynamic Discovery Feeds**:
   - **Home & Quick Picks**: Algorithmic horizontal line-cards and carousels.
   - **Top 100 Charts & Trending**: Real-time country-localized hits for Global, India, US, and UK.
   - **Dynamic Radio**: Continuous algorithmic recommendations and mood-matched stations.
6. **Smart Local Storage & LRU Eviction**:
   - Multi-tiered storage: Binary audio in app-sandboxed directories, metadata in SQLite/IndexedDB.
   - Automatic LRU cache pruning respecting user-configured storage limits while permanently protecting favorites.
7. **Production Glassmorphic UI/UX**:
   - Safe-area inset adaptation (`env(safe-area-inset-top)` / `bottom`).
   - Ergonomic $\ge 48\times 48\text{px}$ touch targets within thumb reach zones.
   - Live soundwave visualizer, MediaSession lock-screen controls, and pull-to-refresh feed hydration.

---

## 📂 Project Directory Structure

```
soko-music-app/
├── .gitignore                                 # Clean gitignore for builds, dex, and caches
├── package.json                               # npm scripts (test, build, build:apk, preview)
├── README.md                                  # Human-readable master overview & quick start
├── apps/
│   ├── mobile/                                # Mobile Web / PWA Single-Page Application
│   │   ├── index.html                         # Core client application & UI
│   │   └── assets -> ../../assets             # Symlink to shared assets
│   └── android/                               # Android native platform assets
│       ├── res/                               # Android launcher mipmaps & drawables
│       │   ├── drawable/
│       │   ├── mipmap-mdpi/
│       │   ├── mipmap-hdpi/
│       │   ├── mipmap-xhdpi/
│       │   ├── mipmap-xxhdpi/
│       │   └── mipmap-xxxhdpi/
│       └── keystore/                          # Release signing keystore
│           └── soko_music.keystore
├── assets/                                    # Static assets & brand graphics
│   ├── logo.svg                               # Brand vector logo
│   ├── logo.png                               # Brand raster icon
│   └── icon.png                               # Launcher icon
├── dist/                                      # Packaged production distribution outputs
│   ├── index.html                             # Compiled standalone web bundle
│   ├── assets/                                # Bundled static assets
│   └── soko-music.apk                         # Signed release Android APK
├── docs/                                      # Technical architecture & specifications
│   ├── ARCHITECTURE.md                        # Master architectural design & telemetry loop
│   ├── PRODUCTION_READINESS.md                # SLAs, verification checklist & invariants
│   ├── architecture/                          # Architectural modules
│   │   ├── 01-offline-first-pipeline.md       # Pre-fetching queue & zero-gap handoff
│   │   ├── 02-innertube-feed-and-recommendation.md # InnerTube endpoints, radios & feeds
│   │   ├── 03-storage-and-sqlite-schema.md    # Multi-tier storage & LRU cache eviction
│   │   ├── 04-audio-and-playback-engine.md    # Playback extraction & dual-audio immunity
│   │   ├── 05-ui-ux-design-system.md          # Design tokens & touch ergonomics
│   │   └── 06-content-filtering-and-podcast-exclusion.md # 10-minute ceiling & podcast exclusion
│   └── screenshots/                           # Curated visual verification assets
├── scripts/                                   # Build automation & utility toolchain
│   ├── build.sh                               # Packages web distribution into dist/
│   ├── build_apk.sh                           # Compiles, zipaligns & signs release APK
│   ├── generate_icons.py                      # Generates multi-density Android launcher icons
│   ├── preview.sh                             # Multi-device mobile viewport auditor
│   └── tools/                                 # Offline tools & charts fetchers
│       └── fetch_real_charts.js               # Fetches dynamic regional chart data
└── tests/                                     # Automated test suites
    ├── cache_test.js                          # In-memory O(1) deduplication & LRU unit tests
    └── comprehensive_test.js                  # Comprehensive verification test suite
```

---

## ⚡ Predictive Look-Ahead Cache Flow

```mermaid
sequenceDiagram
    autonumber
    actor User as User on Mobile Phone
    participant UI as Mobile UI / Player
    participant Filter as Content Filter Engine
    participant Cache as In-Memory Cache Registry (O(1))
    participant Disk as Local App Storage (Flash)
    participant Worker as Background Look-Ahead Worker
    participant Cloud as Cloud Media Service (InnerTube)

    User->>UI: Selects track
    UI->>Filter: Check duration <= 600s & not podcast
    alt Content is Podcast or > 10 min
        Filter-->>UI: Content flagged (Excluded from offline downloads)
        UI->>Cloud: Streams directly via online player (No local flash bloat)
    else Content is Eligible (<= 10 min song)
        UI->>Cache: Check if track exists locally (< 0.05ms)
        alt Cache HIT (Already Downloaded)
            Cache-->>UI: Returns local path (/files/music/[id].opus)
            UI->>Disk: Plays immediately from local storage (0ms latency)
        else Cache MISS (New Track)
            UI->>Cloud: Fetch direct audio stream URL
            Cloud-->>UI: Returns media CDN stream
            UI->>Disk: Downloads & caches audio to local storage
            UI->>Cache: Registers track in memory Set & SQLite
            UI->>Disk: Plays local file
        end

        Note over UI,Worker: Seamless Background Look-Ahead Initiated
        UI->>Cloud: Query next recommendations (RDAMVM<id>)
        Cloud-->>Worker: Returns upcoming tracks
        Worker->>Filter: Verify next track <= 10 min & not podcast
        Worker->>Disk: Pre-downloads next song quietly in background
        Worker->>Cache: Registers next song as cached
    end
```

---

## 🚀 Quick Start & Development

### 1. Run Automated Tests
```bash
# Run entire test suite (204 automated tests)
npm test

# Run unit cache tests only
npm run test:unit

# Run full comprehensive verification suite
npm run test:comprehensive
```

### 2. Build Web Distribution Package
```bash
npm run build
# Outputs to dist/
```

### 3. Build Signed Android APK
```bash
npm run build:apk
# Compiles, zipaligns, signs with persistent keystore -> dist/soko-music.apk
```

### 4. Local Mobile Preview
```bash
npm run preview
```

---

## 📚 Technical Documentation Directory

- [Master Architecture & Telemetry Loop](docs/ARCHITECTURE.md)
- [Production Readiness & Performance SLAs](docs/PRODUCTION_READINESS.md)
- [Module 1: Offline-First Pipeline](docs/architecture/01-offline-first-pipeline.md)
- [Module 2: InnerTube Feeds & Recommendation](docs/architecture/02-innertube-feed-and-recommendation.md)
- [Module 3: Storage & SQLite Schema](docs/architecture/03-storage-and-sqlite-schema.md)
- [Module 4: Audio Playback Engine & Dual-Audio Immunity](docs/architecture/04-audio-and-playback-engine.md)
- [Module 5: Mobile UI/UX Design System](docs/architecture/05-ui-ux-design-system.md)
- [Module 6: Content Filtering & Podcast Exclusion](docs/architecture/06-content-filtering-and-podcast-exclusion.md)

---

## ⚖️ Legal Disclaimer & Trademark Notice

> [!IMPORTANT]
> **Educational & Research Purpose Only**:
> Soko Music is an independent open-source software project developed exclusively for research, personal study, and educational experimentation in mobile web app engineering, client-side predictive cache algorithms, and zero-latency audio buffer management.
>
> **Trademark Attribution**:
> - "YouTube", "YouTube Music", and related marks, brand names, and logos are registered trademarks of **Google LLC** and **Alphabet Inc.**
> - Soko Music is **not** affiliated with, authorized by, sponsored by, maintained by, or in any way associated with Google LLC, YouTube, Alphabet Inc., or any of their subsidiaries or affiliates.
>
> **Copyright & Content Rights**:
> - This software repository does **not** host, store, bundle, re-license, or redistribute any copyrighted audio files, video files, or proprietary media content.
> - The application acts purely as an extensible user-side player client.
> - End users are solely responsible for ensuring that their access, usage, and any content streamed or cached via this software complies with applicable copyright laws, intellectual property rights, and third-party terms of service in their respective jurisdictions.

---

## 📜 License
This project is licensed under the [MIT License](LICENSE) - see the LICENSE file for details.
