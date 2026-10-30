package com.soko.music;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.util.Log;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.CookieManager;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import com.soko.music.audio.AudioEngine;
import com.soko.music.audio.AudioFocusManager;
import com.soko.music.audio.MediaNotificationManager;
import com.soko.music.audio.NoisyAudioReceiver;
import com.soko.music.bridge.AuthBridge;
import com.soko.music.bridge.PlayerBridge;
import com.soko.music.bridge.SokoNativeBridge;
import com.soko.music.bridge.StorageBridge;
import com.soko.music.bridge.TelemetryBridge;
import com.soko.music.cache.DiskCacheManager;
import com.soko.music.cache.TrackDownloader;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.InputStream;

public class MainActivity extends Activity {
    private static final String TAG = "SokoMusic";

    private WebView webView;
    private MediaNotificationManager mediaNotificationManager;
    private AudioFocusManager audioFocusManager;
    private AudioEngine audioEngine;
    private NoisyAudioReceiver noisyAudioReceiver;
    private DiskCacheManager diskCacheManager;
    private TrackDownloader trackDownloader;
    private SokoNativeBridge sokoNativeBridge;
    private final android.content.ServiceConnection serviceConnection = new android.content.ServiceConnection() {
        @Override
        public void onServiceConnected(android.content.ComponentName name, android.os.IBinder service) {}
        @Override
        public void onServiceDisconnected(android.content.ComponentName name) {}
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        requestWindowFeature(Window.FEATURE_NO_TITLE);

        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.LOLLIPOP) {
            getWindow().clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS | WindowManager.LayoutParams.FLAG_TRANSLUCENT_NAVIGATION);
            getWindow().addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
            getWindow().setStatusBarColor(Color.parseColor("#07090E"));
            getWindow().setNavigationBarColor(Color.parseColor("#07090E"));
        }

        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.P) {
            getWindow().getAttributes().layoutInDisplayCutoutMode =
                WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
        }

        if (android.os.Build.VERSION.SDK_INT >= 33) {
            if (checkSelfPermission("android.permission.POST_NOTIFICATIONS") != android.content.pm.PackageManager.PERMISSION_GRANTED) {
                requestPermissions(new String[]{"android.permission.POST_NOTIFICATIONS"}, 101);
            }
        }

        webView = new WebView(this);
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(true);

        CookieManager cookieManager = CookieManager.getInstance();
        cookieManager.setAcceptCookie(true);
        if (android.os.Build.VERSION.SDK_INT >= 21) {
            cookieManager.setAcceptThirdPartyCookies(webView, true);
        }
        try {
            String savedCookies = getSharedPreferences("soko_prefs", Context.MODE_PRIVATE).getString("ytm_cookies", "");
            if (savedCookies != null && !savedCookies.isEmpty()) {
                for (String part : savedCookies.split(";")) {
                    String trimmed = part.trim();
                    if (!trimmed.isEmpty()) {
                        cookieManager.setCookie("https://music.youtube.com", trimmed);
                        cookieManager.setCookie("https://www.youtube.com", trimmed);
                    }
                }
                cookieManager.flush();
            }
        } catch (Exception ignored) {}

        mediaNotificationManager = new MediaNotificationManager(this, webView);
        audioFocusManager = new AudioFocusManager(this, webView);
        audioEngine = new AudioEngine(this, webView, audioFocusManager, mediaNotificationManager);
        mediaNotificationManager.setAudioEngine(audioEngine);
        noisyAudioReceiver = new NoisyAudioReceiver(webView);
        diskCacheManager = new DiskCacheManager(this);
        trackDownloader = new TrackDownloader(this, webView, audioEngine, diskCacheManager);

        PlayerBridge playerBridge = new PlayerBridge(audioEngine, mediaNotificationManager);
        StorageBridge storageBridge = new StorageBridge(trackDownloader, diskCacheManager);
        AuthBridge authBridge = new AuthBridge(this, webView);
        TelemetryBridge telemetryBridge = new TelemetryBridge();
        sokoNativeBridge = new SokoNativeBridge(this, playerBridge, storageBridge, authBridge, telemetryBridge);

        noisyAudioReceiver.register(this);
        mediaNotificationManager.registerActionReceiver();
        try {
            Intent serviceIntent = new Intent(this, com.soko.music.audio.MediaPlaybackService.class);
            bindService(serviceIntent, serviceConnection, Context.BIND_AUTO_CREATE);
        } catch (Exception ignored) {}

        webView.addJavascriptInterface(sokoNativeBridge, "SokoNative");
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                String path = uri.getPath();
                if (path != null) {
                    String assetPath = path;
                    if (assetPath.contains("assets/")) {
                        assetPath = assetPath.substring(assetPath.indexOf("assets/"));
                    } else if (assetPath.contains("music/")) {
                        assetPath = assetPath.substring(assetPath.indexOf("music/"));
                    }
                    while (assetPath.startsWith("/")) {
                        assetPath = assetPath.substring(1);
                    }

                    if (assetPath.startsWith("css/") || assetPath.startsWith("js/") ||
                        assetPath.startsWith("assets/") || assetPath.startsWith("music/") ||
                        assetPath.endsWith(".css") || assetPath.endsWith(".js") ||
                        assetPath.endsWith(".png") || assetPath.endsWith(".jpg") || assetPath.endsWith(".jpeg") ||
                        assetPath.endsWith(".svg") || assetPath.endsWith(".opus") || assetPath.endsWith(".mp3") ||
                        assetPath.endsWith(".m4a") || assetPath.endsWith(".json") || assetPath.endsWith(".html")) {
                        try {
                            InputStream in = null;
                            String fileName = new File(assetPath).getName();
                            String[] candidates = new String[]{
                                assetPath,
                                "assets/" + assetPath,
                                "music/" + fileName,
                                "assets/music/" + fileName
                            };
                            for (String cand : candidates) {
                                try {
                                    in = getAssets().open(cand);
                                    if (in != null) break;
                                } catch (Exception ignored) {}
                            }
                            if (in != null) {
                                String mime = "application/octet-stream";
                                if (assetPath.endsWith(".css")) mime = "text/css";
                                else if (assetPath.endsWith(".js")) mime = "application/javascript";
                                else if (assetPath.endsWith(".png")) mime = "image/png";
                                else if (assetPath.endsWith(".jpg") || assetPath.endsWith(".jpeg")) mime = "image/jpeg";
                                else if (assetPath.endsWith(".svg")) mime = "image/svg+xml";
                                else if (assetPath.endsWith(".opus")) mime = "audio/opus";
                                else if (assetPath.endsWith(".mp3")) mime = "audio/mpeg";
                                else if (assetPath.endsWith(".m4a")) mime = "audio/mp4";
                                else if (assetPath.endsWith(".html")) mime = "text/html";
                                else if (assetPath.endsWith(".json")) mime = "application/json";
                                WebResourceResponse response = new WebResourceResponse(mime, "UTF-8", in);
                                if (android.os.Build.VERSION.SDK_INT >= 21) {
                                    response.setResponseHeaders(java.util.Collections.singletonMap("Access-Control-Allow-Origin", "*"));
                                }
                                return response;
                            }
                        } catch (Exception ignored) {}
                    }
                }
                return super.shouldInterceptRequest(view, request);
            }
        });
        if (android.os.Build.VERSION.SDK_INT >= 19) {
            WebView.setWebContentsDebuggingEnabled(true);
        }

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onConsoleMessage(android.webkit.ConsoleMessage consoleMessage) {
                Log.d("SokoMusicWeb", "[" + consoleMessage.messageLevel() + "] " + consoleMessage.message() + " (" + consoleMessage.sourceId() + ":" + consoleMessage.lineNumber() + ")");
                return super.onConsoleMessage(consoleMessage);
            }
        });

        try {
            InputStream is = getAssets().open("index.html");
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            byte[] buf = new byte[4096];
            int read;
            while ((read = is.read(buf)) != -1) {
                baos.write(buf, 0, read);
            }
            is.close();
            String htmlContent = baos.toString("UTF-8");
            webView.loadDataWithBaseURL("https://music.youtube.com/", htmlContent, "text/html", "UTF-8", null);
        } catch (Exception e) {
            webView.loadUrl("file:///android_asset/index.html");
        }

        setContentView(webView);
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (webView != null) {
            webView.onResume();
        }
        if (audioEngine != null) {
            audioEngine.syncPlaybackStateToWebView();
        }
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        if (audioEngine != null) {
            audioEngine.syncPlaybackStateToWebView();
        }
    }

    @Override
    public void onBackPressed() {
        if (sokoNativeBridge != null && sokoNativeBridge.isAppOutdated()) {
            finishAffinity();
            System.exit(0);
            return;
        }
        super.onBackPressed();
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        if (noisyAudioReceiver != null) {
            noisyAudioReceiver.unregister(this);
        }
        try {
            unbindService(serviceConnection);
        } catch (Exception ignored) {}
        if (mediaNotificationManager != null) {
            mediaNotificationManager.release();
        }
        if (audioFocusManager != null) {
            audioFocusManager.abandonAudioFocus();
        }
        if (audioEngine != null) {
            audioEngine.release();
        }
        if (webView != null) {
            webView.destroy();
        }
    }
}
