import React, { useState } from 'react';
import {
  Search,
  ArrowLeft,
  ArrowRight,
  RotateCw,
  Home,
  Globe,
  Lock,
  ExternalLink,
  Star,
  ShieldCheck,
  Compass,
} from 'lucide-react';
import { sound } from '../../utils/audio';

interface WebBrowserAppProps {
  onClose: () => void;
}

interface WebPage {
  title: string;
  url: string;
  category: string;
  snippet: string;
  icon: string;
  content: string;
}

const FEATURED_SITES: WebPage[] = [
  {
    title: 'NASA Space Place - Explore Earth and Space',
    url: 'https://spaceplace.nasa.gov',
    category: 'Science & Space',
    snippet: 'Learn about planets, stars, galaxies, and how astronauts live in space with fun interactive games and real NASA photos.',
    icon: '🚀',
    content: 'Welcome to NASA Space Place! Did you know Jupiter is so big that more than 1,300 Earths could fit inside it? The James Webb Space Telescope sends breathtaking images from billions of light years away. Explore our solar system, learn about black holes, and design your own Mars rover!',
  },
  {
    title: 'National Geographic Kids - Amazing Animals',
    url: 'https://kids.nationalgeographic.com',
    category: 'Nature & Wildlife',
    snippet: 'Discover cool animal facts, funny pet stories, weird-but-true trivia, and explore ecosystems from the deep ocean to the rainforest.',
    icon: '🦁',
    content: 'Cheetahs can accelerate from 0 to 60 mph in just 3 seconds! Blue whales are the largest animals ever known to have lived on Earth—even bigger than any dinosaur. Learn about wildlife conservation and how you can protect polar bears and sea turtles.',
  },
  {
    title: 'Scratch Coding - Create Stories & Games',
    url: 'https://scratch.mit.edu',
    category: 'Coding & Creativity',
    snippet: 'With Scratch, you can program your own interactive stories, games, and animations—and share your creations with others.',
    icon: '🐱',
    content: 'Welcome to the MIT Scratch visual coding playground! Drag and drop blocks: "When green flag clicked", "Move 10 steps", "Play drum sound". Over 100 million kid coders around the world have created games, musical instruments, and animated cartoons!',
  },
  {
    title: 'Wikipedia Kids - The Free Encyclopedia',
    url: 'https://kids.wikipedia.org',
    category: 'Encyclopedia & History',
    snippet: 'Curated, kid-safe articles on ancient Egypt, dinosaurs, world geography, robotics, and famous inventors throughout history.',
    icon: '📚',
    content: 'The Great Pyramid of Giza was the tallest man-made structure in the world for over 3,800 years. Dinosaurs ruled the Earth during the Mesozoic Era, lasting about 180 million years. Explore historical discoveries, chemistry elements, and ancient civilizations!',
  },
  {
    title: 'PBS KIDS - Educational Games and Videos',
    url: 'https://pbskids.org',
    category: 'Fun & Games',
    snippet: 'Play educational games with Wild Kratts, Curious George, Arthur, Daniel Tiger, and Odd Squad.',
    icon: '📺',
    content: 'Join the Wild Kratts on creature adventures in the Amazon jungle, explore mathematics puzzles with Odd Squad, and build mechanical inventions with Curious George. Safe, ad-free educational fun for kids of all ages.',
  },
  {
    title: 'Math Is Fun - Puzzles and Geometry',
    url: 'https://mathsisfun.com',
    category: 'Mathematics',
    snippet: 'Clear explanations, interactive math puzzles, times tables drills, and geometry visuals made simple.',
    icon: '📐',
    content: 'Mathematics is everywhere! From the Fibonacci spiral in sunflowers and seashells to geometric shapes in modern architecture. Try our brain teaser riddles, interactive fraction visualizers, and algebraic balance scales!',
  },
];

export const WebBrowserApp: React.FC<WebBrowserAppProps> = ({ onClose }) => {
  const [currentUrl, setCurrentUrl] = useState<string>('https://google.com/search');
  const [inputUrl, setInputUrl] = useState<string>('https://google.com/search');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activePage, setActivePage] = useState<WebPage | null>(null);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [bookmarks, setBookmarks] = useState<string[]>([
    'https://spaceplace.nasa.gov',
    'https://kids.nationalgeographic.com',
    'https://scratch.mit.edu',
  ]);

  const handleNavigate = (url: string, page?: WebPage) => {
    sound.playKeyClick();
    setCurrentUrl(url);
    setInputUrl(url);
    if (page) {
      setActivePage(page);
    } else {
      const found = FEATURED_SITES.find((s) => s.url.toLowerCase() === url.toLowerCase());
      setActivePage(found || null);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playKeyClick();
    const query = searchQuery.trim();
    if (!query) return;

    // Check if query matches a site
    const matched = FEATURED_SITES.find(
      (s) =>
        s.title.toLowerCase().includes(query.toLowerCase()) ||
        s.category.toLowerCase().includes(query.toLowerCase()) ||
        s.snippet.toLowerCase().includes(query.toLowerCase())
    );

    if (matched) {
      handleNavigate(matched.url, matched);
    } else {
      // Simulate Google Search results page
      setCurrentUrl(`https://google.com/search?q=${encodeURIComponent(query)}`);
      setInputUrl(`https://google.com/search?q=${encodeURIComponent(query)}`);
      setActivePage(null);
    }
  };

  const handleUrlBarSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playKeyClick();
    let url = inputUrl.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      if (url.includes('.')) {
        url = 'https://' + url;
      } else {
        setSearchQuery(url);
        handleSearchSubmit(e);
        return;
      }
    }
    const matched = FEATURED_SITES.find((s) => s.url.toLowerCase().includes(url.toLowerCase()));
    handleNavigate(url, matched);
  };

  return (
    <div className="w-full h-full bg-slate-950 text-slate-100 flex flex-col select-none overflow-hidden">
      {/* Top Browser Bar (Chrome / Android 15 style) */}
      <div className="bg-slate-900 border-b border-slate-800 p-2.5 flex items-center gap-2 shrink-0">
        {/* Navigation buttons */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => handleNavigate('https://google.com/search')}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Home"
          >
            <Home className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleNavigate('https://google.com/search')}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => sound.playKeyClick()}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Refresh"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>

        {/* Omnibox / URL Bar */}
        <form onSubmit={handleUrlBarSubmit} className="flex-1 flex items-center">
          <div className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700/80 focus-within:border-cyan-400 transition-colors">
            <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <input
              type="text"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="Search Google or enter web address..."
              className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
            />
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" title="Kid-Safe Browsing Active" />
          </div>
        </form>

        {/* Tab & Close Controls */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-cyan-950 text-cyan-300 border border-cyan-800">
            Chrome
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>

      {/* Bookmarks Bar */}
      <div className="bg-slate-900/60 border-b border-slate-800/80 px-3 py-1.5 flex items-center gap-2 overflow-x-auto text-[11px] shrink-0">
        <span className="text-slate-500 flex items-center gap-1">
          <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
          <span>Quick:</span>
        </span>
        {FEATURED_SITES.map((site) => (
          <button
            key={site.url}
            type="button"
            onClick={() => handleNavigate(site.url, site)}
            className={`px-2.5 py-0.5 rounded-md transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              currentUrl === site.url
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'hover:bg-slate-800 text-slate-300'
            }`}
          >
            <span>{site.icon}</span>
            <span className="font-medium">{site.category}</span>
          </button>
        ))}
      </div>

      {/* Web Content Viewport */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-950">
        {activePage ? (
          /* Render Active Web Page Article */
          <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in">
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{activePage.icon}</span>
                  <div>
                    <span className="text-xs uppercase font-bold tracking-wider text-cyan-400">
                      {activePage.category}
                    </span>
                    <h1 className="font-display font-bold text-xl sm:text-2xl text-white">
                      {activePage.title}
                    </h1>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Verified Safe
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs text-slate-400 font-mono flex items-center justify-between">
                <span>{activePage.url}</span>
                <span className="text-cyan-400">HTTPS 256-Bit SSL</span>
              </div>

              <div className="text-sm text-slate-200 leading-relaxed font-sans border-t border-slate-800 pt-4">
                <p>{activePage.content}</p>
              </div>

              <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/20 text-xs text-cyan-200 space-y-2">
                <div className="font-bold flex items-center gap-1.5">
                  <Compass className="w-4 h-4" />
                  <span>Interactive Learning Activity Available</span>
                </div>
                <p className="text-slate-300 text-xs">
                  This educational site is fully accessible during your unlocked tablet session.
                </p>
              </div>
            </div>

            {/* Other Suggested Web Destinations */}
            <div>
              <h3 className="font-display font-bold text-sm text-slate-400 uppercase tracking-wider mb-3">
                More Web Destinations
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {FEATURED_SITES.filter((s) => s.url !== activePage.url).slice(0, 4).map((site) => (
                  <button
                    key={site.url}
                    type="button"
                    onClick={() => handleNavigate(site.url, site)}
                    className="p-3.5 rounded-2xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-cyan-500/40 text-left transition-all flex items-start gap-3 cursor-pointer group"
                  >
                    <span className="text-2xl group-hover:scale-110 transition-transform">{site.icon}</span>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-xs text-white group-hover:text-cyan-300 truncate">
                        {site.title}
                      </div>
                      <div className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">
                        {site.snippet}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Google Search / Home View */
          <div className="max-w-2xl mx-auto py-8 text-center space-y-6 animate-in fade-in">
            {/* Google Logo */}
            <div className="flex items-center justify-center gap-1 font-display font-extrabold text-4xl sm:text-5xl tracking-tight">
              <span className="text-blue-500">G</span>
              <span className="text-rose-500">o</span>
              <span className="text-amber-400">o</span>
              <span className="text-blue-500">g</span>
              <span className="text-emerald-500">l</span>
              <span className="text-rose-500">e</span>
            </div>
            <div className="text-xs text-slate-400 font-semibold uppercase tracking-widest">
              Tablet Web Search • Kid-Safe SafeSearch ON
            </div>

            {/* Search Input Box */}
            <form onSubmit={handleSearchSubmit} className="relative max-w-xl mx-auto">
              <div className="flex items-center px-4 py-3 rounded-full bg-slate-900 border border-slate-700 hover:border-cyan-400 focus-within:border-cyan-400 shadow-xl transition-all">
                <Search className="w-5 h-5 text-slate-400 mr-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search the web, animals, coding, or facts..."
                  className="w-full bg-transparent text-sm text-white placeholder-slate-400 focus:outline-none"
                  autoFocus
                />
                <button
                  type="submit"
                  className="ml-2 px-3 py-1 rounded-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
                >
                  Search
                </button>
              </div>
            </form>

            {/* Popular Quick Search Queries */}
            <div className="space-y-2 pt-2">
              <div className="text-xs text-slate-400 font-medium">Popular kid topics to search:</div>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {[
                  'Dinosaurs facts',
                  'James Webb Space Telescope',
                  'How to code in Scratch',
                  'Deep ocean creatures',
                  'Solar system planets',
                  'Origami paper folding',
                ].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      setSearchQuery(tag);
                      const matched = FEATURED_SITES.find((s) => s.snippet.toLowerCase().includes(tag.toLowerCase()));
                      if (matched) {
                        handleNavigate(matched.url, matched);
                      }
                    }}
                    className="px-3 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 hover:text-white transition-all cursor-pointer"
                  >
                    🔍 {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Curated Directory Grid */}
            <div className="pt-6 text-left">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Featured Safe Websites
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {FEATURED_SITES.map((site) => (
                  <button
                    key={site.url}
                    type="button"
                    onClick={() => handleNavigate(site.url, site)}
                    className="p-3.5 rounded-2xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-cyan-500/40 text-left transition-all flex items-start gap-3 cursor-pointer group"
                  >
                    <span className="text-2xl group-hover:scale-110 transition-transform">{site.icon}</span>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-xs text-white group-hover:text-cyan-300 truncate">
                        {site.title}
                      </div>
                      <div className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">
                        {site.snippet}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
