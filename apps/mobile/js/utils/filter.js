// Content filtering engine (Podcasts & Long Tracks > 10 Min)
function isPodcastOrLongTrack(item) {
      if (!item) return false;

      // 1. Duration filter (> 600 seconds / 10 minutes)
      let dur = 0;
      if (typeof item.duration === 'number' && !isNaN(item.duration)) {
        dur = item.duration;
      } else if (typeof item.duration === 'string') {
        dur = parseDurationStringToSeconds(item.duration);
      } else if (item.lengthSeconds) {
        dur = Number(item.lengthSeconds) || parseDurationStringToSeconds(item.lengthSeconds);
      }
      if (dur > MAX_ALLOWED_DURATION_SECONDS) {
        return true;
      }

      // 2. Textual keyword inspection (title, artist, subtitle, genre, badge)
      const title = extractTextString(item.title).toLowerCase();
      const artist = extractTextString(item.artist || item.author || item.shortBylineText || item.longBylineText).toLowerCase();
      const subtitle = extractTextString(item.subtitle).toLowerCase();
      const genre = extractTextString(item.genre).toLowerCase();
      const badge = extractTextString(item.badge).toLowerCase();

      // Podcast keywords
      if (title.includes('podcast') || title.includes('podcasts') ||
          subtitle.includes('podcast') || subtitle.includes('podcasts') ||
          artist.includes('podcast') || artist.includes('podcasts') ||
          genre.includes('podcast') || badge.includes('podcast')) {
        return true;
      }

      // Episode keywords (e.g. "Full Episode", "Ep. 12", "Episode 45")
      if (title.includes('full episode') || subtitle.includes('full episode') ||
          /\b(ep\.|episode)\s*\d+/i.test(title) || /\b(ep\.|episode)\s*\d+/i.test(subtitle)) {
        return true;
      }

      // 3. InnerTube structured metadata inspection
      if (isInnerTubePodcastItem(item)) {
        return true;
      }

      return false;
    }

    function isInnerTubePodcastItem(item) {
      if (!item || typeof item !== 'object') return false;

      // Check badges (e.g. podcast badge)
      const badges = item.badges || [];
      if (Array.isArray(badges)) {
        for (const b of badges) {
          const label = b.musicInlineBadgeRenderer?.accessibilityData?.accessibilityData?.label ||
                        b.musicInlineBadgeRenderer?.icon?.iconType || '';
          if (/podcast|episode/i.test(label)) return true;
        }
      }

      // Check fixedColumns (frequently holds duration in YouTube Music)
      if (Array.isArray(item.fixedColumns)) {
        for (const fc of item.fixedColumns) {
          const runs = fc.musicResponsiveListItemFixedColumnRenderer?.text?.runs || [];
          for (const r of runs) {
            if (r && r.text) {
              const t = r.text.trim();
              if (/podcast|episode/i.test(t)) return true;
              const dur = parseDurationStringToSeconds(t);
              if (dur > MAX_ALLOWED_DURATION_SECONDS) return true;
            }
          }
        }
      }

      // Check flexColumns (runs for artist, type, duration)
      if (Array.isArray(item.flexColumns)) {
        for (const col of item.flexColumns) {
          const runs = col.musicResponsiveListItemFlexColumnRenderer?.text?.runs ||
                       col.musicResponsiveListItemFlexColumnRenderer?.title?.runs || [];
          for (const r of runs) {
            if (r && r.text) {
              const t = r.text.trim();
              if (t.toLowerCase() === 'podcast' || t.toLowerCase() === 'episode' || /podcast|episode/i.test(t)) {
                return true;
              }
              if (/^[0-9]+:[0-9]+(:[0-9]+)?$/.test(t) || /\b(min|hr|mins|hours)\b/i.test(t)) {
                const dur = parseDurationStringToSeconds(t);
                if (dur > MAX_ALLOWED_DURATION_SECONDS) return true;
              }
            }
          }
        }
      }

      // Check lengthText
      const lenText = item.lengthText?.runs?.[0]?.text || item.lengthText?.simpleText;
      if (lenText) {
        if (parseDurationStringToSeconds(lenText) > MAX_ALLOWED_DURATION_SECONDS) return true;
      }

      // Check navigation endpoints
      const nav = item.navigationEndpoint || item.watchEndpoint || item.defaultServiceEndpoint;
      if (nav) {
        const mType = nav.watchEndpointMusicSupportedConfigs?.watchEndpointMusicConfig?.musicVideoType;
        if (mType && /podcast/i.test(mType)) return true;
        const bId = nav.browseEndpoint?.browseId || '';
        if (bId.startsWith('MPSP') || bId.startsWith('MPEP') || /podcast/i.test(bId)) return true;
      }

      return false;
    }

window.isPodcastOrLongTrack = isPodcastOrLongTrack;
window.isInnerTubePodcastItem = isInnerTubePodcastItem;
