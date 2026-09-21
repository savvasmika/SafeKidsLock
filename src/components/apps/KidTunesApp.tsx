import React from 'react';
import { ArrowLeft, Music } from 'lucide-react';
import { sound } from '../../utils/audio';

interface KidTunesAppProps {
  onBackToHome: () => void;
}

interface PianoKey {
  note: string;
  freq: number;
  color: string;
  border: string;
}

const PIANO_KEYS: PianoKey[] = [
  { note: 'Do (C)', freq: 261.63, color: 'bg-rose-500', border: 'border-rose-400' },
  { note: 'Re (D)', freq: 293.66, color: 'bg-orange-500', border: 'border-orange-400' },
  { note: 'Mi (E)', freq: 329.63, color: 'bg-amber-500', border: 'border-amber-400' },
  { note: 'Fa (F)', freq: 349.23, color: 'bg-emerald-500', border: 'border-emerald-400' },
  { note: 'Sol (G)', freq: 392.00, color: 'bg-teal-500', border: 'border-teal-400' },
  { note: 'La (A)', freq: 440.00, color: 'bg-cyan-500', border: 'border-cyan-400' },
  { note: 'Ti (B)', freq: 493.88, color: 'bg-blue-500', border: 'border-blue-400' },
  { note: 'High Do (C)', freq: 523.25, color: 'bg-purple-500', border: 'border-purple-400' },
];

export const KidTunesApp: React.FC<KidTunesAppProps> = ({ onBackToHome }) => {
  const handlePlayKey = (k: PianoKey) => {
    sound.playNote(k.freq);
  };

  return (
    <div id="kidtunes-app-root" className="w-full h-full flex flex-col bg-slate-900 text-white select-none">
      {/* Header */}
      <div className="h-14 px-4 bg-slate-800/80 border-b border-slate-700/60 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            id="tunes-back-btn"
            onClick={() => {
              sound.playKeyClick();
              onBackToHome();
            }}
            className="p-2 rounded-xl bg-slate-700/70 hover:bg-slate-600 text-slate-200 flex items-center gap-1.5 text-sm font-medium transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Home</span>
          </button>
          <div className="flex items-center gap-2">
            <Music className="w-5 h-5 text-purple-400" />
            <h2 className="font-display font-semibold text-lg">Kids Rainbow Piano</h2>
          </div>
        </div>
      </div>

      {/* Piano Keys Section */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-4xl mx-auto w-full">
        <p className="text-slate-400 text-sm mb-6 font-medium">Tap each colorful note to make your own music!</p>
        <div className="flex items-stretch justify-center gap-2.5 w-full h-72">
          {PIANO_KEYS.map((k) => (
            <button
              key={k.note}
              id={`piano-key-${k.note.replace(/\s+/g, '-')}`}
              onClick={() => handlePlayKey(k)}
              className={`flex-1 rounded-2xl ${k.color} border-t-4 ${k.border} shadow-xl active:scale-95 active:brightness-125 transition-all flex flex-col items-center justify-end pb-6 hover:brightness-110 cursor-pointer`}
            >
              <span className="font-display font-bold text-white text-lg drop-shadow-md text-center">
                {k.note}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
