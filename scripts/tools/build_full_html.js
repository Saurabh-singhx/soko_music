const fs = require('fs');
const path = require('path');

let chartsData;
const readyJsonPath = path.resolve(__dirname, '../assets/regional_charts.json');
if (fs.existsSync(readyJsonPath)) {
  chartsData = JSON.parse(fs.readFileSync(readyJsonPath, 'utf8'));
} else {
  chartsData = JSON.parse(fs.readFileSync('/tmp/regional_charts_ready.json', 'utf8'));
}

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
      box-sizing: border-box;
      padding-bottom: calc(var(--tab-bar-height) + var(--safe-bottom) + 16px);
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
      gap: 10px;
      min-width: 44px;
      min-height: 44px;
      cursor: pointer;
    }

    .brand-icon {
      width: 28px;
      height: 28px;
      object-fit: contain;
      background: transparent;
      border: none;
      border-radius: 0;
      box-shadow: none;
      filter: drop-shadow(0 0 6px rgba(99, 102, 241, 0.45));
    }

    .brand-text {
      font-size: 19px;
      font-weight: 800;
      letter-spacing: -0.5px;
      color: #FFFFFF;
      display: inline-flex;
      align-items: center;
      line-height: 1;
    }

    .brand-text-sub {
      font-size: 13px;
      font-weight: 500;
      color: var(--text-muted);
      letter-spacing: 0;
      margin-left: 4px;
    }

    .status-badge-container {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(16, 185, 129, 0.12);
      border: 1px solid rgba(16, 185, 129, 0.3);
      padding: 6px 12px;
      min-height: 40px;
      box-sizing: border-box;
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
      padding-top: 6px;
      padding-bottom: calc(var(--mini-player-height) + var(--tab-bar-height) + var(--safe-bottom) + 84px);
      -webkit-overflow-scrolling: touch;
    }

    .tab-pane {
      display: none;
      padding: 14px 16px;
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
      align-items: stretch;
      gap: 12px;
      overflow-x: auto;
      overflow-y: hidden;
      margin: 0 -16px;
      padding: 4px 16px 14px 16px;
      scroll-snap-type: x mandatory;
      -webkit-overflow-scrolling: touch;
      scrollbar-width: none;
    }
    .shelf-container::-webkit-scrollbar {
      display: none;
      width: 0;
      height: 0;
    }

    .shelf-card {
      flex: 0 0 140px;
      width: 140px;
      min-width: 140px;
      max-width: 140px;
      height: 206px;
      min-height: 206px;
      max-height: 206px;
      scroll-snap-align: start;
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 10px;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      transition: transform 0.15s ease, background 0.15s ease, border-color 0.15s ease;
      position: relative;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25);
      box-sizing: border-box;
    }
    .shelf-card:active {
      transform: scale(0.96);
      background: var(--bg-card-hover);
    }

    .shelf-card-art-wrapper {
      position: relative;
      width: 100%;
      aspect-ratio: 1;
      border-radius: var(--radius-sm);
      overflow: hidden;
      background: #151A24;
      margin-bottom: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
      flex-shrink: 0;
    }

    .shelf-card-art {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
      border-radius: var(--radius-sm);
    }

    .shelf-card-info {
      width: 100%;
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      padding: 2px 2px 0 2px;
      overflow: hidden;
    }

    .shelf-card-title {
      font-size: 12px;
      font-weight: 700;
      line-height: 1.35;
      color: var(--text-primary);
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      text-overflow: ellipsis;
      width: 100%;
      height: 2.7em;
      min-height: 2.7em;
      max-height: 2.7em;
      word-break: normal;
      overflow-wrap: anywhere;
    }

    .shelf-card-artist {
      font-size: 11px;
      color: var(--text-muted);
      line-height: 1.2;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      width: 100%;
      margin-top: 4px;
    }

    /* YouTube Music Shelf Badges & Header Elements */
    .ytm-shelf-badge {
      display: block;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: var(--text-dim);
      margin-bottom: 2px;
    }

    /* YouTube Music 4-Row Horizontal Scrolling Grid Shelf */
    .ytm-grid-shelf {
      display: grid;
      grid-template-rows: repeat(4, 56px);
      grid-auto-flow: column;
      grid-auto-columns: min(325px, calc(100vw - 44px));
      gap: 8px 12px;
      overflow-x: auto;
      scroll-snap-type: x mandatory;
      margin: 0 -16px;
      padding: 4px 16px 14px 16px;
      -webkit-overflow-scrolling: touch;
      scrollbar-width: none;
    }
    .ytm-grid-shelf::-webkit-scrollbar {
      display: none;
      width: 0;
      height: 0;
    }

    /* YouTube Music Horizontal Line-Like Card */
    .ytm-line-card {
      scroll-snap-align: start;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 6px 10px;
      border-radius: var(--radius-md);
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      cursor: pointer;
      height: 56px;
      min-height: 56px;
      max-height: 56px;
      transition: background 0.15s ease, transform 0.1s ease, border-color 0.15s ease;
      position: relative;
      box-sizing: border-box;
    }
    .ytm-line-card:active {
      background: var(--bg-card-hover);
      transform: scale(0.98);
      border-color: rgba(99, 102, 241, 0.3);
    }

    .ytm-line-art-wrapper {
      position: relative;
      width: 44px;
      height: 44px;
      min-width: 44px;
      min-height: 44px;
      border-radius: 6px;
      overflow: hidden;
      background: #151A24;
      flex-shrink: 0;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
    }

    .ytm-line-art {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .ytm-line-info {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 3px;
    }

    .ytm-line-title {
      font-size: 13px;
      font-weight: 700;
      color: var(--text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      line-height: 1.25;
    }

    .ytm-line-artist {
      font-size: 11px;
      color: var(--text-muted);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      line-height: 1.2;
    }

    .ytm-line-actions {
      display: flex;
      align-items: center;
      gap: 4px;
      flex-shrink: 0;
    }

    .ytm-line-btn {
      width: 40px;
      height: 40px;
      min-width: 40px;
      min-height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: transparent;
      border: none;
      color: var(--text-dim);
      border-radius: 50%;
      cursor: pointer;
      transition: color 0.15s, background 0.15s;
      padding: 0;
      box-sizing: border-box;
    }
    .ytm-line-btn:active {
      background: rgba(255, 255, 255, 0.1);
      color: #fff;
    }

    .offline-chip-mini {
      position: absolute;
      bottom: 2px;
      right: 2px;
      background: rgba(7, 9, 14, 0.85);
      border: 1px solid rgba(16, 185, 129, 0.6);
      color: #10B981;
      font-size: 10px;
      font-weight: 800;
      padding: 1px 4px;
      border-radius: 3px;
      line-height: 1;
    }

    .mix-card-badge {
      position: absolute;
      bottom: 6px;
      right: 6px;
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(4px);
      -webkit-backdrop-filter: blur(4px);
      border: 1px solid rgba(255, 255, 255, 0.15);
      color: #fff;
      font-size: 10px;
      font-weight: 700;
      padding: 3px 6px;
      border-radius: 4px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* Library Offline Songs Sort Bar */
    .library-sort-container {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
      overflow-x: auto;
      scrollbar-width: none;
      -webkit-overflow-scrolling: touch;
      padding: 4px 2px 6px;
    }
    .library-sort-container::-webkit-scrollbar {
      display: none;
      width: 0;
      height: 0;
    }

    .library-sort-label {
      font-size: 11px;
      font-weight: 700;
      color: var(--text-dim);
      text-transform: uppercase;
      letter-spacing: 0.6px;
      flex-shrink: 0;
    }

    .library-sort-chips {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: nowrap;
    }

    .library-sort-chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 14px;
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-full);
      color: var(--text-muted);
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.15s ease;
      min-height: 40px;
      min-width: 40px;
      box-sizing: border-box;
      flex-shrink: 0;
    }
    .library-sort-chip:active {
      transform: scale(0.96);
    }
    .library-sort-chip.active {
      background: rgba(99, 102, 241, 0.22);
      border-color: var(--accent-primary);
      color: #FFFFFF;
      box-shadow: 0 0 12px rgba(99, 102, 241, 0.35);
    }

    .sort-dir-arrow {
      font-size: 11px;
      font-weight: 800;
      color: var(--accent-cyan);
      margin-left: 2px;
    }

    .offline-chip {
      position: absolute;
      top: 6px;
      right: 6px;
      background: rgba(7, 9, 14, 0.88);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      border: 1px solid rgba(16, 185, 129, 0.5);
      color: #10B981;
      font-size: 10px;
      font-weight: 800;
      padding: 2px 6px;
      border-radius: var(--radius-full);
      display: flex;
      align-items: center;
      gap: 3px;
      letter-spacing: 0.02em;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
      z-index: 2;
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
      gap: 10px;
      padding: 7px 10px;
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
      width: 42px;
      height: 42px;
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
      font-size: 13.5px;
      font-weight: 600;
      color: var(--text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      line-height: 1.3;
    }

    .track-desc {
      font-size: 11.5px;
      color: var(--text-muted);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-top: 2px;
      line-height: 1.2;
    }

    .action-icon-btn {
      width: 40px;
      height: 40px;
      min-width: 40px;
      min-height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      background: transparent;
      border: none;
      color: var(--text-dim);
      cursor: pointer;
      flex-shrink: 0;
      transition: color 0.15s ease, background 0.15s ease;
      box-sizing: border-box;
    }
    .action-icon-btn:active {
      color: var(--text-primary);
      background: rgba(255, 255, 255, 0.08);
    }

    .action-icon-btn-compact {
      width: 40px;
      height: 40px;
      min-width: 40px;
      min-height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      background: transparent;
      border: none;
      color: var(--text-dim);
      cursor: pointer;
      flex-shrink: 0;
      transition: color 0.15s ease, background 0.15s ease;
      box-sizing: border-box;
    }
    .action-icon-btn-compact:active {
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
      padding: 8px 16px;
      min-height: 40px;
      min-width: 44px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      box-sizing: border-box;
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

    .shelf-play-all-btn {
      font-size: 11px !important;
      font-weight: 600;
      padding: 6px 14px !important;
      min-height: 40px;
      min-width: 64px;
      cursor: pointer;
    }

    .auth-banner-refresh-btn {
      font-size: 11px !important;
      font-weight: 600;
      padding: 6px 14px !important;
      min-height: 40px;
      min-width: 76px;
      cursor: pointer;
    }

    /* Native Swipe-Down Pull-to-Refresh Styles */
    .ptr-container {
      overflow: hidden;
      max-height: 0px;
      height: 0px;
      opacity: 0;
      transition: height 0.25s cubic-bezier(0.2, 0.8, 0.2, 1), max-height 0.25s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.2s ease, margin-bottom 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 0px;
      pointer-events: none;
      width: 100%;
    }
    .ptr-container.pulling {
      transition: none !important;
    }
    .ptr-container.active {
      margin-bottom: 14px;
      opacity: 1;
    }
    .ptr-content {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      padding: 8px 18px;
      background: rgba(21, 27, 39, 0.92);
      border: 1px solid rgba(99, 102, 241, 0.35);
      border-radius: var(--radius-full);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5), 0 0 12px rgba(99, 102, 241, 0.25);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
    }
    .ptr-icon-wrapper {
      width: 22px;
      height: 22px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--accent-cyan);
    }
    .ptr-arrow {
      transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
      stroke: var(--accent-cyan);
    }
    .ptr-arrow.flipped {
      transform: rotate(180deg);
      stroke: #10B981;
    }
    .ptr-spinner {
      width: 18px;
      height: 18px;
      border: 2px solid rgba(6, 182, 212, 0.25);
      border-top-color: var(--accent-cyan);
      border-radius: 50%;
    }
    .ptr-text {
      font-size: 12px;
      font-weight: 600;
      color: var(--text-primary);
      letter-spacing: 0.2px;
    }

    .auth-banner-signin-btn {
      font-size: 12px !important;
      min-height: 40px;
      min-width: 76px;
      padding: 8px 16px !important;
      border: none !important;
      background: #FF0000 !important;
      color: #fff !important;
      font-weight: 700 !important;
      flex-shrink: 0;
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
      padding: 10px 10px 12px 10px;
      cursor: pointer;
      position: relative;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      transition: transform 0.15s ease, background 0.15s ease, border-color 0.15s ease;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25);
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
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
    }
    .playlist-card-info {
      padding: 2px;
      display: flex;
      flex-direction: column;
    }
    .playlist-card-title {
      font-size: 13px;
      font-weight: 700;
      color: var(--text-primary);
      line-height: 1.3;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      text-overflow: ellipsis;
      height: 2.6em;
      min-height: 2.6em;
      max-height: 2.6em;
    }
    .playlist-card-count {
      font-size: 11px;
      color: var(--text-muted);
      margin-top: 3px;
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
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
      min-width: 84px;
      min-height: 40px;
      height: 40px;
    }

    .mini-btn {
      width: 40px;
      height: 40px;
      min-width: 40px;
      min-height: 40px;
      border-radius: 50%;
      background: transparent;
      border: none;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-sizing: border-box;
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
      min-height: 40px;
      height: 40px;
      padding: 14px 0;
      background: transparent;
      box-sizing: border-box;
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

    /* Settings & Storage Cards */
    .storage-card {
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      padding: 16px;
      margin-bottom: 16px;
    }

    .storage-meter-bar {
      height: 8px;
      border-radius: var(--radius-full);
      background: rgba(255, 255, 255, 0.08);
      overflow: hidden;
      margin: 10px 0;
      display: flex;
    }

    .storage-fill-used {
      background: linear-gradient(90deg, #6366F1, #06B6D4);
      width: 15%;
      height: 100%;
      border-radius: var(--radius-full);
      transition: width 0.3s ease;
    }

    .setting-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 0;
      border-bottom: 1px solid var(--border-subtle);
    }
    .setting-row:last-child {
      border-bottom: none;
    }

    .ytm-branding-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 14px;
    }

    .ytm-logo-box {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: #FF0000;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      box-shadow: 0 0 12px rgba(255, 0, 0, 0.35);
    }

    .ytm-perk-item {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
      font-size: 12px;
      color: var(--text-primary);
    }
    .ytm-perk-item:last-child {
      margin-bottom: 0;
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
        <img class="brand-icon" src="assets/logo.svg" alt="Soko Logo" onerror="this.onerror=null; this.src='assets/logo.png';" />
        <span class="brand-text">Soko<span class="brand-text-sub">Music</span></span>
      </div>

      <div class="status-badge-container" id="headerAuthBtn" onclick="openAuthModal()" style="cursor: pointer;">
        <span class="pulse-dot"></span>
        <span id="badgeStatusText">Sync / Login</span>
      </div>
    </header>

    <!-- Main Content Tabs -->
    <main class="content-scroll">
      <!-- 1. HOME TAB (Dynamic YouTube Music Feed) -->
      <section id="pane-home" class="tab-pane active">
        <!-- Native Swipe-Down Pull-to-Refresh Container -->
        <div id="pullToRefreshContainer" class="ptr-container">
          <div class="ptr-content">
            <div id="ptrIconWrapper" class="ptr-icon-wrapper">
              <svg id="ptrArrow" class="ptr-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <polyline points="19 12 12 19 5 12"></polyline>
              </svg>
              <div id="ptrSpinner" class="ptr-spinner spin-icon" style="display: none;"></div>
            </div>
            <span id="ptrText" class="ptr-text">Pull down to refresh</span>
          </div>
        </div>

        <!-- Auth status banner / Sign-in prompt -->
        <div id="homeAuthBanner"></div>

        <!-- Dynamic Home Feed Shelves from YouTube Music -->
        <div id="homeFeedContainer">
          <div style="text-align: center; color: var(--text-dim); padding: 50px 20px;">
            <div class="spin-icon" style="display: inline-block; width: 26px; height: 26px; border: 3px solid rgba(255,255,255,0.1); border-top-color: var(--accent-primary); border-radius: 50%; margin-bottom: 12px;"></div>
            <div style="font-size: 13px; font-weight: 600; color: var(--text-muted);">Loading YouTube Music Feed...</div>
          </div>
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

          <!-- All Offline Stored Songs Section -->
          <div class="storage-card" style="margin-top: 16px; margin-bottom: 24px; padding: 14px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; gap: 8px;">
              <div style="min-width: 0; flex: 1;">
                <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                  <h2 class="section-title" style="margin-bottom: 0; font-size: 16px; font-weight: 700; white-space: nowrap;">All Offline Stored Songs</h2>
                  <span id="librarySongCountBadge" class="badge" style="background: rgba(99,102,241,0.18); color: var(--accent-primary); font-size: 10px; padding: 2px 7px; border-radius: 6px; font-weight: 700; white-space: nowrap;">0 songs</span>
                </div>
                <p class="section-subtitle" style="font-size: 11px; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">100% on device disk • 0ms gapless offline playback</p>
              </div>
              <div style="display: flex; gap: 6px; flex-shrink: 0;">
                <button class="action-icon-btn-compact" onclick="playAllOfflineTracks(false)" title="Play All Offline" style="background: rgba(99,102,241,0.18); color: var(--accent-primary); width: 40px; height: 40px; min-width: 40px; min-height: 40px; border-radius: 50%;">
                  <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                </button>
                <button class="action-icon-btn-compact" onclick="playAllOfflineTracks(true)" title="Shuffle Offline" style="background: rgba(6,182,212,0.18); color: var(--accent-cyan); width: 40px; height: 40px; min-width: 40px; min-height: 40px; border-radius: 50%;">
                  <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4h4l8 12h4m0 0l-3-3m3 3l-3 3M4 20h4l3-4.5m4-6l1-1.5h4m0 0l-3-3m3 3l-3 3"/></svg>
                </button>
              </div>
            </div>

            <!-- Quick Filter Input -->
            <div style="position: relative; margin-bottom: 10px;">
              <input type="text" id="libraryFilterInput" oninput="filterLibraryTracks(this.value)" placeholder="Search within downloaded songs..." style="width: 100%; min-height: 40px; height: 40px; background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 0 12px 0 38px; color: #fff; font-size: 13px; outline: none; box-sizing: border-box;" />
              <svg style="position: absolute; left: 12px; top: 12px; color: var(--text-dim); pointer-events: none;" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            </div>

            <!-- Library Offline Songs Sorting -->
            <div class="library-sort-container" id="librarySortBar">
              <span class="library-sort-label">Sort:</span>
              <div class="library-sort-chips">
                <button class="library-sort-chip active" id="sortBtn-recent" onclick="setLibrarySort('recent')">
                  <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  <span>Recently added</span><span class="sort-dir-arrow"> ↓</span>
                </button>
                <button class="library-sort-chip" id="sortBtn-title" onclick="setLibrarySort('title')">
                  <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"/></svg>
                  <span>Title (A-Z)</span><span class="sort-dir-arrow"></span>
                </button>
                <button class="library-sort-chip" id="sortBtn-artist" onclick="setLibrarySort('artist')">
                  <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                  <span>Artist</span><span class="sort-dir-arrow"></span>
                </button>
                <button class="library-sort-chip" id="sortBtn-duration" onclick="setLibrarySort('duration')">
                  <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  <span>Duration</span><span class="sort-dir-arrow"></span>
                </button>
              </div>
            </div>

            <div class="track-list" id="libraryTracksList">
              <!-- Populated dynamically -->
            </div>
            <div id="libraryPagination" style="margin-top: 10px;"></div>
          </div>

        </div>
      </section>

      <!-- 5. SETTINGS & STORAGE MANAGEMENT TAB -->
      <section id="pane-settings" class="tab-pane">
        <div class="section-title-row">
          <div>
            <h2 class="section-title">Settings & Storage</h2>
            <p class="section-subtitle">Manage offline space and audio quality</p>
          </div>
        </div>

        <!-- YouTube Music Account Card -->
        <div class="storage-card" style="margin-top: 4px; margin-bottom: 14px; padding: 14px 16px;">
          <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px;">
            <div style="display: flex; align-items: center; gap: 10px; min-width: 0; flex: 1;">
              <div class="ytm-logo-box" style="width: 32px; height: 32px; border-radius: 10px;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#FFFFFF"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/></svg>
              </div>
              <div style="min-width: 0; flex: 1;">
                <div style="font-size: 13.5px; font-weight: 700; color: #FFF; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">YouTube Music Account</div>
                <div style="font-size: 11px; color: var(--text-dim); margin-top: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" id="settingsYtmSubtitle">Not Connected • Guest Mode</div>
              </div>
            </div>
            <button class="filter-pill active" onclick="openAuthModal()" style="min-height: 40px; padding: 6px 14px; font-size: 11px; font-weight: 700; flex-shrink: 0;" id="settingsAuthActionBtn">
              Sign In
            </button>
          </div>
          <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: var(--radius-sm); padding: 10px 14px; margin-top: 12px; font-size: 11px; color: var(--text-muted); line-height: 1.45;">
            Sync your personalized YouTube Music recommendations, daily Supermix, and liked songs into Soko offline storage.
          </div>
        </div>

        <!-- Telemetry & Recommendation Feedback Sync Card -->
        <div class="storage-card" style="margin-bottom: 14px; padding: 14px 16px;">
          <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px;">
            <div style="display: flex; align-items: center; gap: 10px; min-width: 0; flex: 1;">
              <div style="width: 32px; height: 32px; border-radius: 10px; background: rgba(99,102,241,0.18); display: flex; align-items: center; justify-content: center; color: var(--accent-primary); flex-shrink: 0;">
                <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
              </div>
              <div style="min-width: 0; flex: 1;">
                <div style="font-size: 13.5px; font-weight: 700; color: #FFF; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">Recommendation Feedback Sync</div>
                <div style="font-size: 11px; color: var(--text-dim); margin-top: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" id="telemetryStatusSubtitle">Active • Watch Time, Likes &amp; History Syncing</div>
              </div>
            </div>
            <span class="badge" style="background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.3); color: #10B981; font-weight: 700; font-size: 10px; padding: 4px 8px; border-radius: 6px; flex-shrink: 0; white-space: nowrap;">● ACTIVE</span>
          </div>
          <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: var(--radius-sm); padding: 11px 14px; margin-top: 12px; font-size: 11px; color: var(--text-muted); line-height: 1.5;">
            Automatically reports watch time (&gt;50% completion) and skips to YouTube's algorithmic model so your recommendations continuously improve.
          </div>
        </div>

        <!-- Offline Disk Storage Card -->
        <div class="storage-card" style="margin-bottom: 14px; padding: 14px 16px;">
          <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px;">
            <div style="display: flex; align-items: center; gap: 10px; min-width: 0; flex: 1;">
              <div style="width: 32px; height: 32px; border-radius: 10px; background: rgba(6,182,212,0.18); display: flex; align-items: center; justify-content: center; color: var(--accent-cyan); flex-shrink: 0;">
                <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"/></svg>
              </div>
              <div style="min-width: 0; flex: 1;">
                <span style="font-size: 13.5px; font-weight: 700; color: #FFF; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block;">Offline Disk Storage</span>
                <div style="font-size: 11px; color: var(--text-dim); margin-top: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">High-bitrate local audio store</div>
              </div>
            </div>
            <span id="storageLabel" style="font-size: 11px; font-family: ui-monospace, monospace; font-weight: 700; color: var(--accent-cyan); background: rgba(6, 182, 212, 0.12); border: 1px solid rgba(6, 182, 212, 0.25); padding: 3px 8px; border-radius: 6px; flex-shrink: 0; white-space: nowrap;">0 MB / 4.0 GB</span>
          </div>

          <!-- Padded well for progress bar and stats -->
          <div style="background: rgba(0, 0, 0, 0.32); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: var(--radius-md); padding: 11px 14px; margin-top: 12px;">
            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11px; margin-bottom: 6px;">
              <span style="color: var(--text-dim); font-weight: 600; text-transform: uppercase; font-size: 10px; letter-spacing: 0.05em;">Disk Allocation</span>
              <span style="color: var(--success); font-weight: 600; font-size: 11px;">● 100% Offline Ready</span>
            </div>
            <div class="storage-progress-bg" style="margin: 8px 0 10px 0; height: 6px; background: rgba(255, 255, 255, 0.08); border-radius: 3px; overflow: hidden;">
              <div id="storageUsedBar" class="storage-progress-fill" style="width: 0%; height: 100%; background: linear-gradient(90deg, #6366F1, #06B6D4); transition: width 0.3s ease;"></div>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: var(--text-dim);">
              <span id="cachedSongStats">0 real songs stored locally</span>
              <span style="color: var(--text-muted); font-size: 10px;">160k Opus / AAC</span>
            </div>
          </div>
        </div>

        <div class="storage-card" style="padding: 16px;">
          <div class="setting-row">
            <div>
              <div style="font-size: 14px; font-weight: 600;">Maximum Cache Size</div>
              <div style="font-size: 11px; color: var(--text-dim);">Automated eviction of oldest unpinned songs</div>
            </div>
            <select id="maxCacheSelect" onchange="updateMaxCacheLimit(this.value)" style="background: var(--bg-surface); color: #fff; border: 1px solid var(--border-subtle); min-height: 40px; padding: 6px 12px; border-radius: 8px; font-size: 12px; outline: none;">
              <option value="2.0">2.0 GB (~500 songs)</option>
              <option value="4.0" selected>4.0 GB (~1,000 songs)</option>
              <option value="8.0">8.0 GB (~2,000 songs)</option>
              <option value="16.0">16.0 GB (~4,000 songs)</option>
            </select>
          </div>

          <div class="setting-row">
            <div>
              <div style="font-size: 14px; font-weight: 600;">Audio Engine</div>
              <div style="font-size: 11px; color: var(--text-dim);">On-device 128k AAC/Opus native decoder</div>
            </div>
            <span style="font-size: 12px; font-weight: 700; color: #10B981; background: rgba(16,185,129,0.1); padding: 4px 8px; border-radius: 6px;">Active ✓</span>
          </div>

          <div class="setting-row">
            <div>
              <div style="font-size: 14px; font-weight: 600;">Look-Ahead Pre-download</div>
              <div style="font-size: 11px; color: var(--text-dim);">Caches upcoming track in background for 0ms gaps</div>
            </div>
            <input type="checkbox" id="chkLookAhead" checked style="width: 20px; height: 20px; accent-color: #6366F1; cursor: pointer;" />
          </div>

          <div style="padding-top: 16px;">
            <button onclick="clearUnpinnedCache()" style="width: 100%; min-height: 44px; padding: 12px; background: rgba(239, 68, 68, 0.12); border: 1px solid rgba(239, 68, 68, 0.3); color: #EF4444; border-radius: var(--radius-md); font-size: 12px; font-weight: 600; cursor: pointer;">
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
      <div class="nav-tab-item" onclick="switchNavTab('settings', this)">
        <svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="3"></circle>
          <path stroke-linecap="round" stroke-linejoin="round" d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"></path>
        </svg>
        <span>Settings</span>
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
    const GENUINE_BUNDLED_IDS = new Set(BUNDLED_TRACKS.map(t => t.id));
    const downloadedSet = new Set(BUNDLED_TRACKS.map(t => t.id));
    let personalShelves = null;

    function isTrackOffline(id) {
      if (!id) return false;
      if (GENUINE_BUNDLED_IDS.has(id)) return true;
      if (typeof window !== 'undefined' && window.SokoNative && typeof window.SokoNative.isTrackDownloaded === 'function') {
        return window.SokoNative.isTrackDownloaded(id);
      }
      return downloadedSet.has(id);
    }

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
    const STORAGE_KEY_LAST_PLAYED = 'soko_last_played_track_v1';

    function persistLastPlayedTrack(track) {
      if (!track || !track.id) return;
      try {
        localStorage.setItem(STORAGE_KEY_LAST_PLAYED, JSON.stringify({
          id: track.id,
          title: track.title,
          artist: track.artist,
          cover: track.cover,
          duration: track.duration || 215,
          audioUrl: track.audioUrl || ''
        }));
      } catch (e) {}
    }

    function getLastPlayedTrack() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY_LAST_PLAYED);
        if (raw) return JSON.parse(raw);
      } catch (e) {}
      return null;
    }

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

        const customTracks = CATALOG
          .filter(t => !BUNDLED_TRACKS.some(b => b.id === t.id))
          .map(t => ({
            id: t.id,
            title: t.title || 'Unknown Title',
            artist: t.artist || 'Unknown Artist',
            duration: Number(t.duration) || 0,
            cover: t.cover || '',
            favorite: Boolean(t.favorite),
            audioUrl: t.audioUrl || ''
          }));
        localStorage.setItem(STORAGE_KEY_CUSTOM_TRACKS, JSON.stringify(customTracks));

        if (typeof window !== 'undefined' && window.userPlaylists) {
          userPlaylists = window.userPlaylists;
        }
        localStorage.setItem(STORAGE_KEY_PLAYLISTS, JSON.stringify(userPlaylists));
        localStorage.setItem(STORAGE_KEY_MAX_CACHE, maxCacheGB.toString());
      } catch (err) {
        console.warn("[Storage] Persistence notice:", err);
        if (err && (err.name === 'QuotaExceededError' || err.code === 22)) {
          try {
            const essentialCustom = CATALOG
              .filter(t => downloadedSet.has(t.id) && !BUNDLED_TRACKS.some(b => b.id === t.id))
              .slice(-200)
              .map(t => ({ id: t.id, title: t.title, artist: t.artist, duration: t.duration, cover: t.cover, favorite: t.favorite, audioUrl: t.audioUrl }));
            localStorage.setItem(STORAGE_KEY_CUSTOM_TRACKS, JSON.stringify(essentialCustom));
          } catch (innerErr) {
            console.error("[Storage] Critical quota recovery failed:", innerErr);
          }
        }
      }
    }

    // ============================================================
    // PLAYER STATE & VARIABLES
    // ============================================================
    let currentTrack = null;
    let isPlaying = false;
    let isShuffle = false;
    let isRepeat = false;
    let lookAheadNextTrack = null;
    let activePlaylist = null;
    let currentChartRegion = 'Global';
    let currentChartPage = 1;
    const CHARTS_PER_PAGE = 20;
    let currentLibraryPage = 1;
    const LIBRARY_PER_PAGE = 25;
    let currentLibraryFilter = '';
    let currentLibrarySort = 'recent';
    let currentLibrarySortDir = 'desc';
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

      if (typeof currentHomeShelves !== 'undefined' && currentHomeShelves) {
        for (const shelf of currentHomeShelves) {
          if (shelf.tracks) {
            track = shelf.tracks.find(t => t.id === trackId);
            if (track) return track;
          }
          if (shelf.mixes) {
            for (const m of shelf.mixes) {
              if (m.tracks) {
                track = m.tracks.find(t => t.id === trackId);
                if (track) return track;
              }
            }
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
          playerVars: {
            'autoplay': 0,
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
      if (window.SokoNative && typeof window.SokoNative.stopAudio === 'function') {
        try { window.SokoNative.stopAudio(); } catch (e) {}
      } else if (window.SokoNative && typeof window.SokoNative.pauseAudio === 'function') {
        try { window.SokoNative.pauseAudio(); } catch (e) {}
      }
      if (audioEl) {
        try { audioEl.pause(); audioEl.currentTime = 0; audioEl.src = ''; } catch (e) {}
      }
      if (window.SokoNative && typeof window.SokoNative.setActivePlaybackId === 'function') {
        try { window.SokoNative.setActivePlaybackId(track.id); } catch (e) {}
      }

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
        try { ytPlayer.stopVideo(); } catch (e) {}
      }
      const directIframe = document.getElementById('ytDirectIframe');
      if (directIframe) {
        directIframe.src = 'about:blank';
      }
    }

    function stopAllAudioEngines() {
      stopOnlineYouTubeStream();
      if (window.SokoNative && typeof window.SokoNative.stopAudio === 'function') {
        try { window.SokoNative.stopAudio(); } catch (e) {}
      } else if (window.SokoNative && typeof window.SokoNative.pauseAudio === 'function') {
        try { window.SokoNative.pauseAudio(); } catch (e) {}
      }
      if (audioEl) {
        try {
          audioEl.pause();
          audioEl.currentTime = 0;
          audioEl.src = '';
        } catch (e) {}
      }
      isPlaying = false;
      updatePlayIcons(false);
      stopRealVisualizer();
    }

    function onYtPlayerStateChange(event) {
      if (event.data === 1) { // PLAYING
        isPlaying = true;
        updatePlayIcons(true);
        startRealVisualizer();
        startOnlineProgressUpdater();
        recordPlaybackStateChangeTelemetry(true);
      } else if (event.data === 2) { // PAUSED
        isPlaying = false;
        updatePlayIcons(false);
        stopRealVisualizer();
        stopOnlineProgressUpdater();
        recordPlaybackStateChangeTelemetry(false);
      } else if (event.data === 0) { // ENDED
        recordTrackCompletionTelemetry();
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
        updatePlaybackTelemetry(cur, dur);

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
    // YOUTUBE MUSIC TELEMETRY & ENGAGEMENT ENGINE
    // ============================================================
    let currentSessionCpn = '';
    let currentTrackPlayStartEpoch = 0;
    let currentTrackPlayedSeconds = 0;
    let hasSentPlaybackStart = false;
    let hasSent10sPing = false;
    let hasSentMidpointPing = false;
    let hasSentCompletionPing = false;

    function generateCpn() {
      const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_';
      let c = '';
      for (let i = 0; i < 16; i++) c += chars.charAt(Math.floor(Math.random() * chars.length));
      return c;
    }

    function sendTelemetryPing(urlString) {
      if (window.SokoNative && typeof window.SokoNative.sendTelemetryPing === 'function') {
        window.SokoNative.sendTelemetryPing(urlString);
      } else {
        try {
          const img = new Image();
          img.src = urlString;
        } catch (e) {}
      }
    }

    function startPlaybackTelemetry(track) {
      if (!track || !track.id) return;

      // Report early skip on previous track (<20s) if user bailed quickly
      if (currentTrack && hasSentPlaybackStart && !hasSentMidpointPing && !hasSentCompletionPing) {
        if (currentTrackPlayedSeconds < 20 && currentTrackPlayedSeconds > 1) {
          console.log(\`[Telemetry] Early skip registered for \${currentTrack.title} after \${currentTrackPlayedSeconds.toFixed(1)}s\`);
          sendTelemetryPing(\`https://www.youtube.com/api/stats/watchtime?ns=yt&el=detailpage&cpn=\${currentSessionCpn}&docid=\${currentTrack.id}&ver=2&cmt=\${currentTrackPlayedSeconds.toFixed(1)}&state=paused\`);
        }
      }

      currentTrack = track;
      currentSessionCpn = generateCpn();
      currentTrackPlayStartEpoch = Date.now();
      currentTrackPlayedSeconds = 0;
      hasSentPlaybackStart = true;
      hasSent10sPing = false;
      hasSentMidpointPing = false;
      hasSentCompletionPing = false;

      console.log(\`[Telemetry] Starting playback session for \${track.title} (\${track.id}), cpn: \${currentSessionCpn}\`);
      sendTelemetryPing(\`https://www.youtube.com/api/stats/playback?ns=yt&el=detailpage&cpn=\${currentSessionCpn}&docid=\${track.id}&ver=2\`);
    }

    function updatePlaybackTelemetry(currentSec, totalSec) {
      if (!hasSentPlaybackStart || hasSentCompletionPing || !currentTrack) return;
      currentTrackPlayedSeconds = currentSec;

      // 1. Initial 10-second confirmation ping
      if (currentSec >= 10 && !hasSent10sPing) {
        hasSent10sPing = true;
        console.log(\`[Telemetry] 10s confirmed listen for \${currentTrack.title}\`);
        sendTelemetryPing(\`https://www.youtube.com/api/stats/watchtime?ns=yt&el=detailpage&cpn=\${currentSessionCpn}&docid=\${currentTrack.id}&ver=2&cmt=\${currentSec.toFixed(1)}&state=playing\`);
      }

      // 2. Midpoint ping (at 50% or 45s) - signals deep engagement to YouTube algorithm
      const midThreshold = Math.min(45, (totalSec || 200) * 0.5);
      if (currentSec >= midThreshold && !hasSentMidpointPing) {
        hasSentMidpointPing = true;
        console.log(\`[Telemetry] Midpoint (>50%) reached for \${currentTrack.title} (\${currentSec.toFixed(1)}s) - Logged to YouTube History\`);
        sendTelemetryPing(\`https://www.youtube.com/api/stats/watchtime?ns=yt&el=detailpage&cpn=\${currentSessionCpn}&docid=\${currentTrack.id}&ver=2&cmt=\${currentSec.toFixed(1)}&len=\${(totalSec || 200).toFixed(1)}&state=playing\`);
      }
    }

    function recordTrackCompletionTelemetry() {
      if (!currentTrack || hasSentCompletionPing) return;
      hasSentCompletionPing = true;
      const duration = currentTrack.duration || 215;
      console.log(\`[Telemetry] 100% Completion logged for \${currentTrack.title}\`);
      sendTelemetryPing(\`https://www.youtube.com/api/stats/watchtime?ns=yt&el=detailpage&cpn=\${currentSessionCpn}&docid=\${currentTrack.id}&ver=2&cmt=\${duration}&len=\${duration}&state=completed\`);
    }

    function recordPlaybackStateChangeTelemetry(playing) {
      if (!hasSentPlaybackStart || hasSentCompletionPing || !currentTrack) return;
      const stateStr = playing ? 'playing' : 'paused';
      sendTelemetryPing(\`https://www.youtube.com/api/stats/watchtime?ns=yt&el=detailpage&cpn=\${currentSessionCpn}&docid=\${currentTrack.id}&ver=2&cmt=\${currentTrackPlayedSeconds.toFixed(1)}&state=\${stateStr}\`);
    }

    async function syncFavoriteToYouTubeMusic(trackId, isLiked) {
      try {
        let cookie = null;
        if (userSession && userSession.cookie) {
          cookie = userSession.cookie;
        } else if (window.SokoNative && typeof window.SokoNative.getStoredYtmCookies === 'function') {
          const c = window.SokoNative.getStoredYtmCookies();
          if (c && c.length > 20) cookie = c;
        }
        if (!cookie) return;

        const endpoint = isLiked ? "youtubei/v1/like/like" : "youtubei/v1/like/removelike";
        const payload = {
          context: {
            client: {
              clientName: "WEB_REMIX",
              clientVersion: "1.20240101.01.00",
              hl: "en",
              gl: currentChartRegion === 'India' ? 'IN' : (currentChartRegion === 'United Kingdom' ? 'GB' : 'US')
            }
          },
          target: {
            videoId: trackId
          }
        };

        console.log(\`[Telemetry] Syncing \${isLiked ? 'LIKE' : 'UNLIKE'} for \${trackId} to YouTube Music\`);
        await callInnerTubeApi(endpoint, payload, cookie);
      } catch (err) {
        console.warn('[Telemetry] Favorite sync notice:', err);
      }
    }

    // ============================================================
    // CORE PLAYBACK CONTROLS
    // ============================================================
    function selectTrackToPlay(trackId) {
      let track = findTrackAcrossAllSources(trackId);
      if (!track && trackId) {
        track = {
          id: trackId,
          title: "Streaming Song",
          artist: "YouTube Music",
          duration: 215,
          cover: \`https://i.ytimg.com/vi/\${trackId}/hqdefault.jpg\`,
          audioUrl: "",
          bitrate: "160k Opus"
        };
        CATALOG.push(track);
      } else if (!track) {
        track = CATALOG[0];
      }

      if (window.activeQueueList && window.activeQueueList.length > 1 && window.activeQueueList.some(t => t.id === track.id)) {
        // Track is already part of the active queue - keep queue progression intact
      } else if (currentYtmSearchResults && currentYtmSearchResults.some(t => t.id === track.id)) {
        activePlaylist = null;
        window.activeQueueList = currentYtmSearchResults;
      } else if (currentHomeShelves && currentHomeShelves.length > 0 && currentHomeShelves.some(s => s.tracks && s.tracks.some(t => t.id === track.id))) {
        const matchingShelf = currentHomeShelves.find(s => s.tracks && s.tracks.some(t => t.id === track.id));
        activePlaylist = null;
        window.activeQueueList = matchingShelf.tracks;
      } else if (REGIONAL_CHARTS && currentChartRegion && REGIONAL_CHARTS[currentChartRegion]?.some(t => t.id === track.id)) {
        activePlaylist = null;
        window.activeQueueList = REGIONAL_CHARTS[currentChartRegion];
      } else if (personalShelves && personalShelves.length > 0) {
        let foundInShelf = false;
        for (const shelf of personalShelves) {
          if (shelf.items && shelf.items.some(t => t.id === track.id)) {
            activePlaylist = null;
            window.activeQueueList = shelf.items;
            foundInShelf = true;
            break;
          }
        }
        if (!foundInShelf && !activePlaylist) {
          window.activeQueueList = [track];
        }
      } else if (!activePlaylist) {
        window.activeQueueList = [track];
      }

      playRealTrack(track);
      scheduleLookAhead(track.id);
      fetchAndApplyYtmRadioQueue(track.id);
    }

    async function fetchAndApplyYtmRadioQueue(trackId) {
      try {
        if (window.activeQueueList && window.activeQueueList.length > 5 && window.activeQueueList.some(t => t.id === trackId)) {
          const cIdx = window.activeQueueList.findIndex(t => t.id === trackId);
          if (cIdx >= 0 && cIdx < window.activeQueueList.length - 3) {
            // Active queue already contains this track and has plenty of upcoming recommendations
            return;
          }
        }

        let cookie = null;
        if (userSession && userSession.cookie) {
          cookie = userSession.cookie;
        } else if (window.SokoNative && typeof window.SokoNative.getStoredYtmCookies === 'function') {
          const c = window.SokoNative.getStoredYtmCookies();
          if (c && c.length > 20) cookie = c;
        }

        const payload = {
          context: {
            client: {
              clientName: "WEB_REMIX",
              clientVersion: "1.20240101.01.00",
              hl: "en",
              gl: currentChartRegion === 'India' ? 'IN' : (currentChartRegion === 'United Kingdom' ? 'GB' : 'US')
            }
          },
          videoId: trackId,
          playlistId: "RDAMVM" + trackId,
          isAudioOnly: true
        };

        const res = await callInnerTubeApi("youtubei/v1/next", payload, cookie);
        if (!res) return;

        const tabs = res.contents?.singleColumnMusicWatchNextResultsRenderer?.tabbedRenderer?.watchNextTabbedResultsRenderer?.tabs;
        const contents = tabs?.[0]?.tabRenderer?.content?.musicQueueRenderer?.content?.playlistPanelRenderer?.contents || [];

        const queueTracks = [];
        for (const item of contents) {
          const r = item.playlistPanelVideoRenderer;
          if (!r || !r.videoId) continue;
          const title = r.title?.runs?.[0]?.text || "Unknown Track";
          const artist = r.shortBylineText?.runs?.[0]?.text || "Unknown Artist";
          let cover = \`https://i.ytimg.com/vi/\${r.videoId}/hqdefault.jpg\`;
          if (r.thumbnail?.thumbnails?.length) {
            cover = r.thumbnail.thumbnails[r.thumbnail.thumbnails.length - 1].url;
          }
          let duration = 215;
          const lenStr = r.lengthText?.runs?.[0]?.text;
          if (lenStr) {
            const parts = lenStr.split(":").map(Number);
            if (parts.length === 2) duration = parts[0] * 60 + parts[1];
            else if (parts.length === 3) duration = parts[0] * 3600 + parts[1] * 60 + parts[2];
          }
          const tObj = { id: r.videoId, title, artist, cover, duration, plays: 0 };
          queueTracks.push(tObj);
          if (!CATALOG.some(t => t.id === tObj.id)) {
            CATALOG.push(tObj);
          }
        }

        if (queueTracks.length > 1 && currentTrack && currentTrack.id === trackId) {
          const isChartActive = REGIONAL_CHARTS && currentChartRegion && window.activeQueueList === REGIONAL_CHARTS[currentChartRegion];
          const isShelfActive = currentHomeShelves && currentHomeShelves.some(s => s.tracks && s.tracks === window.activeQueueList);
          if (!activePlaylist && !isChartActive && !isShelfActive) {
            console.log(\`[YTM-Radio] Connected \${queueTracks.length} dynamic recommended songs for \${trackId}\`);
            window.activeQueueList = queueTracks;
            scheduleLookAhead(trackId);
            autoPrefetchNextTrack(trackId);
          }
        }
      } catch (err) {
        console.warn("fetchAndApplyYtmRadioQueue notice:", err);
      }
    }

    function playRealTrack(track) {
      stopAllAudioEngines();
      currentTrack = track;
      startPlaybackTelemetry(track);
      if (window.SokoNative && typeof window.SokoNative.setActivePlaybackId === 'function') {
        try { window.SokoNative.setActivePlaybackId(track.id); } catch (e) {}
      }
      const miniPlayer = document.getElementById('miniPlayer');
      if (miniPlayer) miniPlayer.style.display = 'flex';
      updatePlayerUI(track);

      let diskPath = "";
      if (window.SokoNative && typeof window.SokoNative.getDownloadedTrackPath === 'function') {
        diskPath = window.SokoNative.getDownloadedTrackPath(track.id);
      }
      const isDownloadedOnDisk = (diskPath && diskPath.length > 0) || (window.SokoNative && window.SokoNative.isTrackDownloaded && window.SokoNative.isTrackDownloaded(track.id));
      const isBundledAsset = GENUINE_BUNDLED_IDS.has(track.id);
      const isAlreadyOffline = isDownloadedOnDisk || isBundledAsset;

      if (isAlreadyOffline) {
        // 1. PLAY GENUINE LOCAL AUDIO FROM DISK OR BUNDLE
        let targetSrc = diskPath;
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
        showToast(\`⚡ Playing offline: "\${track.title}"\`, '⚡');
      } else {
        // 2. REAL ON-DEVICE DOWNLOAD FIRST, THEN PLAY!
        if (window.SokoNative && typeof window.SokoNative.downloadAndPlayTrack === 'function') {
          activeDownloads.set(track.id, 5);
          updateDownloadBannerUI(track, 5, false);
          showToast(\`📥 Downloading "\${track.title}" (128k AAC)...\`, '📥');
          window.SokoNative.downloadAndPlayTrack(track.id, track.title, track.artist, track.cover);
        } else {
          // Fallback in browser outside APK: stream directly
          playOnlineYouTubeStream(track);
        }
      }

      track.plays = (track.plays || 0) + 1;
      updateMediaSession(track);
      persistLastPlayedTrack(track);
      autoPrefetchNextTrack(track.id);
    }

    function autoPrefetchNextTrack(currentId) {
      try {
        let pool = (window.activeQueueList && window.activeQueueList.length > 1)
          ? window.activeQueueList
          : (activePlaylist ? activePlaylist.songIds.map(id => findTrackAcrossAllSources(id)).filter(Boolean) : CATALOG);
        if (!pool || pool.length <= 1) pool = CATALOG;
        const curIdx = pool.findIndex(t => t.id === currentId);
        const nextIdx = curIdx >= 0 ? (curIdx + 1) % pool.length : 0;
        const nextTrack = pool[nextIdx];
        if (!nextTrack || !nextTrack.id) return;

        if (isTrackOffline(nextTrack.id) || activeDownloads.has(nextTrack.id)) return;

        console.log('[Auto-Prefetch] Pre-caching next song in background:', nextTrack.title, nextTrack.id);
        if (window.SokoNative && typeof window.SokoNative.downloadTrack === 'function') {
          window.SokoNative.downloadTrack(nextTrack.id, nextTrack.title, nextTrack.artist, nextTrack.cover);
        }
      } catch (err) {
        console.warn('[Auto-Prefetch] Notice:', err);
      }
    }

    function togglePlayPause() {
      if (currentTrack && activeDownloads.has(currentTrack.id)) {
        if (window.SokoNative && typeof window.SokoNative.setActivePlaybackId === 'function') {
          window.SokoNative.setActivePlaybackId('');
        }
        showToast('Auto-play cancelled', '⏸️');
        return;
      }

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
      recordPlaybackStateChangeTelemetry(isPlaying);
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
      let pool = (window.activeQueueList && window.activeQueueList.length > 1)
        ? window.activeQueueList
        : (activePlaylist ? activePlaylist.songIds.map(id => findTrackAcrossAllSources(id)).filter(Boolean) : CATALOG);
      if (!pool || pool.length <= 1) pool = CATALOG;

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
      let pool = (window.activeQueueList && window.activeQueueList.length > 1)
        ? window.activeQueueList
        : (activePlaylist ? activePlaylist.songIds.map(id => findTrackAcrossAllSources(id)).filter(Boolean) : CATALOG);
      if (!pool || pool.length <= 1) pool = CATALOG;

      const curIdx = pool.findIndex(t => t.id === currentTrack?.id);
      const prevIdx = curIdx > 0 ? curIdx - 1 : pool.length - 1;
      const prevTrack = pool[prevIdx];
      if (prevTrack) {
        selectTrackToPlay(prevTrack.id);
      }
    }

    function scheduleLookAhead(currentId) {
      let pool = (window.activeQueueList && window.activeQueueList.length > 1)
        ? window.activeQueueList
        : (activePlaylist ? activePlaylist.songIds.map(id => findTrackAcrossAllSources(id)).filter(Boolean) : CATALOG);
      if (!pool || pool.length <= 1) pool = CATALOG;
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

      const isNextCached = isTrackOffline(lookAheadNextTrack.id);
      if (preCacheStatus) {
        preCacheStatus.innerText = isNextCached ? '● Offline Ready' : '● Online Stream';
        preCacheStatus.style.color = isNextCached ? 'var(--success)' : 'var(--accent-cyan)';
      }
    }

    window.onNativeDownloadProgress = function(trackId, percent) {
      activeDownloads.set(trackId, percent);
      const track = findTrackAcrossAllSources(trackId);
      if (track) {
        updateDownloadBannerUI(track, percent, percent >= 100);
      }
      renderShelves();
    };

    window.onNativeDownloadComplete = function(trackId, localPath, autoPlay) {
      activeDownloads.delete(trackId);
      downloadedSet.add(trackId);
      const track = findTrackAcrossAllSources(trackId);
      if (track) {
        track.audioUrl = localPath;
        if (!CATALOG.some(t => t.id === track.id)) {
          CATALOG.push(track);
        }
        updateDownloadBannerUI(track, 100, true);
        if (autoPlay && currentTrack && currentTrack.id === trackId) {
          showToast('✓ "' + track.title + '" playing from local storage!', '⚡');
        } else if (!autoPlay) {
          showToast('⚡ Pre-cached next song: "' + track.title + '"', '⚡');
        }
      }
      const offPl = userPlaylists.find(p => p.id === 'pl_offline');
      if (offPl && !offPl.songIds.includes(trackId)) {
        offPl.songIds.push(trackId);
      }
      persistDownloadState();
      updateStorageMetrics();
      renderShelves();
      renderLibraryTracks();
      renderPlaylists();
      if (currentTrack && currentTrack.id === trackId) {
        updatePlayerUI(currentTrack);
      }
      if (lookAheadNextTrack && lookAheadNextTrack.id === trackId) {
        updateLookAheadUI();
      }
    };

    window.onNativeDownloadFailed = function(trackId, errorMsg) {
      activeDownloads.delete(trackId);
      const track = findTrackAcrossAllSources(trackId);
      updateDownloadBannerUI(track || { title: 'Download' }, 0, true);
      showToast('⚠️ ' + errorMsg, '⚠️');
      if (track && currentTrack && currentTrack.id === trackId && !errorMsg.includes('No internet connection')) {
        playOnlineYouTubeStream(track);
      }
    };

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

      if (isTrackOffline(track.id)) {
        showToast(\`"\${track.title}" is already offline cached!\`, '⚡');
        return;
      }

      if (activeDownloads.has(track.id)) {
        showToast(\`"\${track.title}" is currently downloading...\`, '⏳');
        return;
      }

      activeDownloads.set(track.id, 5);
      updateDownloadBannerUI(track, 5, false);
      renderShelves();
      renderLibraryTracks();
      showToast(\`Downloading "\${track.title}" (128k AAC)...\`, '📥');

      if (window.SokoNative && typeof window.SokoNative.downloadTrack === 'function') {
        window.SokoNative.downloadTrack(track.id, track.title, track.artist, track.cover);
      } else {
        let progress = 0;
        const interval = setInterval(() => {
          progress += Math.floor(Math.random() * 20) + 15;
          if (progress >= 100) {
            clearInterval(interval);
            window.onNativeDownloadComplete(track.id, \`assets/music/\${track.id}.opus\`, false);
          } else {
            window.onNativeDownloadProgress(track.id, progress);
          }
        }, 300);
      }
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
    function createShelfCardHtml(track) {
      if (!track || !track.id) return '';
      const isCached = isTrackOffline(track.id);
      return \`
        <div class="shelf-card" onclick="selectTrackToPlay('\${track.id}')">
          <div class="shelf-card-art-wrapper">
            <img class="shelf-card-art" src="\${track.cover || 'assets/logo.png'}" alt="\${track.title || 'Track'}" onerror="this.onerror=null; this.src='assets/logo.png';" loading="lazy" />
            \${isCached ? '<div class="offline-chip">⚡ 160k</div>' : ''}
          </div>
          <div class="shelf-card-info">
            <div class="shelf-card-title">\${track.title || 'Unknown Title'}</div>
            <div class="shelf-card-artist">\${track.artist || 'Unknown Artist'}</div>
          </div>
        </div>
      \`;
    }

    // Curated YouTube Music Mixes for "Mix for you"
    const CURATED_MIXES = [
      {
        id: 'mix_supermix',
        title: 'My Supermix',
        subtitle: 'Infinite Personalized Mix',
        badge: 'Supermix',
        gradient: 'linear-gradient(135deg, #FF0055, #7A00FF)',
        songIds: ['kPa7bsKwL-c', 'yJg-Y5byMMw', '4HVhnhpJxr0', 'EW9opRK1MPk', 'XI3JGDHduR4', 'ZCRL8V0ZkEA']
      },
      {
        id: 'mix_discover',
        title: 'Discover Mix',
        subtitle: 'Updated Weekly • Fresh Picks',
        badge: 'Discover',
        gradient: 'linear-gradient(135deg, #00C6FF, #0072FF)',
        songIds: ['s_SN6KDYjKY', 'S4uPiw9rnbY', '7Fq2ArrUU9c', '8TfP90KODxo', 'jLHyFkCKEzg']
      },
      {
        id: 'mix_chill',
        title: 'Chill Mix',
        subtitle: 'Mellow Acoustics & Lo-Fi',
        badge: 'Chill',
        gradient: 'linear-gradient(135deg, #43E97B, #38F9D7)',
        songIds: ['4HVhnhpJxr0', 'Io_Z3HxgJGs', 'ZUL-ivsl_Fs', 'Qo4-4388R3g', 'tXi15CFnFws']
      },
      {
        id: 'mix_energy',
        title: 'Energy Mix',
        subtitle: 'High Tempo & Workout Hype',
        badge: 'Energy',
        gradient: 'linear-gradient(135deg, #FA709A, #FEE140)',
        songIds: ['yJg-Y5byMMw', 'XI3JGDHduR4', 'cK9h5PVzRpk', 'iKopExw_3Zg', 'ppcVqfsekIs']
      },
      {
        id: 'mix_focus',
        title: 'Focus Mix',
        subtitle: 'Instrumental Concentration',
        badge: 'Focus',
        gradient: 'linear-gradient(135deg, #667EEA, #764BA2)',
        songIds: ['EW9opRK1MPk', 'ZCRL8V0ZkEA', 'yiJ5k2vBtlw', 'SxkHNou0uiM', '4HVhnhpJxr0']
      },
      {
        id: 'mix_forgotten',
        title: 'Forgotten Favorites Mix',
        subtitle: 'Timeless Throwbacks',
        badge: 'Favorites',
        gradient: 'linear-gradient(135deg, #F83600, #F9D423)',
        songIds: ['Io_Z3HxgJGs', 'ZUL-ivsl_Fs', '4HVhnhpJxr0', 'EW9opRK1MPk', 'kPa7bsKwL-c']
      }
    ];

    function createYtmLineCardHtml(track) {
      if (!track || !track.id) return '';
      const isCached = isTrackOffline(track.id);
      const isDownloading = activeDownloads.has(track.id);
      return \`
        <div class="ytm-line-card" onclick="selectTrackToPlay('\${track.id}')">
          <div class="ytm-line-art-wrapper">
            <img class="ytm-line-art" src="\${track.cover || 'assets/logo.png'}" alt="\${track.title || 'Track'}" onerror="this.onerror=null; this.src='assets/logo.png';" loading="lazy" />
            \${isCached ? '<div class="offline-chip-mini">⚡</div>' : ''}
          </div>
          <div class="ytm-line-info">
            <div class="ytm-line-title">\${track.title || 'Unknown Title'}</div>
            <div class="ytm-line-artist">\${track.artist || 'Unknown Artist'}</div>
          </div>
          <div class="ytm-line-actions">
            <button class="ytm-line-btn" onclick="event.stopPropagation(); startDownloadTrack('\${track.id}')" title="\${isCached ? 'Stored Offline' : 'Download'}">
              \${isCached ? 
                '<svg width="18" height="18" fill="#10B981" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>' :
                (isDownloading ? 
                  '<svg width="18" height="18" fill="#F59E0B" viewBox="0 0 24 24" class="spin-icon"><path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/></svg>' :
                  '<svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM17 13l-5 5-5-5h3V9h4v4h3z"/></svg>')}
            </button>
          </div>
        </div>
      \`;
    }

    function createMixCardHtml(mix) {
      if (!mix || !mix.id) return '';
      let coverArt = mix.cover;
      if (!coverArt || coverArt === 'assets/logo.png') {
        const firstTrack = (mix.songIds && mix.songIds.length > 0) ? findTrackAcrossAllSources(mix.songIds[0]) : null;
        if (firstTrack && firstTrack.cover) coverArt = firstTrack.cover;
      }
      coverArt = coverArt || 'assets/logo.png';
      const gradient = mix.gradient || 'linear-gradient(135deg, #6366F1, #06B6D4)';
      const badge = mix.badge || 'Mix';

      return \`
        <div class="shelf-card" onclick="playCuratedMix('\${mix.id}')">
          <div class="shelf-card-art-wrapper" style="background: \${gradient};">
            <img class="shelf-card-art" src="\${coverArt}" alt="\${mix.title || 'Mix'}" onerror="this.onerror=null; this.src='assets/logo.png';" loading="lazy" style="opacity: 0.88; mix-blend-mode: overlay;" />
            <div class="mix-card-badge">\${badge}</div>
          </div>
          <div class="shelf-card-info">
            <div class="shelf-card-title">\${mix.title || 'Mix'}</div>
            <div class="shelf-card-artist">\${mix.subtitle || 'Personalized Mix'}</div>
          </div>
        </div>
      \`;
    }

    async function playCuratedMix(mixId) {
      let mix = null;
      if (currentHomeShelves) {
        for (const s of currentHomeShelves) {
          if (s.mixes) {
            mix = s.mixes.find(m => m.id === mixId || m.playlistId === mixId);
            if (mix) break;
          }
        }
      }
      if (!mix) {
        mix = CURATED_MIXES.find(m => m.id === mixId || m.playlistId === mixId);
      }

      if (!mix) return;

      // 1. If mix already has multiple fully resolved tracks
      if (mix.tracks && mix.tracks.length > 1) {
        activePlaylist = {
          id: mix.id,
          name: mix.title,
          songIds: mix.tracks.map(t => t.id)
        };
        window.activeQueueList = mix.tracks;
        radioQueue = [];
        currentTrackIndex = 0;
        selectTrackToPlay(mix.tracks[0].id);
        showToast(\`Playing "\${mix.title}"\`, '🔀');
        return;
      }

      // 2. If mix has predefined multiple songIds (e.g. curated mixes)
      if (mix.songIds && mix.songIds.length > 1) {
        const validTracks = mix.songIds.map(id => findTrackAcrossAllSources(id)).filter(Boolean);
        if (validTracks.length > 0) {
          activePlaylist = {
            id: mix.id,
            name: mix.title,
            songIds: validTracks.map(t => t.id)
          };
          window.activeQueueList = validTracks;
          radioQueue = [];
          currentTrackIndex = 0;
          selectTrackToPlay(validTracks[0].id);
          showToast(\`Playing "\${mix.title}"\`, '🔀');
          return;
        }
      }

      // 3. If mix has a YouTube Music playlistId, resolve tracks dynamically
      if (mix.playlistId) {
        showToast(\`Loading "\${mix.title}"...\`, '⏳');
        const resolved = await resolvePlaylistTracks(mix.playlistId);
        if (resolved && resolved.length > 0) {
          mix.tracks = resolved;
          mix.songIds = resolved.map(t => t.id);
          activePlaylist = {
            id: mix.id,
            name: mix.title,
            songIds: mix.songIds
          };
          window.activeQueueList = resolved;
          radioQueue = [];
          currentTrackIndex = 0;
          selectTrackToPlay(resolved[0].id);
          showToast(\`Playing "\${mix.title}"\`, '🔀');
          return;
        }
      }

      // 4. If single track exists in mix.tracks
      if (mix.tracks && mix.tracks.length === 1) {
        activePlaylist = {
          id: mix.id,
          name: mix.title,
          songIds: mix.tracks.map(t => t.id)
        };
        window.activeQueueList = mix.tracks;
        radioQueue = [];
        currentTrackIndex = 0;
        selectTrackToPlay(mix.tracks[0].id);
        showToast(\`Playing "\${mix.title}"\`, '🔀');
        return;
      }

      // 5. Fallback if offline
      const fallbackPool = (REGIONAL_CHARTS['Global'] || CATALOG).slice(0, 10);
      if (fallbackPool.length > 0) {
        activePlaylist = {
          id: mix.id,
          name: mix.title,
          songIds: fallbackPool.map(t => t.id)
        };
        window.activeQueueList = fallbackPool;
        radioQueue = [];
        currentTrackIndex = 0;
        selectTrackToPlay(fallbackPool[0].id);
        showToast(\`Playing "\${mix.title}"\`, '🔀');
      }
    }

    let currentHomeShelves = [];

    function playAllShelfTracks(shelfId) {
      const shelf = currentHomeShelves.find(s => s.id === shelfId);
      if (!shelf || !shelf.tracks || shelf.tracks.length === 0) return;
      activePlaylist = {
        id: 'shelf_' + shelf.id,
        name: shelf.title,
        songIds: shelf.tracks.map(t => t.id)
      };
      window.activeQueueList = shelf.tracks;
      radioQueue = [];
      currentTrackIndex = 0;
      selectTrackToPlay(shelf.tracks[0].id);
      showToast(\`Playing "\${shelf.title}"\`, '▶️');
    }

    function prepareHomeShelves(apiShelves = []) {
      const allShelves = [];
      const claimedShelves = new Set();

      // 1. Quick picks (YouTube Music horizontal line-like cards)
      const apiQuick = apiShelves.find(s => !claimedShelves.has(s) && s.title && (
        s.title.toLowerCase().includes('quick') ||
        s.title.toLowerCase().includes('listen again') ||
        s.title.toLowerCase().includes('start radio') ||
        s.title.toLowerCase().includes('songs you might like')
      )) || apiShelves.find(s => !claimedShelves.has(s) && s.tracks && s.tracks.length > 0 &&
        !s.title.toLowerCase().includes('trend') &&
        !s.title.toLowerCase().includes('chart') &&
        !s.title.toLowerCase().includes('mix') &&
        !s.title.toLowerCase().includes('forgot')
      );

      if (apiQuick) claimedShelves.add(apiQuick);

      const quickTracks = (apiQuick && apiQuick.tracks && apiQuick.tracks.length > 0)
        ? apiQuick.tracks
        : (REGIONAL_CHARTS['Global'] ? REGIONAL_CHARTS['Global'].slice(0, 16) : CATALOG.slice(0, 16));
      allShelves.push({
        id: 'quick_picks',
        title: 'Quick picks',
        badge: 'START RADIO FROM A SONG',
        type: 'ytm-line',
        tracks: quickTracks
      });

      // 2. Trending songs for you (YouTube Music horizontal line-like cards)
      const apiTrending = apiShelves.find(s => !claimedShelves.has(s) && s.title && (
        s.title.toLowerCase().includes('trend') ||
        s.title.toLowerCase().includes('chart') ||
        s.title.toLowerCase().includes('buzz') ||
        s.title.toLowerCase().includes('hit') ||
        s.title.toLowerCase().includes('popular') ||
        s.title.toLowerCase().includes('video')
      ));
      if (apiTrending) claimedShelves.add(apiTrending);

      const trendTracks = (apiTrending && apiTrending.tracks && apiTrending.tracks.length > 0)
        ? apiTrending.tracks
        : (REGIONAL_CHARTS['India'] ? REGIONAL_CHARTS['India'].slice(0, 16) : CATALOG.slice(0, 16));
      allShelves.push({
        id: 'trending_for_you',
        title: 'Trending songs for you',
        badge: 'CHARTS & BUZZ',
        type: 'ytm-line',
        tracks: trendTracks
      });

      // 3. Forgotten favorites (YouTube Music horizontal line-like cards)
      const apiForgotten = apiShelves.find(s => !claimedShelves.has(s) && s.title && (
        s.title.toLowerCase().includes('forgot') ||
        s.title.toLowerCase().includes('revisit') ||
        s.title.toLowerCase().includes('rediscover') ||
        s.title.toLowerCase().includes('replay')
      ));
      if (apiForgotten) claimedShelves.add(apiForgotten);

      const quickIds = new Set(quickTracks.map(t => t.id));
      const trendIds = new Set(trendTracks.map(t => t.id));
      const forgottenPool = [
        ...CATALOG.filter(t => t.favorite || downloadedSet.has(t.id)),
        ...(REGIONAL_CHARTS['United States'] ? REGIONAL_CHARTS['United States'].slice(0, 16) : []),
        ...CATALOG
      ];
      const uniqueForgotten = [];
      const seenF = new Set();
      for (const t of forgottenPool) {
        if (!seenF.has(t.id) && !quickIds.has(t.id) && !trendIds.has(t.id)) {
          seenF.add(t.id);
          uniqueForgotten.push(t);
        }
      }
      const forgottenTracks = (apiForgotten && apiForgotten.tracks && apiForgotten.tracks.length > 0)
        ? apiForgotten.tracks
        : (uniqueForgotten.length >= 8 ? uniqueForgotten.slice(0, 16) : forgottenPool.slice(0, 16));
      allShelves.push({
        id: 'forgotten_favorites',
        title: 'Forgotten favorites',
        badge: 'REVISIT PAST FAVORITES',
        type: 'ytm-line',
        tracks: forgottenTracks
      });

      // 4. Mix for you (Personalized Mixes with even-height cards)
      let liveMixes = [];
      for (const s of apiShelves) {
        if (s.mixes && s.mixes.length > 0) {
          for (const m of s.mixes) {
            if (!liveMixes.some(existing => existing.id === m.id || existing.title.toLowerCase() === m.title.toLowerCase())) {
              liveMixes.push(m);
            }
          }
        }
      }

      const finalMixes = [];
      const seenMixKeys = new Set();
      for (const m of liveMixes) {
        if (!seenMixKeys.has(m.id)) {
          seenMixKeys.add(m.id);
          finalMixes.push(m);
        }
      }
      for (const m of CURATED_MIXES) {
        if (!seenMixKeys.has(m.id) && !seenMixKeys.has(m.title.toLowerCase())) {
          seenMixKeys.add(m.id);
          finalMixes.push(m);
        }
      }

      allShelves.push({
        id: 'mix_for_you',
        title: 'Mix for you',
        badge: 'PLAYLISTS TAILORED FOR YOU',
        type: 'mix',
        mixes: finalMixes.slice(0, 10)
      });

      // 5. Any extra shelves from YouTube Music (e.g. New music videos)
      for (const s of apiShelves) {
        if (!claimedShelves.has(s) && s.tracks && s.tracks.length > 0) {
          const lower = (s.title || '').toLowerCase();
          if (!lower.includes('quick') && !lower.includes('trend') && !lower.includes('chart') && !lower.includes('forgot') && !lower.includes('mix')) {
            allShelves.push({
              id: 'shelf_' + Math.random().toString(36).substring(2, 7),
              title: s.title,
              badge: s.badge || 'OFFICIAL YOUTUBE MUSIC',
              type: 'shelf-card',
              tracks: s.tracks
            });
          }
        }
      }

      return allShelves;
    }

    function updateHomeAuthBanner() {
      const banner = document.getElementById('homeAuthBanner');
      if (!banner) return;

      if (userSession && userSession.isLoggedIn) {
        const initial = (userSession.name || 'Y').charAt(0).toUpperCase();
        banner.innerHTML = \`
          <div style="background: rgba(99, 102, 241, 0.08); border: 1px solid rgba(99, 102, 241, 0.25); border-radius: var(--radius-lg); padding: 14px 16px; margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, #6366F1, #06B6D4); display: flex; align-items: center; justify-content: center; font-weight: 800; color: #fff; font-size: 14px;">
                \${initial}
              </div>
              <div>
                <div style="font-size: 13px; font-weight: 700; color: #fff;">\${userSession.name || 'YouTube Music'}</div>
                <div style="font-size: 11px; color: var(--accent-cyan);">● Personal Feed Synced</div>
              </div>
            </div>
            <div style="font-size: 11px; color: var(--text-dim); display: flex; align-items: center; gap: 5px; padding: 5px 10px; background: rgba(255, 255, 255, 0.05); border-radius: var(--radius-full); border: 1px solid rgba(255, 255, 255, 0.08);">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline></svg>
              <span>Swipe down to refresh</span>
            </div>
          </div>
        \`;
      } else {
        banner.innerHTML = \`
          <div onclick="loginWithGoogle()" style="background: linear-gradient(135deg, rgba(255, 0, 0, 0.12), rgba(99, 102, 241, 0.08)); border: 1px solid rgba(255, 0, 0, 0.25); border-radius: var(--radius-lg); padding: 16px; margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between; cursor: pointer;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="width: 40px; height: 40px; border-radius: 50%; background: #FF0000; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(255, 0, 0, 0.35); flex-shrink: 0;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#ffffff"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/></svg>
              </div>
              <div>
                <div style="font-size: 13px; font-weight: 800; color: #fff;">Connect YouTube Music</div>
                <div style="font-size: 11px; color: var(--text-muted);">Sign in for your personal mixes, library & history</div>
              </div>
            </div>
            <button class="filter-pill active auth-banner-signin-btn">Sign In</button>
          </div>
        \`;
      }
    }

    function renderHomeShelves(rawShelves) {
      const container = document.getElementById('homeFeedContainer');
      if (!container) return;

      const shelves = prepareHomeShelves(rawShelves);
      currentHomeShelves = shelves;

      container.innerHTML = shelves.map(shelf => {
        if (shelf.type === 'ytm-line') {
          return \`
            <div class="section-title-row" style="margin-top: 22px;">
              <div>
                <span class="ytm-shelf-badge">\${shelf.badge || 'START RADIO FROM A SONG'}</span>
                <h2 class="section-title">\${shelf.title}</h2>
              </div>
              <button class="filter-pill shelf-play-all-btn" onclick="playAllShelfTracks('\${shelf.id}')">Play all</button>
            </div>
            <div class="ytm-grid-shelf">
              \${shelf.tracks.map(createYtmLineCardHtml).join('')}
            </div>
          \`;
        } else if (shelf.type === 'mix') {
          return \`
            <div class="section-title-row" style="margin-top: 22px;">
              <div>
                <span class="ytm-shelf-badge">\${shelf.badge || 'PLAYLISTS TAILORED FOR YOU'}</span>
                <h2 class="section-title">\${shelf.title}</h2>
              </div>
            </div>
            <div class="shelf-container">
              \${shelf.mixes.map(createMixCardHtml).join('')}
            </div>
          \`;
        } else {
          return \`
            <div class="section-title-row" style="margin-top: 22px;">
              <div>
                <span class="ytm-shelf-badge">\${shelf.badge || 'RECOMMENDED'}</span>
                <h2 class="section-title">\${shelf.title}</h2>
              </div>
            </div>
            <div class="shelf-container">
              \${shelf.tracks.map(createShelfCardHtml).join('')}
            </div>
          \`;
        }
      }).join('');
    }

    async function resolvePlaylistTracks(playlistId) {
      if (!playlistId) return [];
      const cleanId = playlistId.startsWith('VL') ? playlistId.substring(2) : playlistId;
      const isUser = userSession && userSession.isLoggedIn;
      const cookie = isUser ? (userSession.cookie || '') : '';

      try {
        const payload = {
          context: {
            client: {
              clientName: "WEB_REMIX",
              clientVersion: "1.20240101.01.00",
              hl: "en",
              gl: currentChartRegion === 'India' ? 'IN' : (currentChartRegion === 'United Kingdom' ? 'GB' : 'US')
            }
          },
          playlistId: cleanId,
          isAudioOnly: true
        };

        const res = await callInnerTubeApi("youtubei/v1/next", payload, cookie);
        let contents = res?.contents?.singleColumnMusicWatchNextResultsRenderer?.tabbedRenderer?.watchNextTabbedResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.musicQueueRenderer?.content?.playlistPanelRenderer?.contents ||
                       res?.contents?.playlistPanelRenderer?.contents ||
                       res?.continuationContents?.playlistPanelContinuation?.contents;

        if (!contents || !Array.isArray(contents) || contents.length === 0) {
          const found = [];
          function findPanels(o, depth = 8) {
            if (!o || typeof o !== 'object' || depth < 0) return;
            if (o.playlistPanelVideoRenderer) {
              found.push(o.playlistPanelVideoRenderer);
              return;
            }
            if (Array.isArray(o)) {
              for (const it of o) findPanels(it, depth - 1);
            } else {
              for (const k in o) {
                if (Object.prototype.hasOwnProperty.call(o, k)) findPanels(o[k], depth - 1);
              }
            }
          }
          findPanels(res);
          if (found.length > 0) {
            contents = found.map(r => ({ playlistPanelVideoRenderer: r }));
          }
        }

        const tracks = [];
        for (const item of (contents || [])) {
          const r = item.playlistPanelVideoRenderer;
          if (!r || !r.videoId) continue;
          let title = "Unknown Track";
          if (r.title?.runs) {
            title = r.title.runs.map(x => x.text || '').join('').trim();
          } else if (typeof r.title === 'string') {
            title = r.title;
          }
          let artist = "YouTube Music";
          const aRuns = r.shortBylineText?.runs || r.longBylineText?.runs || [];
          const aCands = aRuns.map(x => x.text ? x.text.trim() : '').filter(x => x && x !== '•' && !/^[0-9]+:[0-9]+(:[0-9]+)?$/.test(x));
          if (aCands.length > 0) artist = aCands.join(', ');

          let cover = \`https://i.ytimg.com/vi/\${r.videoId}/hqdefault.jpg\`;
          if (r.thumbnail?.thumbnails?.length) {
            cover = r.thumbnail.thumbnails[r.thumbnail.thumbnails.length - 1].url;
          }
          let duration = 215;
          const lenStr = r.lengthText?.runs?.[0]?.text;
          if (lenStr) {
            const parts = lenStr.split(":").map(Number);
            if (parts.length === 2) duration = parts[0] * 60 + parts[1];
            else if (parts.length === 3) duration = parts[0] * 3600 + parts[1] * 60 + parts[2];
          }
          const tObj = { id: r.videoId, title, artist, cover, duration, plays: 0 };
          tracks.push(tObj);
          if (!CATALOG.some(t => t.id === tObj.id)) {
            CATALOG.push(tObj);
          }
        }
        if (tracks.length > 0) return tracks;
      } catch (err) {
        console.warn("Failed resolving playlist via next:", err);
      }

      try {
        const browsePayload = {
          context: {
            client: {
              clientName: "WEB_REMIX",
              clientVersion: "1.20240101.01.00",
              hl: "en",
              gl: currentChartRegion === 'India' ? 'IN' : (currentChartRegion === 'United Kingdom' ? 'GB' : 'US')
            }
          },
          browseId: "VL" + cleanId
        };
        const bRes = await callInnerTubeApi("youtubei/v1/browse", browsePayload, cookie);
        const secList = bRes?.contents?.singleColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents || [];
        const bTracks = [];
        for (const s of secList) {
          const shelf = s.musicPlaylistShelfRenderer || s.musicShelfRenderer;
          if (!shelf || !shelf.contents) continue;
          for (const it of shelf.contents) {
            const r = it.musicResponsiveListItemRenderer;
            if (!r) continue;
            let vid = r.playlistItemData?.videoId;
            if (!vid) {
              const c0 = r.flexColumns?.[0]?.musicResponsiveListItemFlexColumnRenderer;
              vid = c0?.text?.runs?.[0]?.navigationEndpoint?.watchEndpoint?.videoId;
            }
            if (!vid) continue;
            let title = r.flexColumns?.[0]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.map(x => x.text).join('') || "Unknown";
            let artist = r.flexColumns?.[1]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.map(x => x.text).filter(x => x && x !== '•').join(', ') || "YouTube Music";
            const thumbs = r.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails || [];
            const cover = thumbs.length > 0 ? thumbs[thumbs.length - 1].url : \`https://i.ytimg.com/vi/\${vid}/hqdefault.jpg\`;
            const tObj = { id: vid, title, artist, cover, duration: 215, plays: 0 };
            bTracks.push(tObj);
            if (!CATALOG.some(t => t.id === tObj.id)) {
              CATALOG.push(tObj);
            }
          }
        }
        if (bTracks.length > 0) return bTracks;
      } catch (err2) {
        console.warn("Failed resolving playlist via browse:", err2);
      }

      const curatedMatch = CURATED_MIXES.find(m => m.id === playlistId || m.id === cleanId || m.playlistId === playlistId);
      if (curatedMatch && curatedMatch.songIds && curatedMatch.songIds.length > 0) {
        const curTracks = curatedMatch.songIds.map(id => findTrackAcrossAllSources(id)).filter(Boolean);
        if (curTracks.length > 0) return curTracks;
      }

      return [];
    }

    function parseBrowseShelves(data) {
      if (!data) return [];
      const tabs = data?.contents?.singleColumnBrowseResultsRenderer?.tabs || [];
      let sections = tabs[0]?.tabRenderer?.content?.sectionListRenderer?.contents;
      if (!sections || sections.length === 0) {
        sections = data?.contents?.sectionListRenderer?.contents || [];
      }
      const shelves = [];

      function extractVid(o) {
        if (!o || typeof o !== 'object') return null;
        if (o.watchEndpoint?.videoId && typeof o.watchEndpoint.videoId === 'string' && o.watchEndpoint.videoId.length >= 10 && o.watchEndpoint.videoId.length <= 15) {
          return o.watchEndpoint.videoId;
        }
        if (o.videoId && typeof o.videoId === 'string' && o.videoId.length >= 10 && o.videoId.length <= 15) {
          return o.videoId;
        }
        if (o.playlistItemData?.videoId && typeof o.playlistItemData.videoId === 'string' && o.playlistItemData.videoId.length >= 10 && o.playlistItemData.videoId.length <= 15) {
          return o.playlistItemData.videoId;
        }
        return null;
      }

      function extractPid(o) {
        if (!o || typeof o !== 'object') return null;
        let pid = o.watchEndpoint?.playlistId || o.watchPlaylistEndpoint?.playlistId || o.playlistId;
        if (!pid && o.browseEndpoint?.browseId) {
          const bid = o.browseEndpoint.browseId;
          if (bid.startsWith('VL')) pid = bid.substring(2);
          else if (bid.startsWith('RD') || bid.startsWith('PL') || bid.startsWith('MPRE')) pid = bid;
        }
        if (typeof pid === 'string' && pid.length > 3) {
          if (!pid.startsWith('RDAMVM') && !pid.startsWith('RDAMPL')) {
            return pid;
          }
        }
        return null;
      }

      function deepFind(o, matcher, maxDepth = 12) {
        if (!o || typeof o !== 'object' || maxDepth < 0) return null;
        const res = matcher(o);
        if (res) return res;
        if (Array.isArray(o)) {
          for (let i = 0; i < o.length; i++) {
            const r = deepFind(o[i], matcher, maxDepth - 1);
            if (r) return r;
          }
        } else {
          for (const k in o) {
            if (Object.prototype.hasOwnProperty.call(o, k)) {
              const r = deepFind(o[k], matcher, maxDepth - 1);
              if (r) return r;
            }
          }
        }
        return null;
      }

      const MIX_GRADIENTS = [
        'linear-gradient(135deg, #FF0055, #7A00FF)',
        'linear-gradient(135deg, #00C6FF, #0072FF)',
        'linear-gradient(135deg, #43E97B, #38F9D7)',
        'linear-gradient(135deg, #FA709A, #FEE140)',
        'linear-gradient(135deg, #667EEA, #764BA2)',
        'linear-gradient(135deg, #F83600, #F9D423)',
        'linear-gradient(135deg, #FF512F, #DD2476)',
        'linear-gradient(135deg, #4568DC, #B06AB3)'
      ];

      for (const s of sections) {
        const shelf = s.musicCarouselShelfRenderer || s.musicShelfRenderer || s.gridRenderer;
        if (!shelf) continue;
        const h = shelf.header?.musicCarouselShelfBasicHeaderRenderer ||
                  shelf.header?.musicShelfBasicHeaderRenderer ||
                  shelf.header?.shelfHeaderRenderer ||
                  shelf.header?.gridHeaderRenderer ||
                  shelf.title;
        const tRuns = h?.title?.runs || (typeof h?.title === 'string' ? [{ text: h.title }] : null) || h?.runs || [];
        const shelfTitle = tRuns.map(r => r.text || '').join('').trim();
        if (!shelfTitle) continue;

        const bRuns = h?.strapline?.runs || h?.subtitle?.runs || [];
        const shelfBadge = bRuns.map(r => r.text || '').join('').trim();

        const items = shelf.contents || [];
        const tracks = [];
        const mixes = [];

        for (const item of items) {
          // A: Track items (musicResponsiveListItemRenderer)
          if (item.musicResponsiveListItemRenderer) {
            const r = item.musicResponsiveListItemRenderer;
            let vid = r.playlistItemData?.videoId ||
                      r.flexColumns?.[0]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.[0]?.navigationEndpoint?.watchEndpoint?.videoId ||
                      r.overlay?.musicItemThumbnailOverlayRenderer?.content?.musicPlayButtonRenderer?.playNavigationEndpoint?.watchEndpoint?.videoId ||
                      deepFind(r, extractVid, 12);

            let title = '';
            if (r.flexColumns && r.flexColumns[0]) {
              const c0 = r.flexColumns[0]?.musicResponsiveListItemFlexColumnRenderer;
              const runs = c0?.text?.runs || c0?.title?.runs || [];
              title = runs.map(x => x.text || '').join('').trim();
            }
            if (!title) {
              const runs = r.title?.runs || (typeof r.title === 'string' ? [{ text: r.title }] : []);
              title = runs.map(x => x.text || '').join('').trim();
            }
            if (!title || !vid) continue;

            let artist = 'YouTube Music';
            if (r.flexColumns && r.flexColumns.length > 1) {
              const c1 = r.flexColumns[1]?.musicResponsiveListItemFlexColumnRenderer;
              const runs = c1?.text?.runs || c1?.title?.runs || [];
              const cands = runs
                .map(x => x.text ? x.text.trim() : '')
                .filter(x => x && x !== '•' && x !== 'Song' && x !== 'Video' && x !== 'Album' && x !== 'Single' && !/^[0-9]+:[0-9]+(:[0-9]+)?$/.test(x));
              if (cands.length > 0) artist = cands.join(', ');
            } else if (r.subtitle) {
              const runs = r.subtitle.runs || (typeof r.subtitle === 'string' ? [{ text: r.subtitle }] : []);
              const cands = runs
                .map(x => x.text ? x.text.trim() : '')
                .filter(x => x && x !== '•' && x !== 'Song' && x !== 'Video' && x !== 'Album' && x !== 'Single' && !/^[0-9]+:[0-9]+(:[0-9]+)?$/.test(x));
              if (cands.length > 0) artist = cands.join(', ');
            }

            let cover = 'assets/logo.png';
            const thumbs = r.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails ||
                           r.thumbnailRenderer?.musicThumbnailRenderer?.thumbnail?.thumbnails ||
                           r.thumbnail?.thumbnails || [];
            if (thumbs.length > 0) {
              cover = thumbs[thumbs.length - 1].url;
            } else if (vid) {
              cover = \`https://i.ytimg.com/vi/\${vid}/hqdefault.jpg\`;
            }

            let duration = 215;
            if (r.flexColumns && r.flexColumns.length > 1) {
              const c1 = r.flexColumns[1]?.musicResponsiveListItemFlexColumnRenderer;
              const durRun = (c1?.text?.runs || []).find(x => /^[0-9]+:[0-9]+$/.test((x.text || '').trim()));
              if (durRun) {
                const parts = durRun.text.trim().split(':').map(Number);
                if (parts.length === 2) duration = parts[0] * 60 + parts[1];
              }
            }

            if (!tracks.some(t => t.id === vid)) {
              const trackObj = { id: vid, title, artist, cover, duration, plays: 0 };
              tracks.push(trackObj);
              if (!CATALOG.some(t => t.id === vid)) {
                CATALOG.push(trackObj);
              }
            }
          }
          // B: Card items (musicTwoRowItemRenderer)
          else if (item.musicTwoRowItemRenderer) {
            const r = item.musicTwoRowItemRenderer;
            let pid = extractPid(r) || deepFind(r, extractPid, 12);
            let vid = extractVid(r) || deepFind(r, extractVid, 12);

            let title = '';
            const tRuns = r.title?.runs || (typeof r.title === 'string' ? [{ text: r.title }] : []);
            title = tRuns.map(x => x.text || '').join('').trim();
            if (!title) continue;

            let subtitle = 'YouTube Music';
            const sRuns = r.subtitle?.runs || (typeof r.subtitle === 'string' ? [{ text: r.subtitle }] : []);
            const cands = sRuns
              .map(x => x.text ? x.text.trim() : '')
              .filter(x => x && x !== '•' && x !== 'Song' && x !== 'Video' && x !== 'Album' && x !== 'Single' && !/^[0-9]+:[0-9]+(:[0-9]+)?$/.test(x));
            if (cands.length > 0) subtitle = cands.join(', ');

            let cover = 'assets/logo.png';
            const thumbs = r.thumbnailRenderer?.musicThumbnailRenderer?.thumbnail?.thumbnails ||
                           r.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails ||
                           r.thumbnail?.thumbnails || [];
            if (thumbs.length > 0) {
              cover = thumbs[thumbs.length - 1].url;
            } else if (vid) {
              cover = \`https://i.ytimg.com/vi/\${vid}/hqdefault.jpg\`;
            }

            const subLower = subtitle.toLowerCase();
            const titleLower = title.toLowerCase();
            const isMixOrPlaylist = !!pid ||
                                    subLower.includes('mix') ||
                                    subLower.includes('playlist') ||
                                    subLower.includes('station') ||
                                    titleLower.includes('mix') ||
                                    titleLower.includes('supermix');

            if (isMixOrPlaylist) {
              const mixId = pid || ('mix_' + titleLower.replace(/[^a-z0-9]/g, '_'));
              if (!mixes.some(m => m.id === mixId)) {
                let badge = 'Mix';
                if (titleLower.includes('supermix')) badge = 'Supermix';
                else if (titleLower.includes('discover')) badge = 'Discover';
                else if (titleLower.includes('chill')) badge = 'Chill';
                else if (titleLower.includes('energy') || titleLower.includes('workout')) badge = 'Energy';
                else if (titleLower.includes('focus')) badge = 'Focus';
                else if (titleLower.includes('favorite') || titleLower.includes('replay')) badge = 'Favorites';
                else if (titleLower.includes('party')) badge = 'Party';
                else if (titleLower.includes('romantic') || titleLower.includes('love')) badge = 'Romance';

                const grad = MIX_GRADIENTS[mixes.length % MIX_GRADIENTS.length];
                mixes.push({
                  id: mixId,
                  playlistId: pid || null,
                  title,
                  subtitle,
                  cover,
                  badge,
                  gradient: grad,
                  songIds: [],
                  tracks: []
                });
              }
            } else if (vid) {
              if (!tracks.some(t => t.id === vid)) {
                const trackObj = { id: vid, title, artist: subtitle, cover, duration: 215, plays: 0 };
                tracks.push(trackObj);
                if (!CATALOG.some(t => t.id === vid)) {
                  CATALOG.push(trackObj);
                }
              }
            }
          }
        }

        if (tracks.length > 0 || mixes.length > 0) {
          shelves.push({ title: shelfTitle, badge: shelfBadge, tracks, mixes });
        }
      }

      return shelves;
    }

    async function fetchYouTubeMusicFeed(force = false) {
      const isUser = userSession && userSession.isLoggedIn;
      const isDemo = userSession && userSession.isDemo;
      const cookie = isUser ? (userSession.cookie || '') : '';

      try {
        if (isDemo) {
          const demoShelves = [
            {
              title: "Quick picks",
              badge: "START RADIO FROM A SONG",
              tracks: (REGIONAL_CHARTS['Global'] || CATALOG).slice(0, 16),
              mixes: []
            },
            {
              title: "Mixed for you",
              badge: "PLAYLISTS TAILORED FOR YOU",
              tracks: [],
              mixes: CURATED_MIXES.map(m => ({
                ...m,
                tracks: (m.songIds || []).map(id => findTrackAcrossAllSources(id)).filter(Boolean)
              }))
            },
            {
              title: "Trending songs for you",
              badge: "CHARTS & BUZZ",
              tracks: (REGIONAL_CHARTS['India'] || CATALOG).slice(0, 16),
              mixes: []
            },
            {
              title: "Forgotten favorites",
              badge: "REVISIT PAST FAVORITES",
              tracks: (REGIONAL_CHARTS['United States'] || CATALOG).slice(0, 16),
              mixes: []
            }
          ];
          personalShelves = demoShelves;
          localStorage.setItem('soko_ytm_cached_feed_v2', JSON.stringify(demoShelves));
          renderHomeShelves(demoShelves);
          return { success: true, shelves: demoShelves };
        }

        const homePayload = {
          context: {
            client: {
              clientName: "WEB_REMIX",
              clientVersion: "1.20240101.01.00",
              hl: "en",
              gl: currentChartRegion === 'India' ? 'IN' : (currentChartRegion === 'United Kingdom' ? 'GB' : 'US')
            }
          },
          browseId: "FEmusic_home"
        };

        const homeData = await callInnerTubeApi("youtubei/v1/browse", homePayload, cookie);
        let extractedShelves = parseBrowseShelves(homeData);

        // If a shelf with title "Quick picks" only contains playlist carousels (e.g. unauthenticated browse),
        // resolve tracks from its playlist so that Quick picks has authentic song items!
        for (const s of extractedShelves) {
          const sTitleLower = (s.title || '').toLowerCase();
          if ((sTitleLower.includes('quick') || sTitleLower.includes('listen again') || sTitleLower.includes('start radio')) &&
              (!s.tracks || s.tracks.length === 0) && s.mixes && s.mixes.length > 0) {
            for (let i = 0; i < Math.min(2, s.mixes.length); i++) {
              const pid = s.mixes[i].playlistId;
              if (pid) {
                const resTracks = await resolvePlaylistTracks(pid);
                if (resTracks && resTracks.length > 0) {
                  s.tracks = s.tracks || [];
                  for (const rt of resTracks) {
                    if (!s.tracks.some(t => t.id === rt.id)) {
                      s.tracks.push(rt);
                    }
                  }
                  s.mixes[i].tracks = resTracks;
                  s.mixes[i].songIds = resTracks.map(t => t.id);
                }
              }
            }
          }
        }

        // Proactively resolve the first mix in the background so tapping starts immediately
        const mixShelf = extractedShelves.find(s => s.mixes && s.mixes.length > 0);
        if (mixShelf && mixShelf.mixes.length > 0 && (!mixShelf.mixes[0].tracks || mixShelf.mixes[0].tracks.length === 0)) {
          const firstPid = mixShelf.mixes[0].playlistId;
          if (firstPid) {
            resolvePlaylistTracks(firstPid).then(rTracks => {
              if (rTracks && rTracks.length > 0) {
                mixShelf.mixes[0].tracks = rTracks;
                mixShelf.mixes[0].songIds = rTracks.map(t => t.id);
              }
            }).catch(() => {});
          }
        }

        // Enrich with explore if needed for unauthenticated browse
        if (!isUser || extractedShelves.length < 2) {
          try {
            const expPayload = {
              context: {
                client: {
                  clientName: "WEB_REMIX",
                  clientVersion: "1.20240101.01.00",
                  hl: "en",
                  gl: currentChartRegion === 'India' ? 'IN' : (currentChartRegion === 'United Kingdom' ? 'GB' : 'US')
                }
              },
              browseId: "FEmusic_explore"
            };
            const expData = await callInnerTubeApi("youtubei/v1/browse", expPayload, cookie);
            const expShelves = parseBrowseShelves(expData);
            for (const es of expShelves) {
              if (!extractedShelves.some(s => s.title.toLowerCase() === es.title.toLowerCase())) {
                extractedShelves.push(es);
              }
            }
          } catch (ignored) {}
        }

        if (extractedShelves.length > 0) {
          personalShelves = extractedShelves;
          localStorage.setItem('soko_ytm_cached_feed_v2', JSON.stringify(extractedShelves));
          renderHomeShelves(extractedShelves);
          return { success: true, shelves: extractedShelves };
        }
      } catch (err) {
        console.warn("YouTube Music feed notice:", err);
        const container = document.getElementById('homeFeedContainer');
        if (container && (!personalShelves || personalShelves.length === 0)) {
          renderHomeShelves([]);
        }
        return { success: false, error: err };
      }

      const container = document.getElementById('homeFeedContainer');
      if (container && (!personalShelves || personalShelves.length === 0)) {
        renderHomeShelves([]);
      }
      return { success: false, error: new Error("No shelves extracted") };
    }

    function initPullToRefresh() {
      const scrollEl = document.querySelector('.content-scroll');
      const homePane = document.getElementById('pane-home');
      const ptrContainer = document.getElementById('pullToRefreshContainer');
      const ptrArrow = document.getElementById('ptrArrow');
      const ptrSpinner = document.getElementById('ptrSpinner');
      const ptrText = document.getElementById('ptrText');

      if (!scrollEl || !homePane || !ptrContainer) return;

      let startX = 0;
      let startY = 0;
      let currentX = 0;
      let currentY = 0;
      let isPulling = false;
      let isRefreshing = false;
      const PULL_THRESHOLD = 60;
      const MAX_PULL = 90;

      function onStart(x, y) {
        if (isRefreshing) return;
        if (scrollEl.scrollTop <= 0 && homePane.classList.contains('active')) {
          startX = x;
          currentX = x;
          startY = y;
          currentY = y;
          isPulling = true;
        }
      }

      function onMove(x, y, e) {
        if (!isPulling || isRefreshing) return;
        if (scrollEl.scrollTop > 0) {
          isPulling = false;
          resetPtr();
          return;
        }

        currentX = x;
        currentY = y;
        const deltaX = currentX - startX;
        const deltaY = currentY - startY;

        // If horizontal swipe dominates (e.g. user swiping a carousel sideways), abort PTR
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          isPulling = false;
          resetPtr();
          return;
        }

        // Pulling down from top
        if (deltaY > 0 && scrollEl.scrollTop <= 0) {
          if (e && e.cancelable && deltaY > 10) {
            e.preventDefault();
          }
          const pullDist = Math.min(MAX_PULL, deltaY * 0.45);
          ptrContainer.classList.add('pulling', 'active');
          ptrContainer.style.height = pullDist + 'px';
          ptrContainer.style.maxHeight = pullDist + 'px';
          ptrContainer.style.opacity = Math.min(1, pullDist / 35);

          if (pullDist >= PULL_THRESHOLD) {
            if (ptrArrow) ptrArrow.classList.add('flipped');
            if (ptrText) ptrText.innerText = 'Release to refresh';
          } else {
            if (ptrArrow) ptrArrow.classList.remove('flipped');
            if (ptrText) ptrText.innerText = 'Pull down to refresh';
          }
        }
      }

      async function onEnd() {
        if (!isPulling || isRefreshing) return;
        isPulling = false;
        ptrContainer.classList.remove('pulling');

        const deltaY = currentY - startY;
        const pullDist = Math.min(MAX_PULL, deltaY * 0.45);

        if (pullDist >= PULL_THRESHOLD && scrollEl.scrollTop <= 0) {
          await triggerRefresh();
        } else {
          resetPtr();
        }
      }

      async function triggerRefresh() {
        if (isRefreshing) return;
        isRefreshing = true;

        ptrContainer.classList.add('active');
        ptrContainer.style.height = '50px';
        ptrContainer.style.maxHeight = '50px';
        ptrContainer.style.opacity = '1';

        if (ptrArrow) ptrArrow.style.display = 'none';
        if (ptrSpinner) ptrSpinner.style.display = 'block';
        if (ptrText) ptrText.innerText = 'Refreshing feed...';

        try {
          let res = null;
          if (typeof window !== 'undefined' && typeof window.fetchYouTubeMusicFeed === 'function') {
            res = await window.fetchYouTubeMusicFeed(true);
          } else {
            res = await fetchYouTubeMusicFeed(true);
          }

          const isSuccess = res ? (res.success !== false && (res.success === true || Array.isArray(res) || (res.shelves && res.shelves.length > 0))) : false;

          if (isSuccess) {
            if (ptrText) ptrText.innerText = 'Feed updated!';
            showToast('Feed refreshed from YouTube Music', '✓');
          } else {
            if (ptrText) ptrText.innerText = 'Feed updated!';
            showToast('Feed refreshed', '✓');
          }
        } catch (err) {
          if (ptrText) ptrText.innerText = 'Refresh failed';
          showToast('Could not refresh feed', '⚠️');
        }

        setTimeout(() => {
          resetPtr();
          isRefreshing = false;
        }, 600);
      }

      function resetPtr() {
        ptrContainer.classList.remove('active', 'pulling');
        ptrContainer.style.height = '0px';
        ptrContainer.style.maxHeight = '0px';
        ptrContainer.style.opacity = '0';
        if (ptrArrow) {
          ptrArrow.style.display = 'block';
          ptrArrow.classList.remove('flipped');
        }
        if (ptrSpinner) ptrSpinner.style.display = 'none';
        if (ptrText) ptrText.innerText = 'Pull down to refresh';
      }

      scrollEl.addEventListener('touchstart', (e) => {
        if (e.touches && e.touches.length === 1) onStart(e.touches[0].clientX, e.touches[0].clientY);
      }, { passive: true });

      scrollEl.addEventListener('touchmove', (e) => {
        if (e.touches && e.touches.length === 1) onMove(e.touches[0].clientX, e.touches[0].clientY, e);
      }, { passive: false });

      scrollEl.addEventListener('touchend', onEnd, { passive: true });
      scrollEl.addEventListener('touchcancel', onEnd, { passive: true });

      let isMouseDown = false;
      scrollEl.addEventListener('mousedown', (e) => {
        if (scrollEl.scrollTop <= 0 && homePane.classList.contains('active')) {
          isMouseDown = true;
          onStart(e.clientX, e.clientY);
        }
      });
      window.addEventListener('mousemove', (e) => {
        if (isMouseDown) onMove(e.clientX, e.clientY, e);
      });
      window.addEventListener('mouseup', () => {
        if (isMouseDown) {
          isMouseDown = false;
          onEnd();
        }
      });

      window.triggerPullToRefresh = triggerRefresh;
    }
    window.initPullToRefresh = initPullToRefresh;
    window.triggerPullToRefresh = async function() {
      if (typeof window !== 'undefined' && typeof window.fetchYouTubeMusicFeed === 'function') {
        return window.fetchYouTubeMusicFeed();
      }
      return fetchYouTubeMusicFeed();
    };

    async function loadHomeFeed() {
      updateHomeAuthBanner();
      try {
        const cached = localStorage.getItem('soko_ytm_cached_feed_v2');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            personalShelves = parsed;
          }
        }
      } catch (e) {}

      // Immediately render shelves (cached or default sections)
      renderHomeShelves(personalShelves || []);

      await fetchYouTubeMusicFeed();
    }

    function renderShelves() {
      updateHomeAuthBanner();
      if (personalShelves && personalShelves.length > 0) {
        renderHomeShelves(personalShelves);
      } else {
        loadHomeFeed();
      }
    }

    function createTrackRowHtml(track, isInsidePlaylist = false, isLibraryView = false) {
      const isCached = isTrackOffline(track.id);
      const isDownloading = activeDownloads.has(track.id);
      return \`
        <div class="track-row" onclick="selectTrackToPlay('\${track.id}')">
          <img class="track-art" src="\${track.cover}" alt="\${track.title}" onerror="this.onerror=null; this.src='assets/logo.png';" />
          <div class="track-meta">
            <div class="track-title">\${track.title}</div>
            <div class="track-desc">\${track.artist} • \${formatTime(track.duration)}</div>
          </div>
          <div style="display: flex; align-items: center; gap: 4px; flex-shrink: 0;">
            \${isLibraryView ? \`
              <span title="Stored Offline" style="display: inline-flex; align-items: center; justify-content: center; width: 22px; height: 22px; color: #10B981; margin-right: 2px;">
                <svg width="17" height="17" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
              </span>
            \` : \`
              <button class="action-icon-btn-compact" onclick="event.stopPropagation(); startDownloadTrack('\${track.id}')" title="\${isCached ? 'Cached Offline' : 'Download'}">
                \${isCached ? 
                  '<svg width="17" height="17" fill="#10B981" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>' : 
                  (isDownloading ? 
                    '<svg width="17" height="17" fill="#F59E0B" viewBox="0 0 24 24" class="spin-icon"><path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/></svg>' :
                    '<svg width="17" height="17" fill="var(--text-dim)" viewBox="0 0 24 24"><path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM17 13l-5 5-5-5h3V9h4v4h3z"/></svg>'
                  )
                }
              </button>
            \`}
            \${isInsidePlaylist ? \`
              <button class="action-icon-btn-compact" onclick="event.stopPropagation(); removeSongFromActivePlaylist('\${track.id}')" title="Remove">✕</button>
            \` : \`
              <button class="action-icon-btn-compact" onclick="event.stopPropagation(); promptAddSongToPlaylist('\${track.id}')" title="Add to playlist">
                <svg width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>
              </button>
            \`}
            \${isLibraryView ? \`
              <button class="action-icon-btn-compact" onclick="event.stopPropagation(); deleteOfflineTrack('\${track.id}')" title="Delete from Offline" style="color: var(--text-dim);">
                <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              </button>
            \` : ''}
          </div>
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

        const isDownloaded = isTrackOffline(track.id);
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
        <button class="filter-pill" style="min-height: 40px; padding: 6px 14px; font-size: 11px; \${page === 1 ? 'opacity: 0.4; pointer-events: none;' : ''}" onclick="setChartPage(\${page - 1})">Prev</button>
      \`;
      for (let p = 1; p <= totalPages; p++) {
        pHtml += \`
          <button class="filter-pill \${p === page ? 'active' : ''}" style="min-width: 40px; min-height: 40px; padding: 6px 10px; font-size: 11px; text-align: center;" onclick="setChartPage(\${p})">\${p}</button>
        \`;
      }
      pHtml += \`
        <button class="filter-pill" style="min-height: 40px; padding: 6px 14px; font-size: 11px; \${page === totalPages ? 'opacity: 0.4; pointer-events: none;' : ''}" onclick="setChartPage(\${page + 1})">Next</button>
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

        let searchCookie = null;
        if (userSession && userSession.cookie) {
          searchCookie = userSession.cookie;
        } else if (window.SokoNative && typeof window.SokoNative.getStoredYtmCookies === 'function') {
          const c = window.SokoNative.getStoredYtmCookies();
          if (c && c.length > 20) searchCookie = c;
        }

        const data = await callInnerTubeApi("youtubei/v1/search", payload, searchCookie);

        function findResponsiveItems(obj, out = []) {
          if (!obj || typeof obj !== 'object') return out;
          if (obj.musicResponsiveListItemRenderer) {
            out.push(obj.musicResponsiveListItemRenderer);
          }
          if (Array.isArray(obj)) {
            for (let i = 0; i < obj.length; i++) findResponsiveItems(obj[i], out);
          } else {
            for (const k in obj) {
              if (Object.prototype.hasOwnProperty.call(obj, k)) {
                findResponsiveItems(obj[k], out);
              }
            }
          }
          return out;
        }

        function extractVideoId(obj) {
          if (!obj || typeof obj !== 'object') return null;
          if (obj.watchEndpoint && obj.watchEndpoint.videoId && typeof obj.watchEndpoint.videoId === 'string' && obj.watchEndpoint.videoId.length === 11) {
            return obj.watchEndpoint.videoId;
          }
          if (obj.videoId && typeof obj.videoId === 'string' && obj.videoId.length === 11) {
            return obj.videoId;
          }
          if (Array.isArray(obj)) {
            for (let i = 0; i < obj.length; i++) {
              const r = extractVideoId(obj[i]);
              if (r) return r;
            }
          } else {
            for (const k in obj) {
              if (Object.prototype.hasOwnProperty.call(obj, k)) {
                const r = extractVideoId(obj[k]);
                if (r) return r;
              }
            }
          }
          return null;
        }

        const items = findResponsiveItems(data);
        const onlineTracks = [];
        for (const item of items) {
          const videoId = extractVideoId(item);
          if (!videoId) continue;

          const cols = item.flexColumns || [];
          if (cols.length === 0) continue;

          const col0 = cols[0]?.musicResponsiveListItemFlexColumnRenderer;
          const tRuns = col0?.text?.runs || col0?.title?.runs || [];
          const title = tRuns.length > 0 ? tRuns[0].text : '';
          if (!title) continue;

          let artist = q;
          if (cols.length > 1) {
            const col1 = cols[1]?.musicResponsiveListItemFlexColumnRenderer;
            const aRuns = col1?.text?.runs || col1?.title?.runs || [];
            const candidates = aRuns
              .map(r => r.text ? r.text.trim() : '')
              .filter(t => t && t !== '•' && t !== 'Song' && t !== 'Video' && t !== 'Album' && t !== 'Single' && t !== 'Playlist' && !/^[0-9]+:[0-9]+(:[0-9]+)?$/.test(t));
            if (candidates.length > 0) {
              artist = candidates[0];
            }
          }

          const thumbs = item.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails || [];
          const cover = thumbs.length > 0 ? thumbs[thumbs.length - 1].url : ('https://i.ytimg.com/vi/' + videoId + '/hqdefault.jpg');

          if (!onlineTracks.some(ot => ot.id === videoId) && !localMatches.some(lm => lm.id === videoId)) {
            onlineTracks.push({
              id: videoId,
              title: title,
              artist: artist,
              duration: 210,
              cover: cover,
              audioUrl: '',
              bitrate: '160k Opus'
            });
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
        const isDownloaded = isTrackOffline(track.id);
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
            <div class="playlist-card-info">
              <div class="playlist-card-title">\${pl.name}</div>
              <div class="playlist-card-count">\${count} tracks \${pl.isSystem ? '• System' : ''}</div>
            </div>
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

    function filterLibraryTracks(query) {
      currentLibraryFilter = (query || '').trim().toLowerCase();
      currentLibraryPage = 1;
      renderLibraryTracks();
    }

    function setLibraryPage(page) {
      currentLibraryPage = page;
      renderLibraryTracks();
      const listEl = document.getElementById('libraryTracksList');
      if (listEl && typeof listEl.scrollIntoView === 'function') {
        listEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }

    function playAllOfflineTracks(shuffle = false) {
      const cached = CATALOG.filter(t => downloadedSet.has(t.id));
      if (cached.length === 0) {
        showToast('No downloaded songs in offline storage', 'ℹ️');
        return;
      }
      isShuffle = shuffle;
      const btn = document.getElementById('btnShuffle');
      if (btn) btn.style.color = isShuffle ? 'var(--accent-primary)' : 'var(--text-dim)';

      const firstTrack = isShuffle ? cached[Math.floor(Math.random() * cached.length)] : cached[0];
      selectTrackToPlay(firstTrack.id);
      showToast(isShuffle ? 'Shuffling All Offline Songs 🔀' : 'Playing All Offline Songs ▶', '⚡');
    }

    function deleteOfflineTrack(trackId) {
      if (!trackId) return;
      if (BUNDLED_TRACKS.some(b => b.id === trackId)) {
        showToast('Bundled core tracks cannot be removed from storage', 'ℹ️');
        return;
      }
      const track = findTrackAcrossAllSources(trackId);
      downloadedSet.delete(trackId);

      if (typeof window !== 'undefined' && window.SokoNative && window.SokoNative.deleteDownloadedTrack) {
        try {
          window.SokoNative.deleteDownloadedTrack(trackId);
        } catch (e) {
          console.warn('[Storage] Native track deletion error:', e);
        }
      }

      const offPl = userPlaylists.find(p => p.id === 'pl_offline');
      if (offPl) {
        offPl.songIds = offPl.songIds.filter(id => id !== trackId);
      }

      persistDownloadState();
      updateStorageMetrics();
      renderLibraryTracks();
      renderPlaylists();
      renderShelves();
      showToast(\`Removed "\${track ? track.title : 'Song'}" from offline storage\`, '🗑️');
    }

    function setLibrarySort(sortKey) {
      if (currentLibrarySort === sortKey) {
        currentLibrarySortDir = currentLibrarySortDir === 'asc' ? 'desc' : 'asc';
      } else {
        currentLibrarySort = sortKey;
        currentLibrarySortDir = (sortKey === 'duration' || sortKey === 'recent') ? 'desc' : 'asc';
      }
      currentLibraryPage = 1;
      const chips = document.querySelectorAll('.library-sort-chip');
      if (chips && chips.forEach) {
        chips.forEach(c => {
          if (c.classList && c.classList.remove) c.classList.remove('active');
          if (typeof c.querySelector === 'function') {
            const arrow = c.querySelector('.sort-dir-arrow');
            if (arrow) arrow.textContent = '';
          }
        });
      }
      const activeBtn = document.getElementById('sortBtn-' + sortKey);
      if (activeBtn) {
        if (activeBtn.classList && activeBtn.classList.add) activeBtn.classList.add('active');
        if (typeof activeBtn.querySelector === 'function') {
          const arrow = activeBtn.querySelector('.sort-dir-arrow');
          if (arrow) {
            arrow.textContent = currentLibrarySortDir === 'asc' ? ' ↑' : ' ↓';
          }
        }
      }
      renderLibraryTracks();
    }

    function renderLibraryTracks() {
      const list = document.getElementById('libraryTracksList');
      const badge = document.getElementById('librarySongCountBadge');
      const paginationEl = document.getElementById('libraryPagination');
      if (!list) return;

      const seenIds = new Set();
      let cachedTracks = [];
      for (const id of downloadedSet) {
        if (seenIds.has(id)) continue;
        seenIds.add(id);
        const t = findTrackAcrossAllSources(id);
        if (t) cachedTracks.push(t);
      }

      if (badge) {
        badge.innerText = \`\${cachedTracks.length} song\${cachedTracks.length === 1 ? '' : 's'}\`;
      }

      if (currentLibraryFilter) {
        const query = currentLibraryFilter.toLowerCase();
        cachedTracks = cachedTracks.filter(t => 
          (t.title && t.title.toLowerCase().includes(query)) ||
          (t.artist && t.artist.toLowerCase().includes(query))
        );
      }

      // Apply Sorting
      if (currentLibrarySort === 'title') {
        cachedTracks.sort((a, b) => {
          const cmp = (a.title || '').localeCompare(b.title || '', undefined, { sensitivity: 'base' });
          return currentLibrarySortDir === 'desc' ? -cmp : cmp;
        });
      } else if (currentLibrarySort === 'artist') {
        cachedTracks.sort((a, b) => {
          const cmp = (a.artist || '').localeCompare(b.artist || '', undefined, { sensitivity: 'base' }) ||
                      (a.title || '').localeCompare(b.title || '', undefined, { sensitivity: 'base' });
          return currentLibrarySortDir === 'desc' ? -cmp : cmp;
        });
      } else if (currentLibrarySort === 'duration') {
        cachedTracks.sort((a, b) => {
          const diff = (b.duration || 0) - (a.duration || 0);
          return currentLibrarySortDir === 'desc' ? diff : -diff;
        });
      } else {
        // 'recent': O(1) index map for instant O(N log N) sort
        const indexMap = new Map();
        let idx = 0;
        for (const id of downloadedSet) {
          indexMap.set(id, idx++);
        }
        cachedTracks.sort((a, b) => {
          const posA = indexMap.get(a.id) ?? 0;
          const posB = indexMap.get(b.id) ?? 0;
          return currentLibrarySortDir === 'asc' ? (posA - posB) : (posB - posA);
        });
      }

      if (cachedTracks.length === 0) {
        if (currentLibraryFilter) {
          list.innerHTML = \`
            <div style="text-align: center; padding: 32px 16px; color: var(--text-dim);">
              <div style="font-size: 28px; margin-bottom: 8px;">🔍</div>
              <div style="font-size: 13px; font-weight: 600; color: #FFF; margin-bottom: 4px;">No matching offline songs</div>
              <div style="font-size: 11px;">No downloaded tracks match "\${currentLibraryFilter}"</div>
            </div>
          \`;
        } else {
          list.innerHTML = \`
            <div style="text-align: center; padding: 36px 16px; background: var(--bg-card); border: 1px dashed var(--border-subtle); border-radius: var(--radius-md); margin-top: 8px;">
              <div style="font-size: 32px; margin-bottom: 8px;">📥</div>
              <div style="font-size: 14px; font-weight: 700; color: #FFF; margin-bottom: 4px;">No offline songs yet</div>
              <div style="font-size: 12px; color: var(--text-dim); max-width: 260px; margin: 0 auto 16px;">
                Download songs from Charts or Search for instant, 0-buffering playback anywhere.
              </div>
              <button class="filter-pill active" onclick="switchTab('charts')" style="padding: 8px 18px; font-size: 12px; font-weight: 600; margin: 0 auto;">
                Explore Top Charts
              </button>
            </div>
          \`;
        }
        if (paginationEl) paginationEl.innerHTML = '';
        return;
      }

      const totalPages = Math.ceil(cachedTracks.length / LIBRARY_PER_PAGE);
      if (currentLibraryPage > totalPages) currentLibraryPage = totalPages;
      if (currentLibraryPage < 1) currentLibraryPage = 1;

      const startIndex = (currentLibraryPage - 1) * LIBRARY_PER_PAGE;
      const pageTracks = cachedTracks.slice(startIndex, startIndex + LIBRARY_PER_PAGE);

      list.innerHTML = pageTracks.map(t => createTrackRowHtml(t, false, true)).join('');

      if (paginationEl) {
        if (totalPages > 1) {
          paginationEl.innerHTML = \`
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 14px 4px 6px; font-size: 12px;">
              <button class="filter-pill \${currentLibraryPage === 1 ? 'disabled' : ''}" 
                style="padding: 6px 14px; font-size: 11px; \${currentLibraryPage === 1 ? 'opacity: 0.4; pointer-events: none;' : ''}"
                onclick="setLibraryPage(\${currentLibraryPage - 1})">
                ‹ Prev
              </button>
              <span style="color: var(--text-dim); font-size: 11px; font-family: ui-monospace, monospace;">
                Page \${currentLibraryPage} of \${totalPages} (\${cachedTracks.length} total)
              </span>
              <button class="filter-pill \${currentLibraryPage === totalPages ? 'disabled' : ''}" 
                style="padding: 6px 14px; font-size: 11px; \${currentLibraryPage === totalPages ? 'opacity: 0.4; pointer-events: none;' : ''}"
                onclick="setLibraryPage(\${currentLibraryPage + 1})">
                Next ›
              </button>
            </div>
          \`;
        } else {
          paginationEl.innerHTML = '';
        }
      }
    }

    // ============================================================
    // FAVORITES & STORAGE METRICS
    // ============================================================
    function toggleFavorite(id) {
      let t = findTrackAcrossAllSources(id);
      if (t) {
        t.favorite = !t.favorite;
        syncFavoriteToYouTubeMusic(id, t.favorite);
        const favPl = userPlaylists.find(p => p.id === 'pl_favorites');
        if (favPl) {
          if (t.favorite && !favPl.songIds.includes(id)) {
            favPl.songIds.push(id);
          } else if (!t.favorite) {
            favPl.songIds = favPl.songIds.filter(x => x !== id);
          }
        }
        persistDownloadState();
        showToast(t.favorite ? 'Added to Liked Songs (Synced to YouTube Music ❤️)' : 'Removed from Liked Songs', t.favorite ? '❤️' : '💔');
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
      let usedMB = (count * 3.4).toFixed(1);
      if (typeof window !== 'undefined' && window.SokoNative && window.SokoNative.getDiskStorageUsedBytes) {
        try {
          const bytes = window.SokoNative.getDiskStorageUsedBytes();
          if (bytes > 0) {
            usedMB = (bytes / (1024 * 1024)).toFixed(1);
          }
        } catch (e) {}
      }
      const usedGB = (usedMB / 1024).toFixed(2);
      const percent = Math.min(100, Math.round((usedGB / maxCacheGB) * 100));

      if (label) label.innerText = \`\${usedMB} MB / \${maxCacheGB.toFixed(1)} GB\`;
      if (bar) bar.style.width = \`\${Math.max(4, percent)}%\`;
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

      toRemove.forEach(id => {
        downloadedSet.delete(id);
        if (typeof window !== 'undefined' && window.SokoNative && window.SokoNative.deleteDownloadedTrack) {
          try {
            window.SokoNative.deleteDownloadedTrack(id);
          } catch (e) {
            console.warn('[Storage] Native track deletion error:', e);
          }
        }
      });

      const offPl = userPlaylists.find(p => p.id === 'pl_offline');
      if (offPl) {
        offPl.songIds = offPl.songIds.filter(id => downloadedSet.has(id));
      }

      persistDownloadState();
      updateStorageMetrics();
      renderShelves();
      renderLibraryTracks();
      renderPlaylists();
      showToast(\`Cleared \${toRemove.length} unpinned songs & freed disk space\`, '🧹');
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

    function switchTab(tabName) {
      const tabs = ['home', 'charts', 'search', 'library', 'settings'];
      const idx = tabs.indexOf(tabName);
      const navItems = document.querySelectorAll('.nav-tab-item');
      switchNavTab(tabName, idx >= 0 && navItems[idx] ? navItems[idx] : null);
    }

    function switchNavTab(tabName, el) {
      document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
      document.querySelectorAll('.nav-tab-item').forEach(t => t.classList.remove('active'));

      const targetPane = document.getElementById(\`pane-\${tabName}\`);
      if (targetPane) targetPane.classList.add('active');
      if (el) el.classList.add('active');

      if (tabName === 'charts') {
        renderCharts(currentChartRegion);
      } else if (tabName === 'library') {
        backToPlaylists();
        renderPlaylists();
        renderLibraryTracks();
      } else if (tabName === 'settings') {
        updateStorageMetrics();
        updateAuthHeaderUI();
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

    window.onYtmNativeApiResponse = function(callbackId, success, jsonOrError) {
      if (window.ytmCallbacks && window.ytmCallbacks[callbackId]) {
        const cb = window.ytmCallbacks[callbackId];
        clearTimeout(cb.timer);
        delete window.ytmCallbacks[callbackId];

        if (!success || (typeof jsonOrError === 'string' && jsonOrError.startsWith("ERROR:"))) {
          cb.reject(new Error(jsonOrError));
        } else {
          try {
            const parsed = typeof jsonOrError === 'object' ? jsonOrError : JSON.parse(jsonOrError);
            cb.resolve(parsed);
          } catch (e) {
            cb.reject(e);
          }
        }
      }
    };
    window.ytmCallback = window.onYtmNativeApiResponse;

    function callInnerTubeApi(endpoint, payload, customCookie) {
      if (window.callInnerTubeApi && typeof window.callInnerTubeApi === 'function' && window.callInnerTubeApi !== callInnerTubeApi) {
        return window.callInnerTubeApi(endpoint, payload, customCookie);
      }
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
          const reqHeaders = {
            'Content-Type': 'application/json',
            'X-YouTube-Client-Name': '67',
            'X-YouTube-Client-Version': '1.20240101.01.00',
            'X-Origin': 'https://music.youtube.com'
          };
          if (customCookie) {
            reqHeaders['Cookie'] = customCookie;
          }
          fetch((endpoint.startsWith('http') ? endpoint : 'https://music.youtube.com/' + endpoint), {
            method: 'POST',
            headers: reqHeaders,
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
      if (window.SokoNative && (typeof window.SokoNative.launchGoogleLogin === 'function' || typeof window.SokoNative.startGoogleLoginFlow === 'function')) {
        if (typeof window.SokoNative.launchGoogleLogin === 'function') {
          window.SokoNative.launchGoogleLogin();
        } else {
          window.SokoNative.startGoogleLoginFlow();
        }
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
      localStorage.removeItem('soko_ytm_cached_feed_v2');
      if (window.SokoNative && typeof window.SokoNative.clearStoredYtmCookies === 'function') {
        window.SokoNative.clearStoredYtmCookies();
      }
      personalShelves = null;
      loadHomeFeed();
      updateAuthModalContent();
      updateAuthHeaderUI();
      showToast("Signed Out", "👋");
    }

    async function syncYTMFeed() {
      showToast("Syncing YouTube Music Feed...", "⏳");
      await fetchYouTubeMusicFeed();
      showToast("Feed Synced!", "✓");
    }

    async function syncUserData() {
      await syncYTMFeed();
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
      loadHomeFeed();
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
      updatePlaybackTelemetry(currentSec, durationSec);
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

    window.onNativeTrackEnded = function() {
      recordTrackCompletionTelemetry();
      if (isRepeat) {
        if (currentTrack) {
          if (window.SokoNative && typeof window.SokoNative.seekAudio === 'function') {
            window.SokoNative.seekAudio(0);
            window.SokoNative.resumeAudio();
          } else {
            playRealTrack(currentTrack);
          }
        }
      } else {
        playNextTrack();
      }
    };

    window.onNativePlaybackError = function(errorCode) {
      console.warn('Native playback error code:', errorCode);
      if (currentTrack) {
        showToast('Playback error, switching to stream...', '⚠️');
        playOnlineYouTubeStream(currentTrack);
      }
    };

    window.handleBecomingNoisy = function() {
      if (isOnlineYtPlaying) {
        if (ytPlayer && typeof ytPlayer.pauseVideo === 'function') {
          try { ytPlayer.pauseVideo(); } catch (e) {}
        }
      }
      if (window.SokoNative && typeof window.SokoNative.pauseAudio === 'function') {
        try { window.SokoNative.pauseAudio(); } catch (e) {}
      } else if (audioEl) {
        try { audioEl.pause(); } catch (e) {}
      }
      isPlaying = false;
      updatePlayIcons(false);
      stopRealVisualizer();
      stopOnlineProgressUpdater();
    };

    window.onNativeAudioFocusLost = function() {
      if (isOnlineYtPlaying) {
        if (ytPlayer && typeof ytPlayer.pauseVideo === 'function') {
          try { ytPlayer.pauseVideo(); } catch (e) {}
        }
      }
      if (window.SokoNative && typeof window.SokoNative.pauseAudio === 'function') {
        try { window.SokoNative.pauseAudio(); } catch (e) {}
      } else if (audioEl) {
        try { audioEl.pause(); } catch (e) {}
      }
      isPlaying = false;
      updatePlayIcons(false);
      stopRealVisualizer();
      stopOnlineProgressUpdater();
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
      initPullToRefresh();
      renderCharts('Global', 1);
      renderPlaylists();
      renderLibraryTracks();
      updateStorageMetrics();
      setupMediaSession();
      updateAuthHeaderUI();

      // Check last played track
      const savedLastTrack = getLastPlayedTrack();
      const miniPlayer = document.getElementById('miniPlayer');
      if (savedLastTrack && savedLastTrack.id) {
        currentTrack = savedLastTrack;
        isPlaying = false;
        updatePlayerUI(currentTrack);
        updatePlayIcons(false);
        scheduleLookAhead(currentTrack.id);
        if (miniPlayer) miniPlayer.style.display = 'flex';
      } else {
        currentTrack = null;
        isPlaying = false;
        if (miniPlayer) miniPlayer.style.display = 'none';
      }

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
