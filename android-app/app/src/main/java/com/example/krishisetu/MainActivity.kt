package com.example.krishisetu

import android.Manifest
import android.annotation.SuppressLint
import android.app.AlertDialog
import android.content.Context
import android.content.SharedPreferences
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.Color
import android.os.Bundle
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.webkit.ConsoleMessage
import android.webkit.PermissionRequest
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Button
import android.widget.EditText
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.ProgressBar
import android.widget.TextView
import androidx.activity.ComponentActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat

class MainActivity : ComponentActivity() {

    private lateinit var prefs: SharedPreferences
    private lateinit var webView: WebView
    private lateinit var rootLayout: FrameLayout
    private lateinit var errorLayout: LinearLayout
    private lateinit var progressBar: ProgressBar
    private lateinit var errorUrlText: TextView

    private val defaultServerUrl = "http://10.141.38.70:3000"
    private var currentUrl: String = ""

    @SuppressLint("SetJavaScriptEnabled", "ClickableViewAccessibility")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        prefs = getSharedPreferences("krishisetu_prefs", Context.MODE_PRIVATE)
        currentUrl = prefs.getString("server_url", defaultServerUrl) ?: defaultServerUrl

        // Enable remote debugging
        WebView.setWebContentsDebuggingEnabled(true)

        // Request audio permission for voice assistant
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(this, arrayOf(Manifest.permission.RECORD_AUDIO), 101)
        }

        // Create Root FrameLayout
        rootLayout = FrameLayout(this).apply {
            layoutParams = ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
            setBackgroundColor(Color.parseColor("#F8FAFC"))
        }

        // Create Native WebView with 100% direct touch dispatch
        webView = WebView(this).apply {
            layoutParams = FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
            isFocusable = true
            isFocusableInTouchMode = true
            isClickable = true
            isLongClickable = true

            settings.apply {
                javaScriptEnabled = true
                domStorageEnabled = true
                databaseEnabled = true
                allowContentAccess = true
                allowFileAccess = true
                useWideViewPort = true
                loadWithOverviewMode = true
                setSupportZoom(false)
                builtInZoomControls = false
                mediaPlaybackRequiresUserGesture = false
                mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
                cacheMode = WebSettings.LOAD_DEFAULT
                userAgentString = "$userAgentString Mobile KrishiSetuApp/1.0"
            }

            webChromeClient = object : WebChromeClient() {
                override fun onPermissionRequest(request: PermissionRequest) {
                    request.grant(request.resources)
                }

                override fun onProgressChanged(view: WebView?, newProgress: Int) {
                    super.onProgressChanged(view, newProgress)
                    if (newProgress < 100) {
                        progressBar.visibility = View.VISIBLE
                        progressBar.progress = newProgress
                    } else {
                        progressBar.visibility = View.GONE
                    }
                }

                override fun onConsoleMessage(consoleMessage: ConsoleMessage?): Boolean {
                    return super.onConsoleMessage(consoleMessage)
                }
            }

            webViewClient = object : WebViewClient() {
                override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
                    super.onPageStarted(view, url, favicon)
                    errorLayout.visibility = View.GONE
                }

                override fun onPageFinished(view: WebView?, url: String?) {
                    super.onPageFinished(view, url)
                    progressBar.visibility = View.GONE
                }

                override fun onReceivedError(
                    view: WebView?,
                    request: WebResourceRequest?,
                    error: WebResourceError?
                ) {
                    super.onReceivedError(view, request, error)
                    if (request?.isForMainFrame == true) {
                        errorUrlText.text = "Could not reach server at:\n$currentUrl"
                        errorLayout.visibility = View.VISIBLE
                    }
                }
            }

            loadUrl(currentUrl)
            requestFocus(View.FOCUS_DOWN)
        }

        rootLayout.addView(webView)

        // Progress Bar
        progressBar = ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal).apply {
            layoutParams = FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                10
            ).apply {
                gravity = Gravity.TOP
            }
            visibility = View.VISIBLE
        }
        rootLayout.addView(progressBar)

        // Error Screen
        errorLayout = createErrorLayout()
        rootLayout.addView(errorLayout)

        setContentView(rootLayout)
    }

    private fun createErrorLayout(): LinearLayout {
        return LinearLayout(this).apply {
            layoutParams = FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            setBackgroundColor(Color.parseColor("#F8FAFC"))
            setPadding(48, 48, 48, 48)
            visibility = View.GONE

            val title = TextView(this@MainActivity).apply {
                text = "🌾 KrishiSetu"
                textSize = 26f
                setTextColor(Color.parseColor("#047857"))
                gravity = Gravity.CENTER
                paint.isFakeBoldText = true
            }
            addView(title)

            val subtitle = TextView(this@MainActivity).apply {
                text = "Connecting to Server..."
                textSize = 18f
                setTextColor(Color.parseColor("#0F172A"))
                gravity = Gravity.CENTER
                setPadding(0, 16, 0, 8)
                paint.isFakeBoldText = true
            }
            addView(subtitle)

            errorUrlText = TextView(this@MainActivity).apply {
                text = "Attempting to reach:\n$currentUrl"
                textSize = 13f
                setTextColor(Color.parseColor("#64748B"))
                gravity = Gravity.CENTER
                setPadding(0, 0, 0, 24)
            }
            addView(errorUrlText)

            val buttonRow = LinearLayout(this@MainActivity).apply {
                orientation = LinearLayout.HORIZONTAL
                gravity = Gravity.CENTER
                layoutParams = LinearLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.WRAP_CONTENT
                )
            }

            val changeIpBtn = Button(this@MainActivity).apply {
                text = "⚙️ Change IP"
                setOnClickListener { showChangeIpDialog() }
            }
            buttonRow.addView(changeIpBtn)

            val retryBtn = Button(this@MainActivity).apply {
                text = "🔄 Retry"
                setBackgroundColor(Color.parseColor("#059669"))
                setTextColor(Color.WHITE)
                setOnClickListener {
                    errorLayout.visibility = View.GONE
                    webView.loadUrl(currentUrl)
                }
            }
            buttonRow.addView(retryBtn)

            addView(buttonRow)
        }
    }

    private fun showChangeIpDialog() {
        val input = EditText(this).apply {
            setText(currentUrl)
            setSelection(currentUrl.length)
        }

        AlertDialog.Builder(this)
            .setTitle("Server Address")
            .setMessage("Enter the computer IP or hosted URL:")
            .setView(input)
            .setPositiveButton("Connect") { _, _ ->
                var newUrl = input.text.toString().trim()
                if (!newUrl.startsWith("http://") && !newUrl.startsWith("https://")) {
                    newUrl = "http://$newUrl"
                }
                currentUrl = newUrl
                prefs.edit().putString("server_url", newUrl).apply()
                errorLayout.visibility = View.GONE
                webView.loadUrl(newUrl)
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        if (this::webView.isInitialized && webView.canGoBack()) {
            webView.goBack()
        } else {
            super.onBackPressed()
        }
    }
}
