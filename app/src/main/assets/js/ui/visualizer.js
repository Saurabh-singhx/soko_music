// ============================================================
// FREQUENCY EQUALIZER VISUALIZER - Smooth Start & Smooth Stop
// ============================================================
let visualizerStopTimer = null;

function startRealVisualizer() {
  if (typeof document === 'undefined') return;
  if (visualizerStopTimer) {
    clearTimeout(visualizerStopTimer);
    visualizerStopTimer = null;
  }
  const container = document.getElementById('visualizerBars');
  if (!container) return;
  const bars = (typeof container.querySelectorAll === 'function')
    ? container.querySelectorAll('.v-bar')
    : (typeof document.querySelectorAll === 'function' ? document.querySelectorAll('.v-bar') : []);
  if (bars && bars.length > 0) {
    bars.forEach(b => {
      if (b && b.style) {
        b.style.transition = '';
        b.style.height = '';
      }
    });
  }
  if (container.classList) {
    container.classList.remove('is-stopping');
    container.classList.add('is-playing');
  }
}

function stopRealVisualizer() {
  if (typeof document === 'undefined') return;
  const container = document.getElementById('visualizerBars');
  if (!container) return;

  const isAlreadyIdle = container.classList && !container.classList.contains('is-playing') && !container.classList.contains('is-stopping');
  if (isAlreadyIdle) return;

  const bars = (typeof container.querySelectorAll === 'function')
    ? container.querySelectorAll('.v-bar')
    : (typeof document.querySelectorAll === 'function' ? document.querySelectorAll('.v-bar') : []);

  if (!bars || bars.length === 0) {
    if (container.classList) {
      container.classList.remove('is-playing');
      container.classList.remove('is-stopping');
    }
    return;
  }

  // 1. Capture current rendered height of each bar
  const heights = [];
  bars.forEach(b => {
    let h = '6px';
    if (typeof window !== 'undefined' && typeof window.getComputedStyle === 'function') {
      try {
        const comp = window.getComputedStyle(b);
        h = comp.getPropertyValue('height') || '6px';
      } catch (e) {
        h = '6px';
      }
    }
    heights.push(h);
  });

  // 2. Lock current heights inline so detaching the keyframe animation does not cause a visual snap
  bars.forEach((b, i) => {
    if (b && b.style) {
      b.style.transition = 'none';
      b.style.height = heights[i];
    }
  });

  // 3. Remove is-playing class and mark is-stopping
  if (container.classList) {
    container.classList.remove('is-playing');
    container.classList.add('is-stopping');
  }

  // Trigger reflow so browser commits the starting inline heights
  try { void container.offsetHeight; } catch (e) {}

  // 4. Smoothly ease down to 6px (idle resting state)
  const applySmoothDecay = () => {
    bars.forEach(b => {
      if (b && b.style) {
        b.style.transition = 'height 0.45s cubic-bezier(0.25, 1, 0.5, 1)';
        b.style.height = '6px';
      }
    });
  };

  if (typeof requestAnimationFrame === 'function') {
    requestAnimationFrame(applySmoothDecay);
  } else {
    applySmoothDecay();
  }

  if (visualizerStopTimer) clearTimeout(visualizerStopTimer);
  visualizerStopTimer = setTimeout(() => {
    bars.forEach(b => {
      if (b && b.style) {
        b.style.transition = '';
        b.style.height = '';
      }
    });
    if (container.classList) {
      container.classList.remove('is-stopping');
    }
    visualizerStopTimer = null;
  }, 500);
}

window.startRealVisualizer = startRealVisualizer;
window.stopRealVisualizer = stopRealVisualizer;
