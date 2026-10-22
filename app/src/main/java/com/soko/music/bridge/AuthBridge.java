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
                    ws.setUserAgentString("Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36");

                    final CookieManager cookieManager = CookieManager.getInstance();
                    cookieManager.setAcceptCookie(true);
                    if (android.os.Build.VERSION.SDK_INT >= 21) {
                        cookieManager.setAcceptThirdPartyCookies(loginWebView, true);
                    }

                    final Runnable cookieChecker = new Runnable() {
                        @Override
                        public void run() {
                            try {
                                if (loginWebView == null) return;
                                String currentUrl = loginWebView.getUrl();
                                // Only process cookies once navigation has routed to YouTube / YouTube Music
                                if (currentUrl != null && (currentUrl.contains("music.youtube.com") || currentUrl.contains("youtube.com"))) {
                                    // Let SetSID finalize without premature dismissal
                                    if (currentUrl.contains("accounts.youtube.com/accounts/SetSID")) {
                                        return;
                                    }

                                    String ytmCookies = cookieManager.getCookie("https://music.youtube.com");
                                    if (ytmCookies == null || ytmCookies.isEmpty()) {
                                        ytmCookies = cookieManager.getCookie("https://www.youtube.com");
                                    }

                                    boolean hasAuthSid = ytmCookies != null && (
                                        ytmCookies.contains("SAPISID=") ||
                                        ytmCookies.contains("__Secure-3PAPISID=") ||
                                        ytmCookies.contains("__Secure-1PAPISID=")
                                    );
                                    boolean hasSession = ytmCookies != null && (
                                        ytmCookies.contains("LOGIN_INFO=") ||
                                        ytmCookies.contains("SID=") ||
                                        ytmCookies.contains("__Secure-3PSID=") ||
                                        ytmCookies.contains("__Secure-1PSID=")
                                    );

                                    if (hasAuthSid && hasSession) {
                                        cookieManager.flush();
                                        final String finalCookies = ytmCookies;
                                        activity.getSharedPreferences("soko_prefs", Context.MODE_PRIVATE)
                                            .edit()
                                            .putString("ytm_cookies", finalCookies)
                                            .apply();

                                        if (loginDialog != null && loginDialog.isShowing()) {
                                            loginDialog.dismiss();
                                        }
                                        if (webView != null) {
                                            webView.evaluateJavascript("window.onGoogleLoginSuccess && window.onGoogleLoginSuccess(" + JSONObject.quote(finalCookies) + ")", null);
                                        }
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
                    conn.setRequestProperty("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36");
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
                        for (String part : cookieToUse.split(";")) {
                            String trimmed = part.trim();
                            if (trimmed.startsWith("__Secure-3PAPISID=")) {
                                sapisid = trimmed.substring("__Secure-3PAPISID=".length());
                                break;
                            } else if (trimmed.startsWith("SAPISID=")) {
                                sapisid = trimmed.substring("SAPISID=".length());
                            } else if (sapisid.isEmpty() && trimmed.startsWith("__Secure-1PAPISID=")) {
                                sapisid = trimmed.substring("__Secure-1PAPISID=".length());
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

                    // Sync any refreshed session cookies back to CookieManager
                    try {
                        java.util.List<String> setCookies = conn.getHeaderFields().get("Set-Cookie");
                        if (setCookies != null && !setCookies.isEmpty()) {
                            CookieManager cm = CookieManager.getInstance();
                            for (String sc : setCookies) {
                                if (sc != null && !sc.trim().isEmpty()) {
                                    cm.setCookie("https://music.youtube.com", sc);
                                }
                            }
                            cm.flush();
                        }
                    } catch (Exception ignored) {}

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
