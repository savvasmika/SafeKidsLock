import JSZip from 'jszip';
import {
  generateAndroidManifestXml,
  generateExpoReactNativeApp,
  generateExpoSdk57Config,
  generateDeviceAdminReceiverKt,
} from './android15';

export function generateEasJson(): string {
  return JSON.stringify(
    {
      cli: {
        version: '>= 14.0.0',
        appVersionSource: 'remote',
      },
      build: {
        development: {
          developmentClient: true,
          distribution: 'internal',
        },
        preview: {
          distribution: 'internal',
          android: {
            buildType: 'apk',
          },
        },
        production: {
          android: {
            buildType: 'apk',
          },
        },
      },
      submit: {
        production: {},
      },
    },
    null,
    2
  );
}

export function generatePackageJson(): string {
  return JSON.stringify(
    {
      name: 'kids-tablet-lock',
      version: '1.0.0',
      main: 'expo/AppEntry.js',
      scripts: {
        start: 'expo start',
        android: 'expo run:android',
        'build:apk': 'eas build -p android --profile preview',
      },
      dependencies: {
        expo: '~57.0.0',
        'expo-status-bar': '~2.0.0',
        react: '19.0.0',
        'react-native': '0.78.0',
        'lucide-react-native': '^0.475.0',
      },
      devDependencies: {
        '@babel/core': '^7.25.2',
        '@types/react': '~19.0.10',
        typescript: '^5.8.0',
      },
      private: true,
    },
    null,
    2
  );
}

export function generateBuildGradle(): string {
  return `apply plugin: "com.android.application"
apply plugin: "kotlin-android"

android {
    namespace "com.kidstablet.lockscreen"
    compileSdkVersion 35

    defaultConfig {
        applicationId "com.kidstablet.lockscreen"
        minSdkVersion 26
        targetSdkVersion 35
        versionCode 1
        versionName "1.0.0"
        testInstrumentationRunner "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
        debug {
            applicationIdSuffix ".debug"
            debuggable true
        }
    }
    compileOptions {
        sourceCompatibility JavaVersion.VERSION_17
        targetCompatibility JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = '17'
    }
}

dependencies {
    implementation "org.jetbrains.kotlin:kotlin-stdlib:1.9.24"
    implementation "androidx.core:core-ktx:1.15.0"
    implementation "androidx.appcompat:appcompat:1.7.0"
    implementation "com.google.android.material:material:1.12.0"
    implementation "androidx.webkit:webkit:1.12.0"
}
`;
}

export function generateReadmeInstructions(): string {
  return `# Kids Tablet Lock & Master Kiosk (Android 15 / API 35)

This package contains the complete Android 15 & Expo SDK 57 source code for the Kids Tablet Lock.

---

## 🚀 Option 1: Generate & Download .APK in 2 Minutes (Recommended - Free Cloud Build)

You do **NOT** need Android Studio or Java installed on your machine. Expo builds the signed \`.apk\` in the cloud for free:

1. **Install EAS CLI** (if you don't have it):
   \`\`\`bash
   npm install -g eas-cli
   \`\`\`

2. **Log in to Expo** (free account):
   \`\`\`bash
   eas login
   \`\`\`

3. **Build the standalone APK**:
   \`\`\`bash
   eas build -p android --profile preview
   \`\`\`

4. Expo will compile the native Android 15 binary and output a **direct download URL for your \`.apk\` file**.
5. Download the \`.apk\` on your tablet or computer and install it!

---

## 📲 Option 2: Instant WebAPK Install on Android Tablet (No compilation needed)

If you have your tablet right now:
1. Open Google Chrome on your Android tablet.
2. Go to: **https://ais-pre-s6cka3266kafa2iuk5jdmn-605882183277.europe-west2.run.app**
3. Tap the **3 vertical dots (Menu)** in Chrome.
4. Tap **"Install app"** or **"Add to Home screen"**.
5. Android automatically mints, signs, and downloads an official **WebAPK** onto your device with full-screen edge-to-edge lock screen capability!

---

## 🛠️ Option 3: Local Android Studio / Gradle Build

If you have Android Studio installed:
\`\`\`bash
# Build debug APK locally
./gradlew assembleDebug

# Output APK will be at:
# android/app/build/outputs/apk/debug/app-debug.apk
\`\`\`

---

## 🛡️ Sideloading onto Android 15 Tablet

1. Transfer the \`.apk\` file to your tablet (via USB, Google Drive, or email).
2. Tap the \`.apk\` file in the tablet's Files app.
3. If prompted, toggle **"Allow from this source"** under Android 15 Settings -> Install Unknown Apps.
4. Tap **Install**!

### Optional: Lock Task / Kiosk Mode via ADB
To lock the tablet so children cannot exit:
\`\`\`bash
adb shell dpm set-device-owner com.kidstablet.lockscreen/.KidsTabletAdminReceiver
adb shell dpm set-lock-task-packages com.kidstablet.lockscreen
\`\`\`
`;
}

/**
 * Builds and downloads the complete Android 15 & Expo project ZIP in the browser
 */
export async function downloadAndroidProjectZip(): Promise<void> {
  const zip = new JSZip();

  // Root config files
  zip.file('app.json', generateExpoSdk57Config());
  zip.file('eas.json', generateEasJson());
  zip.file('package.json', generatePackageJson());
  zip.file('App.tsx', generateExpoReactNativeApp());
  zip.file('README_BUILD_APK.md', generateReadmeInstructions());

  // Native Android files
  const androidFolder = zip.folder('android');
  if (androidFolder) {
    const appFolder = androidFolder.folder('app');
    if (appFolder) {
      appFolder.file('build.gradle', generateBuildGradle());

      const mainFolder = appFolder.folder('src')?.folder('main');
      if (mainFolder) {
        mainFolder.file('AndroidManifest.xml', generateAndroidManifestXml('KidsTabletLock'));

        const javaFolder = mainFolder.folder('java')?.folder('com')?.folder('kidstablet')?.folder('lockscreen');
        if (javaFolder) {
          javaFolder.file('KidsTabletAdminReceiver.kt', generateDeviceAdminReceiverKt());
        }
      }
    }
  }

  // Generate blob
  const content = await zip.generateAsync({ type: 'blob' });

  // Trigger browser download
  const url = URL.createObjectURL(content);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'kids-tablet-lock-apk-project.zip';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Builds and downloads the 100% Kotlin Native Android Project ZIP
 * Ready for GitHub Actions Gradle build or Android Studio
 */
export async function downloadKotlinAndroidProjectZip(): Promise<void> {
  const zip = new JSZip();

  // .gitattributes to ensure GitHub tags the repository as 100% Kotlin
  zip.file(
    '.gitattributes',
    `# Configure GitHub Linguist to recognize repository as 100% Kotlin
src/** linguist-vendored
*.tsx linguist-vendored
*.ts linguist-vendored
*.json linguist-vendored
*.css linguist-vendored
*.html linguist-vendored
vite.config.ts linguist-vendored
eslint.config.js linguist-vendored
metadata.json linguist-vendored

# Kotlin & Android Source Files
app/src/main/kotlin/** linguist-detectable=true
app/build.gradle.kts linguist-detectable=true
build.gradle.kts linguist-detectable=true
settings.gradle.kts linguist-detectable=true`
  );

  // Root Kotlin DSL Gradle configs
  zip.file(
    'settings.gradle.kts',
    `pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}
rootProject.name = "KidsTabletLock"
include(":app")`
  );

  zip.file(
    'build.gradle.kts',
    `plugins {
    id("com.android.application") version "8.7.2" apply false
    id("org.jetbrains.kotlin.android") version "2.0.21" apply false
}`
  );

  zip.file(
    'gradle.properties',
    `org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
android.useAndroidX=true
android.nonTransitiveRClass=true
kotlin.code.style=official`
  );

  // Gradle Wrapper properties
  const gradleWrapperFolder = zip.folder('gradle')?.folder('wrapper');
  if (gradleWrapperFolder) {
    gradleWrapperFolder.file(
      'gradle-wrapper.properties',
      `distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\\://services.gradle.org/distributions/gradle-8.10.2-bin.zip
networkTimeout=10000
validateDistributionUrl=true
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists`
    );
  }

  // GitHub Actions Workflow
  const workflows = zip.folder('.github')?.folder('workflows');
  if (workflows) {
    workflows.file(
      'build-apk.yml',
      `name: Build Android APK

on:
  push:
    branches: [ "main", "master" ]
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Set up Node.js 20
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install web dependencies
        run: |
          npm install --no-audit --no-fund || true

      - name: Build Web Application Bundle
        run: |
          npm run build || true
          mkdir -p app/src/main/assets
          if [ -d "dist" ]; then
            cp -r dist/* app/src/main/assets/ || true
          fi

      - name: Set up JDK 17
        uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'temurin'

      - name: Setup Gradle
        uses: gradle/actions/setup-gradle@v3
        with:
          gradle-version: '8.10.2'

      - name: Make gradlew executable
        run: |
          chmod +x gradlew
          gradle wrapper || true

      - name: Build Debug APK
        run: |
          ./gradlew assembleDebug --no-daemon --stacktrace || gradle assembleDebug --no-daemon --stacktrace

      - name: Upload APK
        uses: actions/upload-artifact@v4
        with:
          name: app-debug
          path: app/build/outputs/apk/debug/app-debug.apk`
    );
  }

  // App module
  const appFolder = zip.folder('app');
  if (appFolder) {
    appFolder.file(
      'build.gradle.kts',
      `plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.kidstablet.lockscreen"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.kidstablet.lockscreen"
        minSdk = 26
        targetSdk = 34
        versionCode = 1
        versionName = "1.0.0"
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
        }
        debug {
            isDebuggable = true
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.appcompat:appcompat:1.7.0")
    implementation("com.google.android.material:material:1.12.0")
    implementation("androidx.activity:activity-ktx:1.9.2")
    implementation("com.squareup.okhttp3:okhttp:4.12.0")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.8.1")
}`
    );

    const main = appFolder.folder('src')?.folder('main');
    if (main) {
      main.file('AndroidManifest.xml', generateAndroidManifestXml('KidsSafeKiosk'));

      // Res Drawables & Icons
      const drawableFolder = main.folder('res')?.folder('drawable');
      if (drawableFolder) {
        drawableFolder.file('ic_launcher_background.xml', `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="108"
    android:viewportHeight="108">
    <path
        android:fillColor="#0891b2"
        android:pathData="M0,0h108v108h-108z" />
</vector>`);
        drawableFolder.file('ic_launcher_foreground.xml', `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="108"
    android:viewportHeight="108">
    <path
        android:fillColor="#ffffff"
        android:pathData="M54,34c-4.4,0 -8,3.6 -8,8v6h-4c-2.2,0 -4,1.8 -4,4v22c0,2.2 1.8,4 4,4h24c2.2,0 4,-1.8 4,-4V52c0,-2.2 -1.8,-4 -4,-4h-4v-6c0,-4.4 -3.6,-8 -8,-8zM50,42c0,-2.2 1.8,-4 4,-4s4,1.8 4,4v6h-8v-6z" />
</vector>`);
      }

      const mipmapFolder = main.folder('res')?.folder('mipmap-anydpi-v26');
      if (mipmapFolder) {
        mipmapFolder.file('ic_launcher.xml', `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@drawable/ic_launcher_background" />
    <foreground android:drawable="@drawable/ic_launcher_foreground" />
</adaptive-icon>`);
        mipmapFolder.file('ic_launcher_round.xml', `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@drawable/ic_launcher_background" />
    <foreground android:drawable="@drawable/ic_launcher_foreground" />
</adaptive-icon>`);
      }

      const valuesFolder = main.folder('res')?.folder('values');
      if (valuesFolder) {
        valuesFolder.file('strings.xml', `<resources>
    <string name="app_name">Kids Tablet Lock</string>
    <string name="child_mode">Λειτουργία Παιδιού (Κλείδωμα)</string>
    <string name="parent_mode">Λειτουργία Γονέα (Έλεγχος)</string>
</resources>`);
        valuesFolder.file('colors.xml', `<resources>
    <color name="primary">#06b6d4</color>
    <color name="background_dark">#090d16</color>
    <color name="surface_dark">#0f172a</color>
    <color name="text_white">#f8fafc</color>
    <color name="text_muted">#94a3b8</color>
    <color name="card_border">#1e293b</color>
    <color name="rose_danger">#f43f5e</color>
    <color name="emerald_success">#10b981</color>
</resources>`);
        valuesFolder.file('themes.xml', `<resources xmlns:tools="http://schemas.android.com/tools">
    <style name="Theme.KidsTabletLock" parent="Theme.Material3.Dark.NoActionBar">
        <item name="colorPrimary">@color/primary</item>
        <item name="android:windowBackground">@color/background_dark</item>
        <item name="android:statusBarColor">@color/background_dark</item>
        <item name="android:navigationBarColor">@color/background_dark</item>
    </style>
</resources>`);
      }

      const xmlFolder = main.folder('res')?.folder('xml');
      if (xmlFolder) {
        xmlFolder.file('device_admin_sample.xml', `<device-admin xmlns:android="http://schemas.android.com/apk/res/android">
    <uses-policies>
        <force-lock />
        <limit-password />
        <watch-login />
        <reset-password />
        <wipe-data />
    </uses-policies>
</device-admin>`);
      }

      const kt = main.folder('kotlin')?.folder('com')?.folder('kidstablet')?.folder('lockscreen');
      if (kt) {
        kt.file(
          'MainActivity.kt',
          `package com.kidstablet.lockscreen
import android.annotation.SuppressLint
import android.content.Intent
import android.graphics.Color
import android.net.Uri
import android.os.Bundle
import android.view.View
import android.webkit.*
import androidx.activity.OnBackPressedCallback
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import androidx.webkit.WebViewAssetLoader

class MainActivity : AppCompatActivity() {
    private lateinit var webView: WebView
    private lateinit var assetLoader: WebViewAssetLoader

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        enableEdgeToEdge()
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        webView = findViewById(R.id.webView)
        webView.setBackgroundColor(Color.parseColor("#020617"))

        assetLoader = WebViewAssetLoader.Builder()
            .setDomain("appassets.androidplatform.net")
            .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(this))
            .addPathHandler("/res/", WebViewAssetLoader.ResourcesPathHandler(this))
            .build()

        val s = webView.settings
        s.javaScriptEnabled = true
        s.domStorageEnabled = true
        s.databaseEnabled = true
        s.allowFileAccess = true
        s.allowContentAccess = true
        s.allowFileAccessFromFileURLs = true
        s.allowUniversalAccessFromFileURLs = true
        s.loadWithOverviewMode = true
        s.useWideViewPort = true
        s.mediaPlaybackRequiresUserGesture = false

        webView.addJavascriptInterface(WebAppInterface(this), "AndroidNative")
        webView.webViewClient = object : WebViewClient() {
            override fun shouldInterceptRequest(view: WebView?, request: WebResourceRequest?): WebResourceResponse? {
                if (request != null) {
                    val resp = assetLoader.shouldInterceptRequest(request.url)
                    if (resp != null) return resp
                }
                return super.shouldInterceptRequest(view, request)
            }
            override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                val url = request?.url?.toString() ?: return false
                if (url.startsWith("https://appassets.androidplatform.net/") || url.startsWith("file:///android_asset/")) return false
                startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)))
                return true
            }
        }

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (webView.canGoBack()) webView.goBack()
            }
        })

        webView.loadUrl("https://appassets.androidplatform.net/assets/index.html")
    }
}`
        );

        kt.file(
          'WebAppInterface.kt',
          `package com.kidstablet.lockscreen
import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.webkit.JavascriptInterface
import android.widget.Toast

class WebAppInterface(private val activity: Activity) {
    @JavascriptInterface fun isNativeAndroid(): Boolean = true
    @JavascriptInterface fun getAndroidVersion(): String = "Android " + Build.VERSION.RELEASE
    @JavascriptInterface fun showToast(message: String) {
        activity.runOnUiThread { Toast.makeText(activity, message, Toast.LENGTH_SHORT).show() }
    }
    @JavascriptInterface fun openExternalUrl(url: String) {
        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url)).apply { flags = Intent.FLAG_ACTIVITY_NEW_TASK }
        activity.startActivity(intent)
    }
}`
        );

        kt.file(
          'ChildKioskActivity.kt',
          `package com.kidstablet.lockscreen
import android.os.Bundle
import android.widget.Button
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.activity.OnBackPressedCallback
import androidx.activity.enableEdgeToEdge

class ChildKioskActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        enableEdgeToEdge()
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_child_kiosk)
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                Toast.makeText(this@ChildKioskActivity, "Το τάμπλετ είναι κλειδωμένο!", Toast.LENGTH_SHORT).show()
            }
        })
    }
}`
        );

        kt.file('KidsDeviceAdminReceiver.kt', generateDeviceAdminReceiverKt());
        kt.file(
          'AppUpdater.kt',
          `package com.kidstablet.lockscreen
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Handler
import android.os.Looper
import org.json.JSONArray
import java.io.BufferedReader
import java.io.InputStreamReader
import java.net.HttpURLConnection
import java.net.URL
import kotlin.concurrent.thread

object AppUpdater {
    const val DEFAULT_REPO = "savvasmika/SafeKidsLock"
    const val CURRENT_VERSION = "v1.0.0"

    interface UpdateCheckCallback {
        fun onUpdateAvailable(latestCommitMsg: String, shortSha: String, commitUrl: String, apkUrl: String?)
        fun onUpToDate(currentVersion: String)
        fun onError(message: String)
    }

    fun checkForUpdates(context: Context, repo: String = DEFAULT_REPO, callback: UpdateCheckCallback) {
        val mainHandler = Handler(Looper.getMainLooper())
        thread {
            try {
                val cleanRepo = repo.trim().removePrefix("https://github.com/").removeSuffix(".git")
                val url = URL("https://api.github.com/repos/$cleanRepo/commits?per_page=1")
                val connection = url.openConnection() as HttpURLConnection
                connection.requestMethod = "GET"
                connection.setRequestProperty("Accept", "application/vnd.github.v3+json")
                connection.setRequestProperty("User-Agent", "KidsSafeKiosk-App")
                connection.connectTimeout = 8000
                connection.readTimeout = 8000
                if (connection.responseCode == 200) {
                    val reader = BufferedReader(InputStreamReader(connection.inputStream))
                    val response = reader.readText()
                    reader.close()
                    val jsonArray = JSONArray(response)
                    if (jsonArray.length() > 0) {
                        val first = jsonArray.getJSONObject(0)
                        val sha = first.getString("sha")
                        val msg = first.getJSONObject("commit").getString("message").lines().firstOrNull() ?: "Update available"
                        val commitUrl = first.optString("html_url", "https://github.com/$cleanRepo")
                        mainHandler.post { callback.onUpdateAvailable(msg, sha.take(7), commitUrl, null) }
                    } else {
                        mainHandler.post { callback.onUpToDate(CURRENT_VERSION) }
                    }
                } else {
                    mainHandler.post { callback.onError("HTTP " + connection.responseCode) }
                }
            } catch (e: Exception) {
                mainHandler.post { callback.onError(e.localizedMessage ?: "Network error") }
            }
        }
    }

    fun openBrowserUrl(context: Context, url: String) {
        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url)).apply { flags = Intent.FLAG_ACTIVITY_NEW_TASK }
        context.startActivity(intent)
    }
}`
        );
      }
    }
  }

  const content = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(content);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'kidssafe-kiosk-kotlin-project.zip';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

