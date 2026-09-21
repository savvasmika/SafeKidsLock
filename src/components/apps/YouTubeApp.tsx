import React, { useState } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Search,
  Flame,
  Film,
  Sparkles,
  RotateCcw,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { sound } from '../../utils/audio';

interface YouTubeAppProps {
  onClose: () => void;
}

interface VideoItem {
  id: string;
  title: string;
  channel: string;
  duration: string;
  views: string;
  thumbnailEmoji: string;
  gradient: string;
  category: 'Science' | 'Animation' | 'Coding' | 'Nature' | 'Gaming';
  description: string;
}

const VIDEOS: VideoItem[] = [
  {
    id: 'vid-1',
    title: 'Journey to the Deep Ocean: Creatures of the Mariana Trench',
    channel: 'National Geographic Wild',
    duration: '12:40',
    views: '1.8M views',
    thumbnailEmoji: '🐋',
    gradient: 'from-blue-900 to-indigo-950',
    category: 'Nature',
    description: 'Dive nearly 36,000 feet beneath the surface into the pitch-black Mariana Trench. Discover bioluminescent jellyfish, the ghost-like snailfish, and hydrothermal vent ecosystems.',
  },
  {
    id: 'vid-2',
    title: 'How Rockets Work: From Launchpad to Mars Orbit',
    channel: 'Science Sparks',
    duration: '15:18',
    views: '3.4M views',
    thumbnailEmoji: '🚀',
    gradient: 'from-purple-900 to-slate-900',
    category: 'Science',
    description: 'Learn Newton third law of motion through giant liquid oxygen rocket engines, multi-stage staging separations, and heat shields during orbital re-entry.',
  },
  {
    id: 'vid-3',
    title: 'Learn to Code Your First Game in Scratch: Step-by-Step',
    channel: 'Code Masters Kids',
    duration: '18:05',
    views: '920K views',
    thumbnailEmoji: '💻',
    gradient: 'from-emerald-900 to-teal-950',
    category: 'Coding',
    description: 'Build a fun platformer dodging meteors and collecting golden stars! We cover sprite movement, score variables, jumping physics, and sound effects.',
  },
  {
    id: 'vid-4',
    title: 'The Secret Life of Dinosaurs: T-Rex vs Triceratops',
    channel: 'Prehistoric Planet',
    duration: '14:22',
    views: '4.1M views',
    thumbnailEmoji: '🦖',
    gradient: 'from-amber-950 to-stone-900',
    category: 'Science',
    description: 'Explore the latest paleontological discoveries! Discover feather pigments in velociraptors, bone-crushing bite forces, and how fossilization occurs over millions of years.',
  },
  {
    id: 'vid-5',
    title: 'Speed Building a Massive Medieval Castle in Minecraft',
    channel: 'Block Crafter Studio',
    duration: '22:10',
    views: '5.2M views',
    thumbnailEmoji: '🏰',
    gradient: 'from-stone-800 to-amber-950',
    category: 'Gaming',
    description: 'Watch an incredible timelapse build of a gothic fortress with drawbridges, automated redstone portcullises, cobblestone battlements, and underground caverns.',
  },
  {
    id: 'vid-6',
    title: 'The Adventures of Pippin the Penguin: The Great Glacier Escape',
    channel: 'Toon World Cartoons',
    duration: '08:45',
    views: '2.3M views',
    thumbnailEmoji: '🐧',
    gradient: 'from-cyan-900 to-blue-950',
    category: 'Animation',
    description: 'Follow Pippin and his polar bear buddy Barnaby on an icy sledding race across Antarctica to rescue their favorite lost snowball.',
  },
];

export const YouTubeApp: React.FC<YouTubeAppProps> = ({ onClose }) => {
  const [selectedVideo, setSelectedVideo] = useState<VideoItem>(VIDEOS[0]);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [progressSec, setProgressSec] = useState<number>(45);

  const categories = ['All', 'Science', 'Nature', 'Coding', 'Animation', 'Gaming'];

  const filteredVideos = VIDEOS.filter((v) => {
    const matchesCat = activeCategory === 'All' || v.category === activeCategory;
    const matchesSearch =
      !searchQuery.trim() ||
      v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.channel.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleSelectVideo = (video: VideoItem) => {
    sound.playUnlockChime();
    setSelectedVideo(video);
    setIsPlaying(true);
    setProgressSec(0);
  };

  return (
    <div className="w-full h-full bg-slate-950 text-white flex flex-col select-none overflow-hidden">
      {/* Top YouTube Header */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between gap-3 shrink-0">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-6 bg-rose-600 rounded-lg flex items-center justify-center shadow">
            <Play className="w-3.5 h-3.5 fill-white text-white ml-0.5" />
          </div>
          <span className="font-display font-bold text-base tracking-tight text-white">
            YouTube <span className="text-cyan-400 font-normal text-xs">Kids</span>
          </span>
        </div>

        {/* Search */}
        <div className="flex-1 max-w-md mx-2">
          <div className="flex items-center px-3 py-1.5 rounded-full bg-slate-950 border border-slate-700/80 focus-within:border-cyan-400">
            <Search className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search videos, science, cartoons..."
              className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="px-3 py-1 text-xs font-bold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
        >
          Close
        </button>
      </div>

      {/* Main Layout: Player on Left / List on Right */}
      <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-3 gap-4 p-4">
        {/* Active Video Player Column */}
        <div className="lg:col-span-2 space-y-3">
          {/* Simulated Video Screen */}
          <div
            className={`relative w-full aspect-video rounded-3xl overflow-hidden bg-gradient-to-br ${selectedVideo.gradient} border border-slate-800 shadow-2xl flex flex-col justify-between p-6`}
          >
            {/* Ambient Animated Visualizer */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className={`text-8xl drop-shadow-2xl transition-transform ${isPlaying ? 'scale-110 animate-bounce' : 'scale-95 opacity-80'}`}>
                {selectedVideo.thumbnailEmoji}
              </span>
            </div>

            {/* Top Overlay Badge */}
            <div className="relative z-10 flex items-center justify-between">
              <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-xs font-bold text-cyan-300 border border-cyan-500/30">
                {selectedVideo.category} • HD 1080p
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-rose-600/80 text-[10px] font-bold text-white uppercase tracking-wider">
                Kid Safe
              </span>
            </div>

            {/* Bottom Player Controls */}
            <div className="relative z-10 bg-slate-950/80 backdrop-blur-md p-3.5 rounded-2xl border border-slate-800/80 space-y-2">
              {/* Scrub Bar */}
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-rose-500 h-full rounded-full transition-all"
                  style={{ width: `${Math.min(100, (progressSec / 300) * 100)}%` }}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      sound.playKeyClick();
                      setIsPlaying(!isPlaying);
                    }}
                    className="w-9 h-9 rounded-xl bg-white text-slate-950 flex items-center justify-center shadow hover:scale-105 active:scale-95 transition-transform cursor-pointer"
                  >
                    {isPlaying ? <Pause className="w-4 h-4 fill-slate-950" /> : <Play className="w-4 h-4 fill-slate-950 ml-0.5" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      sound.playKeyClick();
                      setIsMuted(!isMuted);
                    }}
                    className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
                  </button>

                  <span className="text-xs text-slate-300 font-mono">
                    03:45 / {selectedVideo.duration}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Ad-Free</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Video Metadata */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <h1 className="font-display font-bold text-base sm:text-lg text-white">
              {selectedVideo.title}
            </h1>
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span className="font-bold text-slate-200">{selectedVideo.channel}</span>
              <span>•</span>
              <span>{selectedVideo.views}</span>
              <span>•</span>
              <span className="text-cyan-400">{selectedVideo.category}</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed pt-1">
              {selectedVideo.description}
            </p>
          </div>
        </div>

        {/* Video Recommendations Sidebar */}
        <div className="space-y-3">
          {/* Category Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1 rounded-xl whitespace-nowrap transition-all font-semibold cursor-pointer ${
                  activeCategory === cat
                    ? 'bg-white text-slate-950 shadow'
                    : 'bg-slate-900 text-slate-300 hover:bg-slate-850'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Videos List */}
          <div className="space-y-2.5">
            {filteredVideos.map((vid) => (
              <button
                key={vid.id}
                type="button"
                onClick={() => handleSelectVideo(vid)}
                className={`w-full p-2.5 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer group ${
                  selectedVideo.id === vid.id
                    ? 'bg-slate-850 border-cyan-500/50 shadow-md'
                    : 'bg-slate-900/80 hover:bg-slate-850 border-slate-800'
                }`}
              >
                <div
                  className={`w-24 h-16 rounded-xl bg-gradient-to-br ${vid.gradient} flex items-center justify-center text-2xl shrink-0 group-hover:scale-105 transition-transform`}
                >
                  {vid.thumbnailEmoji}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-xs text-white group-hover:text-cyan-300 line-clamp-2 leading-snug">
                    {vid.title}
                  </h4>
                  <div className="text-[11px] text-slate-400 mt-1 truncate">{vid.channel}</div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                    {vid.duration} • {vid.views}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
