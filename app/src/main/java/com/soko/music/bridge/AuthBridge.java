package com.soko.music.bridge;

import android.app.Activity;
import android.app.Dialog;
import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.graphics.Typeface;
import android.util.Log;
import android.view.Gravity;
import android.view.View;
import android.webkit.CookieManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;
import com.soko.music.util.CryptoUtil;
import org.json.JSONObject;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;

public class AuthBridge {
    private static final String TAG = "SokoMusic";
    public static final String APP_USER_AGENT = "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36";
    private final Activity activity;
    private final WebView webView;
    private Dialog loginDialog;
    private WebView loginWebView;

    public AuthBridge(Activity activity, WebView webView) {
        this.activity = activity;
        this.webView = webView;
    }

    @JavascriptInterface
    public void launchGoogleLogin() {
        activity.runOnUiThread(new Runnable() {
            @Override
            public void run() {
                try {
                    if (loginDialog != null && loginDialog.isShowing()) {
                        loginDialog.dismiss();
                    }
                    loginDialog = new Dialog(activity, android.R.style.Theme_Black_NoTitleBar_Fullscreen);
                    loginWebView = new WebView(activity);
                    WebSettings ws = loginWebView.getSettings();
                    ws.setJavaScriptEnabled(true);
                    ws.setDomStorageEnabled(true);
                    ws.setDatabaseEnabled(true);
                    ws.setUseWideViewPort(true);
                    ws.setLoadWithOverviewMode(true);
                    ws.setJavaScriptCanOpenWindowsAutomatically(true);
                    ws.setSupportMultipleWindows(false);
                    ws.setUserAgentString(APP_USER_AGENT);

                    final CookieManager cookieManager = CookieManager.getInstance();
                    cookieManager.setAcceptCookie(true);
                    if (android.os.Build.VERSION.SDK_INT >= 21) {
                        cookieManager.setAcceptThirdPartyCookies(loginWebView, true);
                    }

                    final java.util.concurrent.atomic.AtomicBoolean isLoginHandled = new java.util.concurrent.atomic.AtomicBoolean(false);
                    final Runnable cookieChecker = new Runnable() {
                        @Override
                        public void run() {
                            try {
                                if (loginWebView == null || isLoginHandled.get()) return;
                                String currentUrl = loginWebView.getUrl();
                                // Only process cookies once navigation has routed to YouTube / YouTube Music
                                if (currentUrl != null && (currentUrl.contains("music.youtube.com") || currentUrl.contains("youtube.com"))) {
                                    // Let SetSID finalize without premature dismissal
                                    if (currentUrl.contains("accounts.youtube.com/accounts/SetSID")) {
                                        return;
                                    }

                                    // Harvest comprehensive cookies across all YouTube auth domains
                                    java.util.Map<String, String> mergedCookies = new java.util.LinkedHashMap<String, String>();
                                    String[] harvestUrls = new String[] {
                                        "https://music.youtube.com",
                                        "https://www.youtube.com",
                                        "https://youtube.com",
                                        "https://accounts.google.com"
                                    };
                                    for (String hUrl : harvestUrls) {
                                        String c = cookieManager.getCookie(hUrl);
                                        if (c != null && !c.isEmpty()) {
                                            for (String part : c.split(";")) {
                                                String trimmed = part.trim();
                                                int eq = trimmed.indexOf('=');
                                                if (eq > 0) {
                                                    String k = trimmed.substring(0, eq).trim();
                                                    String v = trimmed.substring(eq + 1).trim();
                                                    if (!mergedCookies.containsKey(k)) {
                                                        mergedCookies.put(k, v);
                                                    }
                                                }
                                            }
                                        }
                                    }

                                    StringBuilder sb = new StringBuilder();
                                    for (java.util.Map.Entry<String, String> entry : mergedCookies.entrySet()) {
                                        if (sb.length() > 0) sb.append("; ");
                                        sb.append(entry.getKey()).append("=").append(entry.getValue());
                                    }
                                    final String ytmCookies = sb.toString();

                                    boolean hasAuthSid = ytmCookies.contains("SAPISID=") ||
                                                         ytmCookies.contains("__Secure-3PAPISID=") ||
                                                         ytmCookies.contains("__Secure-1PAPISID=");
                                    boolean hasSession = ytmCookies.contains("LOGIN_INFO=") ||
                                                         ytmCookies.contains("SID=") ||
                                                         ytmCookies.contains("__Secure-3PSID=") ||
                                                         ytmCookies.contains("__Secure-1PSID=");

                                    if (hasAuthSid && hasSession) {
                                        if (!isLoginHandled.compareAndSet(false, true)) {
                                            return;
                                        }
                                        cookieManager.flush();
                                        final String finalCookies = ytmCookies;
                                        activity.getSharedPreferences("soko_prefs", Context.MODE_PRIVATE)
                                            .edit()
                                            .putString("ytm_cookies", finalCookies)
                                            .apply();

                                        loginWebView.evaluateJavascript(
                                            "(function(){ try { return JSON.stringify({ name: window.ytcfg?.get('USER_DISPLAY_NAME') || '', email: window.ytcfg?.get('USER_EMAIL') || '' }); } catch(e){ return '{}'; } })()",
                                            new android.webkit.ValueCallback<String>() {
                                                @Override
                                                public void onReceiveValue(String value) {
                                                    String name = "YouTube Music User";
                                                    String email = "Connected Google Account";
                                                    try {
                                                        if (value != null && !value.equals("null")) {
                                                            String cleanVal = value;
                                                            if (cleanVal.startsWith("\"") && cleanVal.endsWith("\"")) {
                                                                cleanVal = new org.json.JSONTokener(cleanVal).nextValue().toString();
                                                            }
                                                            JSONObject uObj = new JSONObject(cleanVal);
                                                            if (uObj.has("name") && !uObj.getString("name").isEmpty()) name = uObj.getString("name");
                                                            if (uObj.has("email") && !uObj.getString("email").isEmpty()) email = uObj.getString("email");
                                                        }
                                                    } catch (Exception ignored) {}

                                                    final String fName = name;
                                                    final String fEmail = email;
                                                    activity.runOnUiThread(new Runnable() {
                                                        @Override
                                                        public void run() {
                                                            if (loginDialog != null && loginDialog.isShowing()) {
                                                                loginDialog.dismiss();
                                                            }
                                                            if (webView != null) {
                                                                webView.evaluateJavascript(
                                                                    "window.onGoogleLoginSuccess && window.onGoogleLoginSuccess(" +
                                                                    JSONObject.quote(finalCookies) + ", " +
                                                                    JSONObject.quote(fName) + ", " +
                                                                    JSONObject.quote(fEmail) + ")",
                                                                    null
                                                                );
                                                            }
                                                        }
                                                    });
                                                }
                                            }
                                        );
                                    }
                                }
                            } catch (Exception e) {
                                Log.e(TAG, "cookieChecker error", e);
                            }
                        }
                    };

                    final android.os.Handler pollHandler = new android.os.Handler(android.os.Looper.getMainLooper());
                    final Runnable pollRunnable = new Runnable() {
                        @Override
                        public void run() {
                            if (loginDialog != null && loginDialog.isShowing()) {
                                cookieChecker.run();
                                pollHandler.postDelayed(this, 1000);
                            }
                        }
                    };

                    loginWebView.setWebViewClient(new WebViewClient() {
                        @Override
                        public void onPageStarted(WebView view, String url, Bitmap favicon) {
                            super.onPageStarted(view, url, favicon);
                            cookieChecker.run();
                        }

                        @Override
                        public void onPageFinished(WebView view, String url) {
                            super.onPageFinished(view, url);
                            cookieChecker.run();
                        }

                        @Override
                        public void doUpdateVisitedHistory(WebView view, String url, boolean isReload) {
                            super.doUpdateVisitedHistory(view, url, isReload);
                            cookieChecker.run();
                        }
                    });

                    LinearLayout rootLayout = new LinearLayout(activity);
                    rootLayout.setOrientation(LinearLayout.VERTICAL);
                    rootLayout.setBackgroundColor(Color.parseColor("#07090E"));

                    LinearLayout topBar = new LinearLayout(activity);
                    topBar.setOrientation(LinearLayout.HORIZONTAL);
                    topBar.setPadding(32, 28, 32, 20);
                    topBar.setGravity(Gravity.CENTER_VERTICAL);

                    TextView topTitle = new TextView(activity);
                    topTitle.setText("Sign in to YouTube Music");
                    topTitle.setTextColor(Color.WHITE);
                    topTitle.setTextSize(16);
                    topTitle.setTypeface(null, Typeface.BOLD);
                    LinearLayout.LayoutParams titleP = new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1.0f);
                    topBar.addView(topTitle, titleP);

                    Button cancelBtn = new Button(activity);
                    cancelBtn.setText("✕ Cancel");
                    cancelBtn.setTextColor(Color.parseColor("#94A3B8"));
                    cancelBtn.setBackgroundColor(Color.TRANSPARENT);
                    cancelBtn.setOnClickListener(new View.OnClickListener() {
                        @Override
                        public void onClick(View v) {
                            pollHandler.removeCallbacksAndMessages(null);
                            if (loginDialog != null && loginDialog.isShowing()) {
                                loginDialog.dismiss();
                            }
                        }
                    });
                    topBar.addView(cancelBtn);

                    rootLayout.addView(topBar);
                    LinearLayout.LayoutParams wvParams = new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.MATCH_PARENT);
                    rootLayout.addView(loginWebView, wvParams);

                    loginDialog.setOnDismissListener(new android.content.DialogInterface.OnDismissListener() {
                        @Override
                        public void onDismiss(android.content.DialogInterface dialog) {
                            pollHandler.removeCallbacksAndMessages(null);
                        }
                    });

                    loginDialog.setContentView(rootLayout);
                    loginDialog.show();
                    pollHandler.postDelayed(pollRunnable, 1500);
                    loginWebView.loadUrl("https://accounts.google.com/ServiceLogin?service=youtube&continue=https%3A%2F%2Fmusic.youtube.com%2F");
                } catch (Exception e) {
                    Log.e(TAG, "launchGoogleLogin error", e);
                }
            }
        });
    }

    @JavascriptInterface
    public void startGoogleLoginFlow() {
        launchGoogleLogin();
    }

    @JavascriptInterface
    public void setStoredYtmCookies(final String cookies) {
        if (cookies != null && !cookies.trim().isEmpty()) {
            activity.getSharedPreferences("soko_prefs", Context.MODE_PRIVATE)
                .edit()
                .putString("ytm_cookies", cookies.trim())
                .apply();
            try {
                CookieManager cm = CookieManager.getInstance();
                cm.setAcceptCookie(true);
                for (String part : cookies.split(";")) {
                    String trimmed = part.trim();
                    if (!trimmed.isEmpty()) {
                        cm.setCookie("https://music.youtube.com", trimmed);
                        cm.setCookie("https://www.youtube.com", trimmed);
                    }
                }
                cm.flush();
            } catch (Exception ignored) {}
        }
    }

    @JavascriptInterface
    public void fetchYtmApi(final String endpoint, final String jsonPayload, final String customCookie, final String callbackId) {
        new Thread(new Runnable() {
            @Override
            public void run() {
                try {
                    String fullUrl = endpoint.startsWith("http") ? endpoint : "https://music.youtube.com" + (endpoint.startsWith("/") ? "" : "/") + endpoint;
                    URL url = new URL(fullUrl);
                    HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                    conn.setRequestMethod("POST");
                    conn.setConnectTimeout(15000);
                    conn.setReadTimeout(25000);
                    conn.setDoOutput(true);
                    conn.setInstanceFollowRedirects(true);
                    conn.setRequestProperty("Content-Type", "application/json");
                    conn.setRequestProperty("User-Agent", APP_USER_AGENT);
                    conn.setRequestProperty("X-YouTube-Client-Name", "67"); // WEB_REMIX
                    conn.setRequestProperty("X-YouTube-Client-Version", "1.20261020.10.00");
                    conn.setRequestProperty("Origin", "https://music.youtube.com");
                    conn.setRequestProperty("Referer", "https://music.youtube.com/");
                    conn.setRequestProperty("X-Origin", "https://music.youtube.com");
                    conn.setRequestProperty("X-Goog-AuthUser", "0");

                    String cookieToUse = customCookie;
                    if (cookieToUse == null || cookieToUse.isEmpty()) {
                        cookieToUse = activity.getSharedPreferences("soko_prefs", Context.MODE_PRIVATE).getString("ytm_cookies", "");
                    }
                    if (cookieToUse == null || cookieToUse.isEmpty()) {
                        try {
                            cookieToUse = CookieManager.getInstance().getCookie("https://music.youtube.com");
                        } catch (Exception ignored) {}
                    }
                    if (cookieToUse != null && !cookieToUse.isEmpty()) {
                        conn.setRequestProperty("Cookie", cookieToUse);
                        String sapisid = "";
                        // Step 1: Look for exact SAPISID for SAPISIDHASH signature
                        for (String part : cookieToUse.split(";")) {
                            String trimmed = part.trim();
                            if (trimmed.startsWith("SAPISID=")) {
                                sapisid = trimmed.substring("SAPISID=".length());
                                break;
                            }
                        }
                        // Step 2: Fallback only if SAPISID is not found
                        if (sapisid.isEmpty()) {
                            for (String part : cookieToUse.split(";")) {
                                String trimmed = part.trim();
                                if (trimmed.startsWith("__Secure-3PAPISID=")) {
                                    sapisid = trimmed.substring("__Secure-3PAPISID=".length());
                                    break;
                                } else if (trimmed.startsWith("__Secure-1PAPISID=")) {
                                    sapisid = trimmed.substring("__Secure-1PAPISID=".length());
                                    break;
                                }
                            }
                        }
                        if (!sapisid.isEmpty()) {
                            String authHeader = CryptoUtil.generateSapisidHash(sapisid);
                            if (authHeader != null && !authHeader.isEmpty()) {
                                conn.setRequestProperty("Authorization", authHeader);
                            }
                        }
                    }

                    byte[] postBytes = jsonPayload.getBytes("UTF-8");
                    conn.getOutputStream().write(postBytes);
                    conn.getOutputStream().flush();

                    int responseCode = conn.getResponseCode();

                    // Sync only positive refreshed session cookies back to CookieManager (never wipe cookies on guest/401)
                    if (responseCode >= 200 && responseCode < 300) {
                        try {
                            java.util.List<String> setCookies = conn.getHeaderFields().get("Set-Cookie");
                            if (setCookies != null && !setCookies.isEmpty()) {
                                CookieManager cm = CookieManager.getInstance();
                                for (String sc : setCookies) {
                                    if (sc != null && !sc.trim().isEmpty()) {
                                        String scLower = sc.toLowerCase();
                                        // Ignore cookie deletion headers (Expires=1970 or Max-Age=0)
                                        if (!scLower.contains("expires=thu, 01 jan 1970") &&
                                            !scLower.contains("expires=thu, 01-jan-1970") &&
                                            !scLower.contains("max-age=0;")) {
                                            cm.setCookie("https://music.youtube.com", sc);
                                        }
                                    }
                                }
                                cm.flush();
                            }
                        } catch (Exception ignored) {}
                    }

                    InputStream is = (responseCode >= 200 && responseCode < 400) ? conn.getInputStream() : conn.getErrorStream();
                    ByteArrayOutputStream baos = new ByteArrayOutputStream();
                    byte[] buf = new byte[8192];
                    int r;
                    while ((r = is.read(buf)) != -1) {
                        baos.write(buf, 0, r);
                    }
                    is.close();
                    final String respStr = baos.toString("UTF-8");

                    final boolean isSuccess = (responseCode >= 200 && responseCode < 400);
                    activity.runOnUiThread(new Runnable() {
                        @Override
                        public void run() {
                            if (webView != null) {
                                String script = "window.onYtmNativeApiResponse && window.onYtmNativeApiResponse(" + JSONObject.quote(callbackId) + ", " + isSuccess + ", " + JSONObject.quote(respStr) + ")";
                                webView.evaluateJavascript(script, null);
                            }
                        }
                    });
                } catch (final Exception e) {
                    Log.e(TAG, "fetchYtmApi error", e);
                    activity.runOnUiThread(new Runnable() {
                        @Override
                        public void run() {
                            if (webView != null) {
                                String script = "window.onYtmNativeApiResponse && window.onYtmNativeApiResponse(" + JSONObject.quote(callbackId) + ", false, " + JSONObject.quote(e.getMessage()) + ")";
                                webView.evaluateJavascript(script, null);
                            }
                        }
                    });
                }
            }
        }).start();
    }

    @JavascriptInterface
    public String getStoredYtmCookies() {
        return activity.getSharedPreferences("soko_prefs", Context.MODE_PRIVATE).getString("ytm_cookies", "");
    }

    @JavascriptInterface
    public void clearStoredYtmCookies() {
        activity.getSharedPreferences("soko_prefs", Context.MODE_PRIVATE).edit().remove("ytm_cookies").apply();
        try {
            CookieManager.getInstance().removeAllCookies(null);
            CookieManager.getInstance().flush();
        } catch (Exception ignored) {}
    }
}
