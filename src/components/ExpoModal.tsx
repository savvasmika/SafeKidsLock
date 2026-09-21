import React, { useState } from 'react';
import {
  X,
  ExternalLink,
  Copy,
  Check,
  QrCode,
  Smartphone,
  Sparkles,
  Terminal,
  FileCode,
  Play,
} from 'lucide-react';
import { sound } from '../utils/audio';
import { generateExpoReactNativeApp, generateExpoSdk57Config } from '../utils/android15';

interface ExpoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExpoModal: React.FC<ExpoModalProps> = ({ isOpen, onClose }) => {
  const [copiedType, setCopiedType] = useState<string | null>(null);

  if (!isOpen) return null;

  const expoSnackUrl = 'https://snack.expo.dev';
  const sharedAppUrl = 'https://ais-pre-s6cka3266kafa2iuk5jdmn-605882183277.europe-west2.run.app';

  const handleCopy = (text: string, type: string) => {
    sound.playKeyClick();
    navigator.clipboard?.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 1800);
  };

  return (
    <div
      id="expo-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="expo-modal-card"
        className="w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-150 relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg text-white flex items-center gap-2">
                <span>Expo SDK 57 Links & Launch</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Android 15
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Run directly in Expo Go or Expo Snack on your tablet
              </p>
            </div>
          </div>
          <button
            id="close-expo-modal"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Primary Action Button: Direct Expo Snack */}
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
              You can also open this link in Google Chrome on your Android 15 tablet and tap <strong>"Add to Home screen"</strong> or <strong>"Install app"</strong> to run as a full-screen tablet kiosk!
            </p>
          </div>

          {/* Quick CLI snippet */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                <Terminal className="w-4 h-4 text-cyan-400" />
                <span>Create Local Expo SDK 57 Project:</span>
              </div>
              <button
                onClick={() =>
                  handleCopy('npx create-expo-app@latest kids-tablet-lock --template blank-typescript', 'cli')
                }
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
              >
                {copiedType === 'cli' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <code className="block p-2 rounded-lg bg-slate-900 text-xs text-slate-300 font-mono">
              npx create-expo-app@latest kids-tablet-lock --template blank-typescript
            </code>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-5 pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
