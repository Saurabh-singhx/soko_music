// ============================================================
// SOKO PEEKING CHARACTER NOTIFICATION ENGINE
// ============================================================

class SokoPeekingAlert {
  constructor() {
    this._timers = [];
    this._runId = 0;
    this._ensureElements();
  }

  _ensureElements() {
    if (!this.row && typeof document !== 'undefined') {
      this.row = document.getElementById("soko-alert-row");
      this.logo = document.getElementById("soko-peek-logo");
      this.bubble = document.getElementById("soko-bubble");
      this.badgeEl = document.getElementById("soko-badge");
      this.messageEl = document.getElementById("soko-message");
      this.timerFill = document.getElementById("soko-timer-fill");

      if (this.bubble) {
        this.bubble.addEventListener("click", () => this.dismiss());
      }
      if (this.logo) {
        this.logo.addEventListener("click", () => this.dismiss());
      }
    }
    return !!(this.row && this.logo && this.bubble && this.badgeEl && this.messageEl && this.timerFill);
  }

  _schedule(fn, delay, runId) {
    const id = setTimeout(() => {
      if (runId === this._runId) fn();
    }, delay);
    this._timers.push(id);
  }

  _clearTimers() {
    this._timers.forEach(clearTimeout);
    this._timers = [];
  }

  /**
   * @param {Object} options
   * @param {string} options.message    - Main notification text
   * @param {string} [options.badge]    - Pill label (default: "SOKO")
   * @param {"right"|"left"} [options.side] - Screen edge to peek from (default: "right")
   * @param {number} [options.duration] - Visible duration in ms (default: 3200)
   * @param {boolean} [options.typing]  - Show messenger typing dots first (default: true)
   */
  show({
    message,
    badge = "SOKO",
    side = "right",
    duration = 3200,
    typing = true,
  }) {
    if (!this._ensureElements()) return;

    this._clearTimers();
    const runId = ++this._runId;

    // Reset state cleanly before starting
    this.bubble.classList.remove("is-open", "is-typing");
    this.logo.classList.remove("is-peeking");
    this.row.classList.toggle("side-right", side === "right");
    this.row.classList.toggle("side-left", side === "left");

    this.badgeEl.textContent = badge;
    this.messageEl.textContent = message;
    this.timerFill.style.transition = "none";
    this.timerFill.style.transform = "scaleX(1)";

    // Force reflow so switching sides or re-triggering replays smoothly
    void this.row.offsetWidth;

    // Step 1: Character peeks halfway out and STAYS peeking
    this.logo.classList.add("is-peeking");

    // Step 2: Messenger bubble pops beside the character
    this._schedule(() => {
      if (typing) this.bubble.classList.add("is-typing");
      this.bubble.classList.add("is-open");

      const revealDelay = typing ? 320 : 0;

      // Step 3: Reveal message & run countdown while character remains visible
      this._schedule(() => {
        this.bubble.classList.remove("is-typing");
        void this.timerFill.offsetWidth;
        this.timerFill.style.transition = `transform ${duration}ms linear`;
        this.timerFill.style.transform = "scaleX(0)";

        // Step 4: Only dismiss after the full countdown finishes
        this._schedule(() => this.dismiss(), duration, runId);
      }, revealDelay, runId);
    }, 220, runId);
  }

  dismiss() {
    this._clearTimers();
    const runId = ++this._runId;

    if (this.bubble) {
      this.bubble.classList.remove("is-open", "is-typing");
    }
    this._schedule(() => {
      if (this.logo) {
        this.logo.classList.remove("is-peeking");
      }
    }, 140, runId);
  }
}

// Global alert instance
const sokoAlert = new SokoPeekingAlert();

// Helper to deduce badge & side from icon or message
function mapIconToBadge(icon, msg = '') {
  if (icon === '❤️' || icon === '💔') return { badge: 'FAVORITES', side: 'left' };
  if (icon === '📁') return { badge: 'PLAYLIST', side: 'left' };
  if (icon === '🧹' || icon === '💾' || icon === '🗑️') return { badge: 'STORAGE', side: 'left' };
  if (icon === '📻') return { badge: 'RADIO', side: 'right' };
  if (icon === '▶️' || icon === '▶' || icon === '🔀') return { badge: 'NOW PLAYING', side: 'right', typing: false };
  if (icon === '✓' || icon === '🎉') return { badge: 'SUCCESS', side: 'right' };
  if (icon === '⚠️' || icon === '⛔' || icon === '⏱️') return { badge: 'NOTICE', side: 'right' };
  if (icon === '📈' || icon === '🔄') return { badge: 'CHARTS', side: 'right' };
  if (icon === '📥' || icon === '⏳') return { badge: 'DOWNLOAD', side: 'right' };
  if (icon === '🔍') return { badge: 'SEARCH', side: 'right' };
  return { badge: 'SOKO', side: 'right' };
}

let toastTimer = null;

function showToast(msg, icon = '⚡', options = {}) {
  // Always update legacy DOM elements for test assertions & backwards compatibility
  const toast = (typeof document !== 'undefined') ? document.getElementById('globalToast') : null;
  const text = (typeof document !== 'undefined') ? document.getElementById('toastMsg') : null;
  const ic = (typeof document !== 'undefined') ? document.getElementById('toastIcon') : null;
  if (text) text.innerText = msg;
  if (ic) ic.innerText = icon;

  // Try peeking alert first
  if (window.sokoAlert && window.sokoAlert._ensureElements()) {
    const defaults = mapIconToBadge(icon, msg);
    const opts = (typeof options === 'object' && options !== null) ? options : {};
    const badge = opts.badge || defaults.badge;
    const side = opts.side || defaults.side;
    const typing = opts.typing !== undefined ? opts.typing : (defaults.typing !== undefined ? defaults.typing : true);
    const duration = opts.duration || 3200;

    let cleanMsg = msg;
    if (cleanMsg.startsWith(icon + ' ')) {
      cleanMsg = cleanMsg.slice(icon.length + 1);
    }

    window.sokoAlert.show({
      message: cleanMsg,
      badge: badge,
      side: side,
      duration: duration,
      typing: typing
    });
    return;
  }

  // Fallback to legacy toast if present
  if (toast) {
    toast.classList.add('show');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 2400);
  }
}

// Window exports
window.SokoPeekingAlert = SokoPeekingAlert;
window.sokoAlert = sokoAlert;
window.showToast = showToast;
