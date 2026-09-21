import React, { useState, useEffect } from 'react';
import {
  Wifi,
  Battery,
  Shield,
  RotateCcw,
  Maximize2,
  Minimize2,
  Mail,
  Sliders,
  Sparkles,
  Smartphone,
  Lock,
  AlertOctagon,
} from 'lucide-react';
import { ParentSettings, ParentEmailMessage } from '../types';
import { sound } from '../utils/audio';

interface TabletFrameProps {
  children: React.ReactNode;
  settings: ParentSettings;
  lockState?: 'locked' | 'unlocked';
  emails?: ParentEmailMessage[];
  onOpenMailbox?: () => void;
  onOpenSettings: () => void;
  onOpenExpoModal?: () => void;
  unreadEmailCount?: number;
}

export const TabletFrame: React.FC<TabletFrameProps> = ({
  children,
  settings,
  lockState = 'locked',
  onOpenSettings,
  onOpenExpoModal,
}) => {
  const [isLandscape, setIsLandscape] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<string>('09:41');
  const [tamperToast, setTamperToast] = useState<string | null>(null);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  const triggerTamperWarning = (actionName: string) => {
    sound.playErrorBuzz();
    if (lockState === 'locked') {
      setTamperToast(
        `Action Blocked (${actionName}): Tablet is locked in Android 15 Master Kiosk Mode. Task removal or app switching prohibited without parent 4-digit PIN.`
      );
    } else {
      setTamperToast(
        `System Alert (${actionName}): Lock Task Mode is active. Application cannot be swiped away from tasks while timer is running.`
      );
    }
    setTimeout(() => setTamperToast(null), 3500);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <div
      id="tablet-frame-wrapper"
      className="min-h-screen w-full bg-slate-950 flex flex-col items-center justify-center p-2 sm:p-4 md:p-6 select-none overflow-x-hidden"
    >
      {/* Top Device Control Strip */}
      <header className="w-full max-w-6xl mb-3 flex flex-wrap items-center justify-between gap-2 px-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
            <h1 className="font-display font-bold text-sm sm:text-base text-slate-100 flex items-center gap-2">
              <span>Android 15 Tablet Lock</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                SDK 57
              </span>
            </h1>
          </div>
          <span className="hidden sm:inline text-xs text-slate-400">
            • Child-Safe OTP Lock Screen
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {/* Expo Link Trigger button */}
          {onOpenExpoModal && (
            <button
              id="expo-link-top-btn"
              type="button"
              onClick={onOpenExpoModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/40 text-purple-300 text-xs font-semibold shadow-sm transition-all"
              title="Open Expo Snack & SDK 57 Links"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Expo Link</span>
            </button>
          )}

          {/* Orientation Switcher */}
          <button
            id="orientation-toggle-btn"
            type="button"
            onClick={() => setIsLandscape(!isLandscape)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-medium transition-all"
            title="Toggle Landscape / Portrait tablet view"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isLandscape ? 'Landscape' : 'Portrait'}</span>
          </button>

          {/* Settings button */}
          <button
            id="settings-top-btn"
            type="button"
            onClick={onOpenSettings}
            className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-all"
            title="Parental Lock Settings"
          >
            <Sliders className="w-4 h-4" />
          </button>

          {/* Fullscreen button */}
          <button
            id="fullscreen-toggle-btn"
            type="button"
            onClick={toggleFullscreen}
            className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-all"
            title="Toggle Fullscreen Mode"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* The Android 15 Tablet Chassis */}
      <div
        id="tablet-hardware-bezel"
        className={`relative transition-all duration-300 rounded-[2.5rem] p-3 sm:p-4 bg-slate-900/95 border-[8px] sm:border-[10px] border-slate-800 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] flex flex-col justify-between ${
          isLandscape
            ? 'w-full max-w-5xl aspect-[16/10] min-h-[580px]'
            : 'w-full max-w-lg aspect-[10/16] min-h-[640px]'
        }`}
      >
        {/* Hardware Front Camera Lens */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center z-40">
          <div className="w-1.5 h-1.5 rounded-full bg-slate-900" />
        </div>

        {/* Tablet Glass Screen Display */}
        <div
          id="tablet-screen-display"
          className="relative w-full h-full rounded-[1.8rem] overflow-hidden bg-slate-950 flex flex-col shadow-inner"
        >
          {/* Android 15 Transparent Edge-to-Edge System Status Bar */}
          <div
            id="android15-status-bar"
            className="h-7 px-5 flex items-center justify-between text-xs text-slate-300 z-30 bg-transparent shrink-0"
          >
            <div className="flex items-center gap-2">
              <span className="font-sans font-bold text-xs tracking-tight text-white">
                {currentTime}
              </span>
              <span className="flex items-center gap-1 text-[10px] text-cyan-400 bg-cyan-950/40 px-1.5 py-0.5 rounded-md border border-cyan-500/20">
                <Shield className="w-2.5 h-2.5" />
                <span className="hidden sm:inline">Kids Mode</span>
              </span>
            </div>

            <div className="flex items-center gap-2 text-slate-300">
              <Wifi className="w-3.5 h-3.5" />
              <div className="flex items-center gap-1 text-[11px] font-medium">
                <span>96%</span>
                <Battery className="w-4 h-4 text-emerald-400" />
              </div>
            </div>
          </div>

          {/* Active Screen View (Lock Screen or Unlocked Tablet Home) */}
          <main className="flex-1 w-full h-full relative overflow-hidden flex flex-col">
            {children}
          </main>

          {/* Android 15 Edge-to-Edge Bottom Navigation Bar (Back, Home, Recents) */}
          <div
            id="android15-navigation-bar"
            className="h-7 w-full flex items-center justify-between px-10 z-30 bg-black/40 backdrop-blur-sm shrink-0 border-t border-white/5"
          >
            {/* Back Button (◁) */}
            <button
              type="button"
              onClick={() => triggerTamperWarning('Back Button')}
              className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer group"
              title="Android Back"
            >
              <span className="text-sm font-black group-hover:scale-125 transition-transform inline-block">
                ◁
              </span>
            </button>

            {/* Home Button (○) */}
            <button
              type="button"
              onClick={() => triggerTamperWarning('Home Button')}
              className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer group"
              title="Android Home"
            >
              <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-400 group-hover:border-white transition-colors" />
            </button>

            {/* Recents / Task Switcher Button (□) */}
            <button
              type="button"
              onClick={() => triggerTamperWarning('Recents / Task Switcher')}
              className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer group"
              title="Android Task Switcher (Blocked by Kiosk Mode)"
            >
              <div className="w-3.5 h-3.5 rounded-sm border-2 border-slate-400 group-hover:border-white transition-colors" />
            </button>
          </div>

          {/* Tamper Defense Toast */}
          {tamperToast && (
            <div
              id="tamper-defense-toast"
              className="absolute bottom-10 left-4 right-4 sm:left-12 sm:right-12 z-50 p-3.5 rounded-2xl bg-rose-950/95 border-2 border-rose-500 text-white shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-3 duration-200 flex items-center gap-3"
            >
              <div className="w-9 h-9 rounded-xl bg-rose-600 flex items-center justify-center shrink-0 shadow">
                <Lock className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-rose-200 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
                  <span>Master Lock Security Defense</span>
                </div>
                <div className="text-xs text-rose-100 font-medium leading-tight mt-0.5">
                  {tamperToast}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTamperToast(null)}
                className="text-xs text-rose-300 hover:text-white font-bold p-1"
              >
                ✕
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Subtle bottom spec label */}
      <footer className="mt-3 text-center text-[11px] text-slate-400">
        Simulating Android 15 (API 35) & Expo SDK 57 Tablet Kiosk Environment
      </footer>
    </div>
  );
};
