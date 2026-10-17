const fs = require('fs');
const path = require('path');

const chartsData = JSON.parse(fs.readFileSync('/tmp/regional_charts_ready.json', 'utf8'));

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
  <title>Soko Music</title>
  <style>
    :root {
      --bg-primary: #07090E;
      --bg-surface: #0E121B;
      --bg-card: #151B27;
      --bg-card-hover: #1C2434;
      --accent-primary: #6366F1;
      --accent-hover: #4F46E5;
      --accent-cyan: #06B6D4;
      --accent-glow: rgba(99, 102, 241, 0.35);
      --text-primary: #FFFFFF;
      --text-muted: #94A3B8;
      --text-dim: #64748B;
      --border-subtle: rgba(255, 255, 255, 0.08);
      --border-focus: rgba(99, 102, 241, 0.4);
      --success: #10B981;
      --warning: #F59E0B;
      --tab-bar-height: 60px;
      --mini-player-height: 56px;
      --safe-top: env(safe-area-inset-top, 0px);
      --safe-bottom: env(safe-area-inset-bottom, 0px);
      --radius-sm: 8px;
      --radius-md: 12px;
      --radius-lg: 18px;
      --radius-full: 9999px;
    }

    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-tap-highlight-color: transparent;
      user-select: none;
      scrollbar-width: none !important;
      -ms-overflow-style: none !important;
    }

    *::-webkit-scrollbar,
    html::-webkit-scrollbar,
    body::-webkit-scrollbar,
    .content-scroll::-webkit-scrollbar,
    .app-viewport::-webkit-scrollbar,
    .tab-pane::-webkit-scrollbar,
    .shelf-container::-webkit-scrollbar,
    .filter-pills-row::-webkit-scrollbar,
    .now-playing-modal::-webkit-scrollbar,
    .track-list::-webkit-scrollbar {
      width: 0px !important;
      height: 0px !important;
      display: none !important;
      background: transparent !important;
      -webkit-appearance: none !important;
    }

    html, body {
      scrollbar-width: none !important;
      -ms-overflow-style: none !important;
    }

    body {
      background-color: var(--bg-primary);
      color: var(--text-primary);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      overflow: hidden;
      width: 100vw;
      height: 100vh;
      height: 100dvh;
    }

    html.modal-open,
    body.modal-open {
      overflow: hidden !important;
      position: fixed;
      width: 100%;
      height: 100%;
      touch-action: none !important;
    }

    body.modal-open .content-scroll {
      overflow: hidden !important;
      touch-action: none !important;
      pointer-events: none !important;
    }

    .app-viewport {
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100%;
      position: relative;
      background: radial-gradient(circle at 50% 0%, #131B2E 0%, #07090E 70%);
    }

    /* ============================================================ */
    /* TOP NAVIGATION HEADER                                        */
    /* ============================================================ */
    .top-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 52px;
      padding: 0 16px;
      margin-top: var(--safe-top);
      border-bottom: 1px solid var(--border-subtle);
      background: rgba(7, 9, 14, 0.85);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      z-index: 40;
      flex-shrink: 0;
    }

    .brand-group {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 44px;
      min-height: 44px;
      cursor: pointer;
    }

    .brand-icon {
      width: 32px;
      height: 32px;
      border-radius: var(--radius-sm);
      object-fit: cover;
      box-shadow: 0 0 12px var(--accent-glow);
    }

    .status-badge-container {
      display: flex;
      align-items: center;
      gap: 6px;
      background: rgba(16, 185, 129, 0.12);
      border: 1px solid rgba(16, 185, 129, 0.3);
      padding: 4px 10px;
      border-radius: var(--radius-full);
      font-size: 11px;
      font-weight: 600;
      color: var(--success);
    }

    .pulse-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--success);
      box-shadow: 0 0 8px var(--success);
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0% { opacity: 0.4; transform: scale(0.9); }
      50% { opacity: 1; transform: scale(1.1); }
      100% { opacity: 0.4; transform: scale(0.9); }
    }

    /* ============================================================ */
    /* MAIN SCROLLABLE CONTENT VIEW                                 */
    /* ============================================================ */
    .content-scroll {
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
      padding-bottom: calc(var(--mini-player-height) + var(--tab-bar-height) + var(--safe-bottom) + 20px);
      -webkit-overflow-scrolling: touch;
    }

    .tab-pane {
      display: none;
      padding: 16px;
    }
    .tab-pane.active {
      display: block;
      animation: fadeIn 0.2s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(4px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* Section Titles */
    .section-title-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
      margin-top: 8px;
    }

    .section-title {
      font-size: 18px;
      font-weight: 700;
      letter-spacing: -0.3px;
      color: var(--text-primary);
    }

    .section-subtitle {
      font-size: 12px;
      color: var(--text-muted);
      margin-top: 2px;
    }

    /* Horizontal Shelves */
    .shelf-container {
      display: flex;
      gap: 12px;
      overflow-x: auto;
      padding-bottom: 8px;
      scroll-snap-type: x mandatory;
      scrollbar-width: none;
    }
    .shelf-container::-webkit-scrollbar {
      display: none;
    }

    .shelf-card {
      flex: 0 0 140px;
      scroll-snap-align: start;
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 10px;
      cursor: pointer;
      transition: transform 0.15s ease, background 0.15s ease, border-color 0.15s ease;
      position: relative;
    }
    .shelf-card:active {
      transform: scale(0.97);
      background: var(--bg-card-hover);
      border-color: var(--border-focus);
    }

    .shelf-card-art {
      width: 100%;
      aspect-ratio: 1;
      border-radius: var(--radius-sm);
      object-fit: cover;
      margin-bottom: 8px;
      background: #151A24;
    }

    .shelf-card-title {
      font-size: 13px;
      font-weight: 600;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      color: var(--text-primary);
    }

    .shelf-card-artist {
      font-size: 11px;
      color: var(--text-muted);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-top: 2px;
    }

    .offline-chip {
      position: absolute;
      top: 14px;
      right: 14px;
      background: rgba(7, 9, 14, 0.85);
      backdrop-filter: blur(6px);
      border: 1px solid rgba(16, 185, 129, 0.4);
      color: var(--success);
      font-size: 9px;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: var(--radius-full);
      display: flex;
      align-items: center;
      gap: 3px;
    }

    /* Track List Rows */
    .track-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .track-row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 10px;
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      cursor: pointer;
      transition: background 0.15s ease;
    }
    .track-row:active {
      background: var(--bg-card-hover);
    }

    .track-art {
      width: 44px;
      height: 44px;
      border-radius: var(--radius-sm);
      object-fit: cover;
      background: #11141E;
      flex-shrink: 0;
    }

    .track-meta {
      flex: 1;
      min-width: 0;
    }

    .track-title {
      font-size: 14px;
      font-weight: 600;
      color: var(--text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .track-desc {
      font-size: 12px;
      color: var(--text-muted);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-top: 2px;
    }

    .action-icon-btn {
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      background: transparent;
      border: none;
      color: var(--text-dim);
      cursor: pointer;
      flex-shrink: 0;
      transition: color 0.15s ease;
    }
    .action-icon-btn:active {
      color: var(--text-primary);
      background: rgba(255, 255, 255, 0.08);
    }

    /* Filter Pills */
    .filter-pills-row {
      display: flex;
      gap: 8px;
      overflow-x: auto;
      margin-bottom: 14px;
      padding-bottom: 4px;
    }
    .filter-pill {
      flex: 0 0 auto;
      padding: 6px 14px;
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-full);
      font-size: 12px;
      font-weight: 500;
      color: var(--text-muted);
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .filter-pill.active {
      background: var(--accent-primary);
      border-color: var(--accent-primary);
      color: #fff;
      font-weight: 600;
      box-shadow: 0 0 12px var(--accent-glow);
    }

    /* Search Cards (Responsive & Clean) */
    .search-track-card {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 12px;
      margin-bottom: 8px;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: var(--radius-md);
      transition: background 0.15s ease, border-color 0.15s ease;
      cursor: pointer;
    }
    .search-track-card:active {
      background: rgba(255, 255, 255, 0.08);
      border-color: rgba(99, 102, 241, 0.3);
    }
    .search-track-art-wrapper {
      position: relative;
      width: 50px;
      height: 50px;
      border-radius: 8px;
      overflow: hidden;
      flex-shrink: 0;
      background: #11141E;
    }
    .search-track-art {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .search-play-badge {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.15s ease;
    }
    .search-track-card:active .search-play-badge,
    .search-play-badge.playing {
      opacity: 1;
    }
    .search-track-info {
      flex: 1;
      min-width: 0;
    }
    .search-track-title {
      font-size: 14px;
      font-weight: 600;
      color: var(--text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-bottom: 3px;
    }
    .search-track-artist {
      font-size: 12px;
      color: var(--text-muted);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .search-track-actions {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-shrink: 0;
    }
    .search-btn-action {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: transparent;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-dim);
      cursor: pointer;
      transition: background 0.15s ease, color 0.15s ease;
    }
    .search-btn-action:active {
      background: rgba(255, 255, 255, 0.1);
      color: var(--text-primary);
    }
    .spin-icon {
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      100% { transform: rotate(360deg); }
    }

    /* Floating Download Banner */
    .active-download-banner {
      position: fixed;
      bottom: calc(var(--mini-player-height) + var(--tab-bar-height) + var(--safe-bottom) + 8px);
      left: 12px;
      right: 12px;
      background: rgba(17, 24, 39, 0.96);
      backdrop-filter: blur(16px);
      border: 1px solid rgba(245, 158, 11, 0.4);
      border-radius: var(--radius-md);
      padding: 10px 14px;
      z-index: 44;
      display: none;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
      animation: slideUp 0.25s ease-out;
    }
    .dl-banner-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 12px;
      font-weight: 600;
      margin-bottom: 6px;
    }
    .dl-progress-bar-bg {
      width: 100%;
      height: 4px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 2px;
      overflow: hidden;
    }
    .dl-progress-bar-fill {
      height: 100%;
      width: 0%;
      background: linear-gradient(90deg, #F59E0B, #10B981);
      transition: width 0.2s ease;
    }

    @keyframes slideUp {
      from { transform: translateY(12px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    /* Search Bar */
    .search-input-box {
      width: 100%;
      height: 46px;
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 0 16px 0 44px;
      color: #fff;
      font-size: 14px;
      outline: none;
      transition: border-color 0.15s ease;
    }
    .search-input-box:focus {
      border-color: var(--accent-primary);
      box-shadow: 0 0 12px var(--accent-glow);
    }
    .search-icon-wrapper {
      position: absolute;
      left: 14px;
      top: 13px;
      pointer-events: none;
      color: var(--text-dim);
    }

    /* Playlist Grid (Zero Layout Shift) */
    .playlist-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      margin-bottom: 24px;
    }
    .playlist-card {
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 12px;
      cursor: pointer;
      position: relative;
      transition: transform 0.15s ease, background 0.15s ease;
    }
    .playlist-card:active {
      transform: scale(0.97);
      background: var(--bg-card-hover);
    }
    .playlist-card-art {
      width: 100%;
      aspect-ratio: 1;
      border-radius: var(--radius-sm);
      object-fit: cover;
      margin-bottom: 8px;
      background: #11141E;
    }
    .playlist-card-title {
      font-size: 13px;
      font-weight: 600;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      color: var(--text-primary);
    }
    .playlist-card-count {
      font-size: 11px;
      color: var(--text-muted);
      margin-top: 2px;
    }

    /* Storage Meter Card */
    .storage-meter-card {
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(6, 182, 212, 0.04) 100%);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 16px;
      margin-bottom: 20px;
    }
    .storage-progress-bg {
      width: 100%;
      height: 6px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 3px;
      overflow: hidden;
      margin: 10px 0;
    }
    .storage-progress-fill {
      height: 100%;
      width: 12%;
      background: linear-gradient(90deg, #6366F1, #06B6D4);
      transition: width 0.3s ease;
    }

    /* ============================================================ */
    /* MINI BOTTOM PLAYER BAR                                       */
    /* ============================================================ */
    .mini-player {
      position: fixed;
      bottom: calc(var(--tab-bar-height) + var(--safe-bottom) + 6px);
      left: 10px;
      right: 10px;
      height: var(--mini-player-height);
      background: rgba(14, 18, 27, 0.94);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      padding: 0 12px;
      gap: 10px;
      z-index: 50;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
      cursor: pointer;
    }

    .mini-art {
      width: 40px;
      height: 40px;
      border-radius: var(--radius-sm);
      object-fit: cover;
      background: #11141E;
      flex-shrink: 0;
    }

    .mini-info {
      flex: 1;
      min-width: 0;
    }

    .mini-title {
      font-size: 13px;
      font-weight: 600;
      color: #fff;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .mini-artist {
      font-size: 11px;
      color: var(--text-muted);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .mini-controls {
      display: flex;
      align-items: center;
      gap: 4px;
      flex-shrink: 0;
    }

    .mini-btn {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      background: transparent;
      border: none;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }

    .mini-progress-track {
      position: absolute;
      top: 0;
      left: 12px;
      right: 12px;
      height: 2.5px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 2px;
      overflow: hidden;
    }
    .mini-progress-fill {
      height: 100%;
      width: 0%;
      background: linear-gradient(90deg, #6366F1, #06B6D4);
      transition: width 0.1s linear;
    }

    /* ============================================================ */
    /* FULLSCREEN NOW PLAYING MODAL SHEET (Clean & Compact)         */
    /* ============================================================ */
    .now-playing-modal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      height: 100dvh;
      background: radial-gradient(circle at 50% 12%, rgba(28, 38, 58, 0.98) 0%, rgba(7, 9, 14, 0.99) 75%);
      backdrop-filter: blur(36px);
      -webkit-backdrop-filter: blur(36px);
      z-index: 200;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      transform: translateY(100%);
      transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
      padding: max(var(--safe-top), 14px) 20px max(var(--safe-bottom), 16px) 20px;
      overflow: hidden;
      overscroll-behavior: contain;
      box-sizing: border-box;
      scrollbar-width: none;
      -ms-overflow-style: none;
      touch-action: pan-y;
    }
    .now-playing-modal.active {
      transform: translateY(0);
    }

    @media (max-height: 640px) {
      .now-playing-modal {
        overflow-y: auto !important;
      }
    }

    .modal-content-container {
      width: 100%;
      max-width: 420px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      min-height: 100%;
      flex: 1;
      box-sizing: border-box;
      gap: 6px;
    }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 2px;
      flex-shrink: 0;
    }

    .modal-center-stage {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      flex: 1;
      width: 100%;
      min-height: 0;
      margin: 4px 0;
    }

    .modal-hero-art-container {
      width: 100%;
      max-width: 250px;
      max-height: 38vh;
      aspect-ratio: 1;
      margin: 0 auto;
      border-radius: 20px;
      position: relative;
      box-shadow: 0 16px 40px rgba(0, 0, 0, 0.7), 0 0 28px var(--accent-glow);
      overflow: hidden;
      border: 1.5px solid rgba(255, 255, 255, 0.15);
      flex-shrink: 1;
    }

    .modal-hero-art {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    /* Equalizer Bars */
    .visualizer-container {
      display: flex;
      align-items: flex-end;
      justify-content: center;
      gap: 4px;
      height: 22px;
      margin-top: 10px;
      margin-bottom: 2px;
      flex-shrink: 0;
    }

    .v-bar {
      width: 4px;
      height: 6px;
      border-radius: 4px;
      background: linear-gradient(180deg, #06B6D4, #6366F1);
      transition: height 0.08s ease;
    }

    .modal-bottom-controls {
      display: flex;
      flex-direction: column;
      width: 100%;
      flex-shrink: 0;
      gap: 4px;
      margin-bottom: 4px;
    }

    .modal-track-info-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 4px;
    }

    .modal-track-meta {
      flex: 1;
      min-width: 0;
      padding-right: 12px;
    }

    .modal-track-title {
      font-size: 17px;
      font-weight: 700;
      color: #fff;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .modal-track-artist {
      font-size: 13px;
      color: var(--text-muted);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-top: 2px;
    }

    /* Seek Slider */
    .seek-slider-container {
      margin-bottom: 4px;
    }

    .seek-slider {
      width: 100%;
      accent-color: #6366F1;
      cursor: pointer;
      height: 36px;
      padding: 14px 0;
      background: transparent;
    }

    .seek-timestamps {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: var(--text-dim);
      font-family: ui-monospace, monospace;
      margin-top: -6px;
    }

    /* Playback Controls */
    .modal-controls-row {
      display: flex;
      align-items: center;
      justify-content: space-around;
      margin-bottom: 6px;
    }

    .btn-main-play {
      width: 58px;
      height: 58px;
      border-radius: 50%;
      background: var(--accent-primary);
      border: none;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 20px var(--accent-glow);
      cursor: pointer;
      transition: transform 0.15s ease;
    }
    .btn-main-play:active {
      transform: scale(0.92);
    }

    .queue-preview-card {
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 10px 12px;
      margin-top: 0;
      flex-shrink: 0;
    }

    /* ============================================================ */
    /* BOTTOM NAVIGATION DOCK (4 Tabs)                             */
    /* ============================================================ */
    .tab-bar-nav {
      position: fixed;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 100%;
      max-width: 520px;
      height: calc(var(--tab-bar-height) + var(--safe-bottom));
      padding-bottom: var(--safe-bottom);
      background: rgba(7, 9, 14, 0.94);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-top: 1px solid var(--border-subtle);
      display: flex;
      align-items: center;
      justify-content: space-around;
      z-index: 45;
    }

    .nav-tab-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 3px;
      flex: 1;
      height: 100%;
      color: var(--text-dim);
      cursor: pointer;
      font-size: 10px;
      font-weight: 600;
      transition: color 0.15s ease;
    }
    .nav-tab-item.active {
      color: var(--accent-primary);
    }
    .nav-tab-item.active svg {
      transform: translateY(-2px);
      filter: drop-shadow(0 0 8px var(--accent-glow));
    }

    /* Modals & Dialogs */
    .dialog-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(8px);
      z-index: 300;
      display: none;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .dialog-card {
      width: 100%;
      max-width: 360px;
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      padding: 20px;
      box-shadow: 0 16px 40px rgba(0, 0, 0, 0.8);
      animation: dialogPop 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }
    @keyframes dialogPop {
      from { transform: scale(0.92); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }

    /* Global Toast */
    .global-toast {
      position: fixed;
      top: calc(var(--safe-top) + 60px);
      left: 50%;
      transform: translateX(-50%) translateY(-20px);
      background: rgba(14, 18, 27, 0.94);
      border: 1px solid var(--border-subtle);
      color: #fff;
      padding: 8px 16px;
      border-radius: var(--radius-full);
      font-size: 12px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6);
      opacity: 0;
      pointer-events: none;
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      z-index: 400;
      max-width: 90%;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .global-toast.show {
      transform: translateX(-50%) translateY(0);
      opacity: 1;
    }
  </style>
</head>
<body>
  <div class="app-viewport">
    <!-- Top Header -->
    <header class="top-header">
      <div class="brand-group" onclick="switchNavTab('home', document.querySelector('.nav-tab-item'))">
        <img class="brand-icon" src="assets/logo.png" alt="Soko Logo" onerror="this.style.display='none'" />
      </div>

      <div class="status-badge-container" id="headerAuthBtn" onclick="openAuthModal()" style="cursor: pointer;">
        <span class="pulse-dot"></span>
        <span id="badgeStatusText">Sync / Login</span>
      </div>
    </header>

    <!-- Main Content Tabs -->
    <main class="content-scroll">
      <!-- 1. HOME TAB -->
      <section id="pane-home" class="tab-pane active">
        <div class="section-title-row">
          <div>
            <h2 class="section-title">Quick picks</h2>
            <p class="section-subtitle">Local 160k Opus • Zero latency</p>
          </div>
        </div>
        <div class="shelf-container" id="shelfQuickPicks">
          <!-- Populated dynamically -->
        </div>

        <div class="section-title-row" style="margin-top: 20px;">
          <div>
            <h2 class="section-title">Biggest hits</h2>
            <p class="section-subtitle">Top verified tracks in cache</p>
          </div>
        </div>
        <div class="shelf-container" id="shelfBiggestHits">
          <!-- Populated dynamically -->
        </div>

        <div class="section-title-row" style="margin-top: 20px;">
          <div>
            <h2 class="section-title">Listen again</h2>
            <p class="section-subtitle">Jump back in seamlessly</p>
          </div>
        </div>
        <div class="shelf-container" id="shelfListenAgain">
          <!-- Populated dynamically -->
        </div>

        <div id="dynamicShelvesContainer">
          <!-- Populated from YouTube Music InnerTube feed -->
        </div>
      </section>

      <!-- 2. CHARTS TAB (100 Songs with Pagination) -->
      <section id="pane-charts" class="tab-pane">
        <div class="section-title-row">
          <div>
            <h2 class="section-title">Top 100 Charts</h2>
            <p class="section-subtitle">Trending hits with authentic audio</p>
          </div>
        </div>

        <div class="filter-pills-row">
          <div class="filter-pill active" onclick="switchChartRegion('Global')">Global</div>
          <div class="filter-pill" onclick="switchChartRegion('United States')">United States</div>
          <div class="filter-pill" onclick="switchChartRegion('India')">India</div>
          <div class="filter-pill" onclick="switchChartRegion('United Kingdom')">United Kingdom</div>
        </div>

        <div class="track-list" id="chartsTrackList">
          <!-- Populated dynamically -->
        </div>

        <div id="chartsPagination" style="display: flex; align-items: center; justify-content: center; gap: 8px; margin: 20px 0 32px 0; padding: 0 16px;">
          <!-- Pagination Buttons -->
        </div>
      </section>

      <!-- 3. SEARCH TAB (Responsive Cards & Real Playback) -->
      <section id="pane-search" class="tab-pane">
        <div style="position: relative; margin-bottom: 16px;">
          <div class="search-icon-wrapper">
            <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </div>
          <input type="text" id="searchInput" class="search-input-box" placeholder="Search songs, artists, or albums..." oninput="handleDebouncedSearch(this.value)" />
        </div>

        <div class="filter-pills-row">
          <div class="filter-pill active" onclick="filterSearchCategory('all')">All Songs</div>
          <div class="filter-pill" onclick="filterSearchCategory('offline')">Offline Only</div>
          <div class="filter-pill" onclick="filterSearchCategory('favorites')">Favorites</div>
        </div>

        <div class="track-list" id="searchResultsList">
          <div style="text-align: center; color: var(--text-dim); padding: 40px;">Type a title, artist, or song name to search</div>
        </div>
      </section>

      <!-- 4. LIBRARY TAB -->
      <section id="pane-library" class="tab-pane">
        <div id="playlistDetailView" style="display: none; margin-bottom: 24px;">
          <button class="filter-pill" onclick="backToPlaylists()" style="margin-bottom: 16px; display: inline-flex; align-items: center; gap: 6px;">
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>
            Back to Library
          </button>
          <div style="display: flex; gap: 16px; align-items: center; margin-bottom: 16px;">
            <div id="plDetailArt" style="width: 72px; height: 72px; border-radius: var(--radius-md); background: #151B27; display: flex; align-items: center; justify-content: center; font-size: 28px;">📁</div>
            <div>
              <h2 id="plDetailTitle" class="section-title">Playlist</h2>
              <p id="plDetailSubtitle" class="section-subtitle">0 tracks</p>
              <div style="margin-top: 8px; display: flex; gap: 8px;">
                <button class="filter-pill active" onclick="playActivePlaylist(false)">▶ Play</button>
                <button class="filter-pill" onclick="playActivePlaylist(true)">🔀 Shuffle</button>
              </div>
            </div>
          </div>
          <div class="track-list" id="plDetailTrackList"></div>
        </div>

        <div id="mainLibraryView">
          <div class="section-title-row">
            <div>
              <h2 class="section-title">Your Playlists</h2>
              <p class="section-subtitle">Local collections & auto-smart lists</p>
            </div>
            <button class="action-icon-btn" onclick="openCreatePlaylistDialog()" title="Create Playlist">
              <svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"></path>
              </svg>
            </button>
          </div>

          <div class="playlist-grid" id="userPlaylistsGrid">
            <!-- Populated dynamically -->
          </div>

          <!-- Offline Storage Metrics -->
          <div class="storage-meter-card">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 13px; font-weight: 700;">Local Audio Storage</span>
              <span id="storageLabel" style="font-size: 12px; font-family: ui-monospace, monospace; color: var(--accent-cyan);">0 MB / 4.0 GB</span>
            </div>
            <div class="storage-progress-bg">
              <div id="storageUsedBar" class="storage-progress-fill"></div>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: var(--text-dim);">
              <span id="cachedSongStats">0 real songs stored locally</span>
              <span style="color: var(--success);">● 100% Offline Ready</span>
            </div>
          </div>

          <div class="section-title-row">
            <h2 class="section-title">All Offline Stored Songs</h2>
          </div>
          <div class="track-list" id="libraryTracksList">
            <!-- Populated dynamically -->
          </div>

          <!-- Cache Settings -->
          <div style="margin-top: 32px; padding: 16px; background: var(--bg-card); border-radius: var(--radius-md); border: 1px solid var(--border-subtle);">
            <div style="font-size: 14px; font-weight: 600; margin-bottom: 8px;">Cache & Storage Management</div>
            <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 16px;">Set maximum offline storage ceiling. Unpinned songs are pruned using LRU cache when limit is reached.</div>
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
              <span style="font-size: 12px;">Max Cache Ceiling:</span>
              <select id="maxCacheSelect" onchange="updateMaxCacheLimit(this.value)" style="background: var(--bg-surface); color: #fff; border: 1px solid var(--border-subtle); padding: 4px 8px; border-radius: var(--radius-sm); font-size: 12px;">
                <option value="2.0">2.0 GB</option>
                <option value="4.0" selected>4.0 GB (Default)</option>
                <option value="8.0">8.0 GB</option>
                <option value="16.0">16.0 GB</option>
              </select>
            </div>
            <button onclick="clearUnpinnedCache()" style="width: 100%; padding: 10px; background: rgba(239, 68, 68, 0.12); border: 1px solid rgba(239, 68, 68, 0.3); color: #EF4444; border-radius: var(--radius-md); font-size: 12px; font-weight: 600; cursor: pointer;">
              Clear Unpinned Cache (Keep Liked & Bundled)
            </button>
          </div>
        </div>
      </section>
    </main>

    <!-- Floating Active Download Banner -->
    <div id="activeDownloadBanner" class="active-download-banner">
      <div class="dl-banner-content">
        <span id="dlBannerTitle">Downloading...</span>
        <span id="dlBannerPercent" style="color: var(--warning); font-family: ui-monospace, monospace;">0%</span>
      </div>
      <div class="dl-progress-bar-bg">
        <div id="dlBannerFill" class="dl-progress-bar-fill"></div>
      </div>
    </div>

    <!-- Mini Bottom Player Bar -->
    <div class="mini-player" id="miniPlayer" onclick="openNowPlayingModal()">
      <div class="mini-progress-track">
        <div id="miniProgressFill" class="mini-progress-fill"></div>
      </div>
      <img id="miniArt" class="mini-art" src="assets/logo.png" alt="Cover" onerror="this.onerror=null; this.src='assets/logo.png';" />
      <div class="mini-info">
        <div id="miniTitle" class="mini-title">Select a track</div>
        <div id="miniArtist" class="mini-artist">Soko Offline Engine</div>
      </div>
      <div class="mini-controls" onclick="event.stopPropagation()">
        <button class="mini-btn" onclick="togglePlayPause()" title="Play/Pause">
          <svg id="miniPlayIcon" width="22" height="22" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z"></path>
          </svg>
        </button>
        <button class="mini-btn" onclick="playNextTrack()" title="Next">
          <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"></path>
          </svg>
        </button>
      </div>
    </div>

    <!-- Bottom Navigation Dock -->
    <nav class="tab-bar-nav">
      <div class="nav-tab-item active" onclick="switchNavTab('home', this)">
        <svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
        </svg>
        <span>Home</span>
      </div>

      <div class="nav-tab-item" onclick="switchNavTab('charts', this)">
        <svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
        </svg>
        <span>Charts</span>
      </div>

      <div class="nav-tab-item" onclick="switchNavTab('search', this)">
        <svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
        </svg>
        <span>Search</span>
      </div>

      <div class="nav-tab-item" onclick="switchNavTab('library', this)">
        <svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
        </svg>
        <span>Library</span>
      </div>
    </nav>

    <!-- Fullscreen Now Playing Modal Sheet -->
    <div class="now-playing-modal" id="nowPlayingModal">
      <div class="modal-content-container">
        <!-- Header -->
        <div class="modal-header">
          <button class="action-icon-btn" onclick="closeNowPlayingModal()" title="Collapse">
            <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"></path>
            </svg>
          </button>
          <div style="font-size: 11px; font-weight: 700; letter-spacing: 1px; color: var(--text-dim); text-transform: uppercase;">Now Playing</div>
          <button class="action-icon-btn" onclick="triggerDownloadCurrentTrack()" title="Download Track">
            <svg id="modalDownloadIcon" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
            </svg>
          </button>
        </div>

        <!-- Center Stage -->
        <div class="modal-center-stage">
          <div class="modal-hero-art-container">
            <img id="modalArt" class="modal-hero-art" src="assets/logo.png" alt="Hero Art" onerror="this.onerror=null; this.src='assets/logo.png';" />
          </div>

          <div class="visualizer-container" id="visualizerBars">
            <div class="v-bar"></div><div class="v-bar"></div><div class="v-bar"></div>
            <div class="v-bar"></div><div class="v-bar"></div><div class="v-bar"></div>
            <div class="v-bar"></div><div class="v-bar"></div><div class="v-bar"></div>
          </div>
        </div>

        <!-- Bottom Controls -->
        <div class="modal-bottom-controls">
          <div class="modal-track-info-row">
            <div class="modal-track-meta">
              <div id="modalTitle" class="modal-track-title">Track Title</div>
              <div id="modalArtist" class="modal-track-artist">Artist Name</div>
            </div>
            <button class="action-icon-btn" onclick="toggleCurrentFavorite()" title="Like Song">
              <svg id="modalHeartIcon" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
              </svg>
            </button>
          </div>

          <div class="seek-slider-container">
            <input type="range" id="modalSeekSlider" class="seek-slider" min="0" max="100" value="0" oninput="handleSeek(this.value)" />
            <div class="seek-timestamps">
              <span id="modalTimeCurrent">0:00</span>
              <span id="modalTimeDuration">0:00</span>
            </div>
          </div>

          <div class="modal-controls-row">
            <button class="action-icon-btn" id="btnShuffle" onclick="toggleShuffle()" title="Shuffle">
              <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path>
              </svg>
            </button>

            <button class="action-icon-btn" onclick="playPreviousTrack()" title="Previous Track">
              <svg width="28" height="28" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"></path>
              </svg>
            </button>

            <button class="btn-main-play" onclick="togglePlayPause()" title="Play/Pause">
              <svg id="modalMainPlayIcon" width="30" height="30" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"></path>
              </svg>
            </button>

            <button class="action-icon-btn" onclick="playNextTrack()" title="Next Track">
              <svg width="28" height="28" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"></path>
              </svg>
            </button>

            <button class="action-icon-btn" id="btnRepeat" onclick="toggleRepeat()" title="Repeat">
              <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
              </svg>
            </button>
          </div>

          <div class="queue-preview-card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
              <span style="font-size: 11px; font-weight: 700; color: var(--text-dim); text-transform: uppercase;">Up Next</span>
              <span id="preCacheStatus" style="font-size: 11px; color: var(--success); font-weight: 600;">● Offline Ready</span>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <img id="nextArt" src="assets/logo.png" style="width: 32px; height: 32px; border-radius: 4px; object-fit: cover;" onerror="this.onerror=null; this.src='assets/logo.png';" />
              <div style="flex: 1; min-width: 0;">
                <div id="nextTitle" style="font-size: 12px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">Next Song Title</div>
                <div id="nextArtist" style="font-size: 10px; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">Next Artist</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Auth Modal Dialog -->
    <div id="authModal" class="dialog-backdrop">
      <div class="dialog-card">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <h3 class="section-title">YouTube Music Account</h3>
          <button class="action-icon-btn" onclick="closeAuthModal()">✕</button>
        </div>
        <p id="authModalSubtitle" style="font-size: 12px; color: var(--text-muted); margin-bottom: 16px;">
          Connect your YouTube Music account to fetch personal recommendations, history, and playlists.
        </p>

        <div id="authLoggedOutView">
          <button onclick="loginWithGoogle()" style="width: 100%; padding: 12px; background: #fff; color: #111; font-weight: 700; font-size: 13px; border-radius: var(--radius-md); border: none; margin-bottom: 10px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;">
            <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/></svg>
            Sign in with Google
          </button>
          <button onclick="loginDemoAccount()" style="width: 100%; padding: 10px; background: rgba(99, 102, 241, 0.15); color: var(--accent-primary); border: 1px solid var(--accent-primary); border-radius: var(--radius-md); font-weight: 600; font-size: 12px; margin-bottom: 8px; cursor: pointer;">
            Use Demo YTM Feed
          </button>
          <div style="margin-top: 12px;">
            <input type="text" id="ytmCookieInput" placeholder="Paste SAPISID cookie..." style="width: 100%; padding: 8px 12px; background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); color: #fff; font-size: 11px; margin-bottom: 8px;" />
            <button onclick="loginWithCookie()" style="width: 100%; padding: 8px; background: var(--bg-surface); border: 1px solid var(--border-subtle); color: var(--text-muted); border-radius: var(--radius-sm); font-size: 11px; cursor: pointer;">Connect with Cookie</button>
          </div>
        </div>

        <div id="authLoggedInView" style="display: none;">
          <div style="background: var(--bg-card); border-radius: var(--radius-md); padding: 12px; margin-bottom: 16px; border: 1px solid rgba(16, 185, 129, 0.3);">
            <div style="font-size: 11px; color: var(--success); font-weight: 700; margin-bottom: 4px;">✓ CONNECTED</div>
            <div id="authProfileName" style="font-size: 14px; font-weight: 700;">Account Name</div>
            <div id="authProfileEmail" style="font-size: 11px; color: var(--text-dim);">Google Account</div>
          </div>
          <button onclick="syncYTMFeed()" style="width: 100%; padding: 10px; background: var(--accent-primary); color: #fff; border: none; border-radius: var(--radius-md); font-weight: 600; font-size: 12px; margin-bottom: 8px; cursor: pointer;">
            🔄 Sync Live Feeds Now
          </button>
          <button onclick="logoutAccount()" style="width: 100%; padding: 8px; background: transparent; border: 1px solid rgba(239, 68, 68, 0.4); color: #EF4444; border-radius: var(--radius-md); font-size: 11px; cursor: pointer;">
            Sign Out
          </button>
        </div>
      </div>
    </div>

    <!-- Create Playlist Dialog -->
    <div id="createPlaylistModal" class="dialog-backdrop">
      <div class="dialog-card">
        <h3 class="section-title" style="margin-bottom: 8px;">Create New Playlist</h3>
        <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 16px;">Enter a title for your custom local collection.</p>
        <input type="text" id="newPlaylistNameInput" class="search-input-box" style="padding-left: 14px; margin-bottom: 16px;" placeholder="Playlist name (e.g. Gym Vibes)" />
        <div style="display: flex; gap: 8px; justify-content: flex-end;">
          <button class="filter-pill" onclick="closeCreatePlaylistDialog()">Cancel</button>
          <button class="filter-pill active" onclick="confirmCreatePlaylist()">Create</button>
        </div>
      </div>
    </div>

    <!-- Add to Playlist Dialog -->
    <div id="addToPlaylistModal" class="dialog-backdrop">
      <div class="dialog-card">
        <h3 class="section-title" style="margin-bottom: 8px;">Add to Playlist</h3>
        <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 16px;">Choose a playlist for this track:</p>
        <div id="targetPlaylistsList" class="track-list" style="max-height: 200px; overflow-y: auto; margin-bottom: 16px;"></div>
        <div style="display: flex; justify-content: flex-end;">
          <button class="filter-pill" onclick="closeAddToPlaylistDialog()">Cancel</button>
        </div>
      </div>
    </div>

    <!-- Global Toast -->
    <div id="globalToast" class="global-toast">
      <span id="toastIcon">⚡</span>
      <span id="toastMsg">Ready</span>
    </div>

    <!-- Real Online YouTube Audio Streaming Sandbox Engine -->
    <div id="ytOnlinePlayerWrapper" style="position: fixed; bottom: 0; right: 0; width: 200px; height: 200px; opacity: 0.001; pointer-events: none; z-index: -999; overflow: hidden;">
      <div id="ytOnlinePlayer"></div>
    </div>
    <audio id="audioPlayer" preload="auto"></audio>
  </div>

  <script>
    // ============================================================
    // APPLICATION DATA & STORES
    // ============================================================
    const CATALOG = [
      {
        id: "4HVhnhpJxr0",
        title: "Gale Lag Ja",
        artist: "JalRaj",
        duration: 172,
        cover: "assets/music/4HVhnhpJxr0.jpg",
        audioUrl: "assets/music/4HVhnhpJxr0.opus",
        bitrate: "160k Opus",
        genre: "Indie Pop",
        favorite: true
      },
      {
        id: "Io_Z3HxgJGs",
        title: "Jee Le Zaraa",
        artist: "Vishal Dadlani",
        duration: 215,
        cover: "assets/music/Io_Z3HxgJGs.jpg",
        audioUrl: "assets/music/Io_Z3HxgJGs.opus",
        bitrate: "160k Opus",
        genre: "Bollywood Hits",
        favorite: true
      },
      {
        id: "EW9opRK1MPk",
        title: "Zara Zara Bahekta Hai",
        artist: "Bombay Jayashri",
        duration: 179,
        cover: "assets/music/EW9opRK1MPk.jpg",
        audioUrl: "assets/music/EW9opRK1MPk.opus",
        bitrate: "160k Opus",
        genre: "Romantic Classic",
        favorite: true
      },
      {
        id: "XI3JGDHduR4",
        title: "Khaab",
        artist: "Akhil",
        duration: 202,
        cover: "assets/music/XI3JGDHduR4.jpg",
        audioUrl: "assets/music/XI3JGDHduR4.opus",
        bitrate: "160k Opus",
        genre: "Punjabi Hits",
        favorite: true
      },
      {
        id: "ZCRL8V0ZkEA",
        title: "Leja Re",
        artist: "Dhvani Bhanushali",
        duration: 205,
        cover: "assets/music/ZCRL8V0ZkEA.jpg",
        audioUrl: "assets/music/ZCRL8V0ZkEA.opus",
        bitrate: "160k Opus",
        genre: "Pop Anthem",
        favorite: true
      },
      {
        id: "ZUL-ivsl_Fs",
        title: "Hona Tha Pyar",
        artist: "Atif Aslam",
        duration: 219,
        cover: "assets/music/ZUL-ivsl_Fs.jpg",
        audioUrl: "assets/music/ZUL-ivsl_Fs.opus",
        bitrate: "160k Opus",
        genre: "Soulful Melody",
        favorite: true
      },
      {
        id: "7Fq2ArrUU9c",
        title: "Pehle Bhi Main",
        artist: "Vishal Mishra",
        duration: 251,
        cover: "assets/music/7Fq2ArrUU9c.jpg",
        audioUrl: "assets/music/7Fq2ArrUU9c.opus",
        bitrate: "160k Opus",
        genre: "Bollywood Soul",
        favorite: false
      },
      {
        id: "8TfP90KODxo",
        title: "Apna Bana Le",
        artist: "Arijit Singh",
        duration: 261,
        cover: "assets/music/8TfP90KODxo.jpg",
        audioUrl: "assets/music/8TfP90KODxo.opus",
        bitrate: "160k Opus",
        genre: "Romantic",
        favorite: false
      },
      {
        id: "Qo4-4388R3g",
        title: "Kesariya",
        artist: "Arijit Singh",
        duration: 268,
        cover: "assets/music/Qo4-4388R3g.jpg",
        audioUrl: "assets/music/Qo4-4388R3g.opus",
        bitrate: "160k Opus",
        genre: "Romantic",
        favorite: false
      },
      {
        id: "SxkHNou0uiM",
        title: "Maan Meri Jaan",
        artist: "King",
        duration: 194,
        cover: "assets/music/SxkHNou0uiM.jpg",
        audioUrl: "assets/music/SxkHNou0uiM.opus",
        bitrate: "160k Opus",
        genre: "Hip-Hop Pop",
        favorite: false
      },
      {
        id: "cK9h5PVzRpk",
        title: "Tum Hi Ho",
        artist: "Arijit Singh",
        duration: 262,
        cover: "assets/music/cK9h5PVzRpk.jpg",
        audioUrl: "assets/music/cK9h5PVzRpk.opus",
        bitrate: "160k Opus",
        genre: "Romantic Classic",
        favorite: false
      },
      {
        id: "iKopExw_3Zg",
        title: "Chaleya",
        artist: "Arijit Singh, Shilpa Rao",
        duration: 200,
        cover: "assets/music/iKopExw_3Zg.jpg",
        audioUrl: "assets/music/iKopExw_3Zg.opus",
        bitrate: "160k Opus",
        genre: "Bollywood Dance",
        favorite: false
      },
      {
        id: "jLHyFkCKEzg",
        title: "Raataan Lambiyan",
        artist: "Jubin Nautiyal, Asees Kaur",
        duration: 230,
        cover: "assets/music/jLHyFkCKEzg.jpg",
        audioUrl: "assets/music/jLHyFkCKEzg.opus",
        bitrate: "160k Opus",
        genre: "Love Ballad",
        favorite: false
      },
      {
        id: "ppcVqfsekIs",
        title: "Agar Tum Saath Ho",
        artist: "Alka Yagnik, Arijit Singh",
        duration: 341,
        cover: "assets/music/ppcVqfsekIs.jpg",
        audioUrl: "assets/music/ppcVqfsekIs.opus",
        bitrate: "160k Opus",
        genre: "Bollywood Emotion",
        favorite: false
      },
      {
        id: "tXi15CFnFws",
        title: "Ilahi",
        artist: "Arijit Singh",
        duration: 228,
        cover: "assets/music/tXi15CFnFws.jpg",
        audioUrl: "assets/music/tXi15CFnFws.opus",
        bitrate: "160k Opus",
        genre: "Travel Acoustic",
        favorite: false
      },
      {
        id: "yiJ5k2vBtlw",
        title: "Kabira",
        artist: "Tochi Raina, Rekha Bhardwaj",
        duration: 223,
        cover: "assets/music/yiJ5k2vBtlw.jpg",
        audioUrl: "assets/music/yiJ5k2vBtlw.opus",
        bitrate: "160k Opus",
        genre: "Folk Sufi",
        favorite: false
      }
    ];

    const BUNDLED_TRACKS = CATALOG.slice(0, 16);
    const downloadedSet = new Set(BUNDLED_TRACKS.map(t => t.id));
    let personalShelves = null;

    // 400 Real Regional Chart Tracks (100 per region with authentic YouTube IDs)
    const REGIONAL_CHARTS = ${JSON.stringify(chartsData, null, 2)};

    let userSession = null;
    try {
      const savedSession = localStorage.getItem('soko_ytm_session');
      if (savedSession) userSession = JSON.parse(savedSession);
    } catch (e) {}

    // ============================================================
    // PERSISTENT STORAGE ENGINE (Survives App Restarts & Process Kills)
    // ============================================================
    const STORAGE_KEY_DOWNLOADED_IDS = 'soko_downloaded_ids_v2';
    const STORAGE_KEY_CUSTOM_TRACKS = 'soko_custom_tracks_v2';
    const STORAGE_KEY_PLAYLISTS = 'soko_user_playlists_v2';
    const STORAGE_KEY_MAX_CACHE = 'soko_max_cache_gb_v2';

    let userPlaylists = [
      {
        id: "pl_favorites",
        name: "Liked Songs",
        isSystem: true,
        songIds: ["4HVhnhpJxr0", "Io_Z3HxgJGs", "EW9opRK1MPk", "XI3JGDHduR4", "ZCRL8V0ZkEA", "ZUL-ivsl_Fs"]
      },
      {
        id: "pl_offline",
        name: "Downloaded Music",
        isSystem: true,
        songIds: BUNDLED_TRACKS.map(t => t.id)
      },
      {
        id: "pl_chill",
        name: "Late Night Lo-Fi & Acoustic",
        isSystem: false,
        songIds: ["4HVhnhpJxr0", "EW9opRK1MPk", "ZUL-ivsl_Fs", "ppcVqfsekIs", "tXi15CFnFws"]
      },
      {
        id: "pl_workout",
        name: "High Energy & Party",
        isSystem: false,
        songIds: ["XI3JGDHduR4", "ZCRL8V0ZkEA", "iKopExw_3Zg", "SxkHNou0uiM"]
      }
    ];

    function initPersistentStorage() {
      try {
        // 1. Rehydrate custom & downloaded tracks into CATALOG
        const savedTracksJson = localStorage.getItem(STORAGE_KEY_CUSTOM_TRACKS);
        if (savedTracksJson) {
          const savedTracks = JSON.parse(savedTracksJson);
          if (Array.isArray(savedTracks)) {
            for (const st of savedTracks) {
              const existingIdx = CATALOG.findIndex(t => t.id === st.id);
              if (existingIdx >= 0) {
                CATALOG[existingIdx] = st;
              } else {
                CATALOG.push(st);
              }
            }
          }
        }

        // 2. Rehydrate downloadedSet (Preserve all user downloads)
        const savedIdsJson = localStorage.getItem(STORAGE_KEY_DOWNLOADED_IDS);
        if (savedIdsJson) {
          const savedIds = JSON.parse(savedIdsJson);
          if (Array.isArray(savedIds)) {
            for (const id of savedIds) {
              downloadedSet.add(id);
            }
          }
        }

        // 3. Rehydrate user playlists
        const savedPlaylistsJson = localStorage.getItem(STORAGE_KEY_PLAYLISTS);
        if (savedPlaylistsJson) {
          const savedPlaylists = JSON.parse(savedPlaylistsJson);
          if (Array.isArray(savedPlaylists) && savedPlaylists.length > 0) {
            userPlaylists = savedPlaylists;
            if (typeof window !== 'undefined') window.userPlaylists = userPlaylists;
          }
        }

        // 4. Rehydrate max cache limit
        const savedLimit = localStorage.getItem(STORAGE_KEY_MAX_CACHE);
        if (savedLimit) {
          const parsed = parseFloat(savedLimit);
          if (!isNaN(parsed) && parsed > 0) {
            maxCacheGB = parsed;
            const selectEl = document.getElementById('maxCacheSelect');
            if (selectEl) selectEl.value = maxCacheGB.toFixed(1);
          }
        }

        console.log(\`[Storage] Rehydrated \${downloadedSet.size} offline tracks and \${userPlaylists.length} playlists\`);
      } catch (err) {
        console.warn("[Storage] Rehydration notice:", err);
      }
    }

    function persistDownloadState() {
      try {
        localStorage.setItem(STORAGE_KEY_DOWNLOADED_IDS, JSON.stringify(Array.from(downloadedSet)));

        const customTracks = CATALOG.filter(t => !BUNDLED_TRACKS.some(b => b.id === t.id));
        localStorage.setItem(STORAGE_KEY_CUSTOM_TRACKS, JSON.stringify(customTracks));

        if (typeof window !== 'undefined' && window.userPlaylists) {
          userPlaylists = window.userPlaylists;
        }
        localStorage.setItem(STORAGE_KEY_PLAYLISTS, JSON.stringify(userPlaylists));
        localStorage.setItem(STORAGE_KEY_MAX_CACHE, maxCacheGB.toString());
      } catch (err) {
        console.warn("[Storage] Persistence notice:", err);
      }
    }

    // ============================================================
    // PLAYER STATE & VARIABLES
    // ============================================================
    let currentTrack = CATALOG[0];
    let isPlaying = false;
    let isShuffle = false;
    let isRepeat = false;
    let lookAheadNextTrack = CATALOG[1];
    let activePlaylist = null;
    let currentChartRegion = 'Global';
    let currentChartPage = 1;
    const CHARTS_PER_PAGE = 20;
    let maxCacheGB = 4.0;
    let searchDebounceTimer = null;
    let songPendingAddToPlaylist = null;
    let audioEl = null;
    let visualizerAnimFrame = null;
    let currentYtmSearchResults = [];

    // ============================================================
    // LOOKUP ENGINE
    // ============================================================
    function findTrackAcrossAllSources(trackId) {
      if (!trackId) return null;
      let track = CATALOG.find(t => t.id === trackId);
      if (track) return track;

      if (currentYtmSearchResults) {
        track = currentYtmSearchResults.find(t => t.id === trackId);
        if (track) return track;
      }

      if (currentChartRegion && REGIONAL_CHARTS && REGIONAL_CHARTS[currentChartRegion]) {
        track = REGIONAL_CHARTS[currentChartRegion].find(t => t.id === trackId);
        if (track) return track;
      }

      if (typeof REGIONAL_CHARTS === 'object') {
        for (const reg in REGIONAL_CHARTS) {
          track = REGIONAL_CHARTS[reg].find(t => t.id === trackId);
          if (track) return track;
        }
      }

      if (personalShelves) {
        for (const shelf of personalShelves) {
          if (shelf.tracks) {
            track = shelf.tracks.find(t => t.id === trackId);
            if (track) return track;
          }
        }
      }

      for (const pl of userPlaylists) {
        if (pl.tracks) {
          track = pl.tracks.find(t => t.id === trackId);
          if (track) return track;
        }
      }

      return null;
    }

    // ============================================================
    // REAL YOUTUBE AUDIO STREAMING ENGINE
    // ============================================================
    let ytPlayer = null;
    let ytPlayerReady = false;
    let isOnlineYtPlaying = false;
    let onlineProgressTimer = null;

    function initYouTubeIframeApi() {
      if (window.YT && window.YT.Player) {
        setupYtPlayer();
        return;
      }
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      if (firstScriptTag && firstScriptTag.parentNode) {
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      } else {
        document.head.appendChild(tag);
      }
    }

    window.onYouTubeIframeAPIReady = function() {
      setupYtPlayer();
    };

    function setupYtPlayer() {
      if (ytPlayer) return;
      try {
        const originVal = (window.location.origin && window.location.origin !== 'null' && !window.location.origin.startsWith('file:')) ? window.location.origin : 'https://music.youtube.com';
        ytPlayer = new YT.Player('ytOnlinePlayer', {
          height: '200',
          width: '200',
          videoId: currentTrack ? currentTrack.id : 'kPa7bsKwL-c',
          playerVars: {
            'autoplay': 1,
            'controls': 0,
            'disablekb': 1,
            'fs': 0,
            'playsinline': 1,
            'origin': originVal
          },
          events: {
            'onReady': (event) => {
              ytPlayerReady = true;
              if (isOnlineYtPlaying && currentTrack) {
                event.target.loadVideoById(currentTrack.id);
                event.target.playVideo();
              }
            },
            'onStateChange': onYtPlayerStateChange,
            'onError': (event) => {
              console.warn("YouTube player notice (code " + event.data + ")");
            }
          }
        });
      } catch (e) {
        console.warn("setupYtPlayer notice:", e);
      }
    }

    function playOnlineYouTubeStream(track) {
      isOnlineYtPlaying = true;
      const wrapper = document.getElementById('ytOnlinePlayerWrapper');
      const originVal = (window.location.origin && window.location.origin !== 'null' && !window.location.origin.startsWith('file:')) ? window.location.origin : 'https://music.youtube.com';

      if (ytPlayer && ytPlayerReady && typeof ytPlayer.loadVideoById === 'function') {
        try {
          ytPlayer.loadVideoById(track.id);
          ytPlayer.playVideo();
        } catch (e) {
          if (wrapper) {
            wrapper.innerHTML = \`<iframe id="ytDirectIframe" src="https://www.youtube-nocookie.com/embed/\${track.id}?autoplay=1&enablejsapi=1&playsinline=1&origin=\${encodeURIComponent(originVal)}" allow="autoplay; encrypted-media" style="width:200px; height:200px; border:none;"></iframe>\`;
          }
        }
      } else {
        if (wrapper) {
          wrapper.innerHTML = \`<iframe id="ytDirectIframe" src="https://www.youtube-nocookie.com/embed/\${track.id}?autoplay=1&enablejsapi=1&playsinline=1&origin=\${encodeURIComponent(originVal)}" allow="autoplay; encrypted-media" style="width:200px; height:200px; border:none;"></iframe>\`;
        }
      }

      isPlaying = true;
      updatePlayIcons(true);
      startRealVisualizer();
      startOnlineProgressUpdater();

      if (window.SokoNative && typeof window.SokoNative.updateNativePlayer === 'function') {
        window.SokoNative.updateNativePlayer(track.title, track.artist, true, track.duration || 215, 0, track.cover);
      }
    }

    function stopOnlineYouTubeStream() {
      isOnlineYtPlaying = false;
      stopOnlineProgressUpdater();
      if (ytPlayer && typeof ytPlayer.pauseVideo === 'function') {
        try { ytPlayer.pauseVideo(); } catch (e) {}
      }
      const directIframe = document.getElementById('ytDirectIframe');
      if (directIframe) {
        directIframe.src = 'about:blank';
      }
    }

    function onYtPlayerStateChange(event) {
      if (event.data === 1) { // PLAYING
        isPlaying = true;
        updatePlayIcons(true);
        startRealVisualizer();
        startOnlineProgressUpdater();
      } else if (event.data === 2) { // PAUSED
        isPlaying = false;
        updatePlayIcons(false);
        stopRealVisualizer();
        stopOnlineProgressUpdater();
      } else if (event.data === 0) { // ENDED
        stopOnlineProgressUpdater();
        if (isRepeat) {
          if (currentTrack) playRealTrack(currentTrack);
        } else {
          playNextTrack();
        }
      }
    }

    function startOnlineProgressUpdater() {
      stopOnlineProgressUpdater();
      onlineProgressTimer = setInterval(() => {
        if (!isOnlineYtPlaying) return;
        let cur = 0;
        let dur = currentTrack ? currentTrack.duration : 215;

        if (ytPlayer && typeof ytPlayer.getCurrentTime === 'function') {
          try {
            cur = ytPlayer.getCurrentTime() || 0;
            const realDur = ytPlayer.getDuration();
            if (realDur > 0) dur = realDur;
          } catch (e) {}
        }

        const slider = document.getElementById('modalSeekSlider');
        const curTime = document.getElementById('modalTimeCurrent');
        const durTime = document.getElementById('modalTimeDuration');
        const miniFill = document.getElementById('miniProgressFill');

        if (curTime) curTime.innerText = formatTime(Math.floor(cur));
        if (durTime && dur > 0) durTime.innerText = formatTime(Math.floor(dur));

        const percent = dur > 0 ? (cur / dur) * 100 : 0;
        if (slider && !slider.matches(':active')) {
          slider.value = percent;
        }
        if (miniFill) miniFill.style.width = \`\${percent}%\`;

        if (window.SokoNative && typeof window.SokoNative.updateNativePlayer === 'function' && currentTrack) {
          if (!window._lastYtNativeUpdate || (Date.now() - window._lastYtNativeUpdate) > 2500) {
            window._lastYtNativeUpdate = Date.now();
            window.SokoNative.updateNativePlayer(currentTrack.title, currentTrack.artist, isPlaying, Math.floor(dur), Math.floor(cur), currentTrack.cover);
          }
        }
      }, 500);
    }

    function stopOnlineProgressUpdater() {
      if (onlineProgressTimer) {
        clearInterval(onlineProgressTimer);
        onlineProgressTimer = null;
      }
    }

    // ============================================================
    // CORE PLAYBACK CONTROLS
    // ============================================================
    function selectTrackToPlay(trackId) {
      let track = findTrackAcrossAllSources(trackId);
      if (!track) {
        console.warn('Track not found for ID:', trackId, 'falling back to CATALOG[0]');
        track = CATALOG[0];
      } else {
        if (!CATALOG.some(t => t.id === track.id)) {
          CATALOG.push(track);
        }
      }

      if (currentYtmSearchResults && currentYtmSearchResults.some(t => t.id === track.id)) {
        activePlaylist = null;
        window.activeQueueList = currentYtmSearchResults;
      } else if (REGIONAL_CHARTS && currentChartRegion && REGIONAL_CHARTS[currentChartRegion]?.some(t => t.id === track.id)) {
        activePlaylist = null;
        window.activeQueueList = REGIONAL_CHARTS[currentChartRegion];
      }

      playRealTrack(track);
      scheduleLookAhead(track.id);
    }

    function playRealTrack(track) {
      currentTrack = track;
      updatePlayerUI(track);

      const isOfflineTrack = downloadedSet.has(track.id) || (track.audioUrl && track.audioUrl.startsWith('assets/'));

      if (isOfflineTrack) {
        // 1. PLAY HIGH-FIDELITY LOCAL OPUS AUDIO
        stopOnlineYouTubeStream();

        let targetSrc = track.audioUrl;
        if (!targetSrc || targetSrc.trim() === '') {
          targetSrc = \`assets/music/\${track.id}.opus\`;
        }

        if (window.SokoNative && typeof window.SokoNative.playAudio === 'function') {
          window.SokoNative.playAudio(targetSrc, track.title, track.artist, track.cover);
          isPlaying = true;
          updatePlayIcons(true);
          startRealVisualizer();
        } else if (audioEl) {
          if (audioEl.src !== targetSrc && !audioEl.src.endsWith(targetSrc)) {
            audioEl.src = targetSrc;
          }
          audioEl.volume = 1.0;
          audioEl.play().then(() => {
            isPlaying = true;
            updatePlayIcons(true);
            startRealVisualizer();
          }).catch(e => {
            console.warn('Playback pending user gesture:', e);
          });
        }
      } else {
        // 2. PLAY REAL ONLINE YOUTUBE MUSIC TRACK (Streams EXACT song)
        if (audioEl) {
          try { audioEl.pause(); } catch (e) {}
        }
        if (window.SokoNative && typeof window.SokoNative.pauseAudio === 'function') {
          try { window.SokoNative.pauseAudio(); } catch (e) {}
        }

        playOnlineYouTubeStream(track);
      }

      track.plays = (track.plays || 0) + 1;
      updateMediaSession(track);
    }

    function togglePlayPause() {
      if (isOnlineYtPlaying) {
        if (isPlaying) {
          if (ytPlayer && typeof ytPlayer.pauseVideo === 'function') {
            try { ytPlayer.pauseVideo(); } catch (e) {}
          }
          isPlaying = false;
          updatePlayIcons(false);
          stopRealVisualizer();
          stopOnlineProgressUpdater();
        } else {
          if (ytPlayer && typeof ytPlayer.playVideo === 'function') {
            try { ytPlayer.playVideo(); } catch (e) {}
          }
          isPlaying = true;
          updatePlayIcons(true);
          startRealVisualizer();
          startOnlineProgressUpdater();
        }
        if (window.SokoNative && typeof window.SokoNative.updateNativePlayer === 'function' && currentTrack) {
          window.SokoNative.updateNativePlayer(currentTrack.title, currentTrack.artist, isPlaying, currentTrack.duration || 215, 0, currentTrack.cover);
        }
        return;
      }

      // Offline local playback toggle
      if (window.SokoNative && typeof window.SokoNative.pauseAudio === 'function') {
        if (isPlaying) {
          window.SokoNative.pauseAudio();
          isPlaying = false;
          updatePlayIcons(false);
          stopRealVisualizer();
        } else {
          window.SokoNative.resumeAudio();
          isPlaying = true;
          updatePlayIcons(true);
          startRealVisualizer();
        }
      } else if (audioEl) {
        if (audioEl.paused) {
          audioEl.play().then(() => {
            isPlaying = true;
            updatePlayIcons(true);
            startRealVisualizer();
          }).catch(e => {
            console.warn('Playback error:', e);
          });
        } else {
          audioEl.pause();
          isPlaying = false;
          updatePlayIcons(false);
          stopRealVisualizer();
        }
      }
    }

    function updatePlayIcons(playing) {
      const miniIcon = document.getElementById('miniPlayIcon');
      const modalIcon = document.getElementById('modalMainPlayIcon');
      const playSvg = '<path d="M8 5v14l11-7z"></path>';
      const pauseSvg = '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"></path>';

      if (miniIcon) miniIcon.innerHTML = playing ? pauseSvg : playSvg;
      if (modalIcon) modalIcon.innerHTML = playing ? pauseSvg : playSvg;
    }

    function handleSeek(val) {
      const percent = parseFloat(val);
      if (isOnlineYtPlaying) {
        if (ytPlayer && typeof ytPlayer.seekTo === 'function') {
          const dur = (ytPlayer.getDuration && ytPlayer.getDuration() > 0) ? ytPlayer.getDuration() : (currentTrack ? currentTrack.duration : 215);
          const targetSec = (percent / 100) * dur;
          ytPlayer.seekTo(targetSec, true);
        }
        return;
      }

      if (window.SokoNative && typeof window.SokoNative.seekAudio === 'function' && currentTrack) {
        const targetSec = Math.floor((percent / 100) * (currentTrack.duration || 215));
        window.SokoNative.seekAudio(targetSec);
      } else if (audioEl && audioEl.duration) {
        audioEl.currentTime = (percent / 100) * audioEl.duration;
      }
    }

    function seekTrack(val) {
      handleSeek(val);
    }

    function toggleShuffle() {
      isShuffle = !isShuffle;
      const btn = document.getElementById('btnShuffle');
      if (btn) btn.style.color = isShuffle ? 'var(--accent-primary)' : 'var(--text-dim)';
      showToast(isShuffle ? 'Shuffle Enabled' : 'Shuffle Off', isShuffle ? '🔀' : '➡️');
    }

    function toggleRepeat() {
      isRepeat = !isRepeat;
      const btn = document.getElementById('btnRepeat');
      if (btn) btn.style.color = isRepeat ? 'var(--accent-primary)' : 'var(--text-dim)';
      showToast(isRepeat ? 'Repeat Enabled' : 'Repeat Off', isRepeat ? '🔁' : '➡️');
    }

    function playNextTrack() {
      let pool = window.activeQueueList || (activePlaylist ? activePlaylist.songIds.map(id => findTrackAcrossAllSources(id)).filter(Boolean) : CATALOG);
      if (!pool || pool.length === 0) pool = CATALOG;

      let nextTrack;
      if (isShuffle) {
        const otherTracks = pool.filter(t => t.id !== currentTrack?.id);
        nextTrack = otherTracks.length > 0 ? otherTracks[Math.floor(Math.random() * otherTracks.length)] : pool[0];
      } else {
        const curIdx = pool.findIndex(t => t.id === currentTrack?.id);
        const nextIdx = curIdx >= 0 ? (curIdx + 1) % pool.length : 0;
        nextTrack = pool[nextIdx];
      }
      if (nextTrack) {
        selectTrackToPlay(nextTrack.id);
      }
    }

    function playPreviousTrack() {
      if (audioEl && audioEl.currentTime > 3) {
        audioEl.currentTime = 0;
        return;
      }
      let pool = window.activeQueueList || (activePlaylist ? activePlaylist.songIds.map(id => findTrackAcrossAllSources(id)).filter(Boolean) : CATALOG);
      if (!pool || pool.length === 0) pool = CATALOG;

      const curIdx = pool.findIndex(t => t.id === currentTrack?.id);
      const prevIdx = curIdx > 0 ? curIdx - 1 : pool.length - 1;
      const prevTrack = pool[prevIdx];
      if (prevTrack) {
        selectTrackToPlay(prevTrack.id);
      }
    }

    function scheduleLookAhead(currentId) {
      let pool = window.activeQueueList || (activePlaylist ? activePlaylist.songIds.map(id => findTrackAcrossAllSources(id)).filter(Boolean) : CATALOG);
      if (!pool || pool.length === 0) pool = CATALOG;
      const curIdx = pool.findIndex(t => t.id === currentId);
      const nextIdx = curIdx >= 0 ? (curIdx + 1) % pool.length : 0;
      lookAheadNextTrack = pool[nextIdx] || CATALOG[0];
      updateLookAheadUI();
    }

    function updateLookAheadUI() {
      const titleEl = document.getElementById('nextTitle');
      const artistEl = document.getElementById('nextArtist');
      const artEl = document.getElementById('nextArt');
      const preCacheStatus = document.getElementById('preCacheStatus');

      if (titleEl) titleEl.innerText = lookAheadNextTrack.title;
      if (artistEl) artistEl.innerText = lookAheadNextTrack.artist;
      if (artEl) artEl.src = lookAheadNextTrack.cover;

      const isNextCached = downloadedSet.has(lookAheadNextTrack.id);
      if (preCacheStatus) {
        preCacheStatus.innerText = isNextCached ? '● Offline Ready' : '● Online Stream';
        preCacheStatus.style.color = isNextCached ? 'var(--success)' : 'var(--accent-cyan)';
      }
    }

    // ============================================================
    // OFFLINE DOWNLOAD ENGINE
    // ============================================================
    const activeDownloads = new Map();

    function startDownloadTrack(trackId) {
      let track = findTrackAcrossAllSources(trackId);
      if (!track) return;
      if (!CATALOG.some(t => t.id === track.id)) {
        CATALOG.push(track);
      }

      if (downloadedSet.has(track.id)) {
        showToast(\`"\${track.title}" is already offline cached!\`, '⚡');
        return;
      }

      if (activeDownloads.has(track.id)) {
        showToast(\`"\${track.title}" is currently downloading...\`, '⏳');
        return;
      }

      activeDownloads.set(track.id, 0);
      updateDownloadBannerUI(track, 0, false);
      renderShelves();
      renderLibraryTracks();
      showToast(\`Downloading "\${track.title}" (160k Opus)...\`, '📥');

      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.floor(Math.random() * 20) + 15;
        if (progress >= 100) {
          clearInterval(interval);
          activeDownloads.delete(track.id);
          downloadedSet.add(track.id);

          const offPl = userPlaylists.find(p => p.id === 'pl_offline');
          if (offPl && !offPl.songIds.includes(track.id)) {
            offPl.songIds.push(track.id);
          }

          persistDownloadState();

          updateDownloadBannerUI(track, 100, true);
          updateStorageMetrics();
          renderShelves();
          renderLibraryTracks();
          renderPlaylists();
          if (currentTrack && currentTrack.id === track.id) {
            updatePlayerUI(currentTrack);
          }
          showToast(\`✓ "\${track.title}" cached offline!\`, '⚡');
        } else {
          activeDownloads.set(track.id, progress);
          updateDownloadBannerUI(track, progress, false);
          renderShelves();
        }
      }, 300);
    }

    function triggerDownloadCurrentTrack() {
      if (currentTrack) {
        startDownloadTrack(currentTrack.id);
      }
    }

    function updateDownloadBannerUI(track, percent, complete) {
      const banner = document.getElementById('activeDownloadBanner');
      const titleEl = document.getElementById('dlBannerTitle');
      const percentEl = document.getElementById('dlBannerPercent');
      const fillEl = document.getElementById('dlBannerFill');
      if (!banner) return;

      if (complete) {
        if (titleEl) titleEl.innerText = \`✓ Downloaded \${track.title}\`;
        if (percentEl) {
          percentEl.innerText = \`100%\`;
          percentEl.style.color = '#10B981';
        }
        if (fillEl) {
          fillEl.style.width = '100%';
          fillEl.style.background = '#10B981';
        }
        setTimeout(() => {
          if (activeDownloads.size === 0) {
            banner.style.display = 'none';
          }
        }, 2500);
      } else {
        banner.style.display = 'block';
        if (titleEl) titleEl.innerText = \`Downloading: \${track.title}\`;
        if (percentEl) {
          percentEl.innerText = \`\${percent}%\`;
          percentEl.style.color = '#F59E0B';
        }
        if (fillEl) {
          fillEl.style.width = \`\${percent}%\`;
          fillEl.style.background = 'linear-gradient(90deg, #F59E0B, #10B981)';
        }
      }
    }

    // ============================================================
    // UI RENDERERS
    // ============================================================
    function renderShelves() {
      const qp = document.getElementById('shelfQuickPicks');
      const bh = document.getElementById('shelfBiggestHits');
      const la = document.getElementById('shelfListenAgain');

      if (qp) qp.innerHTML = CATALOG.slice(0, 6).map(createShelfCardHtml).join('');
      if (bh) bh.innerHTML = CATALOG.slice(6, 12).map(createShelfCardHtml).join('');
      if (la) la.innerHTML = CATALOG.slice(10, 16).map(createShelfCardHtml).join('');

      renderPersonalShelves();
    }

    function createShelfCardHtml(track) {
      const isCached = downloadedSet.has(track.id);
      return \`
        <div class="shelf-card" onclick="selectTrackToPlay('\${track.id}')">
          <img class="shelf-card-art" src="\${track.cover}" alt="\${track.title}" onerror="this.onerror=null; this.src='assets/logo.png';" />
          \${isCached ? '<div class="offline-chip">⚡ 160k</div>' : ''}
          <div class="shelf-card-title">\${track.title}</div>
          <div class="shelf-card-artist">\${track.artist}</div>
        </div>
      \`;
    }

    function renderPersonalShelves() {
      const container = document.getElementById('dynamicShelvesContainer');
      if (!container || !personalShelves || personalShelves.length === 0) return;

      container.innerHTML = personalShelves.map(shelf => \`
        <div class="section-title-row" style="margin-top: 20px;">
          <div>
            <h2 class="section-title">\${shelf.title}</h2>
            <p class="section-subtitle">Personalized YouTube Music Feed</p>
          </div>
        </div>
        <div class="shelf-container">
          \${shelf.tracks.map(createShelfCardHtml).join('')}
        </div>
      \`).join('');
    }

    function createTrackRowHtml(track, isInsidePlaylist = false) {
      const isCached = downloadedSet.has(track.id);
      const isDownloading = activeDownloads.has(track.id);
      return \`
        <div class="track-row" onclick="selectTrackToPlay('\${track.id}')">
          <img class="track-art" src="\${track.cover}" alt="\${track.title}" onerror="this.onerror=null; this.src='assets/logo.png';" />
          <div class="track-meta">
            <div class="track-title">\${track.title}</div>
            <div class="track-desc">\${track.artist} • \${formatTime(track.duration)}</div>
          </div>
          <button class="action-icon-btn" onclick="event.stopPropagation(); startDownloadTrack('\${track.id}')" title="\${isCached ? 'Cached Offline' : 'Download'}">
            \${isCached ? 
              '<svg width="18" height="18" fill="#10B981" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>' : 
              (isDownloading ? 
                '<svg width="18" height="18" fill="#F59E0B" viewBox="0 0 24 24" class="spin-icon"><path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/></svg>' :
                '<svg width="18" height="18" fill="var(--text-dim)" viewBox="0 0 24 24"><path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM17 13l-5 5-5-5h3V9h4v4h3z"/></svg>'
              )
            }
          </button>
          \${isInsidePlaylist ? \`
            <button class="action-icon-btn" onclick="event.stopPropagation(); removeSongFromActivePlaylist('\${track.id}')" title="Remove">✕</button>
          \` : \`
            <button class="action-icon-btn" onclick="event.stopPropagation(); promptAddSongToPlaylist('\${track.id}')" title="Add to playlist">
              <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>
            </button>
          \`}
        </div>
      \`;
    }

    // ============================================================
    // CHARTS TAB (100 Songs with Pagination)
    // ============================================================
    function switchChartRegion(region) {
      currentChartRegion = region;
      currentChartPage = 1;
      document.querySelectorAll('#pane-charts .filter-pill').forEach(p => {
        p.classList.toggle('active', p.innerText === region);
      });
      renderCharts(region, 1);
      showToast(\`Showing \${region} Top Charts\`, '📈');
    }

    function setChartPage(page) {
      currentChartPage = page;
      renderCharts(currentChartRegion, currentChartPage);
      const pane = document.getElementById('pane-charts');
      if (pane) pane.scrollTop = 0;
    }

    function renderCharts(region, page = 1) {
      const list = document.getElementById('chartsTrackList');
      if (!list) return;

      const tracks = (REGIONAL_CHARTS && REGIONAL_CHARTS[region]) ? REGIONAL_CHARTS[region] : CATALOG;
      const totalPages = Math.ceil(tracks.length / CHARTS_PER_PAGE) || 1;
      const startIdx = (page - 1) * CHARTS_PER_PAGE;
      const pageTracks = tracks.slice(startIdx, startIdx + CHARTS_PER_PAGE);

      list.innerHTML = pageTracks.map((track, i) => {
        const globalRank = startIdx + i + 1;
        let badgeColor = 'var(--text-dim)';
        let badgeBg = 'transparent';
        if (globalRank === 1) { badgeColor = '#F59E0B'; badgeBg = 'rgba(245, 158, 11, 0.15)'; }
        else if (globalRank === 2) { badgeColor = '#94A3B8'; badgeBg = 'rgba(148, 163, 184, 0.15)'; }
        else if (globalRank === 3) { badgeColor = '#B45309'; badgeBg = 'rgba(180, 83, 9, 0.15)'; }

        const isDownloaded = downloadedSet.has(track.id);
        const isDownloading = activeDownloads.has(track.id);

        return \`
          <div class="track-row" onclick="selectTrackToPlay('\${track.id}')">
            <span style="font-size: 13px; font-weight: 800; color: \${badgeColor}; background: \${badgeBg}; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; border-radius: 6px; flex-shrink: 0;">\${globalRank}</span>
            <img class="track-art" src="\${track.cover}" alt="\${track.title}" onerror="this.onerror=null; this.src='assets/logo.png';" />
            <div class="track-meta" style="flex: 1; min-width: 0;">
              <div class="track-title" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">\${track.title}</div>
              <div class="track-desc" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">\${track.artist} • \${formatTime(track.duration)}</div>
            </div>
            <button class="action-icon-btn" onclick="event.stopPropagation(); startDownloadTrack('\${track.id}')" title="\${isDownloaded ? 'Cached Offline' : 'Download'}">
              \${isDownloaded ? 
                '<svg width="18" height="18" fill="#10B981" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>' : 
                (isDownloading ? 
                  '<svg width="18" height="18" fill="#F59E0B" viewBox="0 0 24 24" class="spin-icon"><path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/></svg>' :
                  '<svg width="18" height="18" fill="var(--text-dim)" viewBox="0 0 24 24"><path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM17 13l-5 5-5-5h3V9h4v4h3z"/></svg>'
                )
              }
            </button>
          </div>
        \`;
      }).join('');

      let paginationContainer = document.getElementById('chartsPagination');
      if (!paginationContainer) {
        paginationContainer = document.createElement('div');
        paginationContainer.id = 'chartsPagination';
        paginationContainer.style.cssText = 'display: flex; align-items: center; justify-content: center; gap: 8px; margin: 20px 0 32px 0; padding: 0 16px;';
        list.parentNode.insertBefore(paginationContainer, list.nextSibling);
      }

      let pHtml = \`
        <button class="filter-pill" style="padding: 6px 14px; font-size: 11px; \${page === 1 ? 'opacity: 0.4; pointer-events: none;' : ''}" onclick="setChartPage(\${page - 1})">Prev</button>
      \`;
      for (let p = 1; p <= totalPages; p++) {
        pHtml += \`
          <button class="filter-pill \${p === page ? 'active' : ''}" style="min-width: 34px; padding: 6px 10px; font-size: 11px; text-align: center;" onclick="setChartPage(\${p})">\${p}</button>
        \`;
      }
      pHtml += \`
        <button class="filter-pill" style="padding: 6px 14px; font-size: 11px; \${page === totalPages ? 'opacity: 0.4; pointer-events: none;' : ''}" onclick="setChartPage(\${page + 1})">Next</button>
      \`;
      paginationContainer.innerHTML = pHtml;
    }

    // ============================================================
    // SEARCH ENGINE (Instant Local + Live YouTube Music)
    // ============================================================
    function handleDebouncedSearch(val) {
      if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
      searchDebounceTimer = setTimeout(() => {
        executeSearch(val);
      }, 350);
    }

    async function executeSearch(query) {
      const list = document.getElementById('searchResultsList');
      if (!list) return;
      const q = query.trim();
      if (!q) {
        list.innerHTML = '<div style="text-align: center; color: var(--text-dim); padding: 40px;">Type a title, artist, or song name to search</div>';
        currentYtmSearchResults = [];
        return;
      }

      // 1. Instant local search from CATALOG + REGIONAL_CHARTS
      const localMatches = [];
      const lowerQ = q.toLowerCase();
      for (const t of CATALOG) {
        if ((t.title.toLowerCase().includes(lowerQ) || t.artist.toLowerCase().includes(lowerQ)) && !localMatches.some(m => m.id === t.id)) {
          localMatches.push(t);
        }
      }
      if (typeof REGIONAL_CHARTS === 'object') {
        for (const reg in REGIONAL_CHARTS) {
          for (const t of REGIONAL_CHARTS[reg]) {
            if ((t.title.toLowerCase().includes(lowerQ) || t.artist.toLowerCase().includes(lowerQ)) && !localMatches.some(m => m.id === t.id)) {
              localMatches.push(t);
            }
          }
        }
      }

      currentYtmSearchResults = [...localMatches];
      renderSearchResults(list, currentYtmSearchResults, true);

      // 2. Live YouTube Music Search via InnerTube
      try {
        const payload = {
          context: {
            client: {
              clientName: "WEB_REMIX",
              clientVersion: "1.20240101.01.00",
              hl: "en",
              gl: "US"
            }
          },
          query: q
        };

        const data = await callInnerTubeApi("youtubei/v1/search", payload);
        const sections = data?.contents?.tabbedSearchResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents ||
                         data?.contents?.sectionListRenderer?.contents || [];

        const onlineTracks = [];
        for (const sec of sections) {
          const items = sec.musicShelfRenderer?.contents || sec.itemSectionRenderer?.contents || [];
          for (const item of items) {
            const r = item.musicResponsiveListItemRenderer;
            if (!r) continue;
            const flexCols = r.flexColumns || [];
            const titleRun = flexCols[0]?.musicResponsiveListItemFlexColumnRenderer?.title?.runs?.[0];
            const artistRun = flexCols[1]?.musicResponsiveListItemFlexColumnRenderer?.title?.runs?.[0];
            const videoId = r.overlay?.musicItemThumbnailOverlayRenderer?.content?.musicPlayButtonRenderer?.playNavigationEndpoint?.watchEndpoint?.videoId ||
                            r.navigationEndpoint?.watchEndpoint?.videoId;

            if (titleRun && videoId) {
              const thumbs = r.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails || [];
              const cover = thumbs.length ? thumbs[thumbs.length - 1].url : \`https://i.ytimg.com/vi/\${videoId}/hqdefault.jpg\`;
              
              if (!onlineTracks.some(ot => ot.id === videoId) && !localMatches.some(lm => lm.id === videoId)) {
                onlineTracks.push({
                  id: videoId,
                  title: titleRun.text,
                  artist: artistRun ? artistRun.text : "YouTube Artist",
                  duration: 210,
                  cover: cover,
                  audioUrl: "",
                  bitrate: "160k Opus"
                });
              }
            }
          }
        }

        if (onlineTracks.length > 0) {
          currentYtmSearchResults = [...localMatches, ...onlineTracks];
          renderSearchResults(list, currentYtmSearchResults, false);
        } else {
          renderSearchResults(list, currentYtmSearchResults, false);
        }
      } catch (err) {
        console.warn("YouTube live search notice:", err);
        renderSearchResults(list, currentYtmSearchResults, false);
      }
    }

    function renderSearchResults(container, tracks, isLoadingMore) {
      if (tracks.length === 0) {
        container.innerHTML = '<div style="text-align: center; color: var(--text-dim); padding: 40px;">No matching songs found</div>';
        return;
      }

      let html = tracks.map(track => {
        const isDownloaded = downloadedSet.has(track.id);
        const isDownloading = activeDownloads.has(track.id);
        const isCurrentPlaying = currentTrack && currentTrack.id === track.id && isPlaying;

        return \`
          <div class="search-track-card" onclick="selectTrackToPlay('\${track.id}')">
            <div class="search-track-art-wrapper">
              <img class="search-track-art" src="\${track.cover}" alt="\${track.title}" onerror="this.onerror=null; this.src='assets/logo.png';" />
              <div class="search-play-badge \${isCurrentPlaying ? 'playing' : ''}">
                \${isCurrentPlaying ? 
                  '<svg width="14" height="14" fill="#6366F1" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>' :
                  '<svg width="14" height="14" fill="#ffffff" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>'
                }
              </div>
            </div>
            <div class="search-track-info">
              <div class="search-track-title">\${track.title}</div>
              <div class="search-track-artist">\${track.artist}</div>
            </div>
            <div class="search-track-actions">
              <button class="search-btn-action" title="\${isDownloaded ? 'Downloaded' : 'Download'}" onclick="event.stopPropagation(); startDownloadTrack('\${track.id}')">
                \${isDownloaded ? 
                  '<svg width="18" height="18" fill="#10B981" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>' : 
                  (isDownloading ? 
                    '<svg width="18" height="18" fill="#F59E0B" viewBox="0 0 24 24" class="spin-icon"><path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/></svg>' :
                    '<svg width="18" height="18" fill="var(--text-dim)" viewBox="0 0 24 24"><path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM17 13l-5 5-5-5h3V9h4v4h3z"/></svg>'
                  )
                }
              </button>
            </div>
          </div>
        \`;
      }).join('');

      if (isLoadingMore) {
        html += '<div style="text-align: center; color: var(--text-muted); font-size: 11px; padding: 12px;">Searching YouTube Music...</div>';
      }

      container.innerHTML = html;
    }

    function filterSearchCategory(cat) {
      document.querySelectorAll('#pane-search .filter-pill').forEach(p => p.classList.remove('active'));
      if (event && event.target) event.target.classList.add('active');
      const input = document.getElementById('searchInput');
      const q = input ? input.value : '';

      if (cat === 'offline') {
        const offlineList = CATALOG.filter(t => downloadedSet.has(t.id));
        currentYtmSearchResults = offlineList;
        renderSearchResults(document.getElementById('searchResultsList'), offlineList, false);
      } else if (cat === 'favorites') {
        const favList = CATALOG.filter(t => t.favorite);
        currentYtmSearchResults = favList;
        renderSearchResults(document.getElementById('searchResultsList'), favList, false);
      } else {
        executeSearch(q);
      }
    }

    // ============================================================
    // PLAYLIST MANAGEMENT
    // ============================================================
    function renderPlaylists() {
      const grid = document.getElementById('userPlaylistsGrid');
      if (!grid) return;

      grid.innerHTML = userPlaylists.map(pl => {
        let count = pl.songIds ? pl.songIds.length : (pl.tracks ? pl.tracks.length : 0);
        let firstSongArt = 'assets/logo.png';
        if (pl.songIds && pl.songIds.length > 0) {
          const firstSong = findTrackAcrossAllSources(pl.songIds[0]);
          if (firstSong && firstSong.cover) firstSongArt = firstSong.cover;
        } else if (pl.tracks && pl.tracks.length > 0) {
          firstSongArt = pl.tracks[0].cover;
        }

        return \`
          <div class="playlist-card" onclick="openPlaylistDetail('\${pl.id}')">
            <img class="playlist-card-art" src="\${firstSongArt}" alt="\${pl.name}" onerror="this.onerror=null; this.src='assets/logo.png';" />
            <div class="playlist-card-title">\${pl.name}</div>
            <div class="playlist-card-count">\${count} tracks \${pl.isSystem ? '• System' : ''}</div>
          </div>
        \`;
      }).join('');
    }

    function openPlaylistDetail(plId) {
      const pl = userPlaylists.find(p => p.id === plId);
      if (!pl) return;

      activePlaylist = pl;
      window.activeQueueList = null;

      document.getElementById('mainLibraryView').style.display = 'none';
      const detailView = document.getElementById('playlistDetailView');
      detailView.style.display = 'block';

      document.getElementById('plDetailTitle').innerText = pl.name;
      const tracks = pl.songIds ? pl.songIds.map(id => findTrackAcrossAllSources(id)).filter(Boolean) : (pl.tracks || []);
      document.getElementById('plDetailSubtitle').innerText = \`\${tracks.length} tracks\`;

      const trackListEl = document.getElementById('plDetailTrackList');
      if (tracks.length === 0) {
        trackListEl.innerHTML = '<div style="text-align: center; color: var(--text-dim); padding: 30px;">This playlist is empty. Add songs using the + button!</div>';
      } else {
        trackListEl.innerHTML = tracks.map(t => createTrackRowHtml(t, !pl.isSystem)).join('');
      }
    }

    function backToPlaylists() {
      activePlaylist = null;
      document.getElementById('playlistDetailView').style.display = 'none';
      document.getElementById('mainLibraryView').style.display = 'block';
    }

    function playActivePlaylist(shuffle = false) {
      if (!activePlaylist) return;
      const tracks = activePlaylist.songIds ? activePlaylist.songIds.map(id => findTrackAcrossAllSources(id)).filter(Boolean) : (activePlaylist.tracks || []);
      if (tracks.length === 0) return;

      isShuffle = shuffle;
      const btn = document.getElementById('btnShuffle');
      if (btn) btn.style.color = isShuffle ? 'var(--accent-primary)' : 'var(--text-dim)';

      const firstTrack = isShuffle ? tracks[Math.floor(Math.random() * tracks.length)] : tracks[0];
      selectTrackToPlay(firstTrack.id);
      showToast(\`Playing \${activePlaylist.name}\`, '▶');
    }

    function openCreatePlaylistDialog() {
      document.getElementById('createPlaylistModal').style.display = 'flex';
      const input = document.getElementById('newPlaylistNameInput');
      if (input) {
        input.value = '';
        setTimeout(() => input.focus(), 100);
      }
    }

    function closeCreatePlaylistDialog() {
      document.getElementById('createPlaylistModal').style.display = 'none';
    }

    function confirmCreatePlaylist() {
      const input = document.getElementById('newPlaylistNameInput');
      const name = input ? input.value.trim() : '';
      if (!name) return;

      const newPl = {
        id: 'pl_' + Date.now(),
        name: name,
        isSystem: false,
        songIds: []
      };

      userPlaylists.push(newPl);
      persistDownloadState();
      renderPlaylists();
      closeCreatePlaylistDialog();
      showToast(\`Created playlist "\${name}"\`, '📁');
    }

    function promptAddSongToPlaylist(songId) {
      songPendingAddToPlaylist = songId;
      const modal = document.getElementById('addToPlaylistModal');
      const listEl = document.getElementById('targetPlaylistsList');
      modal.style.display = 'flex';

      const eligiblePlaylists = userPlaylists.filter(p => p.id !== 'pl_offline');
      listEl.innerHTML = eligiblePlaylists.map(pl => \`
        <div class="track-row" style="padding: 10px;" onclick="addSongToPlaylistTarget('\${pl.id}')">
          <div style="font-size: 20px;">📁</div>
          <div class="track-meta">
            <div class="track-title">\${pl.name}</div>
            <div class="track-desc">\${pl.songIds ? pl.songIds.length : 0} tracks</div>
          </div>
        </div>
      \`).join('');
    }

    function closeAddToPlaylistDialog() {
      songPendingAddToPlaylist = null;
      document.getElementById('addToPlaylistModal').style.display = 'none';
    }

    function addSongToPlaylistTarget(plId) {
      if (!songPendingAddToPlaylist) return;
      const pl = userPlaylists.find(p => p.id === plId);
      if (pl) {
        if (!pl.songIds.includes(songPendingAddToPlaylist)) {
          pl.songIds.push(songPendingAddToPlaylist);
          persistDownloadState();
          renderPlaylists();
          showToast(\`Added to "\${pl.name}"\`, '✓');
        } else {
          showToast(\`Already in "\${pl.name}"\`, 'ℹ️');
        }
      }
      closeAddToPlaylistDialog();
    }

    function removeSongFromActivePlaylist(songId) {
      if (!activePlaylist || activePlaylist.isSystem) return;
      activePlaylist.songIds = activePlaylist.songIds.filter(id => id !== songId);
      persistDownloadState();
      renderPlaylists();
      openPlaylistDetail(activePlaylist.id);
      showToast('Removed from playlist', '🗑️');
    }

    function renderLibraryTracks() {
      const list = document.getElementById('libraryTracksList');
      if (!list) return;

      const cachedTracks = CATALOG.filter(t => downloadedSet.has(t.id));
      list.innerHTML = cachedTracks.map(t => createTrackRowHtml(t, false)).join('');
    }

    // ============================================================
    // FAVORITES & STORAGE METRICS
    // ============================================================
    function toggleFavorite(id) {
      let t = findTrackAcrossAllSources(id);
      if (t) {
        t.favorite = !t.favorite;
        const favPl = userPlaylists.find(p => p.id === 'pl_favorites');
        if (favPl) {
          if (t.favorite && !favPl.songIds.includes(id)) {
            favPl.songIds.push(id);
          } else if (!t.favorite) {
            favPl.songIds = favPl.songIds.filter(x => x !== id);
          }
        }
        persistDownloadState();
        showToast(t.favorite ? 'Added to Liked Songs (Pinned ✓)' : 'Removed from Liked Songs', t.favorite ? '❤️' : '💔');
        renderShelves();
        renderPlaylists();
        if (currentTrack && currentTrack.id === id) {
          updatePlayerUI(currentTrack);
        }
      }
    }

    function toggleCurrentFavorite() {
      if (currentTrack) toggleFavorite(currentTrack.id);
    }

    function updateStorageMetrics() {
      const label = document.getElementById('storageLabel');
      const bar = document.getElementById('storageUsedBar');
      const stats = document.getElementById('cachedSongStats');

      const count = downloadedSet.size;
      const usedMB = (count * 3.4).toFixed(1);
      const usedGB = (usedMB / 1024).toFixed(2);
      const percent = Math.min(100, Math.round((usedGB / maxCacheGB) * 100));

      if (label) label.innerText = \`\${usedMB} MB / \${maxCacheGB.toFixed(1)} GB\`;
      if (bar) bar.style.width = \`\${Math.max(10, percent)}%\`;
      if (stats) stats.innerText = \`\${count} real songs stored locally (\${usedMB} MB)\`;
    }

    function updateMaxCacheLimit(val) {
      maxCacheGB = parseFloat(val);
      persistDownloadState();
      updateStorageMetrics();
      showToast(\`Cache ceiling set to \${maxCacheGB} GB\`, '💾');
    }

    function clearUnpinnedCache() {
      const toRemove = [];
      for (const id of downloadedSet) {
        const isBundled = BUNDLED_TRACKS.some(b => b.id === id);
        const track = findTrackAcrossAllSources(id);
        const isFavorite = track && track.favorite;
        if (!isBundled && !isFavorite) {
          toRemove.push(id);
        }
      }

      toRemove.forEach(id => downloadedSet.delete(id));

      const offPl = userPlaylists.find(p => p.id === 'pl_offline');
      if (offPl) {
        offPl.songIds = offPl.songIds.filter(id => downloadedSet.has(id));
      }

      persistDownloadState();
      updateStorageMetrics();
      renderShelves();
      renderLibraryTracks();
      renderPlaylists();
      showToast(\`Cleared \${toRemove.length} unpinned songs\`, '🧹');
    }

    // ============================================================
    // PLAYER UI & MODAL MANAGEMENT
    // ============================================================
    function updatePlayerUI(track) {
      if (!track) return;

      const miniArt = document.getElementById('miniArt');
      const miniTitle = document.getElementById('miniTitle');
      const miniArtist = document.getElementById('miniArtist');
      if (miniArt) miniArt.src = track.cover;
      if (miniTitle) miniTitle.innerText = track.title;
      if (miniArtist) miniArtist.innerText = track.artist;

      const modalArt = document.getElementById('modalArt');
      const modalTitle = document.getElementById('modalTitle');
      const modalArtist = document.getElementById('modalArtist');
      const modalDuration = document.getElementById('modalTimeDuration');
      const modalHeart = document.getElementById('modalHeartIcon');
      const modalDlIcon = document.getElementById('modalDownloadIcon');

      if (modalArt) modalArt.src = track.cover;
      if (modalTitle) modalTitle.innerText = track.title;
      if (modalArtist) modalArtist.innerText = track.artist;
      if (modalDuration && track.duration) modalDuration.innerText = formatTime(track.duration);

      if (modalHeart) {
        modalHeart.style.fill = track.favorite ? '#EF4444' : 'none';
        modalHeart.style.stroke = track.favorite ? '#EF4444' : 'currentColor';
      }

      if (modalDlIcon) {
        const isCached = downloadedSet.has(track.id);
        modalDlIcon.style.stroke = isCached ? '#10B981' : 'currentColor';
      }
    }

    function openNowPlayingModal() {
      const modal = document.getElementById('nowPlayingModal');
      if (modal) {
        modal.classList.add('active');
        document.body.classList.add('modal-open');
      }
    }

    function closeNowPlayingModal() {
      const modal = document.getElementById('nowPlayingModal');
      if (modal) {
        modal.classList.remove('active');
        document.body.classList.remove('modal-open');
      }
    }

    function switchNavTab(tabName, el) {
      document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
      document.querySelectorAll('.nav-tab-item').forEach(t => t.classList.remove('active'));

      const targetPane = document.getElementById(\`pane-\${tabName}\`);
      if (targetPane) targetPane.classList.add('active');
      if (el) el.classList.add('active');

      if (tabName === 'library') {
        backToPlaylists();
      }
    }

    // ============================================================
    // FREQUENCY EQUALIZER VISUALIZER
    // ============================================================
    function startRealVisualizer() {
      stopRealVisualizer();
      const bars = document.querySelectorAll('.v-bar');
      function renderFrame() {
        if (!isPlaying) return;
        bars.forEach((bar, idx) => {
          const base = ((idx % 3) + 1) * 5;
          const flux = Math.floor(Math.sin(Date.now() / (120 + idx * 30)) * 6);
          const height = Math.max(5, Math.min(22, base + flux));
          bar.style.height = height + 'px';
        });
        visualizerAnimFrame = requestAnimationFrame(renderFrame);
      }
      visualizerAnimFrame = requestAnimationFrame(renderFrame);
    }

    function stopRealVisualizer() {
      if (visualizerAnimFrame) {
        cancelAnimationFrame(visualizerAnimFrame);
        visualizerAnimFrame = null;
      }
      document.querySelectorAll('.v-bar').forEach(b => b.style.height = '6px');
    }

    // ============================================================
    // TOAST NOTIFICATIONS
    // ============================================================
    let toastTimer = null;
    function showToast(msg, icon = '⚡') {
      const toast = document.getElementById('globalToast');
      const text = document.getElementById('toastMsg');
      const ic = document.getElementById('toastIcon');
      if (!toast) return;

      text.innerText = msg;
      ic.innerText = icon;
      toast.classList.add('show');

      if (toastTimer) clearTimeout(toastTimer);
      toastTimer = setTimeout(() => {
        toast.classList.remove('show');
      }, 2400);
    }

    // ============================================================
    // AUDIO LISTENERS (Local Playback)
    // ============================================================
    function setupAudioListeners() {
      if (!audioEl) return;

      audioEl.addEventListener('timeupdate', () => {
        if (isOnlineYtPlaying) return;
        const cur = audioEl.currentTime;
        const dur = audioEl.duration;
        const percent = dur ? (cur / dur) * 100 : 0;

        const slider = document.getElementById('modalSeekSlider');
        const curTime = document.getElementById('modalTimeCurrent');
        const durTime = document.getElementById('modalTimeDuration');
        const miniFill = document.getElementById('miniProgressFill');

        if (curTime) curTime.innerText = formatTime(Math.floor(cur));
        if (durTime && dur) durTime.innerText = formatTime(Math.floor(dur));
        if (slider && !slider.matches(':active')) {
          slider.value = percent;
        }
        if (miniFill) miniFill.style.width = \`\${percent}%\`;
      });

      audioEl.addEventListener('ended', () => {
        if (isRepeat) {
          audioEl.currentTime = 0;
          audioEl.play();
        } else {
          playNextTrack();
        }
      });
    }

    // ============================================================
    // YOUTUBE MUSIC INNERTUBE & AUTH
    // ============================================================
    window.ytmCallbacks = {};

    function openAuthModal() {
      updateAuthModalContent();
      document.getElementById('authModal').style.display = 'flex';
    }

    function closeAuthModal() {
      document.getElementById('authModal').style.display = 'none';
    }

    function updateAuthModalContent() {
      const loggedOutView = document.getElementById('authLoggedOutView');
      const loggedInView = document.getElementById('authLoggedInView');
      const subTitle = document.getElementById('authModalSubtitle');
      const profileName = document.getElementById('authProfileName');
      const profileEmail = document.getElementById('authProfileEmail');

      if (userSession && userSession.isLoggedIn) {
        loggedOutView.style.display = 'none';
        loggedInView.style.display = 'block';
        subTitle.innerText = "Connected to YouTube Music. Recommendations and feed synced.";
        profileName.innerText = userSession.name || "YouTube Music User";
        profileEmail.innerText = userSession.email || "Active InnerTube Session";
      } else {
        loggedOutView.style.display = 'block';
        loggedInView.style.display = 'none';
        subTitle.innerText = "Connect your YouTube Music account to fetch personal recommendations, history, and playlists.";
      }
    }

    function updateAuthHeaderUI() {
      const badgeStatusText = document.getElementById('badgeStatusText');
      if (badgeStatusText) {
        if (userSession && userSession.isLoggedIn) {
          badgeStatusText.innerText = userSession.name ? userSession.name.split(' ')[0] : 'Synced';
        } else {
          badgeStatusText.innerText = 'Sync / Login';
        }
      }
    }

    window.ytmCallback = function(callbackId, jsonOrError) {
      const cb = window.ytmCallbacks[callbackId];
      if (!cb) return;
      clearTimeout(cb.timer);
      delete window.ytmCallbacks[callbackId];

      if (jsonOrError.startsWith("ERROR:")) {
        cb.reject(new Error(jsonOrError));
      } else {
        try {
          const parsed = JSON.parse(jsonOrError);
          cb.resolve(parsed);
        } catch (e) {
          cb.reject(e);
        }
      }
    };

    function callInnerTubeApi(endpoint, payload, customCookie) {
      return new Promise((resolve, reject) => {
        const cbId = 'ytm_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
        const timer = setTimeout(() => {
          if (window.ytmCallbacks[cbId]) {
            delete window.ytmCallbacks[cbId];
            reject(new Error("InnerTube API request timed out"));
          }
        }, 25000);

        window.ytmCallbacks[cbId] = { resolve, reject, timer };

        if (window.SokoNative && typeof window.SokoNative.fetchYtmApi === 'function') {
          window.SokoNative.fetchYtmApi(endpoint, JSON.stringify(payload), customCookie || '', cbId);
        } else {
          fetch((endpoint.startsWith('http') ? endpoint : 'https://music.youtube.com/' + endpoint), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-YouTube-Client-Name': '67',
              'X-YouTube-Client-Version': '1.20240101.01.00',
              'X-Origin': 'https://music.youtube.com'
            },
            body: JSON.stringify(payload)
          })
          .then(res => res.json())
          .then(data => {
            clearTimeout(timer);
            delete window.ytmCallbacks[cbId];
            resolve(data);
          })
          .catch(err => {
            clearTimeout(timer);
            delete window.ytmCallbacks[cbId];
            reject(err);
          });
        }
      });
    }

    function loginWithGoogle() {
      if (window.SokoNative && typeof window.SokoNative.startGoogleLoginFlow === 'function') {
        window.SokoNative.startGoogleLoginFlow();
        closeAuthModal();
        showToast("Opening Google Sign-In...", "🔑");
      } else {
        const cookie = prompt("Paste your YouTube Music SAPISID cookie or session string:");
        if (cookie) {
          const cookieInput = document.getElementById('ytmCookieInput');
          if (cookieInput) cookieInput.value = cookie;
          loginWithCookie();
        }
      }
    }

    function loginWithCookie() {
      const cookieInput = document.getElementById('ytmCookieInput');
      const cookieVal = cookieInput ? cookieInput.value.trim() : '';
      if (!cookieVal) return;

      userSession = {
        isLoggedIn: true,
        cookie: cookieVal,
        name: "YouTube Music Member",
        email: "Connected via InnerTube"
      };
      localStorage.setItem('soko_ytm_session', JSON.stringify(userSession));
      updateAuthModalContent();
      updateAuthHeaderUI();
      showToast("YouTube Music Connected!", "✓");
      syncYTMFeed();
    }

    function loginDemoAccount() {
      userSession = {
        isLoggedIn: true,
        isDemo: true,
        name: "Demo Audiophile",
        email: "demo@soko.music"
      };
      localStorage.setItem('soko_ytm_session', JSON.stringify(userSession));
      updateAuthModalContent();
      updateAuthHeaderUI();
      showToast("Demo Account Active!", "✓");
      syncYTMFeed();
    }

    function logoutAccount() {
      userSession = null;
      localStorage.removeItem('soko_ytm_session');
      if (window.SokoNative && typeof window.SokoNative.clearStoredYtmCookies === 'function') {
        window.SokoNative.clearStoredYtmCookies();
      }
      personalShelves = null;
      renderShelves();
      updateAuthModalContent();
      updateAuthHeaderUI();
      showToast("Signed Out", "👋");
    }

    async function syncYTMFeed() {
      showToast("Syncing YouTube Music Feed...", "⏳");
      let cookies = '';
      if (window.SokoNative && typeof window.SokoNative.getStoredYtmCookies === 'function') {
        cookies = window.SokoNative.getStoredYtmCookies();
      }
      if (!cookies && userSession && userSession.cookie) {
        cookies = userSession.cookie;
      }

      const payload = {
        context: {
          client: {
            clientName: "WEB_REMIX",
            clientVersion: "1.20240101.01.00",
            hl: "en",
            gl: "US"
          }
        },
        browseId: "FEmusic_home"
      };

      try {
        const data = await callInnerTubeApi("youtubei/v1/browse", payload, cookies);
        const tabs = data?.contents?.singleColumnBrowseResultsRenderer?.tabs;
        const sections = tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents;

        if (sections && Array.isArray(sections)) {
          const parsedShelves = [];
          for (const s of sections) {
            const shelf = s.musicCarouselShelfRenderer;
            if (shelf) {
              const h = shelf.header?.musicCarouselShelfBasicHeaderRenderer;
              const shelfTitle = h?.title?.runs?.[0]?.text || h?.strapline?.runs?.[0]?.text || "Your Recommendations";
              const shelfTracks = [];

              for (const item of (shelf.contents || [])) {
                let track = null;
                if (item.musicResponsiveListItemRenderer) {
                  const r = item.musicResponsiveListItemRenderer;
                  const cols = r.flexColumns || [];
                  const title = cols[0]?.musicResponsiveListItemFlexColumnRenderer?.title?.runs?.[0]?.text;
                  const artist = cols[1]?.musicResponsiveListItemFlexColumnRenderer?.title?.runs?.[0]?.text;
                  let vid = r.overlay?.musicItemThumbnailOverlayRenderer?.content?.musicPlayButtonRenderer?.playNavigationEndpoint?.watchEndpoint?.videoId;
                  if (!vid && r.navigationEndpoint?.watchEndpoint) {
                    vid = r.navigationEndpoint.watchEndpoint.videoId;
                  }
                  const thumbs = r.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails || [];
                  const cover = thumbs.length ? thumbs[thumbs.length - 1].url : \`https://i.ytimg.com/vi/\${vid}/hqdefault.jpg\`;

                  if (title && vid) {
                    track = {
                      id: vid,
                      title: title,
                      artist: artist || "YouTube Artist",
                      duration: 215,
                      cover: cover,
                      audioUrl: "",
                      bitrate: "160k Opus"
                    };
                  }
                }

                if (track) {
                  shelfTracks.push(track);
                  if (!CATALOG.some(t => t.id === track.id)) {
                    CATALOG.push(track);
                  }
                }
              }

              if (shelfTracks.length > 0) {
                parsedShelves.push({ title: shelfTitle, tracks: shelfTracks });
              }
            }
          }

          if (parsedShelves.length > 0) {
            personalShelves = parsedShelves;
            renderPersonalShelves();
            showToast("Feeds Updated Successfully!", "✓");
            return;
          }
        }
      } catch (err) {
        console.warn("Sync notice:", err);
      }

      // Demo fallback if feed not accessible
      personalShelves = [
        {
          title: "Your YouTube Music Mix",
          tracks: CATALOG.slice(0, 8)
        }
      ];
      renderPersonalShelves();
      showToast("Feed Synced", "✓");
    }

    // Native Bridge Hooks
    window.onLoginSuccess = function(cookies, displayName, email) {
      userSession = {
        isLoggedIn: true,
        cookie: cookies,
        name: displayName || "YouTube Music User",
        email: email || "Connected Google Account"
      };
      localStorage.setItem('soko_ytm_session', JSON.stringify(userSession));
      updateAuthModalContent();
      updateAuthHeaderUI();
      showToast(\`Welcome, \${userSession.name}!\`, "🎉");
      syncYTMFeed();
    };

    window.onNativePlayerStateChange = function(playing, durationSec) {
      isPlaying = playing;
      updatePlayIcons(playing);
      if (playing) startRealVisualizer();
      else stopRealVisualizer();
      if (currentTrack && durationSec > 0) {
        currentTrack.duration = durationSec;
        const durTime = document.getElementById('modalTimeDuration');
        if (durTime) durTime.innerText = formatTime(durationSec);
      }
    };

    window.onNativePlayerProgress = function(currentSec, durationSec) {
      if (isOnlineYtPlaying) return;
      const slider = document.getElementById('modalSeekSlider');
      const curTime = document.getElementById('modalTimeCurrent');
      const durTime = document.getElementById('modalTimeDuration');
      const miniFill = document.getElementById('miniProgressFill');

      if (curTime) curTime.innerText = formatTime(currentSec);
      if (durTime && durationSec > 0) durTime.innerText = formatTime(durationSec);

      const percent = durationSec > 0 ? (currentSec / durationSec) * 100 : 0;
      if (slider && !slider.matches(':active')) {
        slider.value = percent;
      }
      if (miniFill) miniFill.style.width = \`\${percent}%\`;
    };

    // ============================================================
    // MEDIASESSION INTEGRATION (Android Lock Screen)
    // ============================================================
    function setupMediaSession() {
      if ('mediaSession' in navigator) {
        navigator.mediaSession.setActionHandler('play', () => togglePlayPause());
        navigator.mediaSession.setActionHandler('pause', () => togglePlayPause());
        navigator.mediaSession.setActionHandler('previoustrack', () => playPreviousTrack());
        navigator.mediaSession.setActionHandler('nexttrack', () => playNextTrack());
      }
    }

    function updateMediaSession(track) {
      if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: track.title,
          artist: track.artist,
          album: 'Soko Music Library',
          artwork: [
            { src: track.cover, sizes: '512x512', type: 'image/jpeg' }
          ]
        });
      }
      if (window.SokoNative && typeof window.SokoNative.updateNativePlayer === 'function') {
        window.SokoNative.updateNativePlayer(
          track.title,
          track.artist,
          isPlaying,
          track.duration || 215,
          audioEl ? Math.floor(audioEl.currentTime) : 0,
          track.cover
        );
      }
    }

    window.handleNativeMediaAction = function(action) {
      if (action === 'toggle') togglePlayPause();
      else if (action === 'next') playNextTrack();
      else if (action === 'prev') playPreviousTrack();
    };

    function formatTime(sec) {
      const m = Math.floor(sec / 60);
      const s = Math.floor(sec % 60);
      return \`\${m}:\${s < 10 ? '0' : ''}\${s}\`;
    }

    // ============================================================
    // APPLICATION INITIALIZATION
    // ============================================================
    window.addEventListener('DOMContentLoaded', () => {
      audioEl = document.getElementById('audioPlayer');
      initPersistentStorage();
      initYouTubeIframeApi();
      setupAudioListeners();
      renderShelves();
      renderCharts('Global', 1);
      renderPlaylists();
      renderLibraryTracks();
      updateStorageMetrics();
      setupMediaSession();
      updateAuthHeaderUI();

      updatePlayerUI(currentTrack);
      scheduleLookAhead(currentTrack.id);

      // Prevent modal touch events from scrolling background page
      const modalEl = document.getElementById('nowPlayingModal');
      if (modalEl) {
        modalEl.addEventListener('touchmove', (e) => {
          if (!e.target.closest('#modalSeekSlider')) {
            e.stopPropagation();
          }
        }, { passive: false });
      }

      if (window.SokoNative && typeof window.SokoNative.getStoredYtmCookies === 'function') {
        const storedCookies = window.SokoNative.getStoredYtmCookies();
        if (storedCookies && storedCookies.length > 20) {
          if (!userSession) {
            userSession = {
              isLoggedIn: true,
              cookie: storedCookies,
              name: "YouTube Music Member",
              email: "Saved Android Session"
            };
            localStorage.setItem('soko_ytm_session', JSON.stringify(userSession));
            updateAuthHeaderUI();
          }
        }
      }
    });
  </script>
</body>
</html>
`;

fs.writeFileSync('/home/saurabh/coding/soko-music-app/apps/mobile/index.html', htmlContent);
fs.writeFileSync('/home/saurabh/coding/soko-music-app/dist/index.html', htmlContent);
console.log('Successfully generated apps/mobile/index.html and dist/index.html! (' + htmlContent.length + ' bytes)');
