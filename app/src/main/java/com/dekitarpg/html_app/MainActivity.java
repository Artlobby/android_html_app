package com.dekitarpg.html_app;

import android.content.Context;
import android.os.Build;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.support.v7.app.AppCompatActivity;
import android.os.Bundle;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

public class MainActivity extends AppCompatActivity {

    //
    // Main Webview for the app!!
    //
    private WebView view;

    //
    // Instance of custom interface class
    //
    private JSInt js_interface = new JSInt();

    //
    // Custom interface class definition
    //
    public class JSInt {
        //
        // private variables used by interface class
        // to control the functionality of the back button
        //
        private boolean can_go_back = true;
        private boolean was_back_pressed = false;

        //
        // set if app can exit when back pressed
        //
        @JavascriptInterface
        public boolean setCanGoBack(boolean cangoback) {
            can_go_back = cangoback;
            return can_go_back;
        }

        //
        // return boolean for if back was pressed
        // since the last time this function was called
        //
        @JavascriptInterface
        public boolean wasBackButtonPressed() {
            boolean was_it = was_back_pressed;
            // reset was back flag after check to
            // ensure that it will only return
            // true one time after each press
            was_back_pressed = false;
            return was_it;
        }

        //
        // pop a toast using text string
        //
        @JavascriptInterface
        public void popToast(String text) {
            Context context = getApplicationContext();
            Toast toast = Toast.makeText(context, text, Toast.LENGTH_SHORT);
            toast.show();
        }

        //
        // trigger android vibrate feature for ms duration
        //
        @JavascriptInterface
        public void vibrate(int ms) {
            Vibrator vibrator = (Vibrator) getSystemService(VIBRATOR_SERVICE);
            if (Build.VERSION.SDK_INT >= 26) {
                vibrator.vibrate(VibrationEffect.createOneShot(ms, VibrationEffect.DEFAULT_AMPLITUDE));
            } else {
                vibrator.vibrate(ms);
            }
        }

        //
        // force the app to finish and exit
        //
        @JavascriptInterface
        public void forceExitApp(){
            finish();
            System.exit(0);
        }
    }

    //
    // OVERRIDE of onCreate() function
    //
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        //
        // Get and store the web view for this app
        //
        view = findViewById(R.id.web_view);

        //
        // Change web views settings to allow
        // for javascript code to be executed
        // and for dom storage to be enabled
        //
        WebSettings settings = view.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        //
        // fixes cors error when loading local json files
        // within the main html app html page.
        // REQUIRES API Level 16+
        //
        settings.setAllowUniversalAccessFromFileURLs(true);

        //
        // Set debugging enabled: FOR DEV MODE ONLY!!
        // MUST REMOVE FOR APP DISTRIBUTION!!!!
        // REQUIRES API Level 19+
        //
        view.setWebContentsDebuggingEnabled(true);

        //
        // Setup javascript interface class and add to web view
        //
        view.addJavascriptInterface(js_interface,"android");

        //
        // Load main app web view
        //
        view.setWebViewClient(new WebViewClient());
        view.loadUrl("file:///android_asset/best-game-ever/www/index.html");
    }


    //
    // OVERRIDE onBackPressed function
    //
    @Override
    public void onBackPressed() {
        // set was back pressed flag to true
        // this is sent to the javascript environment
        // from js interface class functions.
        js_interface.was_back_pressed = true;
        // process the back button pressing
        if (view != null && view.isFocused()) {
            // if the view is focused, and
            // js interface allows us, lets
            // exit the app like normal.
            if (js_interface.can_go_back) {
                super.onBackPressed();
            }
        } else {
            // if view is null or not focused and
            // back is somehow triggered, exit app.
            super.onBackPressed();
        }
    }

    //
    // End of MainActivity class
    //
}
