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

window.showToast = showToast;
