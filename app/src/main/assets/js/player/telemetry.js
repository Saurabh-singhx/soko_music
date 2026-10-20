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

function sendTelemetryPing(urlString) {
  const cookie = (userSession && userSession.cookie) ? userSession.cookie : null;
  if (window.SokoNative && typeof window.SokoNative.sendAuthenticatedTelemetryPing === 'function' && cookie) {
    window.SokoNative.sendAuthenticatedTelemetryPing(urlString, cookie);
  } else if (window.SokoNative && typeof window.SokoNative.sendTelemetryPing === 'function') {
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
      console.log(`[Telemetry] Early skip registered for ${currentTrack.title} after ${currentTrackPlayedSeconds.toFixed(1)}s`);
      sendTelemetryPing(`https://www.youtube.com/api/stats/watchtime?ns=yt&el=detailpage&cpn=${currentSessionCpn}&docid=${currentTrack.id}&ver=2&cmt=${currentTrackPlayedSeconds.toFixed(1)}&state=paused`);
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

  console.log(`[Telemetry] Starting playback session for ${track.title} (${track.id}), cpn: ${currentSessionCpn}`);
  sendTelemetryPing(`https://www.youtube.com/api/stats/playback?ns=yt&el=detailpage&cpn=${currentSessionCpn}&docid=${track.id}&ver=2`);
}

function updatePlaybackTelemetry(currentSec, totalSec) {
  if (!hasSentPlaybackStart || hasSentCompletionPing || !currentTrack) return;
  currentTrackPlayedSeconds = currentSec;

  // 1. Initial 10-second confirmation ping
  if (currentSec >= 10 && !hasSent10sPing) {
    hasSent10sPing = true;
    console.log(`[Telemetry] 10s confirmed listen for ${currentTrack.title}`);
    sendTelemetryPing(`https://www.youtube.com/api/stats/watchtime?ns=yt&el=detailpage&cpn=${currentSessionCpn}&docid=${currentTrack.id}&ver=2&cmt=${currentSec.toFixed(1)}&state=playing`);
  }

  // 2. Midpoint ping (at 50% or 45s) - signals deep engagement to YouTube algorithm
  const midThreshold = Math.min(45, (totalSec || 200) * 0.5);
  if (currentSec >= midThreshold && !hasSentMidpointPing) {
    hasSentMidpointPing = true;
    console.log(`[Telemetry] Midpoint (>50%) reached for ${currentTrack.title} (${currentSec.toFixed(1)}s) - Logged to YouTube History`);
    sendTelemetryPing(`https://www.youtube.com/api/stats/watchtime?ns=yt&el=detailpage&cpn=${currentSessionCpn}&docid=${currentTrack.id}&ver=2&cmt=${currentSec.toFixed(1)}&len=${(totalSec || 200).toFixed(1)}&state=playing`);
  }
}

function recordTrackCompletionTelemetry() {
  if (!currentTrack || hasSentCompletionPing) return;
  hasSentCompletionPing = true;
  const duration = currentTrack.duration || 215;
  console.log(`[Telemetry] 100% Completion logged for ${currentTrack.title}`);
  sendTelemetryPing(`https://www.youtube.com/api/stats/watchtime?ns=yt&el=detailpage&cpn=${currentSessionCpn}&docid=${currentTrack.id}&ver=2&cmt=${duration}&len=${duration}&state=completed`);
}

function recordPlaybackStateChangeTelemetry(playing) {
  if (!hasSentPlaybackStart || hasSentCompletionPing || !currentTrack) return;
  const stateStr = playing ? 'playing' : 'paused';
  sendTelemetryPing(`https://www.youtube.com/api/stats/watchtime?ns=yt&el=detailpage&cpn=${currentSessionCpn}&docid=${currentTrack.id}&ver=2&cmt=${currentTrackPlayedSeconds.toFixed(1)}&state=${stateStr}`);
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

    console.log(`[Telemetry] Syncing ${isLiked ? 'LIKE' : 'UNLIKE'} for ${trackId} to YouTube Music`);
    await callInnerTubeApi(endpoint, payload, cookie);
  } catch (err) {
    console.warn('[Telemetry] Favorite sync notice:', err);
  }
}

window.currentSessionCpn = currentSessionCpn;
window.currentTrackPlayStartEpoch = currentTrackPlayStartEpoch;
window.currentTrackPlayedSeconds = currentTrackPlayedSeconds;
window.hasSentPlaybackStart = hasSentPlaybackStart;
window.hasSent10sPing = hasSent10sPing;
window.hasSentMidpointPing = hasSentMidpointPing;
window.hasSentCompletionPing = hasSentCompletionPing;

window.sendTelemetryPing = sendTelemetryPing;
window.startPlaybackTelemetry = startPlaybackTelemetry;
window.updatePlaybackTelemetry = updatePlaybackTelemetry;
window.recordTrackCompletionTelemetry = recordTrackCompletionTelemetry;
window.recordPlaybackStateChangeTelemetry = recordPlaybackStateChangeTelemetry;
window.syncFavoriteToYouTubeMusic = syncFavoriteToYouTubeMusic;
