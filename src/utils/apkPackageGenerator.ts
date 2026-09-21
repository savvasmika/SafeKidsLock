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
