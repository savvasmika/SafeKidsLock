import React, { useState } from 'react';
import {
  Wifi,
  Volume2,
  Sun,
  Shield,
  Battery,
  Lock,
  Smartphone,
  CheckCircle,
  Copy,
  AlertTriangle,
  Terminal,
} from 'lucide-react';
import { sound } from '../../utils/audio';

interface SettingsAppProps {
  onClose: () => void;
  onOpenParentSettings: () => void;
}

export const SettingsApp: React.FC<SettingsAppProps> = ({ onClose, onOpenParentSettings }) => {
  const [brightness, setBrightness] = useState<number>(85);
  const [volume, setVolume] = useState<number>(70);
  const [wifiEnabled, setWifiEnabled] = useState<boolean>(true);
  const [bluetoothEnabled, setBluetoothEnabled] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'system' | 'security' | 'display'>('system');
  const [copiedCmd, setCopiedCmd] = useState<boolean>(false);

  const adbCommand = 'adb shell dpm set-device-owner com.tabletlock/.DeviceAdminReceiver';

  const handleCopy = () => {
    navigator.clipboard.writeText(adbCommand);
    setCopiedCmd(true);
    sound.playUnlockChime();
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  return (
    <div className="w-full h-full bg-slate-950 text-white flex flex-col select-none overflow-hidden">
      {/* Top Header */}
      <div className="bg-slate-900 border-b border-slate-800 p-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-slate-800 text-cyan-400 flex items-center justify-center font-bold">
            ⚙️
          </div>
          <h2 className="font-display font-bold text-sm sm:text-base text-white">Tablet Settings</h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenParentSettings}
            className="px-3 py-1 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold transition-colors cursor-pointer"
          >
            Open Parent Controls
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 rounded-xl bg-slate-800 text-xs font-bold text-slate-300 hover:text-white"
          >
            Exit
          </button>
        </div>
      </div>

      {/* Main Settings Body */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-4 overflow-hidden">
        {/* Left Tabs */}
        <div className="p-3 border-r border-slate-800 space-y-1 bg-slate-900/40">
          <button
            type="button"
            onClick={() => {
              sound.playKeyClick();
              setActiveTab('system');
            }}
            className={`w-full p-2.5 rounded-xl text-left text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer ${
              activeTab === 'system' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <Wifi className="w-4 h-4" />
            <span>Network & Tablet</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sound.playKeyClick();
              setActiveTab('display');
            }}
            className={`w-full p-2.5 rounded-xl text-left text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer ${
              activeTab === 'display' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <Sun className="w-4 h-4" />
            <span>Display & Sound</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sound.playKeyClick();
              setActiveTab('security');
            }}
            className={`w-full p-2.5 rounded-xl text-left text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer ${
              activeTab === 'security' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>Lock Task & Kiosk Security</span>
          </button>
        </div>

        {/* Right Content */}
        <div className="md:col-span-3 p-6 overflow-y-auto bg-slate-950 space-y-6">
          {activeTab === 'system' && (
            <div className="space-y-4 max-w-lg">
              <h3 className="font-display font-bold text-base text-white">Network & Device</h3>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Wifi className="w-5 h-5 text-cyan-400" />
                    <div>
                      <div className="font-bold text-xs text-white">Wi-Fi Network</div>
                      <div className="text-[11px] text-slate-400">Connected to Home_Family_5G</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={wifiEnabled}
                    onChange={(e) => setWifiEnabled(e.target.checked)}
                    className="toggle accent-cyan-500 w-5 h-5 cursor-pointer"
                  />
                </div>

                <div className="border-t border-slate-800 pt-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Smartphone className="w-5 h-5 text-purple-400" />
                    <div>
                      <div className="font-bold text-xs text-white">Bluetooth</div>
                      <div className="text-[11px] text-slate-400">Audio headphones connected</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={bluetoothEnabled}
                    onChange={(e) => setBluetoothEnabled(e.target.checked)}
                    className="toggle accent-cyan-500 w-5 h-5 cursor-pointer"
                  />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-xs text-white">
                    <Battery className="w-4 h-4 text-emerald-400" />
                    <span>Battery Status</span>
                  </div>
                  <span className="text-xs font-mono text-emerald-400">96% • Healthy</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full w-[96%]" />
                </div>
                <div className="text-[11px] text-slate-400">Estimated 8 hours remaining</div>
              </div>
            </div>
          )}

          {activeTab === 'display' && (
            <div className="space-y-4 max-w-lg">
              <h3 className="font-display font-bold text-base text-white">Display & Sound</h3>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-white">
                    <span className="flex items-center gap-2">
                      <Sun className="w-4 h-4 text-amber-400" />
                      <span>Screen Brightness</span>
                    </span>
                    <span className="font-mono text-amber-400">{brightness}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={brightness}
                    onChange={(e) => setBrightness(parseInt(e.target.value, 10))}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </div>

                <div className="space-y-2 pt-3 border-t border-slate-800">
                  <div className="flex items-center justify-between text-xs font-bold text-white">
                    <span className="flex items-center gap-2">
                      <Volume2 className="w-4 h-4 text-cyan-400" />
                      <span>Media Volume</span>
                    </span>
                    <span className="font-mono text-cyan-400">{volume}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={volume}
                    onChange={(e) => setVolume(parseInt(e.target.value, 10))}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-4 max-w-xl">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-400" />
                <h3 className="font-display font-bold text-base text-white">
                  Master Kiosk & Task Removal Protection
                </h3>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 space-y-3">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                  <CheckCircle className="w-4 h-4" />
                  <span>Unbreakable Device Owner Mode Active</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  When the session timer ends or the tablet is locked, the app engages Android 15
                  <strong> Lock Task Mode (COSU Kiosk)</strong>. This locks the hardware into this application
                  and prevents the child from swiping it away from recent tasks, accessing settings, or force stopping it.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Terminal className="w-4 h-4 text-cyan-400" />
                  <span>Device Owner Provisioning Command</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 font-mono text-xs text-cyan-300 border border-slate-800 break-all flex items-center justify-between gap-2">
                  <span>{adbCommand}</span>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors shrink-0"
                    title="Copy command"
                  >
                    {copiedCmd ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <div className="text-[11px] text-slate-400 leading-relaxed space-y-1">
                  <div>1. Enable USB Debugging on your Android tablet.</div>
                  <div>2. Connect to PC and run the command above via ADB.</div>
                  <div>3. The app becomes the permanent Device Owner: impossible to remove from tasks or uninstall without parent authorization.</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
