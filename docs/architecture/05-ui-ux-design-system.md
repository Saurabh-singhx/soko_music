# Architecture: UI/UX Design System & Mobile Ergonomics

> **Design Objective**: Premium, high-contrast dark cyberpunk glassmorphism tailored specifically for single-handed mobile ergonomics, WCAG 2.2 AA contrast compliance, and fluid responsive adaptability across viewports from 360px up to large flagship screens.

---

## 1. Design Tokens & Color Palette

```css
:root {
  /* Surfaces & Backgrounds */
  --bg-primary: #07090E;
  --bg-secondary: #0D111A;
  --surface-card: rgba(19, 24, 37, 0.75);
  --surface-glass: rgba(255, 255, 255, 0.04);
  --surface-border: rgba(255, 255, 255, 0.08);

  /* Brand Accents */
  --accent-primary: #6366F1;       /* Electric Indigo */
  --accent-secondary: #06B6D4;     /* Cyan Neon Glow */
  --accent-glow: rgba(99, 102, 241, 0.35);
  --accent-success: #10B981;      /* Emerald Download Done */
  --accent-amber: #F59E0B;        /* Caching Active */
  --accent-rose: #F43F5E;         /* Favorite Heart */

  /* Typography */
  --text-primary: #F8FAFC;
  --text-secondary: #94A3B8;
  --text-tertiary: #64748B;

  /* Mobile Ergonomic Layout */
  --safe-top: max(env(safe-area-inset-top, 0px), 16px);
  --safe-bottom: max(env(safe-area-inset-bottom, 0px), 16px);
  --tab-bar-height: 64px;
  --mini-player-height: 64px;
  --touch-target-min: 44px;
}
```

---

## 2. Touch Ergonomics & Reachability Zones

1. **Lower Two-Thirds Priority**: Primary play/pause, scrub slider, and navigation tabs are anchored in the comfortable thumb reach zone.
2. **Touch Targets**: All interactable icons, buttons, and seek controls maintain a minimum target bounding box of **$48\times 48\text{px}$** to eliminate mis-taps while walking or commuting.
3. **Bottom Floating Dock Clearance**: Content containers enforce bottom padding:
   ```css
   padding-bottom: calc(var(--tab-bar-height) + var(--mini-player-height) + var(--safe-bottom) + 24px);
   ```
   Ensuring zero content is ever obscured beneath the floating mini-player or navigation bar.

---

## 3. Responsive Fluidity & Breakpoints

- **Zero Fixed Container Widths**: Container max-width capped at `520px` with `width: 100%` and `margin: 0 auto`.
- **Narrow Viewport Optimization (`@media (max-width: 380px)`)**:
  - Horizontal gutters scale from `16px` to `12px`.
  - Grid columns transition smoothly without horizontal overflow (`overflow-x: hidden`).
  - Button paddings scale to prevent multiline text breaking.

---

## 4. Micro-Interactions & 60fps Visualizer

- **Equalizer Soundwaves**: Dynamic frequency bars utilizing hardware-accelerated CSS `transform: scaleY()` to maintain 60fps frame rates with negligible battery overhead.
- **Glassmorphic Mini-Player**: Smooth slide-up transition when audio begins playing, with quick access to full-screen lyrics and up-next queue drawer.

---

## 5. Visual Verification & Screenshot Catalog

Design system compliance, responsive layout stability, and WCAG accessibility standards are documented in curated screenshot archives:
- [`docs/screenshots/device/`](file:///home/saurabh/coding/soko-music-app/docs/screenshots/device/): Viewport ergonomics across compact (360px) and large mobile screens.
- [`docs/screenshots/ui/`](file:///home/saurabh/coding/soko-music-app/docs/screenshots/ui/): Glassmorphic panes, library sorting controls, dynamic carousels, and mini-player states.
- [`docs/screenshots/audits/`](file:///home/saurabh/coding/soko-music-app/docs/screenshots/audits/): Touch target bounding boxes ($\ge 48\times 48\text{px}$) and safe-area notch insets.
- [`docs/screenshots/brand/`](file:///home/saurabh/coding/soko-music-app/docs/screenshots/brand/): Vector branding assets, adaptive Android launcher icons, and splash imagery.
