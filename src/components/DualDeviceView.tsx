import React from 'react';
import { Smartphone, Tablet, Sparkles, ArrowRightLeft, Layers, Shield } from 'lucide-react';
import { ParentSettings, DeviceRole } from '../types';
import { ParentDashboard } from './ParentDashboard';

interface DualDeviceViewProps {
  settings: ParentSettings;
  onUpdateSettings: (newSettings: ParentSettings) => void;
  onSwitchRole: (role: DeviceRole) => void;
  onOpenSettingsModal: () => void;
  childContent: React.ReactNode;
}

export const DualDeviceView: React.FC<DualDeviceViewProps> = ({
  settings,
  onUpdateSettings,
  onSwitchRole,
  onOpenSettingsModal,
  childContent,
}) => {
  return (
    <div className="w-full max-w-[1700px] mx-auto p-2 sm:p-4 space-y-4 select-none">
      {/* Top Banner explaining Dual View */}
      <div className="bg-gradient-to-r from-indigo-950/90 via-slate-900 to-cyan-950/90 border border-indigo-500/40 rounded-3xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-indigo-300">
            <ArrowRightLeft className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-display font-bold text-white text-sm flex items-center gap-2">
              <span>Διπλή Προβολή Προσομοίωσης (Side-by-Side Dual Mode)</span>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30">
                Live Network Sync
              </span>
            </h2>
            <p className="text-slate-400 text-[11px]">
              Δοκιμάστε την αλληλεπίδραση: Πατήστε <strong>«Ζήτησε Κωδικό»</strong> στο τάμπλετ και δείτε το PIN να εμφανίζεται αυτόματα στη συσκευή του γονέα!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onSwitchRole('parent')}
            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all cursor-pointer shadow"
          >
            Μόνο Γονέας (Parent Only)
          </button>
          <button
            type="button"
            onClick={() => onSwitchRole('child')}
            className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition-all cursor-pointer shadow"
          >
            Μόνο Τάμπλετ Παιδιού (Child Only)
          </button>
        </div>
      </div>

      {/* Dual Screen Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left Side (5 cols): Parent Phone Controller View */}
        <div className="xl:col-span-5 bg-slate-900/60 border border-indigo-500/30 rounded-3xl p-3 shadow-2xl backdrop-blur-md">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800 px-2">
            <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs uppercase tracking-wider">
              <Smartphone className="w-4 h-4 text-indigo-400" />
              <span>Συσκευή 1: Κινητό Γονέα (Parent Dashboard)</span>
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>

          <div className="max-h-[820px] overflow-y-auto pr-1">
            <ParentDashboard
              settings={settings}
              onUpdateSettings={onUpdateSettings}
              onSwitchRole={onSwitchRole}
              onOpenSettingsModal={onOpenSettingsModal}
            />
          </div>
        </div>

        {/* Right Side (7 cols): Child Tablet Kiosk View */}
        <div className="xl:col-span-7 bg-slate-900/60 border border-cyan-500/30 rounded-3xl p-3 shadow-2xl backdrop-blur-md">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800 px-2">
            <div className="flex items-center gap-2 text-cyan-300 font-bold text-xs uppercase tracking-wider">
              <Tablet className="w-4 h-4 text-cyan-400" />
              <span>Συσκευή 2: Τάμπλετ Παιδιού (Child Tablet Kiosk)</span>
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
          </div>

          <div className="w-full flex justify-center">
            {childContent}
          </div>
        </div>
      </div>
    </div>
  );
};
