import React, { useEffect } from 'react';
import { Delete, X } from 'lucide-react';
import { sound } from '../utils/audio';

interface KeypadProps {
  value: string;
  maxLength?: number;
  onChange: (val: string) => void;
  onSubmit?: (val: string) => void;
  disabled?: boolean;
  isError?: boolean;
}

export const Keypad: React.FC<KeypadProps> = ({
  value,
  maxLength = 4,
  onChange,
  onSubmit,
  disabled = false,
  isError = false,
}) => {
  const handleDigit = (digit: string) => {
    if (disabled) return;
    if (value.length < maxLength) {
      sound.playKeyClick();
      const newVal = value + digit;
      onChange(newVal);
      if (newVal.length === maxLength && onSubmit) {
        onSubmit(newVal);
      }
    }
  };

  const handleDelete = () => {
    if (disabled || value.length === 0) return;
    sound.playKeyClick();
    onChange(value.slice(0, -1));
  };

  const handleClear = () => {
    if (disabled || value.length === 0) return;
    sound.playKeyClick();
    onChange('');
  };

  // Physical keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (disabled) return;
      if (e.key >= '0' && e.key <= '9') {
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        handleDelete();
      } else if (e.key === 'Escape') {
        handleClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [value, disabled]);

  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

  return (
    <div id="pin-keypad-container" className="flex flex-col items-center select-none">
      {/* 4 Digit Boxes */}
      <div
        id="pin-boxes-row"
        className={`flex items-center gap-3.5 mb-6 transition-transform ${
          isError ? 'animate-bounce text-rose-400' : ''
        }`}
      >
        {Array.from({ length: maxLength }).map((_, index) => {
          const isFilled = index < value.length;
          const isCurrent = index === value.length && !disabled;
          return (
            <div
              key={index}
              id={`pin-slot-${index}`}
              className={`w-14 h-16 rounded-2xl flex items-center justify-center font-mono text-3xl font-bold transition-all duration-150 border-2 ${
                isFilled
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.3)] scale-105'
                  : isCurrent
                  ? 'bg-slate-800/80 border-cyan-500/60 ring-2 ring-cyan-500/30'
                  : 'bg-slate-900/60 border-slate-700/60 text-slate-500'
              } ${isError ? 'border-rose-500 bg-rose-950/30 text-rose-400' : ''}`}
            >
              {isFilled ? (
                <span className="tracking-widest">{value[index]}</span>
              ) : (
                <span className="w-2.5 h-2.5 rounded-full bg-slate-600/70" />
              )}
            </div>
          );
        })}
      </div>

      {/* Numerical Grid */}
      <div id="pin-number-grid" className="grid grid-cols-3 gap-3 w-72 max-w-full">
        {digits.map((digit) => (
          <button
            key={digit}
            id={`keypad-btn-${digit}`}
            type="button"
            disabled={disabled}
            onClick={() => handleDigit(digit)}
            className="h-16 rounded-2xl bg-slate-800/80 hover:bg-slate-700 active:scale-95 active:bg-cyan-600/40 text-2xl font-bold font-sans text-slate-100 transition-all border border-slate-700/50 hover:border-cyan-500/40 shadow-sm flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {digit}
          </button>
        ))}

        {/* Clear Button */}
        <button
          id="keypad-btn-clear"
          type="button"
          disabled={disabled || value.length === 0}
          onClick={handleClear}
          title="Clear PIN"
          className="h-16 rounded-2xl bg-slate-900/60 hover:bg-slate-800 active:scale-95 text-slate-400 hover:text-slate-200 transition-all border border-slate-800 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Zero */}
        <button
          id="keypad-btn-0"
          type="button"
          disabled={disabled}
          onClick={() => handleDigit('0')}
          className="h-16 rounded-2xl bg-slate-800/80 hover:bg-slate-700 active:scale-95 active:bg-cyan-600/40 text-2xl font-bold font-sans text-slate-100 transition-all border border-slate-700/50 hover:border-cyan-500/40 shadow-sm flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
        >
          0
        </button>

        {/* Backspace Button */}
        <button
          id="keypad-btn-backspace"
          type="button"
          disabled={disabled || value.length === 0}
          onClick={handleDelete}
          title="Delete last digit"
          className="h-16 rounded-2xl bg-slate-900/60 hover:bg-slate-800 active:scale-95 text-slate-400 hover:text-rose-300 transition-all border border-slate-800 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Delete className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};
