import React, { useState } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, BookOpen, Volume2 } from 'lucide-react';
import { sound } from '../../utils/audio';

interface StorybookAppProps {
  onBackToHome: () => void;
}

interface StoryPage {
  title: string;
  emoji: string;
  text: string;
  bgGradient: string;
}

const STORY_PAGES: StoryPage[] = [
  {
    title: "The Curious Little Robot",
    emoji: "🤖 ⭐",
    text: "Once upon a time in a sparkling digital forest, there lived a tiny robot named Pip. Pip loved discovering how bright stars twinkled in the sky.",
    bgGradient: "from-indigo-950 via-slate-900 to-slate-950",
  },
  {
    title: "A Hidden Treasure Map",
    emoji: "🗺️ 🧭",
    text: "One morning, Pip found an old golden scroll beneath a glowing mossy stone. It revealed a secret path leading up to Mount Rainbow!",
    bgGradient: "from-amber-950 via-slate-900 to-slate-950",
  },
  {
    title: "The Friendly Owl Guide",
    emoji: "🦉 🌲",
    text: "'Hoo hoo!' called Oliver the wise owl from a pine branch. 'Take courage, little robot! Every step forward brings you closer to your dreams.'",
    bgGradient: "from-emerald-950 via-slate-900 to-slate-950",
  },
  {
    title: "The Great Rainbow Summit",
    emoji: "🌈 🚀",
    text: "When Pip reached the peak, the clouds parted into ribbons of shimmering color. Pip learned that curiosity and friendship are the greatest adventures of all.",
    bgGradient: "from-purple-950 via-slate-900 to-slate-950",
  },
];

export const StorybookApp: React.FC<StorybookAppProps> = ({ onBackToHome }) => {
  const [pageIndex, setPageIndex] = useState<number>(0);
  const page = STORY_PAGES[pageIndex];

  const handleNext = () => {
    if (pageIndex < STORY_PAGES.length - 1) {
      sound.playKeyClick();
      setPageIndex((p) => p + 1);
    }
  };

  const handlePrev = () => {
    if (pageIndex > 0) {
      sound.playKeyClick();
      setPageIndex((p) => p - 1);
    }
  };

  const handleReadAloud = () => {
    sound.playUnlockChime();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(page.text);
      utterance.pitch = 1.1;
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div id="storybook-app-root" className={`w-full h-full flex flex-col bg-gradient-to-b ${page.bgGradient} text-white select-none transition-colors duration-500`}>
      {/* Header */}
      <div className="h-14 px-4 bg-slate-900/60 backdrop-blur border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            id="story-back-btn"
            onClick={() => {
              sound.playKeyClick();
              onBackToHome();
            }}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1.5 text-sm font-medium transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Home</span>
          </button>
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            <h2 className="font-display font-semibold text-lg">Storybook Adventure</h2>
          </div>
        </div>

        {/* Read aloud button */}
        <button
          id="story-read-aloud-btn"
          onClick={handleReadAloud}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-400/40 text-indigo-300 text-xs font-semibold transition-all active:scale-95"
        >
          <Volume2 className="w-4 h-4" />
          <span>Read to Me</span>
        </button>
      </div>

      {/* Story Content Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 max-w-2xl mx-auto w-full text-center">
        <div className="text-8xl mb-6 select-none animate-pulse">
          {page.emoji}
        </div>

        <h3 className="text-2xl font-display font-bold text-amber-300 mb-4">
          {page.title}
        </h3>

        <p className="text-xl md:text-2xl font-sans text-slate-200 leading-relaxed max-w-xl font-medium">
          "{page.text}"
        </p>

        {/* Page progress indicators */}
        <div className="flex items-center gap-2 mt-8">
          {STORY_PAGES.map((_, idx) => (
            <div
              key={idx}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                idx === pageIndex ? 'w-8 bg-amber-400' : 'w-2.5 bg-slate-700'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="h-20 px-8 bg-slate-900/70 border-t border-slate-800 flex items-center justify-between">
        <button
          id="story-prev-page"
          onClick={handlePrev}
          disabled={pageIndex === 0}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-white font-medium transition-all"
        >
          <ChevronLeft className="w-5 h-5" />
          <span>Previous</span>
        </button>

        <span className="text-sm font-semibold text-slate-400">
          Page {pageIndex + 1} of {STORY_PAGES.length}
        </span>

        <button
          id="story-next-page"
          onClick={handleNext}
          disabled={pageIndex === STORY_PAGES.length - 1}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 disabled:opacity-30 disabled:cursor-not-allowed text-slate-950 font-bold transition-all"
        >
          <span>Next</span>
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
