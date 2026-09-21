import React, { useState } from 'react';
import {
  X,
  ExternalLink,
  Copy,
  Check,
  Smartphone,
  Terminal,
  FileCode,
  Play,
  Download,
  Github,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { sound } from '../utils/audio';
import { generateExpoReactNativeApp, generateExpoSdk57Config } from '../utils/android15';
import { downloadKotlinAndroidProjectZip } from '../utils/apkPackageGenerator';

interface ExpoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExpoModal: React.FC<ExpoModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'kotlin' | 'expo'>('kotlin');
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [isZipping, setIsZipping] = useState<boolean>(false);

  if (!isOpen) return null;

  const expoSnackUrl = 'https://snack.expo.dev';
  const sharedAppUrl = 'https://ais-pre-s6cka3266kafa2iuk5jdmn-605882183277.europe-west2.run.app';

  const handleCopy = (text: string, type: string) => {
    sound.playKeyClick();
    navigator.clipboard?.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 1800);
  };

  const handleDownloadKotlinZip = async () => {
    sound.playUnlockChime();
    setIsZipping(true);
    try {
      await downloadKotlinAndroidProjectZip();
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div
      id="expo-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="expo-modal-card"
        className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-150 relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-400 font-bold">
              {activeTab === 'kotlin' ? 'Kt' : '📱'}
            </div>
            <div>
              <h2 className="font-display font-bold text-lg text-white flex items-center gap-2">
                <span>Android APK & Source Code</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  100% Kotlin
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Native Android 15 (API 35) Gradle Project & APK Build
              </p>
            </div>
          </div>
          <button
            id="close-expo-modal"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-2 mb-5 p-1 bg-slate-950 rounded-2xl border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('kotlin')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'kotlin'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>1. Native Kotlin &amp; Gradle APK</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('expo')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'expo'
                ? 'bg-cyan-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>2. Expo SDK 57 / WebAPK</span>
          </button>
        </div>

        {activeTab === 'kotlin' ? (
          <div className="space-y-4">
            {/* Kotlin & GitHub Actions Banner */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950/80 via-slate-900 to-purple-950/80 border-2 border-indigo-500/50 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-indigo-300 font-bold text-sm">
                  <Github className="w-5 h-5 text-white" />
                  <span>GitHub Actions Gradle APK Workflow</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-900/60 text-indigo-200 border border-indigo-700/50">
                  build-apk.yml
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Το αποθετήριο περιλαμβάνει έτοιμο το πλήρες <strong>Native Android Project σε γλώσσα Kotlin</strong> με <strong>Gradle Kotlin DSL (`.gradle.kts`)</strong> και το GitHub Actions workflow (<code>/.github/workflows/build-apk.yml</code>).
              </p>

              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-xs font-mono text-slate-300 space-y-1">
                <div className="text-[11px] text-slate-400">Εντολή Build APK στο GitHub:</div>
                <div className="text-cyan-300 font-bold">gradle assembleDebug --stacktrace</div>
                <div className="text-[11px] text-slate-400 pt-1">Αποτέλεσμα:</div>
                <div className="text-emerald-400">app/build/outputs/apk/debug/app-debug.apk</div>
              </div>

              {/* Download Full Kotlin Project ZIP */}
              <button
                type="button"
                onClick={handleDownloadKotlinZip}
                disabled={isZipping}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-400 hover:to-pink-400 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 transition-all active:scale-98 cursor-pointer disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>{isZipping ? 'Δημιουργία ZIP...' : '📦 Λήψη Πλήρους Kotlin Project (.ZIP)'}</span>
              </button>
            </div>

            {/* Kotlin Code Highlights */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-purple-400" />
                  <span>Κύρια αρχεία Kotlin στο project:</span>
                </span>
                <span className="text-[10px] text-purple-400 font-semibold">Kotlin 2.0 • AGP 8.7.2</span>
              </div>
              <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside">
                <li><strong className="text-slate-200">MainActivity.kt</strong>: Επιλογή ρόλου (Parent Mode / Child Mode)</li>
                <li><strong className="text-slate-200">ChildKioskActivity.kt</strong>: Kiosk Lock Screen, PIN keypad, Back-gesture blocking</li>
                <li><strong className="text-slate-200">ParentDashboardActivity.kt</strong>: Έγκριση αιτημάτων, εμφάνιση PIN, τηλεχειρισμός</li>
                <li><strong className="text-slate-200">KidsDeviceAdminReceiver.kt</strong>: Android 15 Device Admin Kiosk</li>
                <li><strong className="text-slate-200">NetworkPairingManager.kt</strong>: Αυτόματη σύνδεση τοπικού δικτύου</li>
              </ul>
            </div>
          </div>
        ) : (
          /* Expo SDK 57 Tab */
          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-gradient-to-r from-cyan-950/70 to-blue-950/70 border border-cyan-500/40 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/30 text-cyan-300 flex items-center justify-center shrink-0">
                  <Play className="w-6 h-6 fill-cyan-400 text-cyan-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Launch on Expo Snack</h3>
                  <p className="text-xs text-slate-300">
                    Run directly in browser or scan with Expo Go on Android 15
                  </p>
                </div>
              </div>

              <a
                id="open-expo-snack-link"
                href={expoSnackUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => sound.playUnlockChime()}
                className="px-5 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg transition-all active:scale-95 shrink-0"
              >
                <span>Open Snack</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            {/* Quick Copy Expo Code */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                id="copy-expo-app-btn"
                onClick={() => handleCopy(generateExpoReactNativeApp(), 'app')}
                className="p-4 rounded-2xl bg-slate-800/80 hover:bg-slate-750 border border-slate-700 text-left flex items-center justify-between group transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <FileCode className="w-5 h-5 text-cyan-400" />
                  <div>
                    <div className="text-xs font-bold text-white">Copy App.tsx (Expo)</div>
                    <div className="text-[11px] text-slate-400">Ready for SDK 57 Snack</div>
                  </div>
                </div>
                {copiedType === 'app' ? (
                  <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                    <Check className="w-4 h-4" />
                    <span>Copied!</span>
                  </span>
                ) : (
                  <Copy className="w-4 h-4 text-slate-400 group-hover:text-white" />
                )}
              </button>

              <button
                id="copy-expo-config-btn"
                onClick={() => handleCopy(generateExpoSdk57Config(), 'config')}
                className="p-4 rounded-2xl bg-slate-800/80 hover:bg-slate-750 border border-slate-700 text-left flex items-center justify-between group transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <FileCode className="w-5 h-5 text-purple-400" />
                  <div>
                    <div className="text-xs font-bold text-white">Copy app.json (Config)</div>
                    <div className="text-[11px] text-slate-400">API 35 & SDK 57 Target</div>
                  </div>
                </div>
                {copiedType === 'config' ? (
                  <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                    <Check className="w-4 h-4" />
                    <span>Copied!</span>
                  </span>
                ) : (
                  <Copy className="w-4 h-4 text-slate-400 group-hover:text-white" />
                )}
              </button>
            </div>

            {/* Direct Tablet Web Preview Link */}
            <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs uppercase font-bold tracking-wider text-slate-400">
                  Direct Web App Tablet Link:
                </span>
                <button
                  onClick={() => handleCopy(sharedAppUrl, 'link')}
                  className="text-xs text-cyan-400 hover:underline flex items-center gap-1"
                >
                  {copiedType === 'link' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedType === 'link' ? 'Copied' : 'Copy URL'}</span>
                </button>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-cyan-300 truncate select-all">
                {sharedAppUrl}
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                Open in Chrome on your Android 15 tablet and tap <strong>"Install app"</strong> to run as a full-screen tablet kiosk!
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-5 pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

