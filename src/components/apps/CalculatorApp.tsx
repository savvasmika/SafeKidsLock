import React, { useState } from 'react';
import { Delete, RotateCcw } from 'lucide-react';
import { sound } from '../../utils/audio';

interface CalculatorAppProps {
  onClose: () => void;
}

export const CalculatorApp: React.FC<CalculatorAppProps> = ({ onClose }) => {
  const [display, setDisplay] = useState<string>('0');
  const [prevVal, setPrevVal] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [newNumber, setNewNumber] = useState<boolean>(true);

  const handleDigit = (digit: string) => {
    sound.playKeyClick();
    if (newNumber || display === '0') {
      setDisplay(digit);
      setNewNumber(false);
    } else {
      if (display.length < 12) {
        setDisplay(display + digit);
      }
    }
  };

  const handleOp = (op: string) => {
    sound.playKeyClick();
    const current = parseFloat(display);
    if (prevVal !== null && operation) {
      const res = calculate(prevVal, current, operation);
      setDisplay(res.toString().slice(0, 12));
      setPrevVal(res);
    } else {
      setPrevVal(current);
    }
    setOperation(op);
    setNewNumber(true);
  };

  const calculate = (a: number, b: number, op: string): number => {
    switch (op) {
      case '+':
        return a + b;
      case '-':
        return a - b;
      case '×':
        return a * b;
      case '÷':
        return b !== 0 ? a / b : 0;
      default:
        return b;
    }
  };

  const handleEqual = () => {
    sound.playUnlockChime();
    if (prevVal !== null && operation) {
      const current = parseFloat(display);
      const res = calculate(prevVal, current, operation);
      setDisplay(res.toString().slice(0, 12));
      setPrevVal(null);
      setOperation(null);
      setNewNumber(true);
    }
  };

  const handleClear = () => {
    sound.playKeyClick();
    setDisplay('0');
    setPrevVal(null);
    setOperation(null);
    setNewNumber(true);
  };

  const handleDecimal = () => {
    sound.playKeyClick();
    if (!display.includes('.')) {
      setDisplay(display + '.');
      setNewNumber(false);
    }
  };

  const handleSqrt = () => {
    sound.playKeyClick();
    const current = parseFloat(display);
    if (current >= 0) {
      setDisplay(Math.sqrt(current).toString().slice(0, 12));
      setNewNumber(true);
    }
  };

  return (
    <div className="w-full h-full bg-slate-950 text-white flex flex-col justify-between p-4 sm:p-6 select-none max-w-xl mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
            =
          </div>
          <h2 className="font-display font-bold text-base text-slate-100">Tablet Calculator</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 hover:text-white"
        >
          Exit
        </button>
      </div>

      {/* Calculator Display */}
      <div className="my-auto bg-slate-900/90 border border-slate-800 rounded-3xl p-6 text-right shadow-inner">
        <div className="h-6 text-xs font-mono text-cyan-400 font-semibold">
          {prevVal !== null && `${prevVal} ${operation || ''}`}
        </div>
        <div className="font-display font-bold text-4xl sm:text-5xl text-white tracking-tight overflow-hidden text-ellipsis">
          {display}
        </div>
      </div>

      {/* Buttons Keypad */}
      <div className="grid grid-cols-4 gap-2 sm:gap-3">
        {/* Row 1 */}
        <button
          type="button"
          onClick={handleClear}
          className="p-4 rounded-2xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 font-bold text-lg active:scale-95 transition-transform"
        >
          AC
        </button>
        <button
          type="button"
          onClick={handleSqrt}
          className="p-4 rounded-2xl bg-slate-850 hover:bg-slate-800 text-cyan-400 font-bold text-lg active:scale-95 transition-transform"
        >
          √
        </button>
        <button
          type="button"
          onClick={() => handleOp('÷')}
          className="p-4 rounded-2xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-bold text-xl active:scale-95 transition-transform"
        >
          ÷
        </button>
        <button
          type="button"
          onClick={() => handleOp('×')}
          className="p-4 rounded-2xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-bold text-xl active:scale-95 transition-transform"
        >
          ×
        </button>

        {/* Row 2 */}
        {['7', '8', '9'].map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => handleDigit(d)}
            className="p-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-display font-bold text-xl active:scale-95 transition-transform"
          >
            {d}
          </button>
        ))}
        <button
          type="button"
          onClick={() => handleOp('-')}
          className="p-4 rounded-2xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-bold text-xl active:scale-95 transition-transform"
        >
          -
        </button>

        {/* Row 3 */}
        {['4', '5', '6'].map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => handleDigit(d)}
            className="p-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-display font-bold text-xl active:scale-95 transition-transform"
          >
            {d}
          </button>
        ))}
        <button
          type="button"
          onClick={() => handleOp('+')}
          className="p-4 rounded-2xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-bold text-xl active:scale-95 transition-transform"
        >
          +
        </button>

        {/* Row 4 */}
        {['1', '2', '3'].map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => handleDigit(d)}
            className="p-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-display font-bold text-xl active:scale-95 transition-transform"
          >
            {d}
          </button>
        ))}
        <button
          type="button"
          onClick={handleEqual}
          className="row-span-2 p-4 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-2xl active:scale-95 transition-transform shadow-lg shadow-cyan-500/20 flex items-center justify-center"
        >
          =
        </button>

        {/* Row 5 */}
        <button
          type="button"
          onClick={() => handleDigit('0')}
          className="col-span-2 p-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-display font-bold text-xl active:scale-95 transition-transform"
        >
          0
        </button>
        <button
          type="button"
          onClick={handleDecimal}
          className="p-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-display font-bold text-xl active:scale-95 transition-transform"
        >
          .
        </button>
      </div>
    </div>
  );
};
