import React, { useState } from 'react';
import { ArrowLeft, Star, Sparkles, CheckCircle2, RotateCcw } from 'lucide-react';
import { sound } from '../../utils/audio';

interface MathQuestAppProps {
  onBackToHome: () => void;
}

interface Question {
  num1: number;
  num2: number;
  op: '+' | '-';
  correct: number;
  options: number[];
}

function generateQuestion(): Question {
  const op: '+' | '-' = Math.random() > 0.4 ? '+' : '-';
  let num1: number;
  let num2: number;
  let correct: number;

  if (op === '+') {
    num1 = Math.floor(Math.random() * 12) + 1;
    num2 = Math.floor(Math.random() * 10) + 1;
    correct = num1 + num2;
  } else {
    num1 = Math.floor(Math.random() * 15) + 6;
    num2 = Math.floor(Math.random() * (num1 - 1)) + 1;
    correct = num1 - num2;
  }

  // Generate 4 distinct options
  const optionsSet = new Set<number>([correct]);
  while (optionsSet.size < 4) {
    const delta = Math.floor(Math.random() * 7) - 3;
    const fake = Math.max(1, correct + delta);
    optionsSet.add(fake);
  }

  const options = Array.from(optionsSet).sort(() => Math.random() - 0.5);
  return { num1, num2, op, correct, options };
}

export const MathQuestApp: React.FC<MathQuestAppProps> = ({ onBackToHome }) => {
  const [stars, setStars] = useState<number>(0);
  const [question, setQuestion] = useState<Question>(generateQuestion());
  const [selectedAns, setSelectedAns] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const handleSelect = (ans: number) => {
    if (selectedAns !== null) return;
    setSelectedAns(ans);
    if (ans === question.correct) {
      setIsCorrect(true);
      setStars((s) => s + 1);
      sound.playUnlockChime();
      setTimeout(() => {
        setQuestion(generateQuestion());
        setSelectedAns(null);
        setIsCorrect(null);
      }, 1200);
    } else {
      setIsCorrect(false);
      sound.playErrorTone();
      setTimeout(() => {
        setSelectedAns(null);
        setIsCorrect(null);
      }, 1000);
    }
  };

  return (
    <div id="math-quest-app-root" className="w-full h-full flex flex-col bg-slate-900 text-white select-none">
      {/* App Header */}
      <div className="h-14 px-4 bg-slate-800/80 border-b border-slate-700/60 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            id="math-back-btn"
            onClick={() => {
              sound.playKeyClick();
              onBackToHome();
            }}
            className="p-2 rounded-xl bg-slate-700/70 hover:bg-slate-600 text-slate-200 flex items-center gap-1.5 text-sm font-medium transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Home</span>
          </button>
          <h2 className="font-display font-semibold text-lg flex items-center gap-2">
            <span>🚀 Math Galaxy Quest</span>
          </h2>
        </div>

        {/* Stars counter */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300">
          <Star className="w-5 h-5 fill-amber-400 text-amber-400 animate-pulse" />
          <span className="font-bold text-base">{stars} Stars</span>
        </div>
      </div>

      {/* Main Quest Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-2xl mx-auto w-full">
        <div className="text-center mb-8">
          <span className="text-xs uppercase tracking-widest text-cyan-400 font-bold">Solve to fuel the rocket!</span>
          {/* Equation Card */}
          <div className="mt-4 p-8 rounded-3xl bg-slate-800/90 border-2 border-slate-700 shadow-2xl flex items-center justify-center gap-4">
            <span className="text-6xl font-display font-bold text-white">{question.num1}</span>
            <span className="text-5xl font-display font-bold text-cyan-400">{question.op}</span>
            <span className="text-6xl font-display font-bold text-white">{question.num2}</span>
            <span className="text-5xl font-display font-bold text-slate-400">=</span>
            <span className="text-6xl font-display font-bold text-amber-400 min-w-[70px] text-center">
              {selectedAns !== null ? selectedAns : '?'}
            </span>
          </div>
        </div>

        {/* Feedback message */}
        {isCorrect === true && (
          <div className="mb-4 flex items-center gap-2 text-emerald-400 font-bold text-lg animate-bounce">
            <CheckCircle2 className="w-6 h-6" />
            <span>Awesome job! +1 Star 🌟</span>
          </div>
        )}
        {isCorrect === false && (
          <div className="mb-4 text-rose-400 font-bold text-lg animate-shake">
            <span>Oops, try again! You can do it! 💪</span>
          </div>
        )}

        {/* Answer Options Grid */}
        <div className="grid grid-cols-2 gap-4 w-full max-w-md">
          {question.options.map((opt) => {
            const isThisSelected = selectedAns === opt;
            let btnStyle = 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700';
            if (isThisSelected) {
              btnStyle = isCorrect ? 'bg-emerald-600 text-white border-emerald-400 ring-4 ring-emerald-500/40' : 'bg-rose-600 text-white border-rose-400';
            }

            return (
              <button
                key={opt}
                id={`math-option-${opt}`}
                onClick={() => handleSelect(opt)}
                disabled={selectedAns !== null}
                className={`h-20 rounded-2xl border-2 text-3xl font-display font-bold transition-all shadow-md active:scale-95 flex items-center justify-center ${btnStyle}`}
              >
                {opt}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
