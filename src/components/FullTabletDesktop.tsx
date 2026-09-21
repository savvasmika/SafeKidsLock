import React, { useState, useEffect } from 'react';
import {
  Search,
  Lock,
  Clock,
  Wifi,
  Battery,
  Sliders,
  Sparkles,
  Maximize2,
  ChevronDown,
  Volume2,
  Sun,
  Shield,
  Gamepad2,
  Plus,
  Compass,
  Layers,
  CheckCircle,
} from 'lucide-react';
import { ParentSettings, UnlockSession, InstalledApp } from '../types';
import { WebBrowserApp } from './apps/WebBrowserApp';
import { YouTubeApp } from './apps/YouTubeApp';
import { CameraApp } from './apps/CameraApp';
import { CalculatorApp } from './apps/CalculatorApp';
import { NotesApp } from './apps/NotesApp';
import { SettingsApp } from './apps/SettingsApp';
import { DrawingApp } from './apps/DrawingApp';
import { MathQuestApp } from './apps/MathQuestApp';
import { StorybookApp } from './apps/StorybookApp';
import { KidTunesApp } from './apps/KidTunesApp';
import { DeviceAppRunner } from './apps/DeviceAppRunner';
import { sound } from '../utils/audio';
import { TabType } from './ParentSettingsModal';

interface FullTabletDesktopProps {
  settings: ParentSettings;
  session: UnlockSession;
  secondsRemaining: number;
  timeFormatted: string;
  isLowTime: boolean;
  onLockNow: () => void;
  onOpenSettings: (tab?: TabType) => void;
  onExtendSession: (mins: number) => void;
  onOpenAddApps: () => void;
}

type OpenAppType =
  | 'none'
  | 'browser'
  | 'youtube'
  | 'camera'
  | 'calculator'
  | 'notes'
  | 'settings'
  | 'drawing'
  | 'math'
  | 'storybook'
  | 'tunes'
  | 'custom_app';

export const FullTabletDesktop: React.FC<FullTabletDesktopProps> = ({
  settings,
  session,
  secondsRemaining,
  timeFormatted,
  isLowTime,
  onLockNow,
  onOpenSettings,
  onExtendSession,
  onOpenAddApps,
}) => {
  const [openApp, setOpenApp] = useState<OpenAppType>('none');
  const [selectedCustomApp, setSelectedCustomApp] = useState<InstalledApp | null>(null);
  const [quickSettingsOpen, setQuickSettingsOpen] = useState<boolean>(false);
  const [currentTimeStr, setCurrentTimeStr] = useState<string>('09:41');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTimeStr(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      );
    };
    updateTime();
    const int = setInterval(updateTime, 10000);
    return () => clearInterval(int);
  }, []);

  const handleLaunchApp = (appType: OpenAppType, customApp?: InstalledApp) => {
    sound.playUnlockChime();
    setOpenApp(appType);
    if (customApp) {
      setSelectedCustomApp(customApp);
    } else {
      setSelectedCustomApp(null);
    }
  };

  const handleCloseApp = () => {
    sound.playKeyClick();
    setOpenApp('none');
    setSelectedCustomApp(null);
  };

  // Render open app if active
  if (openApp !== 'none') {
    return (
      <div className="w-full h-full relative flex flex-col bg-slate-950 overflow-hidden select-none">
        {/* Persistent Floating Master Timer Bar (Visible across all apps) */}
        <div
          id="persistent-master-timer-bar"
          className="bg-slate-900/95 border-b border-slate-800 px-4 py-2 flex items-center justify-between gap-3 z-40 backdrop-blur-md shrink-0 shadow-lg"
        >
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold text-slate-200">
              {settings.childName}'s Tablet • Full Access Mode
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Live Countdown badge */}
            <div
              className={`px-3 py-1 rounded-full text-xs font-mono font-bold flex items-center gap-1.5 transition-colors shadow-sm ${
                isLowTime
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                  : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{timeFormatted} Left</span>
            </div>

            {/* Quick Home button */}
            <button
              type="button"
              onClick={handleCloseApp}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              Tablet Home
            </button>

            {/* Master Lock Now button */}
            <button
              type="button"
              onClick={onLockNow}
              className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 active:scale-95 text-xs font-bold text-white transition-all flex items-center gap-1.5 cursor-pointer shadow-sm shadow-rose-900/50"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Lock Now</span>
            </button>
          </div>
        </div>

        {/* App Content Container */}
        <div className="flex-1 w-full h-full relative overflow-hidden">
          {openApp === 'browser' && <WebBrowserApp onClose={handleCloseApp} />}
          {openApp === 'youtube' && <YouTubeApp onClose={handleCloseApp} />}
          {openApp === 'camera' && <CameraApp onClose={handleCloseApp} />}
          {openApp === 'calculator' && <CalculatorApp onClose={handleCloseApp} />}
          {openApp === 'notes' && <NotesApp onClose={handleCloseApp} />}
          {openApp === 'settings' && (
            <SettingsApp
              onClose={handleCloseApp}
              onOpenParentSettings={() => onOpenSettings('duration')}
            />
          )}
          {openApp === 'drawing' && <DrawingApp onBack={handleCloseApp} />}
          {openApp === 'math' && <MathQuestApp onBack={handleCloseApp} />}
          {openApp === 'storybook' && <StorybookApp onBack={handleCloseApp} />}
          {openApp === 'tunes' && <KidTunesApp onBack={handleCloseApp} />}
          {openApp === 'custom_app' && selectedCustomApp && (
            <DeviceAppRunner
              app={selectedCustomApp}
              secondsRemaining={secondsRemaining}
              timeFormatted={timeFormatted}
              isLowTime={isLowTime}
              onBackToHome={handleCloseApp}
              onLockNow={onLockNow}
            />
          )}
        </div>
      </div>
    );
  }

  // Otherwise, render the Full Android 15 Tablet Home Screen / Desktop
  return (
    <div
      id="full-tablet-desktop-screen"
      className="w-full h-full relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white flex flex-col justify-between p-4 sm:p-6 select-none"
    >
      {/* Dynamic Cosmic Wallpaper Glow */}
      <div className="absolute top-10 left-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Persistent Floating System Bar */}
      <div className="relative z-20 flex items-center justify-between gap-2">
        {/* Child Profile & Full Access status */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-xl shadow-inner">
            {settings.childAvatar}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-sm text-white">
                {settings.childName}'s Tablet
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Full Access
              </span>
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-1">
              <span>All apps & tools unlocked for this session</span>
            </div>
          </div>
        </div>

        {/* Live Timer Countdown & Master Lock Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Remaining countdown pill */}
          <div
            className={`px-3 py-1.5 rounded-2xl text-xs font-mono font-bold flex items-center gap-2 shadow-md transition-all ${
              isLowTime
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                : 'bg-slate-900/90 text-cyan-300 border border-cyan-500/40'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>{timeFormatted} Remaining</span>
          </div>

          {/* Quick Settings dropdown toggle */}
          <button
            type="button"
            onClick={() => setQuickSettingsOpen(!quickSettingsOpen)}
            className="p-2 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
            title="Quick Settings Shade"
          >
            <Sliders className="w-4 h-4" />
          </button>

          {/* Master Lock Now button */}
          <button
            id="desktop-lock-tablet-btn"
            type="button"
            onClick={onLockNow}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 text-white text-xs font-display font-bold shadow-lg shadow-rose-950/50 transition-all active:scale-95 cursor-pointer border border-rose-400/30"
            title="Relock the tablet immediately"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Lock Tablet</span>
          </button>
        </div>
      </div>

      {/* Quick Settings Dropdown Overlay */}
      {quickSettingsOpen && (
        <div className="absolute top-16 right-4 sm:right-6 z-50 w-80 p-4 rounded-3xl bg-slate-900/95 border border-slate-700 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-2 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Android 15 Quick Settings
            </span>
            <button
              type="button"
              onClick={() => setQuickSettingsOpen(false)}
              className="text-xs text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 flex items-center gap-2">
              <Wifi className="w-4 h-4" />
              <span className="font-semibold">Wi-Fi Connected</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 flex items-center gap-2">
              <Sun className="w-4 h-4 text-amber-400" />
              <span>Auto Brightness</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-cyan-400" />
              <span>Sound On</span>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span className="font-semibold">Task Pinning Active</span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                setQuickSettingsOpen(false);
                handleLaunchApp('settings');
              }}
              className="text-xs text-cyan-400 hover:underline font-semibold"
            >
              Open Tablet Settings →
            </button>
            <button
              type="button"
              onClick={() => {
                setQuickSettingsOpen(false);
                onOpenSettings('duration');
              }}
              className="text-xs text-slate-400 hover:text-white"
            >
              Parent Controls
            </button>
          </div>
        </div>
      )}

      {/* Main Desktop Space */}
      <div className="relative z-10 flex-1 flex flex-col justify-center my-3 max-w-5xl mx-auto w-full space-y-4">
        {/* Big Clock & Google Search Bar Widget */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/60 p-4 sm:p-5 rounded-3xl border border-slate-800/80 backdrop-blur-md">
          {/* Clock Widget */}
          <div className="flex items-center gap-3">
            <div className="font-display font-extrabold text-3xl sm:text-4xl text-white tracking-tight">
              {currentTimeStr}
            </div>
            <div className="border-l border-slate-700 pl-3">
              <div className="text-xs font-semibold text-cyan-300">
                {new Date().toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
              </div>
              <div className="text-[11px] text-slate-400">☀️ 24°C Sunny • Family Tablet</div>
            </div>
          </div>

          {/* Google Search Bar */}
          <div
            onClick={() => handleLaunchApp('browser')}
            className="w-full sm:w-80 px-4 py-2.5 rounded-full bg-slate-950 border border-slate-700 hover:border-cyan-400 transition-all flex items-center justify-between cursor-pointer shadow-inner group"
          >
            <div className="flex items-center gap-2 text-xs text-slate-400 group-hover:text-slate-200">
              <Search className="w-4 h-4 text-cyan-400" />
              <span>Search Google or web...</span>
            </div>
            <span className="text-xs">🌐</span>
          </div>
        </div>

        {/* All Tablet Apps Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 sm:gap-4 overflow-y-auto max-h-[380px] p-1">
          {/* Core Tablet System Apps */}
          <button
            type="button"
            onClick={() => handleLaunchApp('browser')}
            className="group p-3 rounded-2xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-cyan-500/50 flex flex-col items-center justify-center text-center transition-all hover:scale-105 active:scale-95 cursor-pointer h-28"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform">
              🌐
            </div>
            <span className="text-xs font-bold text-white group-hover:text-cyan-300 mt-2 truncate w-full">
              Chrome
            </span>
            <span className="text-[10px] text-slate-400">Web Browser</span>
          </button>

          <button
            type="button"
            onClick={() => handleLaunchApp('youtube')}
            className="group p-3 rounded-2xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-rose-500/50 flex flex-col items-center justify-center text-center transition-all hover:scale-105 active:scale-95 cursor-pointer h-28"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-600 to-red-700 flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform">
              📺
            </div>
            <span className="text-xs font-bold text-white group-hover:text-rose-300 mt-2 truncate w-full">
              YouTube
            </span>
            <span className="text-[10px] text-slate-400">Videos & Kids</span>
          </button>

          <button
            type="button"
            onClick={() => handleLaunchApp('camera')}
            className="group p-3 rounded-2xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-purple-500/50 flex flex-col items-center justify-center text-center transition-all hover:scale-105 active:scale-95 cursor-pointer h-28"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform">
              📷
            </div>
            <span className="text-xs font-bold text-white group-hover:text-purple-300 mt-2 truncate w-full">
              Camera
            </span>
            <span className="text-[10px] text-slate-400">Photo & Video</span>
          </button>

          <button
            type="button"
            onClick={() => handleLaunchApp('calculator')}
            className="group p-3 rounded-2xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-cyan-500/50 flex flex-col items-center justify-center text-center transition-all hover:scale-105 active:scale-95 cursor-pointer h-28"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-600 to-blue-700 flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform">
              🧮
            </div>
            <span className="text-xs font-bold text-white group-hover:text-cyan-300 mt-2 truncate w-full">
              Calculator
            </span>
            <span className="text-[10px] text-slate-400">Math Tool</span>
          </button>

          <button
            type="button"
            onClick={() => handleLaunchApp('notes')}
            className="group p-3 rounded-2xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-amber-500/50 flex flex-col items-center justify-center text-center transition-all hover:scale-105 active:scale-95 cursor-pointer h-28"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform">
              📝
            </div>
            <span className="text-xs font-bold text-white group-hover:text-amber-300 mt-2 truncate w-full">
              Notes
            </span>
            <span className="text-[10px] text-slate-400">Memo Pad</span>
          </button>

          <button
            type="button"
            onClick={() => handleLaunchApp('settings')}
            className="group p-3 rounded-2xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-slate-500 flex flex-col items-center justify-center text-center transition-all hover:scale-105 active:scale-95 cursor-pointer h-28"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform">
              ⚙️
            </div>
            <span className="text-xs font-bold text-white group-hover:text-slate-200 mt-2 truncate w-full">
              Settings
            </span>
            <span className="text-[10px] text-slate-400">Android 15</span>
          </button>

          {/* Built-in Learning & Creative Apps */}
          <button
            type="button"
            onClick={() => handleLaunchApp('drawing')}
            className="group p-3 rounded-2xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-pink-500/50 flex flex-col items-center justify-center text-center transition-all hover:scale-105 active:scale-95 cursor-pointer h-28"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform">
              🎨
            </div>
            <span className="text-xs font-bold text-white group-hover:text-pink-300 mt-2 truncate w-full">
              Art Studio
            </span>
            <span className="text-[10px] text-slate-400">Drawing</span>
          </button>

          <button
            type="button"
            onClick={() => handleLaunchApp('math')}
            className="group p-3 rounded-2xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-blue-500/50 flex flex-col items-center justify-center text-center transition-all hover:scale-105 active:scale-95 cursor-pointer h-28"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform">
              🚀
            </div>
            <span className="text-xs font-bold text-white group-hover:text-blue-300 mt-2 truncate w-full">
              Math Galaxy
            </span>
            <span className="text-[10px] text-slate-400">Space Quest</span>
          </button>

          <button
            type="button"
            onClick={() => handleLaunchApp('storybook')}
            className="group p-3 rounded-2xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-amber-500/50 flex flex-col items-center justify-center text-center transition-all hover:scale-105 active:scale-95 cursor-pointer h-28"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-600 to-yellow-600 flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform">
              📖
            </div>
            <span className="text-xs font-bold text-white group-hover:text-amber-300 mt-2 truncate w-full">
              Storybook
            </span>
            <span className="text-[10px] text-slate-400">Read Aloud</span>
          </button>

          <button
            type="button"
            onClick={() => handleLaunchApp('tunes')}
            className="group p-3 rounded-2xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-purple-500/50 flex flex-col items-center justify-center text-center transition-all hover:scale-105 active:scale-95 cursor-pointer h-28"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform">
              🎹
            </div>
            <span className="text-xs font-bold text-white group-hover:text-purple-300 mt-2 truncate w-full">
              Rainbow Piano
            </span>
            <span className="text-[10px] text-slate-400">Music Tunes</span>
          </button>

          {/* Installed Games & Custom Apps */}
          {(settings.allowedApps || [])
            .filter((a) => a.enabled && !a.isBuiltIn)
            .map((app) => (
              <button
                key={app.id}
                type="button"
                onClick={() => handleLaunchApp('custom_app', app)}
                className="group p-3 rounded-2xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-cyan-500/50 flex flex-col items-center justify-center text-center transition-all hover:scale-105 active:scale-95 cursor-pointer h-28"
              >
                <div
                  className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${app.colorGradient} flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform`}
                >
                  {app.iconEmoji}
                </div>
                <span className="text-xs font-bold text-white group-hover:text-cyan-300 mt-2 truncate w-full">
                  {app.name}
                </span>
                <span className="text-[10px] text-slate-400 capitalize">{app.category}</span>
              </button>
            ))}

          {/* Add / Manage Apps Shortcut */}
          <button
            type="button"
            onClick={onOpenAddApps}
            className="group p-3 rounded-2xl bg-slate-900/40 hover:bg-slate-850/80 border-2 border-dashed border-slate-800 hover:border-cyan-400 flex flex-col items-center justify-center text-center transition-all hover:scale-105 active:scale-95 cursor-pointer h-28"
          >
            <div className="w-12 h-12 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-center text-cyan-400 text-xl group-hover:scale-110 transition-transform">
              <Plus className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-slate-300 group-hover:text-white mt-2 truncate w-full">
              Add More Apps
            </span>
            <span className="text-[10px] text-cyan-400">Admin Control</span>
          </button>
        </div>
      </div>

      {/* Bottom Tablet App Dock (Android 15 / iPad style dock) */}
      <div className="relative z-20 flex items-center justify-center">
        <div className="px-5 py-2.5 rounded-3xl bg-slate-900/90 border border-slate-800/80 shadow-2xl backdrop-blur-xl flex items-center gap-3 sm:gap-4">
          <button
            type="button"
            onClick={() => handleLaunchApp('browser')}
            className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-xl shadow hover:scale-110 active:scale-95 transition-transform cursor-pointer"
            title="Chrome Browser"
          >
            🌐
          </button>
          <button
            type="button"
            onClick={() => handleLaunchApp('youtube')}
            className="w-11 h-11 rounded-2xl bg-gradient-to-br from-rose-600 to-red-700 flex items-center justify-center text-xl shadow hover:scale-110 active:scale-95 transition-transform cursor-pointer"
            title="YouTube"
          >
            📺
          </button>
          <button
            type="button"
            onClick={() => handleLaunchApp('camera')}
            className="w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-xl shadow hover:scale-110 active:scale-95 transition-transform cursor-pointer"
            title="Camera"
          >
            📷
          </button>
          <button
            type="button"
            onClick={() => handleLaunchApp('calculator')}
            className="w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-600 to-blue-700 flex items-center justify-center text-xl shadow hover:scale-110 active:scale-95 transition-transform cursor-pointer"
            title="Calculator"
          >
            🧮
          </button>
          <button
            type="button"
            onClick={() => handleLaunchApp('notes')}
            className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-xl shadow hover:scale-110 active:scale-95 transition-transform cursor-pointer"
            title="Notes"
          >
            📝
          </button>
          <button
            type="button"
            onClick={() => handleLaunchApp('settings')}
            className="w-11 h-11 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-xl shadow hover:scale-110 active:scale-95 transition-transform cursor-pointer"
            title="Tablet Settings"
          >
            ⚙️
          </button>

          <div className="w-px h-7 bg-slate-700 mx-1" />

          {/* Quick Lock Now in Dock */}
          <button
            type="button"
            onClick={onLockNow}
            className="w-11 h-11 rounded-2xl bg-rose-600/30 hover:bg-rose-600 border border-rose-500/40 text-rose-300 hover:text-white flex items-center justify-center text-lg shadow hover:scale-110 active:scale-95 transition-transform cursor-pointer"
            title="Master Lock Tablet Now"
          >
            <Lock className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
