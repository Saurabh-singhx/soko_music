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
    window.visualizerAnimFrame = visualizerAnimFrame;
  }
  visualizerAnimFrame = requestAnimationFrame(renderFrame);
  window.visualizerAnimFrame = visualizerAnimFrame;
}

function stopRealVisualizer() {
  if (visualizerAnimFrame) {
    cancelAnimationFrame(visualizerAnimFrame);
    visualizerAnimFrame = null;
    window.visualizerAnimFrame = null;
  }
  document.querySelectorAll('.v-bar').forEach(b => b.style.height = '6px');
}

window.startRealVisualizer = startRealVisualizer;
window.stopRealVisualizer = stopRealVisualizer;
