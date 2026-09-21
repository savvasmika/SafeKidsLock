import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  RotateCcw,
  Sparkles,
  Zap,
  Image as ImageIcon,
  Check,
  Video,
} from 'lucide-react';
import { sound } from '../../utils/audio';

interface CameraAppProps {
  onClose: () => void;
}

export const CameraApp: React.FC<CameraAppProps> = ({ onClose }) => {
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [filter, setFilter] = useState<string>('none');
  const [photos, setPhotos] = useState<string[]>([]);
  const [flashActive, setFlashActive] = useState<boolean>(false);
  const [mode, setMode] = useState<'photo' | 'video'>('photo');
  const [hasWebcam, setHasWebcam] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    const startCamera = async () => {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode },
            audio: false,
          });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            setHasWebcam(true);
          }
        }
      } catch (err) {
        setHasWebcam(false);
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [facingMode]);

  const handleCapture = () => {
    sound.playUnlockChime();
    setFlashActive(true);
    setTimeout(() => setFlashActive(false), 150);

    // Save snap
    const newPhotoId = `photo_${Date.now()}`;
    setPhotos((prev) => [newPhotoId, ...prev]);
  };

  const filters = [
    { id: 'none', label: 'Normal', css: '' },
    { id: 'sepia', label: 'Vintage', css: 'sepia(0.6) contrast(1.1)' },
    { id: 'cyber', label: 'Neon Cyber', css: 'hue-rotate(180deg) saturate(1.8)' },
    { id: 'warm', label: 'Sunny Warm', css: 'saturate(1.5) brightness(1.1)' },
    { id: 'bw', label: 'B&W Film', css: 'grayscale(1)' },
  ];

  return (
    <div className="w-full h-full bg-black text-white flex flex-col justify-between select-none relative overflow-hidden">
      {/* Flash effect overlay */}
      {flashActive && <div className="absolute inset-0 bg-white z-50 pointer-events-none animate-out fade-out duration-200" />}

      {/* Top Camera Controls */}
      <div className="bg-black/80 backdrop-blur-md p-3.5 flex items-center justify-between z-20">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => sound.playKeyClick()}
            className="p-2 rounded-full bg-slate-900 text-amber-400 hover:bg-slate-800"
            title="Flash"
          >
            <Zap className="w-4 h-4" />
          </button>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Tablet Camera (1080p 60fps)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'))}
            className="p-2 rounded-full bg-slate-900 text-slate-200 hover:bg-slate-800 transition-colors"
            title="Flip Front/Rear Camera"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 rounded-xl bg-slate-800 text-xs font-bold text-white hover:bg-slate-700"
          >
            Exit
          </button>
        </div>
      </div>

      {/* Viewfinder Area */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-slate-950">
        {hasWebcam ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
            style={{ filter: filters.find((f) => f.id === filter)?.css }}
          />
        ) : (
          /* Simulated HD Viewfinder Graphic */
          <div
            className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 relative"
            style={{ filter: filters.find((f) => f.id === filter)?.css }}
          >
            <div className="w-48 h-48 rounded-full border-2 border-dashed border-cyan-400/40 flex items-center justify-center relative animate-pulse">
              <Camera className="w-16 h-16 text-cyan-400/80" />
              {/* Focus brackets */}
              <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-cyan-400" />
              <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-cyan-400" />
              <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-cyan-400" />
              <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-cyan-400" />
            </div>

            <div className="mt-4 text-xs font-medium text-slate-300">
              High-Definition Camera Viewfinder Active
            </div>
            <div className="text-[11px] text-cyan-400/80">
              Tap Shutter below to snap a tablet photo
            </div>
          </div>
        )}

        {/* Framing Grid overlay */}
        <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 border border-white/10">
          <div className="border-r border-b border-white/10" />
          <div className="border-r border-b border-white/10" />
          <div className="border-b border-white/10" />
          <div className="border-r border-b border-white/10" />
          <div className="border-r border-b border-white/10" />
          <div className="border-b border-white/10" />
          <div className="border-r border-white/10" />
          <div className="border-r border-white/10" />
          <div />
        </div>
      </div>

      {/* Filter Selector Strip */}
      <div className="bg-black/90 px-4 py-2 flex items-center justify-center gap-2 overflow-x-auto z-20">
        {filters.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => {
              sound.playKeyClick();
              setFilter(f.id);
            }}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              filter === f.id
                ? 'bg-cyan-500 text-slate-950 shadow-md font-bold'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Bottom Shutter Controls */}
      <div className="bg-black p-4 flex items-center justify-around z-20">
        {/* Gallery Preview Thumbnail */}
        <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center overflow-hidden">
          {photos.length > 0 ? (
            <div className="w-full h-full bg-cyan-600 flex items-center justify-center text-xs font-bold">
              {photos.length}
            </div>
          ) : (
            <ImageIcon className="w-5 h-5 text-slate-500" />
          )}
        </div>

        {/* Big Shutter Button */}
        <button
          type="button"
          onClick={handleCapture}
          className="w-18 h-18 rounded-full border-4 border-white p-1.5 hover:scale-105 active:scale-95 transition-transform cursor-pointer flex items-center justify-center"
        >
          <div className="w-full h-full rounded-full bg-white hover:bg-cyan-200 transition-colors" />
        </button>

        {/* Mode Switcher */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMode('photo')}
            className={`text-xs font-bold px-2 py-1 rounded-lg ${mode === 'photo' ? 'text-amber-400' : 'text-slate-500'}`}
          >
            PHOTO
          </button>
          <button
            type="button"
            onClick={() => setMode('video')}
            className={`text-xs font-bold px-2 py-1 rounded-lg ${mode === 'video' ? 'text-amber-400' : 'text-slate-500'}`}
          >
            VIDEO
          </button>
        </div>
      </div>
    </div>
  );
};
