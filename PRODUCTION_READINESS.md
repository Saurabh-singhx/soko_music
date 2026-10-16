# Production Readiness & Architecture Specification

## Soko Music Mobile: Standalone Offline-First Architecture

---

### 1. Performance SLAs & Metrics

| Operation | Target SLA | Strategy & Implementation |
| :--- | :--- | :--- |
| **In-Memory Cache Check** | `< 0.05 ms` | O(1) `Set<String>` lookup on 11-char video IDs prior to any I/O. |
| **Cached Track Playback** | `< 50 ms` | Direct `file://` or Local Blob playback into audio subsystem. |
| **Look-Ahead Pre-download** | Background | Initiated 15s after current track starts; completes before track ends. |
| **Search Debounce Delay** | `400 ms` | Prevents burst API polling to YouTube servers. |
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
│   ├── [11-char-id].opus           (High-fidelity 160 kbps Opus stream)
│   └── [11-char-id].jpg            (512x512 JPEG album artwork)
└── /databases/
    ├── music.db                    (SQLite / IndexedDB metadata registry)
    └── preferences.json            (User preferences, cache limits, equalizer)
```

- **Invariance 1**: User favorited or explicit playlist songs have `is_favorite = 1` and are exempt from LRU cleanup.
- **Invariance 2**: Incomplete downloads write to `.part` files; only renamed to `.opus` upon 100% SHA/byte completion verification.
- **Invariance 3**: Storage ceiling defaults to 4.0 GB (configurable up to 20 GB).

---

### 4. UI/UX & Responsive Ergonomics Audit

- **Touch Ergonomics**: All interactable buttons, scrubbing sliders, and navigation tabs adhere to $\ge 48\times 48\text{px}$ touch targets.
- **Safe Area Insets**:
  - Top headers clear notch/punch-hole: `padding-top: max(env(safe-area-inset-top), 16px)`.
  - Bottom docks clear home gesture pill: `padding-bottom: calc(72px + env(safe-area-inset-bottom))`.
- **Narrow Viewport Resilience**: Tested and audited for compact 360px Android devices (no horizontal clipping or text overflow).
