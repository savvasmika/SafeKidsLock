import React, { useState } from 'react';
import { PhoneCall, AlertTriangle, X, Shield, Phone } from 'lucide-react';
import { sound } from '../utils/audio';

interface EmergencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  emergencyNumber: string;
  parentEmail: string;
}

export const EmergencyModal: React.FC<EmergencyModalProps> = ({
  isOpen,
  onClose,
  emergencyNumber,
  parentEmail,
}) => {
  const [dialing, setDialing] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDial = (number: string) => {
    sound.playKeyClick();
    setDialing(number);
    setTimeout(() => {
      setDialing(null);
      onClose();
    }, 2500);
  };

  return (
    <div
      id="emergency-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        id="emergency-modal-card"
        className="w-full max-w-sm rounded-3xl bg-slate-900 border-2 border-rose-500/60 p-6 shadow-2xl animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-rose-400">
            <AlertTriangle className="w-6 h-6" />
            <h2 className="font-display font-bold text-lg text-white">Emergency Services</h2>
          </div>
          <button
            id="close-emergency-btn"
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-slate-300 text-xs mb-5">
          Emergency calls can be placed without unlocking the tablet. Choose an option below:
        </p>

        {dialing ? (
          <div className="p-6 rounded-2xl bg-rose-950/50 border border-rose-500/40 text-center animate-pulse">
            <PhoneCall className="w-10 h-10 text-rose-400 mx-auto mb-2" />
            <p className="font-bold text-lg text-white">Calling {dialing}...</p>
            <p className="text-xs text-rose-300 mt-1">Connecting emergency line</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* 911 button */}
            <button
              id="emergency-call-911"
              onClick={() => handleDial(emergencyNumber || '911')}
              className="w-full p-4 rounded-2xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-bold flex items-center justify-between shadow-lg transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <Phone className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="text-sm">Emergency Services</div>
                  <div className="text-xs text-rose-200">Local Dispatch ({emergencyNumber || '911'})</div>
                </div>
              </div>
              <span className="text-xl font-mono">CALL</span>
            </button>

            {/* Parent contact info */}
            <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300">
              <div className="flex items-center gap-2 text-cyan-400 font-semibold mb-1">
                <Shield className="w-4 h-4" />
                <span>Parental Emergency Contact</span>
              </div>
              <div className="text-slate-400">
                Primary Parent: <span className="text-slate-200 font-mono">{parentEmail}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
