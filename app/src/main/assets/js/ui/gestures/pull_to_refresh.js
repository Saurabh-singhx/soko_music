// ============================================================
// PULL TO REFRESH TOUCH GESTURE
// ============================================================
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

      const isSuccess = res ? (res.success === true || Array.isArray(res) || (res.shelves && res.shelves.length > 0)) : false;

      if (isSuccess) {
        if (ptrText) ptrText.innerText = 'Feed updated!';
        showToast('Feed refreshed with fresh music', '✓');
      } else {
        if (ptrText) ptrText.innerText = 'Could not refresh';
        showToast('Could not refresh feed (check connection)', '⚠️');
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
