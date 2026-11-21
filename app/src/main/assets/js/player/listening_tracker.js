// ============================================================
// ACCURATE & OPTIMAL REAL-TIME LISTENING TIME & STATS ENGINE
// Dual-Store Persistence (Native SharedPreferences + LocalStorage)
// Zero Hardcoded Mock Data - 100% Dynamically Calculated
// ============================================================

(function() {
  const STORAGE_KEY = 'soko_listening_stats_v2';

  function getTodayKey() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  function formatHoursMins(totalMins) {
    const mins = Math.max(0, Math.floor(totalMins));
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h > 0) return `${h}h ${m < 10 ? '0' : ''}${m}m`;
    return `${m}m`;
  }

  function safeGetEl(id) {
    if (typeof document !== 'undefined' && typeof document.getElementById === 'function') {
      try { return document.getElementById(id); } catch (e) {}
    }
    return null;
  }

  function safeQueryAll(sel) {
    if (typeof document !== 'undefined' && typeof document.querySelectorAll === 'function') {
      try { return document.querySelectorAll(sel); } catch (e) {}
    }
    return [];
  }

  class ListeningTracker {
    constructor() {
      this.isPlaying = false;
      this.isSeeking = false;
      this.isBuffering = false;
      this.currentTrackId = null;
      this.isCurrentTrackOffline = false;
      this.lastTickTime = null;

      // In-memory accumulator
      this.unsavedSeconds = 0;
      this.activeRange = 'today';

      // Load or initialize persistent stats
      this.stats = this.loadStats();

      // UI update throttle (1s)
      this.lastUiUpdateTime = 0;

      // Auto-flush every 3 seconds during active playback to guarantee persistence
      setInterval(() => {
        if (this.isPlaying || this.unsavedSeconds >= 1.0) {
          this.flushToStorage();
        }
      }, 3000);

      // Save immediately on unload / background / visibility change
      if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
        try {
          window.addEventListener('beforeunload', () => this.flushToStorage());
          window.addEventListener('pagehide', () => this.flushToStorage());
          window.addEventListener('blur', () => this.flushToStorage());
        } catch (e) {}
      }
      if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
        try {
          document.addEventListener('visibilitychange', () => {
            this.flushToStorage();
          });
        } catch (e) {}
      }
    }

    loadStats() {
      let stats = null;

      // 1. Try SokoNative SharedPreferences first (rock solid Android persistent storage)
      try {
        if (typeof window !== 'undefined' && window.SokoNative && typeof window.SokoNative.getStoredListeningStats === 'function') {
          const nativeRaw = window.SokoNative.getStoredListeningStats();
          if (nativeRaw && typeof nativeRaw === 'string' && nativeRaw.trim().startsWith('{')) {
            const parsed = JSON.parse(nativeRaw);
            if (parsed && typeof parsed === 'object' && parsed.daily) {
              stats = parsed;
            }
          }
        }
      } catch (e) {}

      // 2. Try localStorage
      try {
        if (typeof localStorage !== 'undefined') {
          const localRaw = localStorage.getItem(STORAGE_KEY);
          if (localRaw && typeof localRaw === 'string' && localRaw.trim().startsWith('{')) {
            const parsed = JSON.parse(localRaw);
            if (parsed && typeof parsed === 'object' && parsed.daily) {
              if (!stats || (parsed.allTimeSeconds || 0) > (stats.allTimeSeconds || 0)) {
                stats = parsed;
              }
            }
          }
        }
      } catch (e) {}

      if (stats) {
        this.stats = stats;
        this.saveStats();
        return stats;
      }

      // Clean, zeroed real initial state
      return {
        allTimeSeconds: 0,
        daily: {}
      };
    }

    saveStats() {
      if (!this.stats) return;
      try {
        const jsonStr = JSON.stringify(this.stats);
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(STORAGE_KEY, jsonStr);
        }
        if (typeof window !== 'undefined' && window.SokoNative && typeof window.SokoNative.setStoredListeningStats === 'function') {
          window.SokoNative.setStoredListeningStats(jsonStr);
        }
      } catch (e) {}
    }

    onPlay(trackId, isOffline = false) {
      if (this.currentTrackId !== trackId) {
        this.flushToStorage();
        this.currentTrackId = trackId;
        this.isCurrentTrackOffline = Boolean(isOffline);
        this.recordTrackPlay(trackId);
      }
      this.isPlaying = true;
      this.isSeeking = false;
      this.isBuffering = false;
      this.lastTickTime = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
      this.renderUI();
    }

    onPause() {
      this.accumulateDelta();
      this.isPlaying = false;
      this.lastTickTime = null;
      this.flushToStorage();
      this.renderUI();
    }

    onSeek() {
      this.accumulateDelta();
      this.lastTickTime = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
    }

    onBuffering(buffering) {
      if (buffering) {
        this.accumulateDelta();
        this.isBuffering = true;
        this.lastTickTime = null;
      } else {
        this.isBuffering = false;
        if (this.isPlaying) {
          this.lastTickTime = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
        }
      }
    }

    onTrackEnded(track) {
      this.accumulateDelta();
      this.flushToStorage();
      this.renderUI();
    }

    onProgressTick() {
      this.accumulateDelta();
      // Auto-flush whenever unsaved time reaches 2 seconds
      if (this.unsavedSeconds >= 2.0) {
        this.flushToStorage();
      }
      const now = Date.now();
      if (now - this.lastUiUpdateTime >= 1000) {
        this.lastUiUpdateTime = now;
        this.updateLiveIndicators();
      }
    }

    accumulateDelta() {
      if (!this.isPlaying || this.isSeeking || this.isBuffering || !this.lastTickTime) return;

      const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
      const deltaSec = (now - this.lastTickTime) / 1000;
      this.lastTickTime = now;

      // Clamp delta to reject freezes or tab wakeups
      if (deltaSec > 0 && deltaSec < 3.0) {
        this.unsavedSeconds += deltaSec;
      }
    }

    recordTrackPlay(trackId) {
      const todayKey = getTodayKey();
      this.ensureTodayBucket(todayKey);
      this.stats.daily[todayKey].tracksPlayed = (this.stats.daily[todayKey].tracksPlayed || 0) + 1;
      this.saveStats();
    }

    ensureTodayBucket(todayKey) {
      if (!this.stats.daily[todayKey]) {
        this.stats.daily[todayKey] = {
          totalSeconds: 0,
          offlineSeconds: 0,
          onlineSeconds: 0,
          tracksPlayed: 0,
          hourly: new Array(24).fill(0),
          artists: {}
        };
      }
    }

    flushToStorage() {
      this.accumulateDelta();
      if (this.unsavedSeconds < 0.2) return;

      const secs = Math.floor(this.unsavedSeconds);
      this.unsavedSeconds -= secs;

      const todayKey = getTodayKey();
      this.ensureTodayBucket(todayKey);

      const bucket = this.stats.daily[todayKey];
      bucket.totalSeconds = (bucket.totalSeconds || 0) + secs;
      if (this.isCurrentTrackOffline) {
        bucket.offlineSeconds = (bucket.offlineSeconds || 0) + secs;
      } else {
        bucket.onlineSeconds = (bucket.onlineSeconds || 0) + secs;
      }

      const hour = new Date().getHours();
      if (!bucket.hourly) bucket.hourly = new Array(24).fill(0);
      bucket.hourly[hour] = (bucket.hourly[hour] || 0) + secs;

      // Track artist listening time dynamically
      if (typeof currentTrack !== 'undefined' && currentTrack && currentTrack.artist) {
        const artist = currentTrack.artist.trim();
        if (artist && artist !== 'Unknown Artist' && artist !== 'Cloud Music') {
          if (!bucket.artists) bucket.artists = {};
          bucket.artists[artist] = (bucket.artists[artist] || 0) + secs;
        }
      }

      this.stats.allTimeSeconds = (this.stats.allTimeSeconds || 0) + secs;
      this.saveStats();
      this.renderUI();
    }

    getTodayTotalSeconds() {
      const todayKey = getTodayKey();
      const saved = (this.stats.daily[todayKey] && this.stats.daily[todayKey].totalSeconds) || 0;
      return saved + Math.floor(this.unsavedSeconds);
    }

    getStreak() {
      let streak = 0;
      const now = new Date();
      for (let i = 0; i < 365; i++) {
        const d = new Date(now.getTime() - i * 86400000);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const entry = this.stats.daily[key];
        const sec = (entry ? entry.totalSeconds : 0) + (i === 0 ? this.unsavedSeconds : 0);
        if (sec > 0) {
          streak++;
        } else if (i > 0) {
          break;
        }
      }
      return streak;
    }

    getTopArtist(artistMap) {
      if (!artistMap || typeof artistMap !== 'object') return 'None yet';
      let topName = 'None yet';
      let topSec = 0;
      for (const [artist, sec] of Object.entries(artistMap)) {
        if (sec > topSec) {
          topSec = sec;
          topName = artist;
        }
      }
      return topName;
    }

    getPeakHour(hourlyArray) {
      if (!hourlyArray || !hourlyArray.length) return '--';
      let peakIdx = -1;
      let maxSec = 0;
      for (let h = 0; h < 24; h++) {
        if ((hourlyArray[h] || 0) > maxSec) {
          maxSec = hourlyArray[h];
          peakIdx = h;
        }
      }
      if (peakIdx === -1 || maxSec === 0) return '--';
      const ampm = peakIdx >= 12 ? 'PM' : 'AM';
      const hour12 = peakIdx % 12 === 0 ? 12 : peakIdx % 12;
      return `${hour12}:00 ${ampm}`;
    }

    setRange(range) {
      this.activeRange = range;
      this.renderUI();
    }

    updateLiveIndicators() {
      const todaySec = this.getTodayTotalSeconds();
      const todayMins = Math.floor(todaySec / 60);
      const remSec = todaySec % 60;

      // Update header badge
      const headerBadge = safeGetEl('headerListenBadge');
      if (headerBadge) {
        headerBadge.textContent = `${formatHoursMins(todayMins)} today`;
      }

      // Update card live indicator if in 'today' range
      if (this.activeRange === 'today') {
        const liveSecEl = safeGetEl('statLiveSec');
        if (liveSecEl) {
          liveSecEl.style.display = this.isPlaying ? 'inline' : 'none';
          liveSecEl.textContent = `+${remSec < 10 ? '0' : ''}${remSec}s live`;
        }
        const totalTimeEl = safeGetEl('statTotalTime');
        if (totalTimeEl) {
          totalTimeEl.textContent = formatHoursMins(todayMins);
        }
      }
    }

    renderUI() {
      const todayKey = getTodayKey();
      this.ensureTodayBucket(todayKey);
      const todayData = this.stats.daily[todayKey];
      const todayTotalSec = this.getTodayTotalSeconds();
      const todayMins = Math.floor(todayTotalSec / 60);

      // 1. Header Pill
      const headerBadge = safeGetEl('headerListenBadge');
      if (headerBadge) {
        headerBadge.textContent = `${formatHoursMins(todayMins)} today`;
      }

      // 2. Streak Badge
      const streakBadge = safeGetEl('statStreakBadge');
      if (streakBadge) {
        streakBadge.textContent = `${this.getStreak()}-day streak`;
      }

      // 3. Range Buttons Active State
      safeQueryAll('.range-btn').forEach(btn => {
        const r = btn.getAttribute('data-range');
        const isActive = r === this.activeRange;
        if (isActive) {
          btn.classList.add('active');
          btn.style.background = 'var(--brand-orange)';
          btn.style.color = '#FFFFFF';
          btn.style.fontWeight = '800';
        } else {
          btn.classList.remove('active');
          btn.style.background = 'transparent';
          btn.style.color = 'var(--text-muted)';
          btn.style.fontWeight = '600';
        }
      });

      // 4. Elements
      const labelEl = safeGetEl('statRangeLabel');
      const totalTimeEl = safeGetEl('statTotalTime');
      const liveSecEl = safeGetEl('statLiveSec');
      const trackCountEl = safeGetEl('statTrackCount');
      const offlinePctBadge = safeGetEl('statOfflinePctBadge');
      const dailyAvgEl = safeGetEl('statDailyAvg');
      const topArtistEl = safeGetEl('statTopArtist');
      const peakHourEl = safeGetEl('statPeakHour');
      const offlineShareText = safeGetEl('offlineShareText');
      const onlineShareText = safeGetEl('onlineShareText');
      const offlineShareBar = safeGetEl('offlineShareBar');
      const onlineShareBar = safeGetEl('onlineShareBar');

      let displayTotal = '0m';
      let displaySongs = 0;
      let offlinePct = 0;
      let topArtist = 'None yet';
      let peakHour = '--';
      let dailyAvg = '0m';
      let bars = [];

      if (this.activeRange === 'today') {
        if (labelEl) labelEl.textContent = 'Time Spent Today';
        displayTotal = formatHoursMins(todayMins);
        displaySongs = todayData.tracksPlayed || 0;

        const offSec = (todayData.offlineSeconds || 0) + (this.isCurrentTrackOffline ? this.unsavedSeconds : 0);
        offlinePct = todayTotalSec > 0 ? Math.min(100, Math.max(0, Math.round((offSec / todayTotalSec) * 100))) : 0;

        if (liveSecEl) {
          liveSecEl.style.display = this.isPlaying ? 'inline' : 'none';
          liveSecEl.textContent = `+${String(todayTotalSec % 60).padStart(2, '0')}s live`;
        }

        topArtist = this.getTopArtist(todayData.artists);
        peakHour = this.getPeakHour(todayData.hourly);
        dailyAvg = formatHoursMins(todayMins);

        // 6 4-hour slots for today
        const h = todayData.hourly || [];
        const slots = [
          { label: '6a', sec: (h[5]||0) + (h[6]||0) + (h[7]||0) + (h[8]||0) },
          { label: '9a', sec: (h[9]||0) + (h[10]||0) + (h[11]||0) },
          { label: '12p', sec: (h[12]||0) + (h[13]||0) + (h[14]||0) },
          { label: '3p', sec: (h[15]||0) + (h[16]||0) + (h[17]||0) },
          { label: '6p', sec: (h[18]||0) + (h[19]||0) + (h[20]||0) },
          { label: '9p', sec: (h[21]||0) + (h[22]||0) + (h[23]||0) + (h[0]||0) + (h[1]||0) }
        ];
        bars = slots.map(s => ({
          label: s.label,
          val: Math.round(s.sec / 60),
          text: `${Math.round(s.sec / 60)}m`
        }));
      } else if (this.activeRange === 'week') {
        if (labelEl) labelEl.textContent = 'Time Spent This Week';
        if (liveSecEl) liveSecEl.style.display = 'none';

        // Dynamically aggregate last 7 days
        let weekSec = 0;
        let weekOffSec = 0;
        let weekSongs = 0;
        let weekArtists = {};
        let weekHourly = new Array(24).fill(0);
        let activeDays = 0;
        const now = new Date();
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        bars = [];

        for (let i = 6; i >= 0; i--) {
          const d = new Date(now.getTime() - i * 86400000);
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          const b = this.stats.daily[key];
          const isToday = i === 0;
          const s = (b ? b.totalSeconds : 0) + (isToday ? Math.floor(this.unsavedSeconds) : 0);
          const off = (b ? b.offlineSeconds : 0) + (isToday && this.isCurrentTrackOffline ? Math.floor(this.unsavedSeconds) : 0);
          const tracks = b ? (b.tracksPlayed || 0) : 0;

          weekSec += s;
          weekOffSec += off;
          weekSongs += tracks;
          if (s > 0) activeDays++;

          if (b && b.artists) {
            for (const [a, aSec] of Object.entries(b.artists)) {
              weekArtists[a] = (weekArtists[a] || 0) + aSec;
            }
          }
          if (b && b.hourly) {
            for (let h = 0; h < 24; h++) {
              weekHourly[h] += (b.hourly[h] || 0);
            }
          }

          bars.push({
            label: dayNames[d.getDay()],
            val: Math.round(s / 60),
            text: formatHoursMins(Math.round(s / 60))
          });
        }

        displayTotal = formatHoursMins(Math.round(weekSec / 60));
        displaySongs = weekSongs;
        offlinePct = weekSec > 0 ? Math.min(100, Math.max(0, Math.round((weekOffSec / weekSec) * 100))) : 0;
        topArtist = this.getTopArtist(weekArtists);
        peakHour = this.getPeakHour(weekHourly);
        dailyAvg = activeDays > 0 ? formatHoursMins(Math.round(weekSec / 60 / activeDays)) : '0m';
      } else if (this.activeRange === 'month') {
        if (labelEl) labelEl.textContent = 'Time Spent This Month';
        if (liveSecEl) liveSecEl.style.display = 'none';

        // Dynamically aggregate past 28 days into 4 weeks
        let monthSec = 0;
        let monthOffSec = 0;
        let monthSongs = 0;
        let monthArtists = {};
        let monthHourly = new Array(24).fill(0);
        let activeDays = 0;
        const now = new Date();
        bars = [
          { label: 'Wk 1', sec: 0 },
          { label: 'Wk 2', sec: 0 },
          { label: 'Wk 3', sec: 0 },
          { label: 'Wk 4', sec: 0 }
        ];

        for (let i = 27; i >= 0; i--) {
          const d = new Date(now.getTime() - i * 86400000);
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          const b = this.stats.daily[key];
          const isToday = i === 0;
          const s = (b ? b.totalSeconds : 0) + (isToday ? Math.floor(this.unsavedSeconds) : 0);
          const off = (b ? b.offlineSeconds : 0) + (isToday && this.isCurrentTrackOffline ? Math.floor(this.unsavedSeconds) : 0);
          const tracks = b ? (b.tracksPlayed || 0) : 0;

          monthSec += s;
          monthOffSec += off;
          monthSongs += tracks;
          if (s > 0) activeDays++;

          const weekIdx = Math.min(3, Math.floor((27 - i) / 7));
          bars[weekIdx].sec += s;

          if (b && b.artists) {
            for (const [a, aSec] of Object.entries(b.artists)) {
              monthArtists[a] = (monthArtists[a] || 0) + aSec;
            }
          }
          if (b && b.hourly) {
            for (let h = 0; h < 24; h++) {
              monthHourly[h] += (b.hourly[h] || 0);
            }
          }
        }

        bars = bars.map(b => ({
          label: b.label,
          val: Math.round(b.sec / 60),
          text: formatHoursMins(Math.round(b.sec / 60))
        }));

        displayTotal = formatHoursMins(Math.round(monthSec / 60));
        displaySongs = monthSongs;
        offlinePct = monthSec > 0 ? Math.min(100, Math.max(0, Math.round((monthOffSec / monthSec) * 100))) : 0;
        topArtist = this.getTopArtist(monthArtists);
        peakHour = this.getPeakHour(monthHourly);
        dailyAvg = activeDays > 0 ? formatHoursMins(Math.round(monthSec / 60 / activeDays)) : '0m';
      } else {
        if (labelEl) labelEl.textContent = 'All-Time Listening';
        if (liveSecEl) liveSecEl.style.display = 'none';

        // Dynamically aggregate all stored days
        let allSec = (this.stats.allTimeSeconds || 0) + Math.floor(this.unsavedSeconds);
        let allOffSec = 0;
        let allSongs = 0;
        let allArtists = {};
        let allHourly = new Array(24).fill(0);
        let activeDays = 0;

        for (const [key, b] of Object.entries(this.stats.daily || {})) {
          const s = b.totalSeconds || 0;
          allOffSec += (b.offlineSeconds || 0);
          allSongs += (b.tracksPlayed || 0);
          if (s > 0) activeDays++;

          if (b.artists) {
            for (const [a, aSec] of Object.entries(b.artists)) {
              allArtists[a] = (allArtists[a] || 0) + aSec;
            }
          }
          if (b.hourly) {
            for (let h = 0; h < 24; h++) {
              allHourly[h] += (b.hourly[h] || 0);
            }
          }
        }

        displayTotal = formatHoursMins(Math.round(allSec / 60));
        displaySongs = allSongs;
        offlinePct = allSec > 0 ? Math.min(100, Math.max(0, Math.round((allOffSec / allSec) * 100))) : 0;
        topArtist = this.getTopArtist(allArtists);
        peakHour = this.getPeakHour(allHourly);
        dailyAvg = activeDays > 0 ? formatHoursMins(Math.round(allSec / 60 / activeDays)) : '0m';

        // Last 6 months bars
        const now = new Date();
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        bars = [];
        for (let m = 5; m >= 0; m--) {
          const targetDate = new Date(now.getFullYear(), now.getMonth() - m, 1);
          const y = targetDate.getFullYear();
          const mo = String(targetDate.getMonth() + 1).padStart(2, '0');
          const prefix = `${y}-${mo}`;

          let monthTotal = 0;
          for (const [k, b] of Object.entries(this.stats.daily || {})) {
            if (k.startsWith(prefix)) {
              monthTotal += (b.totalSeconds || 0);
            }
          }
          if (m === 0) monthTotal += Math.floor(this.unsavedSeconds);

          bars.push({
            label: monthNames[targetDate.getMonth()],
            val: Math.round(monthTotal / 3600), // hours
            text: `${Math.round(monthTotal / 3600)}h`
          });
        }
      }

      if (totalTimeEl) totalTimeEl.textContent = displayTotal;
      if (trackCountEl) trackCountEl.textContent = `${displaySongs.toLocaleString()} songs played`;
      if (offlinePctBadge) offlinePctBadge.textContent = `${offlinePct}% Offline`;

      // Split bar
      const onlinePct = offlinePct > 0 ? 100 - offlinePct : (displaySongs > 0 ? 100 : 0);
      if (offlineShareText) offlineShareText.textContent = `${offlinePct}%`;
      if (onlineShareText) onlineShareText.textContent = `${onlinePct}%`;
      if (offlineShareBar) offlineShareBar.style.width = `${offlinePct}%`;
      if (onlineShareBar) onlineShareBar.style.width = `${onlinePct}%`;

      // Mini stats
      if (dailyAvgEl) dailyAvgEl.textContent = dailyAvg;
      if (topArtistEl) topArtistEl.textContent = topArtist;
      if (peakHourEl) peakHourEl.textContent = peakHour;

      // Chart Bars
      this.renderChartBars(bars);
    }

    renderChartBars(bars) {
      const chartEl = safeGetEl('listeningChart');
      const labelsEl = safeGetEl('listeningChartLabels');
      if (!chartEl || !labelsEl || !bars || !bars.length) return;

      const maxVal = Math.max(...bars.map(b => b.val), 0);

      chartEl.innerHTML = bars.map(bar => {
        const pct = maxVal > 0 ? Math.max(14, Math.round((bar.val / maxVal) * 100)) : 10;
        const isPeak = maxVal > 0 && bar.val === maxVal;
        const barColor = isPeak
          ? 'linear-gradient(to top, #16A34A, #10B981)'
          : (bar.val > 0 ? 'linear-gradient(to top, #FF5A1F, #FF8C42)' : '#EAECEF');

        return `
          <div onclick="if (window.listeningTracker) window.listeningTracker.highlightBar('${bar.label}', '${bar.text}')" 
               class="chart-bar-col" 
               style="flex: 1; height: 100%; display: flex; flex-direction: column; justify-content: flex-end; align-items: center; cursor: pointer; position: relative;">
            <div class="chart-bar" style="width: 100%; max-width: 28px; height: ${pct}%; border-radius: 8px 8px 0 0; background: ${barColor}; transition: all 0.3s ease;" title="${bar.label}: ${bar.text}"></div>
          </div>
        `;
      }).join('');

      labelsEl.innerHTML = bars.map(bar => `
        <span style="flex: 1; text-align: center; font-size: 10px; font-weight: 700; color: var(--text-dim); text-transform: uppercase;">${bar.label}</span>
      `).join('');
    }

    highlightBar(label, text) {
      if (typeof showToast === 'function') {
        showToast(`📊 ${label}: ${text}`, '⏱️');
      }
    }

    init() {
      // Re-load stats in case SokoNative bridge was injected after script evaluation
      const loaded = this.loadStats();
      if (loaded) {
        this.stats = loaded;
      }

      // Wire range buttons
      safeQueryAll('.range-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          const r = btn.getAttribute('data-range');
          if (r) this.setRange(r);
        });
      });

      this.renderUI();
    }
  }

  window.ListeningTracker = ListeningTracker;
  window.listeningTracker = new ListeningTracker();
  window.renderListeningStats = function() {
    if (window.listeningTracker) window.listeningTracker.renderUI();
  };
})();
