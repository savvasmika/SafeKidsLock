import React, { useState } from 'react';
import {
  Search,
  Download,
  CheckCircle,
  Star,
  Gamepad2,
  BookOpen,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { sound } from '../../utils/audio';

interface PlayStoreAppProps {
  onClose: () => void;
  onLaunchGame?: (gameName: string) => void;
}

interface StoreItem {
  id: string;
  name: string;
  developer: string;
  rating: number;
  downloads: string;
  category: string;
  iconEmoji: string;
  gradient: string;
  description: string;
  installed: boolean;
}

const INITIAL_STORE_ITEMS: StoreItem[] = [
  {
    id: 'store-1',
    name: 'Minecraft: Pocket Edition',
    developer: 'Mojang Studios',
    rating: 4.8,
    downloads: '100M+',
    category: 'Creativity & Adventure',
    iconEmoji: '⛏️',
    gradient: 'from-emerald-700 to-green-950',
    description: 'Explore infinite worlds and build everything from the simplest of homes to the grandest of castles. Play in creative mode with unlimited resources.',
    installed: true,
  },
  {
    id: 'store-2',
    name: 'Roblox Studio & Worlds',
    developer: 'Roblox Corporation',
    rating: 4.6,
    downloads: '500M+',
    category: 'Multiplayer Sandbox',
    iconEmoji: '🧱',
    gradient: 'from-rose-800 to-red-950',
    description: 'The ultimate virtual universe that lets you create, share experiences with friends, and be anything you can imagine.',
    installed: true,
  },
  {
    id: 'store-3',
    name: 'Subway Surfers: World Tour',
    developer: 'SYBO Games',
    rating: 4.7,
    downloads: '1B+',
    category: 'Endless Runner',
    iconEmoji: '🛹',
    gradient: 'from-amber-600 to-orange-900',
    description: 'DASH as fast as you can! DODGE the oncoming trains! Help Jake, Tricky & Fresh escape from the grumpy Inspector and his dog.',
    installed: true,
  },
  {
    id: 'store-4',
    name: 'Duolingo: Learn Languages Free',
    developer: 'Duolingo',
    rating: 4.9,
    downloads: '100M+',
    category: 'Education & Languages',
    iconEmoji: '🦉',
    gradient: 'from-lime-600 to-green-900',
    description: 'Learn Spanish, French, German, Italian, and more with fun, bite-sized lessons. Practice speaking, reading, listening, and writing.',
    installed: true,
  },
  {
    id: 'store-5',
    name: 'Chess Kids - Learn & Play',
    developer: 'Chess.com',
    rating: 4.7,
    downloads: '10M+',
    category: 'Strategy & Brain',
    iconEmoji: '♟️',
    gradient: 'from-purple-800 to-indigo-950',
    description: 'Fun, safe, and kid-friendly chess puzzles, lessons, and computer matches designed to sharpen logical reasoning and memory.',
    installed: false,
  },
  {
    id: 'store-6',
    name: 'Khan Academy Kids',
    developer: 'Khan Academy',
    rating: 4.9,
    downloads: '50M+',
    category: 'Early Learning',
    iconEmoji: '🐻',
    gradient: 'from-teal-600 to-cyan-950',
    description: 'Award-winning educational app for young learners. Thousands of interactive activities in reading, language, math, and social skills.',
    installed: false,
  },
];

export const PlayStoreApp: React.FC<PlayStoreAppProps> = ({ onClose, onLaunchGame }) => {
  const [items, setItems] = useState<StoreItem[]>(INITIAL_STORE_ITEMS);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [installingId, setInstallingId] = useState<string | null>(null);

  const handleInstall = (item: StoreItem) => {
    sound.playKeyClick();
    setInstallingId(item.id);
    setTimeout(() => {
      sound.playUnlockChime();
      setItems((prev) =>
        prev.map((it) => (it.id === item.id ? { ...it, installed: true } : it))
      );
      setInstallingId(null);
    }, 1200);
  };

  const filtered = items.filter(
    (i) =>
      i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full h-full bg-slate-950 text-white flex flex-col select-none overflow-hidden">
      {/* Top Play Store Header */}
      <div className="bg-slate-900 border-b border-slate-800 p-3 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-cyan-400 via-blue-500 to-emerald-400 flex items-center justify-center shadow">
            <span className="text-slate-950 font-black text-xs">▶</span>
          </div>
          <span className="font-display font-bold text-sm sm:text-base text-white">
            Google Play <span className="text-cyan-400 text-xs">Tablet Store</span>
          </span>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-sm">
          <div className="flex items-center px-3 py-1.5 rounded-full bg-slate-950 border border-slate-700/80 focus-within:border-cyan-400">
            <Search className="w-3.5 h-3.5 text-slate-400 mr-2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search apps, games, learning..."
              className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="px-3 py-1 rounded-xl bg-slate-800 text-xs font-bold text-slate-300 hover:text-white"
        >
          Exit
        </button>
      </div>

      {/* Main Apps Grid */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-bold text-base text-white flex items-center gap-2">
            <span>Popular Tablet Games & Apps</span>
            <span className="text-[10px] uppercase px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
              Verified Safe
            </span>
          </h2>
          <span className="text-xs text-slate-400">{filtered.length} Apps</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-cyan-500/40 transition-all flex flex-col justify-between space-y-3"
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${item.gradient} flex items-center justify-center text-3xl shadow-lg shrink-0`}
                >
                  {item.iconEmoji}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-sm text-white truncate">{item.name}</h3>
                  <div className="text-xs text-slate-400">{item.developer}</div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                    <span className="flex items-center gap-1 text-amber-400 font-bold">
                      <Star className="w-3 h-3 fill-amber-400" />
                      {item.rating}
                    </span>
                    <span>•</span>
                    <span>{item.downloads}</span>
                    <span>•</span>
                    <span className="text-cyan-400">{item.category}</span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                {item.description}
              </p>

              <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                <span className="text-[10px] text-slate-500 font-mono">PEGI 3 • Everyone</span>
                {item.installed ? (
                  <button
                    type="button"
                    onClick={() => onLaunchGame?.(item.name)}
                    className="px-4 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <CheckCircle className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Open Game</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={installingId === item.id}
                    onClick={() => handleInstall(item)}
                    className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{installingId === item.id ? 'Installing...' : 'Install Free'}</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
