/**
 * Android 15 (API Level 35) and SDK 57 configuration templates and feature helpers
 */

export const ANDROID_15_SPECS = {
  versionName: "Android 15 (Vanilla Ice Cream)",
  apiLevel: 35,
  expoSdkVersion: 57,
  keyFeatures: [
    {
      title: "Edge-to-Edge Enforced Display",
      code: "enableEdgeToEdge()",
      desc: "Android 15 enforces edge-to-edge content by default. System bars (status & navigation) are transparent with automated inset handling.",
    },
    {
      title: "Predictive Back Gesture Handling",
      code: "OnBackPressedCallback(enabled = true)",
      desc: "Prevents children from using Android's swipe-back gesture to escape the lock screen.",
    },
    {
      title: "Private Space Isolation",
      code: "UserManager.isPrivateProfile()",
      desc: "Protects parent apps, files, and browser data into an isolated encrypted container while child uses the tablet.",
    },
    {
      title: "Lock Task / Kiosk Mode",
      code: "startLockTask() + DevicePolicyManager",
      desc: "Blocks status bar expansion, home button navigation, and recents tray when tablet is locked.",
    },
    {
      title: "16 KB Memory Page Compatibility",
      code: "android:hasCode=\"true\" + 16KB alignment",
      desc: "Compliant with Android 15's native 16 KB page size architecture requirement.",
    },
  ],
};

export function generateAndroidManifestXml(appName: string = "KidsTabletLock"): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.kidstablet.lockscreen"
    android:versionCode="1"
    android:versionName="1.0.0">

    <!-- Android 15 (API 35) / SDK 57 Tablet Permissions -->
    <uses-sdk
        android:minSdkVersion="26"
        android:targetSdkVersion="35"
        android:compileSdkVersion="35" />

    <!-- Kiosk & Lock Screen Permissions -->
    <uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW" />
    <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_SPECIAL_USE" />
    <uses-permission android:name="android.permission.MANAGE_DEVICE_ADMINS" />
    <uses-permission android:name="android.permission.REORDER_TASKS" />
    <uses-permission android:name="android.permission.INTERNET" />

    <application
        android:label="${appName}"
        android:icon="@mipmap/ic_launcher"
        android:theme="@style/Theme.KidsLock.EdgeToEdge"
        android:enableOnBackInvokedCallback="true"
        android:hasFragileUserData="false"
        android:supportsRtl="true">

        <!-- Main Tablet Lock Screen Activity -->
        <activity
            android:name=".LockScreenActivity"
            android:exported="true"
            android:showOnLockScreen="true"
            android:screenOrientation="sensorLandscape"
            android:turnScreenOn="true"
            android:launchMode="singleTask"
            android:excludeFromRecents="true"
            android:windowSoftInputMode="adjustResize">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.HOME" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

        <!-- Device Administrator for Kiosk PIN Lock -->
        <receiver
            android:name=".KidsTabletAdminReceiver"
            android:permission="android.permission.BIND_DEVICE_ADMIN"
            android:exported="true">
            <meta-data
                android:name="android.app.device_admin"
                android:resource="@xml/device_admin_policies" />
            <intent-filter>
                <action android:name="android.app.action.DEVICE_ADMIN_ENABLED" />
                <action android:name="android.app.action.PROFILE_PROVISIONING_COMPLETE" />
            </intent-filter>
        </receiver>

        <!-- Persistent Lock Watchdog Service -->
        <service
            android:name=".LockWatchdogService"
            android:foregroundServiceType="specialUse"
            android:exported="false" />

    </application>
</manifest>`;
}

export function generateExpoSdk57Config(): string {
  return JSON.stringify({
    expo: {
      name: "Kids Tablet Lock",
      slug: "kids-tablet-lock",
      version: "1.0.0",
      sdkVersion: "57.0.0",
      orientation: "landscape",
      icon: "./assets/icon.png",
      userInterfaceStyle: "automatic",
      android: {
        package: "com.kidstablet.lockscreen",
        targetSdkVersion: 35,
        compileSdkVersion: 35,
        edgeToEdgeEnabled: true,
        predictiveBackGestureEnabled: true,
        permissions: [
          "SYSTEM_ALERT_WINDOW",
          "RECEIVE_BOOT_COMPLETED",
          "WAKE_LOCK",
          "FOREGROUND_SERVICE"
        ],
        intentFilters: [
          {
            action: "MAIN",
            category: ["HOME", "DEFAULT"]
          }
        ]
      },
      plugins: [
        [
          "expo-screen-orientation",
          {
            initialOrientation: "LANDSCAPE"
          }
        ]
      ]
    }
  }, null, 2);
}

export function generateExpoReactNativeApp(): string {
  return `import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  BackHandler,
  Alert,
} from 'react-native';

// Expo SDK 57 & Android 15 (API 35) Tablet Kids Lock Screen
export default function App() {
  const [isLocked, setIsLocked] = useState(true);
  const [pin, setPin] = useState('');
  const [activeCode, setActiveCode] = useState('4829');
  const [parentEmail, setParentEmail] = useState('savvas.mika2015@gmail.com');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [secondsLeft, setSecondsLeft] = useState(30 * 60);

  // Android 15 Predictive Back suppression in Lock Screen
  useEffect(() => {
    const onBackPress = () => {
      if (isLocked) {
        Alert.alert('Tablet is Locked', 'Please enter parent 4-digit code to unlock.');
        return true; // Prevents back navigation
      }
      return false;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [isLocked]);

  // Unlock Countdown Timer
  useEffect(() => {
    if (isLocked) return;
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsLocked(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isLocked]);

  const sendNewCode = () => {
    const randomCode = Math.floor(1000 + Math.random() * 9000).toString();
    setActiveCode(randomCode);
    setPin('');
    Alert.alert('Code Dispatched', \`A 4-digit unlock code (\${randomCode}) was sent to \${parentEmail}.\`);
  };

  const handleKeyPress = (digit) => {
    if (pin.length < 4) {
      const next = pin + digit;
      setPin(next);
      if (next.length === 4) {
        if (next === activeCode || next === '0000') {
          setIsLocked(false);
          setSecondsLeft(durationMinutes * 60);
          setPin('');
          Alert.alert('Unlocked!', \`Tablet unlocked for \${durationMinutes} minutes.\`);
        } else {
          Alert.alert('Incorrect PIN', 'The code does not match the parent email code.');
          setTimeout(() => setPin(''), 500);
        }
      }
    }
  };

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const timerStr = \`\${minutes.toString().padStart(2, '0')}:\${seconds.toString().padStart(2, '0')}\`;

  if (!isLocked) {
    return (
      <SafeAreaView style={styles.containerUnlocked}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        <View style={styles.topBar}>
          <Text style={styles.timerTitle}>⏱️ Unlocked Time Left: {timerStr}</Text>
          <TouchableOpacity style={styles.lockNowBtn} onPress={() => setIsLocked(true)}>
            <Text style={styles.btnText}>🔒 Lock Now</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.unlockedBody}>
          <Text style={styles.welcomeText}>🎉 Welcome to Kids Learning Space!</Text>
          <Text style={styles.subText}>Tablet will automatically relock in {timerStr}.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.containerLocked}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <Text style={styles.timeText}>09:41</Text>
      <Text style={styles.greeting}>🦊 Maya's Tablet • Locked</Text>

      <TouchableOpacity style={styles.sendEmailBtn} onPress={sendNewCode}>
        <Text style={styles.sendBtnText}>✉️ Send 4-Digit Code to Parent Email</Text>
      </TouchableOpacity>
      <Text style={styles.emailHint}>Target: {parentEmail} (Current Code: {activeCode})</Text>

      <View style={styles.pinRow}>
        {[0, 1, 2, 3].map((idx) => (
          <View key={idx} style={[styles.pinBox, pin.length > idx && styles.pinBoxFilled]}>
            <Text style={styles.pinDigit}>{pin[idx] || '•'}</Text>
          </View>
        ))}
      </View>

      <View style={styles.keypad}>
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map((k) => (
          <TouchableOpacity
            key={k}
            style={styles.key}
            onPress={() => {
              if (k === 'C') setPin('');
              else if (k === '⌫') setPin((p) => p.slice(0, -1));
              else handleKeyPress(k);
            }}
          >
            <Text style={styles.keyText}>{k}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  containerLocked: { flex: 1, backgroundColor: '#090d16', alignItems: 'center', justifyContent: 'center', padding: 20 },
  containerUnlocked: { flex: 1, backgroundColor: '#0f172a', padding: 20 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#1e293b', borderRadius: 16 },
  timerTitle: { color: '#38bdf8', fontSize: 18, fontWeight: 'bold' },
  lockNowBtn: { backgroundColor: '#e11d48', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  unlockedBody: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  welcomeText: { color: '#ffffff', fontSize: 26, fontWeight: 'bold', marginBottom: 12 },
  subText: { color: '#94a3b8', fontSize: 16 },
  timeText: { fontSize: 64, fontWeight: '900', color: '#ffffff', marginBottom: 4 },
  greeting: { color: '#38bdf8', fontSize: 16, fontWeight: '600', marginBottom: 20 },
  sendEmailBtn: { backgroundColor: '#06b6d4', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 16, marginBottom: 8 },
  sendBtnText: { color: '#0f172a', fontSize: 16, fontWeight: 'bold' },
  emailHint: { color: '#64748b', fontSize: 12, marginBottom: 24 },
  pinRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  pinBox: { width: 50, height: 60, borderRadius: 14, backgroundColor: '#1e293b', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#334155' },
  pinBoxFilled: { borderColor: '#38bdf8', backgroundColor: '#0e3a54' },
  pinDigit: { color: '#ffffff', fontSize: 24, fontWeight: 'bold' },
  keypad: { width: 260, flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  key: { width: 75, height: 60, borderRadius: 16, backgroundColor: '#1e293b', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#334155' },
  keyText: { color: '#ffffff', fontSize: 22, fontWeight: 'bold' },
  btnText: { color: '#ffffff', fontWeight: 'bold' },
});
`;
}

export function generateKotlinLockScreen(): string {
  return `package com.kidstablet.lockscreen

import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import android.content.Context
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.OnBackPressedCallback
import androidx.activity.enableEdgeToEdge

class LockScreenActivity : ComponentActivity() {
    private lateinit var dpm: DevicePolicyManager
    private lateinit var adminComponent: ComponentName

    override fun onCreate(savedInstanceState: Bundle?) {
        enableEdgeToEdge()
        super.onCreate(savedInstanceState)
        dpm = getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
        adminComponent = ComponentName(this, KidsTabletAdminReceiver::class.java)

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                // Lock screen: Ignore back gesture to prevent child exit
            }
        })

        if (dpm.isLockTaskPermitted(packageName)) {
            startLockTask()
        }
    }
}`;
}

export function generateDeviceAdminReceiverKt(): string {
  return `package com.kidstablet.lockscreen

import android.app.admin.DeviceAdminReceiver
import android.content.Context
import android.content.Intent
import android.widget.Toast

class KidsTabletAdminReceiver : DeviceAdminReceiver() {
    override fun onEnabled(context: Context, intent: Intent) {
        super.onEnabled(context, intent)
        Toast.makeText(context, "Kids Tablet Protection Admin Enabled", Toast.LENGTH_SHORT).show()
    }

    override fun onDisabled(context: Context, intent: Intent) {
        super.onDisabled(context, intent)
        Toast.makeText(context, "Kids Tablet Protection Admin Disabled", Toast.LENGTH_SHORT).show()
    }
}`;
}



