// ============================================================
// YOUTUBE MUSIC INNERTUBE API CLIENT
// ============================================================
window.ytmCallbacks = window.ytmCallbacks || {};

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

window.callInnerTubeApi = callInnerTubeApi;
