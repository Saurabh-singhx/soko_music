# Production Readiness & Architecture Specification

## Soko Music Mobile: Standalone Offline-First Architecture

---

### 1. Performance SLAs & Metrics

| Operation | Target SLA | Strategy & Implementation |
| :--- | :--- | :--- |
| **In-Memory Cache Check** | `< 0.05 ms` | O(1) `Set<String>` lookup on 11-char video IDs prior to any I/O. |
| **Duration & Podcast Filter** | `< 1 ms` | Synchronous regex, badge & timestamp parsing before feed/queue insertion. |
| **Cached Track Playback** | `< 50 ms` | Direct `file://` or Local Blob playback into audio subsystem. |
| **Look-Ahead Pre-download** | Background | Initiated 15s after current track starts; completes before track ends. |
| **Search Debounce Delay** | `400 ms` | Prevents burst API polling to remote servers. |
| **Storage Eviction Run** | `< 100 ms` | Triggered when free cache margin drops below 10% of configured ceiling. |
| **UI Frame Budget** | `60 fps (16.6ms)` | CSS GPU-accelerated transforms (`translate3d`, `will-change`) for visualizers. |

---

### 2. Network & Anti-Abuse Hardening

- **Client Identity**: The app communicates using the official `ANDROID_MUSIC` (version `6.40.52`, SDK 34) persona, which receives unthrottled format 251 Opus streams.
- **Session Continuity**: `visitorData` and `VISITOR_INFO1_LIVE` cookies are generated on first launch and persisted across application restarts.
- **Rate-Limiting Safeguards**:
  - Maximum 1 active download worker at any time.
  - Maximum 2 songs queued in the look-ahead pipeline.
  - Automatic exponential backoff on HTTP 429/503 responses (`1.5s`, `3.0s`, `6.0s`).

---

### 3. Storage Hierarchy & Safety Invariants

```
App Sandboxed Storage
├── /files/music/                   (Read-Write; 0 permissions required)
│   ├── [11-char-id].m4a            (High-fidelity 160 kbps Opus/AAC stream)
│   └── [11-char-id].jpg            (512x512 JPEG album artwork)
└── /databases/
    ├── music.db                    (SQLite / IndexedDB metadata registry)
    └── preferences.json            (User preferences, cache limits, equalizer)
```

- **Invariance 1**: User favorited or explicit playlist songs have `is_favorite = 1` and are exempt from LRU cleanup.
- **Invariance 2**: Incomplete downloads write to `.part` files; only renamed upon 100% byte verification and duration check.
- **Invariance 3**: Storage ceiling defaults to 4.0 GB (configurable up to 20 GB).
- **Invariance 4**: Tracks exceeding 600s (10 min) or flagged as podcasts are barred from local disk caching in both WebView and Android native bridge layers.

---

### 4. UI/UX & Responsive Ergonomics Audit

- **Touch Ergonomics**: All interactable buttons, scrubbing sliders, and navigation tabs adhere to $\ge 48\times 48\text{px}$ touch targets.
- **Safe Area Insets**:
  - Top headers clear notch/punch-hole: `padding-top: max(env(safe-area-inset-top), 16px)`.
  - Bottom docks clear home gesture pill: `padding-bottom: calc(72px + env(safe-area-inset-bottom))`.
- **Narrow Viewport Resilience**: Tested and audited for compact 360px Android devices (no horizontal clipping or text overflow).

---

### 5. Repository Directory Architecture

The codebase enforces a scalable, clean layout separating client applications, native Android assets, build tools, and test suites:

```
soko-music-app/
├── apps/
│   ├── mobile/             # Monolithic standalone mobile web application (index.html)
│   └── android/            # Android packaging resources (res/) and release keystore
├── assets/                 # Brand SVG/PNG logos, regional charts JSON, bundled audio
├── dist/                   # Production distribution (standalone index.html & soko-music.apk)
├── docs/                   # Architectural blueprints and verified screenshots
│   ├── architecture/       # Deep-dive specs (01 to 06)
│   └── screenshots/        # Categorized visual test evidence (audits, brand, device, ui)
├── scripts/                # Build runners, preview server, and helper tools
│   └── tools/              # Chart fetchers and HTML bundler
└── tests/                  # Unit and full comprehensive regression suites (204 tests)
```

---

### 6. Production Quality Gates & Verification

Before cutting a release build:
1. **Automated Regression Suite**:
   ```bash
   npm test
   # Must exit code 0 with 204/204 passing tests across 13 test suites.
   ```
2. **Web Distribution Bundle**:
   ```bash
   npm run build
   # Generates standalone dist/index.html with all assets linked.
   ```
3. **Android APK Compilation & Signing**:
   ```bash
   npm run build:apk
   # Zero-Gradle toolchain (AAPT2 -> Javac -> D8 -> Zipalign -> Apksigner)
   # Emits signed production release at dist/soko-music.apk.
   ```
