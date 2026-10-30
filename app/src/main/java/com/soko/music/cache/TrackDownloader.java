package com.soko.music.cache;

import android.app.Activity;
import android.content.Context;
import android.os.PowerManager;
import android.util.Log;
import android.webkit.WebView;
import com.soko.music.audio.AudioEngine;
import com.soko.music.util.HttpUtil;
import org.json.JSONArray;
import org.json.JSONObject;
import java.io.BufferedReader;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.concurrent.ConcurrentHashMap;

public class TrackDownloader {
    private static final String TAG = "SokoMusic";
    private static final ConcurrentHashMap<String, Boolean> activeDownloadTasks = new ConcurrentHashMap<>();

    private final Activity activity;
    private final WebView webView;
    private final AudioEngine audioEngine;
    private final DiskCacheManager diskCacheManager;

    public TrackDownloader(Activity activity, WebView webView, AudioEngine audioEngine, DiskCacheManager diskCacheManager) {
        this.activity = activity;
        this.webView = webView;
        this.audioEngine = audioEngine;
        this.diskCacheManager = diskCacheManager;
    }

    public void downloadAndPlayTrack(final String videoId, final String title, final String artist, final String coverUrl, final boolean autoPlayWhenDone) {
        if (autoPlayWhenDone) {
            audioEngine.setActivePlaybackVideoId(videoId);
            audioEngine.stopNativeAudio();
        }
        new Thread(new Runnable() {
            @Override
            public void run() {
                PowerManager.WakeLock wakeLock = null;
                try {
                    PowerManager pm = (PowerManager) activity.getSystemService(Context.POWER_SERVICE);
                    if (pm != null) {
                        wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "soko:TrackDownloaderWakeLock");
                        wakeLock.acquire(45 * 1000L); // 45 second safety ceiling
                    }
                } catch (Exception ignored) {}

                File musicDir = diskCacheManager.getMusicDir();
                final File targetFile = new File(musicDir, videoId + ".m4a");

                if (targetFile.exists() && targetFile.length() > 50000) {
                    final boolean shouldPlay = videoId.equals(audioEngine.getActivePlaybackVideoId());
                    activity.runOnUiThread(new Runnable() {
                        @Override
                        public void run() {
                            if (webView != null) {
                                webView.evaluateJavascript("window.onNativeDownloadProgress && window.onNativeDownloadProgress(" + JSONObject.quote(videoId) + ", 100)", null);
                                webView.evaluateJavascript("window.onNativeDownloadComplete && window.onNativeDownloadComplete(" + JSONObject.quote(videoId) + ", " + JSONObject.quote(targetFile.getAbsolutePath()) + ", " + shouldPlay + ")", null);
                            }
                            if (shouldPlay) {
                                audioEngine.playNativeAudio(targetFile.getAbsolutePath(), title, artist, coverUrl);
                            }
                        }
                    });
                    if (wakeLock != null && wakeLock.isHeld()) {
                        try { wakeLock.release(); } catch (Exception ignored) {}
                    }
                    return;
                }

                if (activeDownloadTasks.putIfAbsent(videoId, Boolean.TRUE) != null) {
                    if (wakeLock != null && wakeLock.isHeld()) {
                        try { wakeLock.release(); } catch (Exception ignored) {}
                    }
                    return;
                }

                // Filter out podcasts from native download
                String lowerTitle = (title != null) ? title.toLowerCase() : "";
                String lowerArtist = (artist != null) ? artist.toLowerCase() : "";
                if (lowerTitle.contains("podcast") || lowerArtist.contains("podcast") || lowerTitle.contains("full episode") || lowerTitle.contains("episode") || lowerTitle.contains("ep.")) {
                    activeDownloadTasks.remove(videoId);
                    activity.runOnUiThread(new Runnable() {
                        @Override
                        public void run() {
                            if (webView != null) {
                                webView.evaluateJavascript("window.onNativeDownloadFailed && window.onNativeDownloadFailed(" + JSONObject.quote(videoId) + ", 'Cannot download: podcasts are excluded')", null);
                            }
                        }
                    });
                    if (wakeLock != null && wakeLock.isHeld()) {
                        try { wakeLock.release(); } catch (Exception ignored) {}
                    }
                    return;
                }

                try {
                    activity.runOnUiThread(new Runnable() {
                        @Override
                        public void run() {
                            if (webView != null) {
                                webView.evaluateJavascript("window.onNativeDownloadProgress && window.onNativeDownloadProgress(" + JSONObject.quote(videoId) + ", 5)", null);
                            }
                        }
                    });

                    // 1. Fetch visitorData and signatureTimestamp if not cached or expired
                    HttpUtil.ensureVisitorDataAndSts(videoId);
                    String visitorData = HttpUtil.getCachedVisitorData();
                    int sts = HttpUtil.getCachedSts();

                    // 2. Query InnerTube player API with VISIONOS client
                    final String visionUa = "Mozilla/5.0 (Macintosh; Intel Mac OS X 15_7_3) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Safari/605.1.15";
                    URL playerUrl = new URL("https://www.youtube.com/youtubei/v1/player?prettyPrint=false");
                    HttpURLConnection playerConn = (HttpURLConnection) playerUrl.openConnection();
                    playerConn.setRequestMethod("POST");
                    playerConn.setConnectTimeout(12000);
                    playerConn.setReadTimeout(12000);
                    playerConn.setDoOutput(true);
                    playerConn.setRequestProperty("Content-Type", "application/json");
                    playerConn.setRequestProperty("X-Youtube-Client-Name", "101");
                    playerConn.setRequestProperty("X-Youtube-Client-Version", "1.02");
                    playerConn.setRequestProperty("Origin", "https://www.youtube.com");
                    playerConn.setRequestProperty("User-Agent", visionUa);
                    if (!visitorData.isEmpty()) {
                        playerConn.setRequestProperty("X-Goog-Visitor-Id", visitorData);
                    }

                    JSONObject clientObj = new JSONObject();
                    clientObj.put("clientName", "VISIONOS");
                    clientObj.put("clientVersion", "1.02");
                    clientObj.put("deviceMake", "Apple");
                    clientObj.put("deviceModel", "RealityDevice17,1");
                    clientObj.put("userAgent", visionUa);
                    clientObj.put("osName", "visionOS");
                    clientObj.put("osVersion", "26.5.23O471");
                    clientObj.put("hl", "en");
                    clientObj.put("timeZone", "UTC");
                    clientObj.put("utcOffsetMinutes", 0);
                    if (!visitorData.isEmpty()) {
                        clientObj.put("visitorData", visitorData);
                    }

                    JSONObject contextObj = new JSONObject();
                    contextObj.put("client", clientObj);

                    JSONObject cpContext = new JSONObject();
                    cpContext.put("html5Preference", "HTML5_PREF_WANTS");
                    cpContext.put("signatureTimestamp", sts);

                    JSONObject pbContext = new JSONObject();
                    pbContext.put("contentPlaybackContext", cpContext);

                    JSONObject payload = new JSONObject();
                    payload.put("context", contextObj);
                    payload.put("videoId", videoId);
                    payload.put("playbackContext", pbContext);
                    payload.put("contentCheckOk", true);
                    payload.put("racyCheckOk", true);

                    OutputStream pOs = playerConn.getOutputStream();
                    pOs.write(payload.toString().getBytes("UTF-8"));
                    pOs.flush();
                    pOs.close();

                    BufferedReader pReader = new BufferedReader(new InputStreamReader(playerConn.getInputStream()));
                    StringBuilder pSb = new StringBuilder();
                    String line;
                    while ((line = pReader.readLine()) != null) {
                        pSb.append(line);
                    }
                    pReader.close();

                    JSONObject pData = new JSONObject(pSb.toString());

                    // Guard against downloading tracks longer than 10 minutes (600 seconds)
                    JSONObject videoDetails = pData.optJSONObject("videoDetails");
                    if (videoDetails != null) {
                        long lengthSec = videoDetails.optLong("lengthSeconds", 0);
                        if (lengthSec > 600) {
                            activeDownloadTasks.remove(videoId);
                            activity.runOnUiThread(new Runnable() {
                                @Override
                                public void run() {
                                    if (webView != null) {
                                        webView.evaluateJavascript("window.onNativeDownloadFailed && window.onNativeDownloadFailed(" + JSONObject.quote(videoId) + ", 'Cannot download: content exceeds 10 minutes limit')", null);
                                    }
                                }
                            });
                            return;
                        }
                    }

                    JSONObject streamingData = pData.optJSONObject("streamingData");
                    String directAudioUrl = null;
                    long totalSize = 0;

                    if (streamingData != null) {
                        JSONArray adaptiveFormats = streamingData.optJSONArray("adaptiveFormats");
                        if (adaptiveFormats != null) {
                            for (int i = 0; i < adaptiveFormats.length(); i++) {
                                JSONObject f = adaptiveFormats.getJSONObject(i);
                                int itag = f.optInt("itag");
                                if (itag == 140 && f.has("url")) {
                                    directAudioUrl = f.getString("url");
                                    totalSize = f.optLong("contentLength", 0);
                                    break;
                                }
                            }
                            if (directAudioUrl == null) {
                                for (int i = 0; i < adaptiveFormats.length(); i++) {
                                    JSONObject f = adaptiveFormats.getJSONObject(i);
                                    String mime = f.optString("mimeType", "");
                                    if (mime.contains("audio") && f.has("url")) {
                                        directAudioUrl = f.getString("url");
                                        totalSize = f.optLong("contentLength", 0);
                                        break;
                                    }
                                }
                            }
                        }
                    }

                    if (directAudioUrl == null) {
                        try {
                            URL fallbackUrl = new URL("https://www.youtube.com/youtubei/v1/player?prettyPrint=false");
                            HttpURLConnection fConn = (HttpURLConnection) fallbackUrl.openConnection();
                            fConn.setRequestMethod("POST");
                            fConn.setConnectTimeout(10000);
                            fConn.setReadTimeout(10000);
                            fConn.setDoOutput(true);
                            fConn.setRequestProperty("Content-Type", "application/json");
                            fConn.setRequestProperty("User-Agent", "Mozilla/5.0 (Android 12; Mobile; Oculus Quest 3)");

                            JSONObject fClient = new JSONObject();
                            fClient.put("clientName", "ANDROID_VR");
                            fClient.put("clientVersion", "1.56.21");
                            fClient.put("deviceMake", "Oculus");
                            fClient.put("deviceModel", "Quest 3");
                            fClient.put("osName", "Android");
                            fClient.put("osVersion", "12");
                            fClient.put("hl", "en");

                            JSONObject fContext = new JSONObject();
                            fContext.put("client", fClient);

                            JSONObject fPayload = new JSONObject();
                            fPayload.put("context", fContext);
                            fPayload.put("videoId", videoId);
                            fPayload.put("contentCheckOk", true);
                            fPayload.put("racyCheckOk", true);

                            OutputStream fOs = fConn.getOutputStream();
                            fOs.write(fPayload.toString().getBytes("UTF-8"));
                            fOs.flush();
                            fOs.close();

                            BufferedReader fReader = new BufferedReader(new InputStreamReader(fConn.getInputStream()));
                            StringBuilder fSb = new StringBuilder();
                            String fLine;
                            while ((fLine = fReader.readLine()) != null) {
                                fSb.append(fLine);
                            }
                            fReader.close();

                            JSONObject fData = new JSONObject(fSb.toString());
                            JSONObject fStreaming = fData.optJSONObject("streamingData");
                            if (fStreaming != null) {
                                JSONArray fFormats = fStreaming.optJSONArray("adaptiveFormats");
                                if (fFormats != null) {
                                    for (int i = 0; i < fFormats.length(); i++) {
                                        JSONObject f = fFormats.getJSONObject(i);
                                        int itag = f.optInt("itag");
                                        if (itag == 140 && f.has("url")) {
                                            directAudioUrl = f.getString("url");
                                            totalSize = f.optLong("contentLength", 0);
                                            break;
                                        }
                                    }
                                    if (directAudioUrl == null) {
                                        for (int i = 0; i < fFormats.length(); i++) {
                                            JSONObject f = fFormats.getJSONObject(i);
                                            String mime = f.optString("mimeType", "");
                                            if (mime.contains("audio") && f.has("url")) {
                                                directAudioUrl = f.getString("url");
                                                totalSize = f.optLong("contentLength", 0);
                                                break;
                                            }
                                        }
                                    }
                                }
                            }
                        } catch (Exception ignored) {}
                    }

                    if (directAudioUrl == null) {
                        throw new Exception("Unable to extract direct audio stream from provider");
                    }

                    // 3. Fast Chunked Range Download (1 MB chunks bypassing 32KB/s throttle)
                    final File partFile = new File(musicDir, videoId + ".part");

                    if (totalSize <= 0) {
                        try {
                            HttpURLConnection headConn = (HttpURLConnection) new URL(directAudioUrl).openConnection();
                            headConn.setRequestProperty("User-Agent", visionUa);
                            headConn.setRequestMethod("HEAD");
                            headConn.setConnectTimeout(8000);
                            headConn.setReadTimeout(8000);
                            totalSize = headConn.getContentLengthLong();
                            headConn.disconnect();
                        } catch (Exception ignored) {}
                    }

                    FileOutputStream fos = new FileOutputStream(partFile);
                    long downloadedBytes = 0;

                    if (totalSize > 0) {
                        long chunkSize = 1024 * 1024L; // 1 MB per chunk
                        while (downloadedBytes < totalSize) {
                            long endByte = Math.min(downloadedBytes + chunkSize - 1, totalSize - 1);
                            HttpURLConnection cConn = (HttpURLConnection) new URL(directAudioUrl).openConnection();
                            cConn.setRequestProperty("User-Agent", visionUa);
                            cConn.setRequestProperty("Range", "bytes=" + downloadedBytes + "-" + endByte);
                            cConn.setConnectTimeout(12000);
                            cConn.setReadTimeout(20000);

                            InputStream cIn = cConn.getInputStream();
                            byte[] cBuf = new byte[32768];
                            int cLen;
                            while ((cLen = cIn.read(cBuf)) != -1) {
                                fos.write(cBuf, 0, cLen);
                                downloadedBytes += cLen;
                            }
                            cIn.close();
                            cConn.disconnect();

                            final int pct = (int) Math.min(99, (downloadedBytes * 100) / totalSize);
                            activity.runOnUiThread(new Runnable() {
                                @Override
                                public void run() {
                                    if (webView != null) {
                                        webView.evaluateJavascript("window.onNativeDownloadProgress && window.onNativeDownloadProgress(" + JSONObject.quote(videoId) + ", " + pct + ")", null);
                                    }
                                }
                            });
                        }
                    } else {
                        // Fallback single stream if totalSize could not be determined
                        HttpURLConnection audioConn = (HttpURLConnection) new URL(directAudioUrl).openConnection();
                        audioConn.setRequestProperty("User-Agent", visionUa);
                        audioConn.setConnectTimeout(15000);
                        audioConn.setReadTimeout(30000);
                        totalSize = audioConn.getContentLengthLong();

                        InputStream aIn = audioConn.getInputStream();
                        byte[] buf = new byte[16384];
                        int len;
                        long lastProgressTime = 0;

                        while ((len = aIn.read(buf)) != -1) {
                            fos.write(buf, 0, len);
                            downloadedBytes += len;
                            long now = System.currentTimeMillis();
                            if (totalSize > 0 && (now - lastProgressTime > 250)) {
                                lastProgressTime = now;
                                final int pct = (int) Math.min(99, (downloadedBytes * 100) / totalSize);
                                activity.runOnUiThread(new Runnable() {
                                    @Override
                                    public void run() {
                                        if (webView != null) {
                                            webView.evaluateJavascript("window.onNativeDownloadProgress && window.onNativeDownloadProgress(" + JSONObject.quote(videoId) + ", " + pct + ")", null);
                                        }
                                    }
                                });
                            }
                        }
                        aIn.close();
                        audioConn.disconnect();
                    }

                    fos.flush();
                    fos.close();

                    if (totalSize > 0 && downloadedBytes < totalSize) {
                        if (partFile.exists()) partFile.delete();
                        throw new Exception("Download incomplete: received " + downloadedBytes + " of " + totalSize + " bytes");
                    }

                    if (partFile.length() > 80000) {
                        partFile.renameTo(targetFile);
                    } else {
                        if (partFile.exists()) partFile.delete();
                        throw new Exception("Downloaded file too small: " + partFile.length() + " bytes");
                    }

                    // 4. Notify completion and play if this is the active track
                    final boolean shouldPlay = videoId.equals(audioEngine.getActivePlaybackVideoId());
                    activity.runOnUiThread(new Runnable() {
                        @Override
                        public void run() {
                            if (webView != null) {
                                webView.evaluateJavascript("window.onNativeDownloadProgress && window.onNativeDownloadProgress(" + JSONObject.quote(videoId) + ", 100)", null);
                                webView.evaluateJavascript("window.onNativeDownloadComplete && window.onNativeDownloadComplete(" + JSONObject.quote(videoId) + ", " + JSONObject.quote(targetFile.getAbsolutePath()) + ", " + shouldPlay + ")", null);
                            }
                            if (shouldPlay) {
                                audioEngine.playNativeAudio(targetFile.getAbsolutePath(), title, artist, coverUrl);
                            }
                        }
                    });

                } catch (final Exception e) {
                    Log.e(TAG, "downloadAndPlayTrack error for " + videoId, e);
                    File partFile = new File(musicDir, videoId + ".part");
                    if (partFile.exists()) {
                        try { partFile.delete(); } catch (Exception ignored) {}
                    }
                    final String msg;
                    if (e instanceof java.net.UnknownHostException || (e.getMessage() != null && e.getMessage().contains("Unable to resolve host"))) {
                        msg = "No internet connection. Please check Wi-Fi or mobile data.";
                    } else if (e.getMessage() != null && !e.getMessage().isEmpty()) {
                        msg = e.getMessage();
                    } else {
                        msg = "Network or download error";
                    }
                    activity.runOnUiThread(new Runnable() {
                        @Override
                        public void run() {
                            if (webView != null) {
                                webView.evaluateJavascript("window.onNativeDownloadFailed && window.onNativeDownloadFailed(" + JSONObject.quote(videoId) + ", " + JSONObject.quote(msg) + ")", null);
                            }
                        }
                    });
                } finally {
                    activeDownloadTasks.remove(videoId);
                    if (wakeLock != null) {
                        try {
                            if (wakeLock.isHeld()) {
                                wakeLock.release();
                            }
                        } catch (Exception ignored) {}
                    }
                }
            }
        }).start();
    }
}
