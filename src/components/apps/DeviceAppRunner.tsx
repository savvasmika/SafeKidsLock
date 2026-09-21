import React, { useState, useEffect } from 'react';
import {
  Clock,
  Lock,
  ArrowLeft,
  ShieldCheck,
  Sparkles,
  Trophy,
  Volume2,
  RefreshCw,
  Play,
  Pause,
  CheckCircle2,
} from 'lucide-react';
import { InstalledApp } from '../../types';
import { sound } from '../../utils/audio';

interface DeviceAppRunnerProps {
  app: InstalledApp;
  secondsRemaining: number;
  timeFormatted: string;
  isLowTime: boolean;
  onBackToHome: () => void;
  onLockNow: () => void;
}

export const DeviceAppRunner: React.FC<DeviceAppRunnerProps> = ({
  app,
  timeFormatted,
  isLowTime,
  onBackToHome,
  onLockNow,
}) => {
  // Minecraft builder state
  const [blocks, setBlocks] = useState<string[]>(['🟩', '🟫', '🪨', '💎', '🟩', '🟫', '🪨', '🪵']);
  const [selectedBlock, setSelectedBlock] = useState<string>('🟩');
  const [score, setScore] = useState<number>(0);

  // YouTube Kids player state
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [videoIndex, setVideoIndex] = useState<number>(0);

  // Educational puzzle state
  const [quizScore, setQuizScore] = useState<number>(0);
  const [quizAnswered, setQuizAnswered] = useState<boolean>(false);

  const VIDEOS = [
    { title: 'Journey to the Solar System: Planets Explained!', duration: '5:20', channel: 'Space Explorers Kids', emoji: '🪐' },
    { title: 'Dinosaurs of the Jurassic Era: T-Rex & Triceratops', duration: '6:45', channel: 'Dino Discovery', emoji: '🦖' },
    { title: 'Deep Ocean Mysteries: Coral Reefs & Blue Whales', duration: '4:15', channel: 'Wild Animal Kingdom', emoji: '🐋' },
    { title: 'How Do Airplanes Fly? Physics for Young Explorers', duration: '7:10', channel: 'Kid Science Lab', emoji: '✈️' },
  ];

  const handleMineBlock = (index: number) => {
    sound.playKeyClick();
    const newBlocks = [...blocks];
    newBlocks[index] = selectedBlock;
    setBlocks(newBlocks);
    setScore((s) => s + 10);
  };

  return (
    <div className="w-full h-full relative flex flex-col bg-slate-950 text-white select-none">
      {/* Top Mini-Timer Strip with App Info & Controls */}
      <div className="h-10 bg-slate-900/95 border-b border-slate-800 px-4 flex items-center justify-between z-20 shadow-md">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              sound.playKeyClick();
              onBackToHome();
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold transition-all cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Home</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-base">{app.iconEmoji}</span>
            <span className="font-display font-bold text-xs sm:text-sm text-slate-100 truncate max-w-[140px] sm:max-w-xs">
              {app.name}
            </span>
            <span className="hidden sm:inline text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
              {app.packageName || 'installed.app'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-slate-950/80 px-2.5 py-1 rounded-lg border border-slate-800">
            <Clock className={`w-3.5 h-3.5 ${isLowTime ? 'text-rose-400 animate-pulse' : 'text-cyan-400'}`} />
            <span className={`font-mono text-xs font-bold ${isLowTime ? 'text-rose-300' : 'text-cyan-300'}`}>
              {timeFormatted} left
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              sound.playLockSound();
              onLockNow();
            }}
            className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 text-xs font-semibold flex items-center gap-1 cursor-pointer"
          >
            <Lock className="w-3 h-3" />
            <span>Lock</span>
          </button>
        </div>
      </div>

      {/* Main Interactive App Experience */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex flex-col items-center justify-center max-w-4xl mx-auto w-full">
        {/* Case 1: Minecraft / Building Game Experience */}
        {app.id === 'minecraft' || (app.category === 'games' && app.name.toLowerCase().includes('craft')) ? (
          <div className="w-full max-w-xl bg-slate-900/90 border border-emerald-500/40 rounded-3xl p-6 shadow-2xl flex flex-col items-center">
            <div className="flex items-center justify-between w-full border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">⛏️</span>
                <div>
                  <h3 className="font-display font-bold text-base text-emerald-300">{app.name}</h3>
                  <p className="text-xs text-slate-400">Creative Sandbox & Builder Mode</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 bg-emerald-950/60 text-emerald-300 border border-emerald-700/50 px-3 py-1 rounded-full text-xs font-bold">
                <Trophy className="w-3.5 h-3.5" />
                <span>Craft Score: {score}</span>
              </div>
            </div>

            {/* Block Palette Selector */}
            <div className="flex items-center gap-2 mb-4 bg-slate-950 p-2 rounded-2xl border border-slate-800">
              <span className="text-xs font-semibold text-slate-400 mr-2">Block:</span>
              {['🟩', '🟫', '🪨', '💎', '🪵', '🧱', '⭐', '🔥'].map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => {
                    sound.playKeyClick();
                    setSelectedBlock(b);
                  }}
                  className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-all ${
                    selectedBlock === b ? 'bg-emerald-500/30 ring-2 ring-emerald-400 scale-110' : 'hover:bg-slate-800'
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>

            {/* Tap Grid to Build */}
            <div className="grid grid-cols-4 gap-3 w-full max-w-sm mb-4">
              {blocks.map((block, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleMineBlock(idx)}
                  className="h-16 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center text-3xl shadow-inner active:scale-95 transition-transform cursor-pointer"
                >
                  {block}
                </button>
              ))}
            </div>

            <p className="text-xs text-slate-400 text-center">
              💡 Tap any block in the world to place your selected block and build your structure!
            </p>
          </div>
        ) : app.id === 'youtube_kids' || app.category === 'media' ? (
          /* Case 2: YouTube Kids & Media Experience */
          <div className="w-full max-w-2xl bg-slate-900/90 border border-red-500/40 rounded-3xl p-6 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">▶️</span>
                <div>
                  <h3 className="font-display font-bold text-base text-rose-300">{app.name}</h3>
                  <p className="text-xs text-slate-400">Curated Safe Learning Videos</p>
                </div>
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-red-950 text-rose-400 border border-red-800">
                Kid-Safe Filtered
              </span>
            </div>

            {/* Animated Player Screen */}
            <div className="w-full h-56 sm:h-72 rounded-2xl bg-slate-950 border border-slate-800 relative flex flex-col items-center justify-center overflow-hidden group shadow-inner">
              <div className="text-6xl sm:text-7xl mb-3 animate-pulse">{VIDEOS[videoIndex].emoji}</div>
              <h4 className="font-display font-bold text-base sm:text-lg text-white text-center px-4">
                {VIDEOS[videoIndex].title}
              </h4>
              <p className="text-xs text-cyan-400 mt-1">{VIDEOS[videoIndex].channel}</p>

              {/* Player Overlay Controls */}
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-xl border border-slate-700/60">
                <button
                  type="button"
                  onClick={() => {
                    sound.playKeyClick();
                    setIsPlaying(!isPlaying);
                  }}
                  className="flex items-center gap-2 text-xs font-bold text-white hover:text-cyan-300"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  <span>{isPlaying ? 'Playing' : 'Paused'}</span>
                </button>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-slate-400">{VIDEOS[videoIndex].duration}</span>
                  <button
                    type="button"
                    onClick={() => {
                      sound.playUnlockChime();
                      setVideoIndex((prev) => (prev + 1) % VIDEOS.length);
                    }}
                    className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1"
                  >
                    <span>Next Video</span>
                    <span>→</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Playlist Preview */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
              {VIDEOS.map((v, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    sound.playKeyClick();
                    setVideoIndex(i);
                    setIsPlaying(true);
                  }}
                  className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                    videoIndex === i
                      ? 'bg-red-950/60 border-red-500/80 text-white'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <div className="text-lg mb-1">{v.emoji}</div>
                  <div className="font-semibold line-clamp-1 text-slate-200">{v.title}</div>
                  <div className="text-[10px] text-slate-400">{v.duration}</div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Case 3: Standard Interactive Tablet Game / App Runner */
          <div className="w-full max-w-xl bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center">
            <div className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${app.colorGradient} flex items-center justify-center text-4xl shadow-xl mb-4`}>
              {app.iconEmoji}
            </div>

            <h3 className="font-display font-bold text-2xl text-white mb-1">{app.name}</h3>
            <p className="text-xs text-slate-400 max-w-md leading-relaxed mb-6">
              {app.description}
            </p>

            {/* Simulated Interactive Arcade Stage */}
            <div className="w-full bg-slate-950 border border-slate-800/80 rounded-2xl p-6 mb-6 relative overflow-hidden">
              <div className="flex items-center justify-between mb-4 text-xs text-slate-400">
                <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Interactive Game Sandbox</span>
                </span>
                <span className="font-mono bg-slate-900 px-2 py-0.5 rounded text-cyan-300">
                  Stars Earned: ⭐ {quizScore}
                </span>
              </div>

              <div className="py-6 flex flex-col items-center justify-center">
                <div className="text-5xl mb-3 animate-bounce">{app.iconEmoji}</div>
                <div className="text-sm font-semibold text-slate-200 mb-4">
                  Tap the magic button to play and collect power stars!
                </div>

                <button
                  type="button"
                  onClick={() => {
                    sound.playUnlockChime();
                    setQuizScore((s) => s + 1);
                    setQuizAnswered(true);
                  }}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-display font-bold text-sm shadow-xl active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Play Game Activity (+1 ⭐)</span>
                </button>

                {quizAnswered && (
                  <div className="mt-4 text-xs text-emerald-400 font-bold animate-in fade-in">
                    Great job! Keep exploring during your allowed screen time.
                  </div>
                )}
              </div>
            </div>

            {/* Android 15 Isolation Badge */}
            <div className="flex items-center gap-2 text-slate-400 text-xs bg-slate-950/60 px-4 py-2 rounded-xl border border-slate-800">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>
                Protected under Android 15 Lock Task Mode • Package: <strong>{app.packageName || 'installed.app'}</strong>
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
