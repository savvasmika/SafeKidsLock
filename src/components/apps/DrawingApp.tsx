import React, { useRef, useState, useEffect } from 'react';
import { Palette, Trash2, Undo2, Sparkles, ArrowLeft } from 'lucide-react';
import { sound } from '../../utils/audio';

interface DrawingAppProps {
  onBackToHome: () => void;
}

const COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#f59e0b', // amber
  '#10b981', // emerald
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#ffffff', // white
  '#0f172a', // eraser/slate
];

export const DrawingApp: React.FC<DrawingAppProps> = ({ onBackToHome }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [selectedColor, setSelectedColor] = useState<string>(COLORS[4]); // cyan
  const [brushSize, setBrushSize] = useState<number>(8);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [history, setHistory] = useState<ImageData[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (parent) {
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // save history state for undo
    const currentData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory((prev) => [...prev.slice(-10), currentData]);

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = selectedColor;
    ctx.lineWidth = brushSize;
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const last = history[history.length - 1];
    ctx.putImageData(last, 0, 0);
    setHistory((prev) => prev.slice(0, -1));
    sound.playKeyClick();
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const currentData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory((prev) => [...prev.slice(-10), currentData]);

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    sound.playKeyClick();
  };

  return (
    <div id="drawing-app-root" className="w-full h-full flex flex-col bg-slate-900 text-white select-none">
      {/* App Header */}
      <div className="h-14 px-4 bg-slate-800/80 border-b border-slate-700/60 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            id="drawing-back-btn"
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
            <Palette className="w-5 h-5 text-cyan-400" />
            <h2 className="font-display font-semibold text-lg">Kids Art Studio</h2>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            id="drawing-undo-btn"
            onClick={handleUndo}
            disabled={history.length === 0}
            className="p-2 rounded-xl bg-slate-700/60 hover:bg-slate-600 disabled:opacity-40 text-slate-200 transition-all"
            title="Undo"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            id="drawing-clear-btn"
            onClick={handleClear}
            className="p-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 transition-all flex items-center gap-1 text-xs font-semibold px-3"
            title="Clear Canvas"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 relative overflow-hidden bg-slate-950">
        <canvas
          id="kids-drawing-canvas"
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full h-full cursor-crosshair touch-none"
        />
      </div>

      {/* Brush & Color Toolbar */}
      <div className="h-16 px-4 bg-slate-800/90 border-t border-slate-700/60 flex items-center justify-between gap-4">
        {/* Colors */}
        <div className="flex items-center gap-2 overflow-x-auto py-1">
          {COLORS.map((col) => (
            <button
              key={col}
              id={`color-picker-${col}`}
              onClick={() => {
                setSelectedColor(col);
                sound.playKeyClick();
              }}
              style={{ backgroundColor: col }}
              className={`w-9 h-9 rounded-full transition-transform border-2 ${
                selectedColor === col ? 'scale-125 border-white shadow-lg ring-2 ring-cyan-400' : 'border-slate-700 hover:scale-110'
              }`}
            />
          ))}
        </div>

        {/* Brush Size */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-slate-400 font-medium">Size:</span>
          {[4, 8, 16, 28].map((size) => (
            <button
              key={size}
              id={`brush-size-${size}`}
              onClick={() => {
                setBrushSize(size);
                sound.playKeyClick();
              }}
              className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                brushSize === size ? 'bg-cyan-500 text-white' : 'bg-slate-700/70 text-slate-300 hover:bg-slate-600'
              }`}
            >
              <span
                className="rounded-full bg-current"
                style={{ width: Math.max(size / 3, 3), height: Math.max(size / 3, 3) }}
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
