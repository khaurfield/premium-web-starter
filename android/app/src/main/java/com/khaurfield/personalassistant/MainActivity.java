package com.khaurfield.personalassistant;

import android.Manifest;
import android.app.Activity;
import android.app.AlertDialog;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.view.WindowInsets;
import android.view.WindowManager;
import android.webkit.CookieManager;
import android.webkit.PermissionRequest;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.EditText;
import android.widget.FrameLayout;
import android.widget.HorizontalScrollView;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

/**
 * HTTPS-only shell for the existing server-rendered app. No Javascript bridge,
 * bundled credentials, or AI implementation exists in the Android app.
 */
public final class MainActivity extends Activity {
    private static final int FILE_REQUEST = 1001;
    private static final int MIC_REQUEST = 1002;
    private static final int BG = Color.rgb(8, 15, 35);
    private static final int CARD = Color.rgb(20, 31, 56);
    private static final int TEXT = Color.rgb(236, 242, 255);
    private static final int MUTED = Color.rgb(165, 182, 211);
    private static final String PREFS = "personal_ai_config";
    private static final String KEY_ORIGIN = "backend_origin";

    private SharedPreferences prefs;
    private String backendOrigin;
    private WebView webView;
    private LinearLayout root;
    private LinearLayout errorView;
    private TextView errorTitle;
    private TextView errorMessage;
    private ProgressBar progress;
    private ValueCallback<Uri[]> fileCallback;
    private PermissionRequest pendingMicRequest;
    private boolean clearHistoryAfterLoad;

    @Override public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE);
        prefs = getSharedPreferences(PREFS, MODE_PRIVATE);
        backendOrigin = BackendOrigin.parse(prefs.getString(KEY_ORIGIN, ""));
        buildUi();
        configureWebView();
        if (backendOrigin == null) {
            showSetupState();
        } else if (savedInstanceState == null || webView.restoreState(savedInstanceState) == null
                || !BackendOrigin.matches(backendOrigin, webView.getUrl())) {
            clearHistoryAfterLoad = true;
            openPath("/chat");
        }
    }

    private int dp(int value) {
        return Math.round(value * getResources().getDisplayMetrics().density);
    }

    private GradientDrawable rounded(int color, int radius) {
        GradientDrawable background = new GradientDrawable();
        background.setColor(color);
        background.setCornerRadius(dp(radius));
        return background;
    }

    private TextView label(String value, int size, int color) {
        TextView text = new TextView(this);
        text.setText(value);
        text.setTextColor(color);
        text.setTextSize(size);
        return text;
    }

    private Button button(String title) {
        Button button = new Button(this);
        button.setText(title);
        button.setAllCaps(false);
        button.setTextSize(13);
        button.setTextColor(TEXT);
        button.setMinHeight(dp(44));
        button.setMinWidth(0);
        button.setPadding(dp(14), 0, dp(14), 0);
        button.setBackground(rounded(CARD, 12));
        return button;
    }

    private void buildUi() {
        root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setBackgroundColor(BG);
        root.setOnApplyWindowInsetsListener((view, insets) -> {
            if (Build.VERSION.SDK_INT >= 30) {
                android.graphics.Insets bars = insets.getInsets(WindowInsets.Type.systemBars() | WindowInsets.Type.displayCutout());
                view.setPadding(bars.left, bars.top, bars.right, bars.bottom);
            } else {
                view.setPadding(insets.getSystemWindowInsetLeft(), insets.getSystemWindowInsetTop(),
                        insets.getSystemWindowInsetRight(), insets.getSystemWindowInsetBottom());
            }
            return insets;
        });

        LinearLayout header = new LinearLayout(this);
        header.setGravity(Gravity.CENTER_VERTICAL);
        header.setPadding(dp(16), dp(8), dp(12), dp(8));
        TextView brand = label("✦  Personal AI", 19, TEXT);
        brand.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        header.addView(brand, new LinearLayout.LayoutParams(0, dp(44), 1));
        brand.setGravity(Gravity.CENTER_VERTICAL);
        Button settings = button("Server");
        settings.setContentDescription("Set assistant server");
        settings.setOnClickListener(v -> showServerDialog());
        header.addView(settings);
        root.addView(header);

        progress = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal);
        progress.setMax(100);
        progress.setVisibility(View.INVISIBLE);
        root.addView(progress, new LinearLayout.LayoutParams(-1, dp(2)));

        FrameLayout body = new FrameLayout(this);
        webView = new WebView(this);
        webView.setBackgroundColor(BG);
        body.addView(webView, new FrameLayout.LayoutParams(-1, -1));

        errorView = new LinearLayout(this);
        errorView.setOrientation(LinearLayout.VERTICAL);
        errorView.setGravity(Gravity.CENTER);
        errorView.setPadding(dp(28), dp(24), dp(28), dp(24));
        errorView.setBackgroundColor(BG);
        TextView symbol = label("✦", 42, Color.rgb(155, 181, 255));
        symbol.setGravity(Gravity.CENTER);
        errorView.addView(symbol);
        errorTitle = label("", 22, TEXT);
        errorTitle.setGravity(Gravity.CENTER);
        errorTitle.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        LinearLayout.LayoutParams titleParams = new LinearLayout.LayoutParams(-1, -2);
        titleParams.topMargin = dp(18);
        errorView.addView(errorTitle, titleParams);
        errorMessage = label("", 15, MUTED);
        errorMessage.setGravity(Gravity.CENTER);
        errorMessage.setLineSpacing(dp(4), 1f);
        LinearLayout.LayoutParams messageParams = new LinearLayout.LayoutParams(-1, -2);
        messageParams.topMargin = dp(12);
        errorView.addView(errorMessage, messageParams);
        LinearLayout actions = new LinearLayout(this);
        actions.setGravity(Gravity.CENTER);
        Button retry = button("Retry");
        retry.setOnClickListener(v -> {
            if (backendOrigin == null) showServerDialog();
            else if (webView.getUrl() != null && BackendOrigin.matches(backendOrigin, webView.getUrl())) webView.reload();
            else openPath("/chat");
        });
        Button change = button("Set server");
        change.setOnClickListener(v -> showServerDialog());
        LinearLayout.LayoutParams actionParams = new LinearLayout.LayoutParams(-2, -2);
        actionParams.setMargins(dp(4), dp(20), dp(4), 0);
        actions.addView(retry, actionParams);
        LinearLayout.LayoutParams changeParams = new LinearLayout.LayoutParams(-2, -2);
        changeParams.setMargins(dp(4), dp(20), dp(4), 0);
        actions.addView(change, changeParams);
        errorView.addView(actions);
        body.addView(errorView, new FrameLayout.LayoutParams(-1, -1));
        root.addView(body, new LinearLayout.LayoutParams(-1, 0, 1));

        HorizontalScrollView scroll = new HorizontalScrollView(this);
        scroll.setHorizontalScrollBarEnabled(false);
        scroll.setFillViewport(true);
        LinearLayout nav = new LinearLayout(this);
        nav.setGravity(Gravity.CENTER);
        nav.setPadding(dp(5), dp(6), dp(5), dp(6));
        addNav(nav, "Chat", "/chat");
        addNav(nav, "Files", "/documents");
        addNav(nav, "Vision", "/vision");
        addNav(nav, "Coding", "/coding");
        addNav(nav, "Research", "/research");
        addNav(nav, "Account", "/account");
        scroll.addView(nav);
        root.addView(scroll);
        setContentView(root);
        root.requestApplyInsets();
    }

    private void addNav(LinearLayout row, String text, String path) {
        Button item = button(text);
        item.setContentDescription("Open " + text);
        item.setBackgroundColor(Color.TRANSPARENT);
        item.setOnClickListener(v -> openPath(path));
        row.addView(item, new LinearLayout.LayoutParams(-2, dp(48)));
    }

    private void configureWebView() {
        WebView.setWebContentsDebuggingEnabled(false);
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true); // required by the existing Next.js UI
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(true); // Android document picker provides content: URIs
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setJavaScriptCanOpenWindowsAutomatically(false);
        settings.setSupportMultipleWindows(false);
        settings.setMediaPlaybackRequiresUserGesture(true);
        CookieManager cookies = CookieManager.getInstance();
        cookies.setAcceptCookie(true);
        cookies.setAcceptThirdPartyCookies(webView, false);
        webView.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                if (!request.isForMainFrame()) return false;
                String url = request.getUrl().toString();
                if (BackendOrigin.matches(backendOrigin, url)) return false;
                openExternal(request.getUrl());
                return true;
            }
            @Override public void onPageStarted(WebView view, String url, android.graphics.Bitmap favicon) {
                super.onPageStarted(view, url, favicon);
                errorView.setVisibility(View.GONE);
                progress.setVisibility(View.VISIBLE);
            }
            @Override public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                progress.setVisibility(View.INVISIBLE);
                if (clearHistoryAfterLoad && BackendOrigin.matches(backendOrigin, url)) {
                    view.clearHistory();
                    clearHistoryAfterLoad = false;
                }
                CookieManager.getInstance().flush();
            }
            @Override public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                super.onReceivedError(view, request, error);
                if (request.isForMainFrame()) showConnectionError();
            }
            @Override public void onReceivedHttpError(WebView view, WebResourceRequest request, WebResourceResponse response) {
                super.onReceivedHttpError(view, request, response);
                if (request.isForMainFrame() && response.getStatusCode() >= 400) showConnectionError();
            }
        });
        webView.setWebChromeClient(new WebChromeClient() {
            @Override public void onProgressChanged(WebView view, int value) {
                progress.setProgress(value);
                progress.setVisibility(value < 100 ? View.VISIBLE : View.INVISIBLE);
            }
            @Override public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (!BackendOrigin.matches(backendOrigin, view.getUrl())) return false;
                if (fileCallback != null) fileCallback.onReceiveValue(null);
                fileCallback = callback;
                try {
                    startActivityForResult(params.createIntent(), FILE_REQUEST);
                    return true;
                } catch (ActivityNotFoundException ex) {
                    fileCallback = null;
                    callback.onReceiveValue(null);
                    Toast.makeText(MainActivity.this, "No file picker is available on this device.", Toast.LENGTH_LONG).show();
                    return true;
                }
            }
            @Override public void onPermissionRequest(PermissionRequest request) {
                runOnUiThread(() -> requestMicrophone(request));
            }
            @Override public void onPermissionRequestCanceled(PermissionRequest request) {
                if (pendingMicRequest == request) pendingMicRequest = null;
            }
        });
    }

    private void requestMicrophone(PermissionRequest request) {
        String[] resources = request.getResources();
        boolean audioOnly = resources.length == 1 && PermissionRequest.RESOURCE_AUDIO_CAPTURE.equals(resources[0]);
        if (!audioOnly || backendOrigin == null || !BackendOrigin.matches(backendOrigin, request.getOrigin().toString())
                || !BackendOrigin.matches(backendOrigin, webView.getUrl()) || pendingMicRequest != null) {
            request.deny();
            return;
        }
        if (checkSelfPermission(Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED) {
            request.grant(new String[]{PermissionRequest.RESOURCE_AUDIO_CAPTURE});
        } else {
            pendingMicRequest = request;
            requestPermissions(new String[]{Manifest.permission.RECORD_AUDIO}, MIC_REQUEST);
        }
    }

    @Override public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] results) {
        super.onRequestPermissionsResult(requestCode, permissions, results);
        if (requestCode != MIC_REQUEST || pendingMicRequest == null) return;
        PermissionRequest request = pendingMicRequest;
        pendingMicRequest = null;
        if (results.length > 0 && results[0] == PackageManager.PERMISSION_GRANTED
                && BackendOrigin.matches(backendOrigin, request.getOrigin().toString())
                && BackendOrigin.matches(backendOrigin, webView.getUrl())) {
            request.grant(new String[]{PermissionRequest.RESOURCE_AUDIO_CAPTURE});
        } else {
            request.deny();
        }
    }

    @Override protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == FILE_REQUEST && fileCallback != null) {
            ValueCallback<Uri[]> callback = fileCallback;
            fileCallback = null;
            callback.onReceiveValue(BackendOrigin.matches(backendOrigin, webView.getUrl())
                    ? WebChromeClient.FileChooserParams.parseResult(resultCode, data) : null);
        }
    }

    private void openExternal(Uri uri) {
        String scheme = uri.getScheme();
        if (!"https".equalsIgnoreCase(scheme) && !"http".equalsIgnoreCase(scheme)) return;
        try {
            startActivity(new Intent(Intent.ACTION_VIEW, uri).addCategory(Intent.CATEGORY_BROWSABLE));
        } catch (ActivityNotFoundException ex) {
            Toast.makeText(this, "No browser is available to open this link.", Toast.LENGTH_LONG).show();
        }
    }

    private void openPath(String path) {
        if (backendOrigin == null) {
            showSetupState();
            showServerDialog();
            return;
        }
        webView.loadUrl(backendOrigin + path);
    }

    private void showSetupState() {
        errorTitle.setText("Connect your assistant");
        errorMessage.setText("Enter the HTTPS address of your deployed assistant server. The app does not contain an AI provider key.");
        errorView.setVisibility(View.VISIBLE);
    }

    private void showConnectionError() {
        progress.setVisibility(View.INVISIBLE);
        errorTitle.setText("Couldn’t reach your assistant");
        errorMessage.setText("Check your internet connection and server address, then try again. Your conversations on this device are not deleted.");
        errorView.setVisibility(View.VISIBLE);
    }

    private void showServerDialog() {
        EditText address = new EditText(this);
        address.setSingleLine(true);
        address.setInputType(android.text.InputType.TYPE_CLASS_TEXT | android.text.InputType.TYPE_TEXT_VARIATION_URI);
        address.setHint("https://your-assistant.example");
        if (backendOrigin != null) address.setText(backendOrigin);
        LinearLayout container = new LinearLayout(this);
        container.setPadding(dp(24), 0, dp(24), 0);
        container.addView(address, new LinearLayout.LayoutParams(-1, -2));
        AlertDialog dialog = new AlertDialog.Builder(this)
                .setTitle("Assistant server")
                .setMessage("Use the HTTPS origin of your own deployed assistant. Do not enter API keys or passwords here.")
                .setView(container)
                .setNegativeButton("Cancel", null)
                .setPositiveButton("Connect", null)
                .create();
        dialog.setOnShowListener(ignored -> dialog.getButton(AlertDialog.BUTTON_POSITIVE).setOnClickListener(v -> {
            String origin = BackendOrigin.parse(address.getText().toString());
            if (origin == null) {
                address.setError("Enter an HTTPS origin only, without a path, credentials, query or fragment.");
                return;
            }
            boolean changed = !origin.equals(backendOrigin);
            backendOrigin = origin;
            prefs.edit().putString(KEY_ORIGIN, origin).apply();
            if (changed) {
                webView.stopLoading();
                webView.clearHistory();
                clearHistoryAfterLoad = true;
            }
            dialog.dismiss();
            openPath("/chat");
        }));
        dialog.show();
    }

    @Override protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        if (backendOrigin != null) webView.saveState(outState);
    }

    @Override protected void onPause() {
        CookieManager.getInstance().flush();
        super.onPause();
    }

    @Override public void onBackPressed() {
        if (errorView.getVisibility() != View.VISIBLE && webView.canGoBack()) webView.goBack();
        else super.onBackPressed();
    }

    @Override protected void onDestroy() {
        if (fileCallback != null) { fileCallback.onReceiveValue(null); fileCallback = null; }
        if (pendingMicRequest != null) { pendingMicRequest.deny(); pendingMicRequest = null; }
        webView.destroy();
        super.onDestroy();
    }
}
