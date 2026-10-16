# Architecture: InnerTube Feed & Recommendation Engine

> **Feature Goal**: Replicate the discovery power of YouTube Music—Top Charts, Infinite Song Radios, Quick Picks, and Mood Stations—while maintaining zero account risk and zero bot-detection flags.

---

## 1. InnerTube Client Persona & Headers

The client declares itself as the official Google Android YouTube Music application:

```json
{
  "context": {
    "client": {
      "clientName": "ANDROID_MUSIC",
      "clientVersion": "6.40.52",
      "androidSdkVersion": 34,
      "osName": "Android",
      "osVersion": "14",
      "gl": "US",
      "hl": "en"
    }
  }
}
```

### Critical HTTP Headers
```http
User-Agent: com.google.android.apps.youtube.music/6.40.52 (Linux; U; Android 14; en_US; Pixel 8)
X-YouTube-Client-Name: 21
X-YouTube-Client-Version: 6.40.52
Content-Type: application/json
```

---

## 2. Dynamic Feed Matrix

| Feed Target | Endpoint | Parameters / Payload | UI Section |
| :--- | :--- | :--- | :--- |
| **Home Feeds** | `/youtubei/v1/browse` | `{"browseId": "FEmusic_home"}` | Quick Picks, Mixed for you, Forgotten Favorites |
| **Charts & Trending** | `/youtubei/v1/browse` | `{"browseId": "FEmusic_charts"}` | Top 100 Songs, Trending Music Videos |
| **Moods & Genres** | `/youtubei/v1/browse` | `{"browseId": "FEmusic_moods_and_genres"}` | Chill, Workout, Focus, Lo-Fi, Romance |
| **Song Radio** | `/youtubei/v1/next` | `{"videoId": id, "isRadio": true}` | Continuous algorithmic radio queue |
| **Search** | `/youtubei/v1/search` | `{"query": q, "params": "Eg-KAQwIABAAGAAgACgB"}` | Songs filter with debounced input |

---

## 3. Anti-Flagging Hygiene

1. **Distributed Residential/Mobile IPs**: Because each user makes calls from their own mobile carrier IP, requests are never classified as datacenter scraping bots.
2. **Session Consistency**: The client generates and caches a `visitorData` token on initial bootstrap, sending it on all future requests.
3. **Debounced Search Dispatch**: User keyboard input is throttled by `400ms` to prevent burst floods.
