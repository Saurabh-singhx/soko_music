// Duration parsing and time formatting utilities
function parseDurationStringToSeconds(str) {
  if (!str && str !== 0) return 0;
  if (typeof str === 'number') return isNaN(str) ? 0 : str;
  const s = String(str).trim();

  // Hours indicator: "1 hr 12 min", "2 hours", "1 hr", "1h 10m"
  if (/\b(hr|hrs|hour|hours)\b/i.test(s) || /^\d+\s*h(?:\s*\d+m)?/i.test(s)) {
    return 3600;
  }

  // Minutes indicator: "25 min", "45 mins", "15m"
  const minMatch = s.match(/(\d+)\s*(?:min|mins|minute|minutes|m)\b/i);
  if (minMatch) {
    const mins = parseInt(minMatch[1], 10);
    return isNaN(mins) ? 0 : mins * 60;
  }

  // Colon separated: "mm:ss" or "hh:mm:ss"
  if (s.includes(':')) {
    const parts = s.split(':').map(p => parseInt(p, 10));
    if (parts.some(isNaN)) return 0;
    if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    } else if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
  }

  const num = parseInt(s, 10);
  return isNaN(num) ? 0 : num;
}

function formatTime(sec) {
  if (isNaN(sec) || sec < 0) return '0:00';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  if (h > 0) {
    return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  }
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

window.parseDurationStringToSeconds = parseDurationStringToSeconds;
window.formatTime = formatTime;
