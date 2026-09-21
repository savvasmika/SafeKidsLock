import React, { useState, useEffect } from 'react';
import {
  Shield,
  Smartphone,
  Lock,
  Unlock,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Copy,
  Check,
  Send,
  Sliders,
  Sparkles,
  Wifi,
  Battery,
  Layers,
  Activity,
  UserCheck,
  Key,
  Flame,
  HelpCircle,
} from 'lucide-react';
import { ParentSettings, FamilyRoomState, UnlockRequest, DeviceRole, InstalledApp } from '../types';
import { pairingService } from '../utils/pairingService';
import { sound } from '../utils/audio';

interface ParentDashboardProps {
  settings: ParentSettings;
  onUpdateSettings: (newSettings: ParentSettings) => void;
  onSwitchRole: (role: DeviceRole) => void;
  onOpenSettingsModal: () => void;
}

export const ParentDashboard: React.FC<ParentDashboardProps> = ({
  settings,
  onUpdateSettings,
  onSwitchRole,
  onOpenSettingsModal,
}) => {
  const [roomState, setRoomState] = useState<FamilyRoomState | null>(null);
  const [activeRequest, setActiveRequest] = useState<UnlockRequest | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<number>(30);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [customPinModalOpen, setCustomPinModalOpen] = useState<boolean>(false);
  const [customGeneratedPin, setCustomGeneratedPin] = useState<string>('');
  const [familyCodeInput, setFamilyCodeInput] = useState<string>(pairingService.getFamilyCode());
  const [isEditingFamilyCode, setIsEditingFamilyCode] = useState<boolean>(false);

  // Subscribe to real-time pairing events
  useEffect(() => {
    pairingService.start('parent', 'Parent Control Phone');

    const unsubRoom = pairingService.on('room:state', (room: FamilyRoomState) => {
      setRoomState(room);
      if (room.activeRequest && room.activeRequest.status === 'pending') {
        setActiveRequest(room.activeRequest);
      } else if (!room.activeRequest) {
        setActiveRequest(null);
      }
    });

    const unsubReq = pairingService.on('unlock:requested', (data: { request: UnlockRequest }) => {
      sound.playUnlockChime();
      setActiveRequest(data.request);
      setStatusMessage({
        type: 'info',
        text: `🚨 Νέο αίτημα ξεκλειδώματος από: ${data.request.childName}!`,
      });
    });

    const unsubApprove = pairingService.on('unlock:approved', (data: any) => {
      setActiveRequest(null);
      setStatusMessage({
        type: 'success',
        text: `✅ Το τάμπλετ ξεκλειδώθηκε για ${data.durationMinutes} λεπτά!`,
      });
    });

    const unsubReject = pairingService.on('unlock:rejected', () => {
      setActiveRequest(null);
      setStatusMessage({
        type: 'info',
        text: 'Αίτημα ξεκλειδώματος απορρίφθηκε.',
      });
    });

    const unsubLock = pairingService.on('remote:lock', () => {
      setStatusMessage({
        type: 'info',
        text: '🔒 Το τάμπλετ κλειδώθηκε εξ αποστάσεως.',
      });
    });

    // Initial fetch
    pairingService.fetchState().then((state) => {
      if (state) {
        setRoomState(state);
        if (state.activeRequest && state.activeRequest.status === 'pending') {
          setActiveRequest(state.activeRequest);
        }
      }
    });

    return () => {
      unsubRoom();
      unsubReq();
      unsubApprove();
      unsubReject();
      unsubLock();
    };
  }, []);

  // Format seconds to mm:ss
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle approving unlock request
  const handleApproveUnlock = async (autoUnlock: boolean = true) => {
    if (!activeRequest) return;
    setActionLoading('approve');
    sound.playUnlockChime();

    try {
      await pairingService.approveUnlock(
        activeRequest.id,
        selectedDuration,
        autoUnlock,
        'Γονέας (Parent Phone)'
      );
      setStatusMessage({
        type: 'success',
        text: autoUnlock
          ? `✨ Εγκρίθηκε! Το τάμπλετ ξεκλειδώθηκε αυτόματα για ${selectedDuration} λεπτά.`
          : `🔑 Ο κωδικός PIN (${activeRequest.pin}) στάλθηκε στο τάμπλετ!`,
      });
      setActiveRequest(null);
    } catch {
      setStatusMessage({ type: 'error', text: 'Σφάλμα κατά την έγκριση' });
    } finally {
      setActionLoading(null);
    }
  };

  // Handle rejecting unlock request
  const handleRejectUnlock = async () => {
    if (!activeRequest) return;
    setActionLoading('reject');
    sound.playErrorTone();

    try {
      await pairingService.rejectUnlock(activeRequest.id, 'Ώρα για διάβασμα / ύπνο');
      setActiveRequest(null);
      setStatusMessage({ type: 'info', text: 'Το αίτημα ξεκλειδώματος απορρίφθηκε.' });
    } catch {
      setStatusMessage({ type: 'error', text: 'Σφάλμα απόρριψης' });
    } finally {
      setActionLoading(null);
    }
  };

  // Remote instant lock
  const handleRemoteLockNow = async () => {
    setActionLoading('lock');
    sound.playLockSound();
    try {
      await pairingService.sendRemoteLock('Κλείδωμα από γονέα');
      setStatusMessage({ type: 'success', text: '🔒 Το τάμπλετ του παιδιού κλειδώθηκε άμεσα!' });
    } finally {
      setActionLoading(null);
    }
  };

  // Remote time extension
  const handleRemoteExtendTime = async (minutes: number) => {
    setActionLoading(`extend-${minutes}`);
    sound.playUnlockChime();
    try {
      await pairingService.sendRemoteExtend(minutes);
      setStatusMessage({ type: 'success', text: `⏳ Προστέθηκαν +${minutes} λεπτά στο τάμπλετ!` });
    } finally {
      setActionLoading(null);
    }
  };

  // Generate on-demand PIN
  const handleGenerateCustomPin = () => {
    const pin = Math.floor(1000 + Math.random() * 9000).toString();
    setCustomGeneratedPin(pin);
    setCustomPinModalOpen(true);
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleSaveFamilyCode = () => {
    if (familyCodeInput.trim()) {
      pairingService.setFamilyCode(familyCodeInput.trim().toUpperCase());
      setIsEditingFamilyCode(false);
      setStatusMessage({ type: 'success', text: `Κωδικός Οικογένειας ενημερώθηκε: ${familyCodeInput.toUpperCase()}` });
    }
  };

  // Toggle app enablement
  const handleToggleApp = (appId: string) => {
    const updatedApps = settings.allowedApps.map((a) =>
      a.id === appId ? { ...a, enabled: !a.enabled } : a
    );
    const updatedSettings = { ...settings, allowedApps: updatedApps };
    onUpdateSettings(updatedSettings);
  };

  const isChildOnline = roomState?.childDevice?.online ?? true;
  const childLockState = roomState?.childDevice?.lockState ?? 'locked';
  const childRemainingSec = roomState?.childDevice?.remainingSeconds ?? 0;
  const activeAppName = roomState?.childDevice?.activeApp ?? 'home';

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 text-slate-100 p-3 sm:p-6 select-none animate-in fade-in duration-300">
      {/* Top Header & Role Switcher */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-indigo-400 shadow-inner">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-display font-extrabold text-white tracking-tight">
                Λειτουργία Γονέα
              </h1>
              <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Parent Controller
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Έλεγχος τάμπλετ, άμεση παραλαβή αιτημάτων PIN & αυτόματο ξεκλείδωμα
            </p>
          </div>
        </div>

        {/* Mode Switcher & Quick Navigation */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onSwitchRole('child')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold transition-all cursor-pointer"
            title="Μετάβαση σε Λειτουργία Παιδιού"
          >
            <Smartphone className="w-4 h-4 text-cyan-400" />
            <span>Συσκευή Παιδιού</span>
          </button>
          <button
            type="button"
            onClick={() => onSwitchRole('dual_preview')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold transition-all cursor-pointer"
            title="Προβολή και των δύο συσκευών δίπλα-δίπλα"
          >
            <Layers className="w-4 h-4 text-amber-400" />
            <span>Διπλή Προβολή (Side-by-Side)</span>
          </button>
          <button
            type="button"
            onClick={onOpenSettingsModal}
            className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-md cursor-pointer"
          >
            <Sliders className="w-4 h-4" />
            <span>Ρυθμίσεις</span>
          </button>
        </div>
      </div>

      {/* Network Pairing Status Bar */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${isChildOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <span className="font-semibold text-slate-200">
              {isChildOnline ? '🟢 Συνδεδεμένο με Τάμπλετ Παιδιού' : '🟡 Αναζήτηση Τάμπλετ στο Δίκτυο...'}
            </span>
          </div>
          <span className="text-slate-500 hidden sm:inline">•</span>
          <div className="text-slate-400 hidden sm:flex items-center gap-1.5">
            <Wifi className="w-3.5 h-3.5 text-cyan-400" />
            <span>Αυτόματη Ανίχνευση Τοπικού Δικτύου: <strong>Ενεργή</strong></span>
          </div>
        </div>

        {/* Family Room Code Tag */}
        <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
          <span className="text-slate-400">Κωδικός Οικογένειας:</span>
          {isEditingFamilyCode ? (
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={familyCodeInput}
                onChange={(e) => setFamilyCodeInput(e.target.value)}
                className="bg-slate-800 text-cyan-300 font-mono text-xs px-2 py-0.5 rounded border border-cyan-500/50 outline-none w-28 uppercase"
                placeholder="FAMILY-1001"
              />
              <button
                type="button"
                onClick={handleSaveFamilyCode}
                className="px-2 py-0.5 bg-cyan-600 text-white rounded text-[10px] font-bold"
              >
                OK
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <span className="font-mono font-bold text-cyan-300 tracking-wider">
                {pairingService.getFamilyCode()}
              </span>
              <button
                type="button"
                onClick={() => handleCopyText(pairingService.getFamilyCode())}
                className="text-slate-400 hover:text-white p-0.5"
                title="Αντιγραφή Κωδικού"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <button
                type="button"
                onClick={() => setIsEditingFamilyCode(true)}
                className="text-[10px] text-slate-500 hover:text-slate-300 underline ml-1"
              >
                Αλλαγή
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Global Status Message Toast */}
      {statusMessage && (
        <div
          className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs font-semibold animate-in fade-in slide-in-from-top-1 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-200'
              : statusMessage.type === 'error'
              ? 'bg-rose-950/80 border-rose-500/50 text-rose-200'
              : 'bg-indigo-950/80 border-indigo-500/50 text-indigo-200'
          }`}
        >
          <span>{statusMessage.text}</span>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="text-xs opacity-70 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      )}

      {/* 🚨 ACTIVE REAL-TIME UNLOCK REQUEST (PRIORITY CARD) */}
      {activeRequest && (
        <div
          id="parent-active-unlock-alert"
          className="bg-gradient-to-r from-amber-950/95 via-slate-900 to-amber-950/90 border-2 border-amber-500/80 rounded-3xl p-6 shadow-2xl backdrop-blur-lg relative overflow-hidden animate-pulse duration-1000"
        >
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                <span>🚨 Επείγον Αίτημα Ξεκλειδώματος Τάμπλετ!</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-display font-extrabold text-white">
                Ο/Η <span className="text-amber-300">{activeRequest.childName}</span> ζητάει κωδικό ξεκλειδώματος
              </h2>
              <p className="text-xs text-slate-300">
                Το τάμπλετ είναι κλειδωμένο και περιμένει την έγκρισή σας ή την είσοδο του παρακάτω PIN:
              </p>
            </div>

            {/* Generated 4-Digit Matching PIN Box */}
            <div className="bg-slate-950/90 border-2 border-amber-400/80 rounded-2xl p-4 text-center shrink-0 shadow-lg">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                Κωδικός PIN Τάμπλετ
              </span>
              <div className="text-4xl font-mono font-black tracking-[10px] text-amber-300">
                {activeRequest.pin}
              </div>
              <button
                type="button"
                onClick={() => handleCopyText(activeRequest.pin)}
                className="mt-2 flex items-center justify-center gap-1.5 text-[11px] text-amber-300 hover:text-white mx-auto font-medium"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? 'Αντιγράφηκε!' : 'Αντιγραφή PIN'}</span>
              </button>
            </div>
          </div>

          {/* Duration Selector & Action Buttons */}
          <div className="mt-6 pt-5 border-t border-amber-500/30 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-300">Διάρκεια Ξεκλειδώματος:</span>
              <div className="flex flex-wrap gap-1.5">
                {[15, 30, 45, 60, 120].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setSelectedDuration(mins)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                      selectedDuration === mins
                        ? 'bg-amber-500 text-slate-950 shadow-md'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    }`}
                  >
                    {mins}λ
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              <button
                type="button"
                disabled={actionLoading === 'approve'}
                onClick={() => handleApproveUnlock(true)}
                className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-display font-bold text-sm shadow-xl shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>✨ Έγκριση & Άμεσο Ξεκλείδωμα</span>
              </button>

              <button
                type="button"
                disabled={actionLoading === 'approve'}
                onClick={() => handleApproveUnlock(false)}
                className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs shadow-md active:scale-95 transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Αποστολή PIN στο Τάμπλετ</span>
              </button>

              <button
                type="button"
                disabled={actionLoading === 'reject'}
                onClick={handleRejectUnlock}
                className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-2xl bg-slate-800 hover:bg-rose-900/50 text-rose-300 border border-rose-500/30 text-xs font-semibold active:scale-95 transition-all cursor-pointer"
              >
                <XCircle className="w-4 h-4" />
                <span>Απόρριψη</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Live Tablet Monitor + Remote Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Live Tablet Status & Remote Control Bar */}
        <div className="lg:col-span-2 space-y-6">
          {/* Live Tablet Status Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-2xl shadow-inner">
                  {settings.childAvatar}
                </div>
                <div>
                  <h3 className="text-lg font-display font-bold text-white flex items-center gap-2">
                    <span>Τάμπλετ {settings.childName}</span>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        childLockState === 'unlocked'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}
                    >
                      {childLockState === 'unlocked' ? '🟢 ΞΕΚΛΕΙΔΩΤΟ' : '🔒 ΚΛΕΙΔΩΜΕΝΟ'}
                    </span>
                  </h3>
                  <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                    <span>Μοντέλο: Android 15 Tablet Kiosk</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Battery className="w-3.5 h-3.5 text-emerald-400" />
                      <span>95%</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Icon */}
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl ${
                  childLockState === 'unlocked'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
              >
                {childLockState === 'unlocked' ? <Unlock className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
              </div>
            </div>

            {/* Status Information Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 mb-6">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Κατάσταση
                </span>
                <span className="text-xs font-semibold text-slate-200">
                  {childLockState === 'unlocked' ? 'Ενεργή Συνεδρία Χρήσης' : 'Σε Αναμονή Έγκρισης'}
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Χρόνος που Απομένει
                </span>
                <span className="text-sm font-mono font-bold text-cyan-300">
                  {childLockState === 'unlocked' && childRemainingSec > 0
                    ? formatTimer(childRemainingSec)
                    : `${settings.unlockDurationMinutes} λεπτά (προκαθορισμένο)`}
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Τρέχουσα Εφαρμογή
                </span>
                <span className="text-xs font-semibold text-indigo-300 capitalize">
                  {activeAppName === 'home' ? '📱 Αρχική Οθόνη' : `🎮 ${activeAppName}`}
                </span>
              </div>
            </div>

            {/* Quick Remote Actions */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Άμεσες Ενέργειες Τηλεχειρισμού
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  disabled={actionLoading === 'lock' || childLockState === 'locked'}
                  onClick={handleRemoteLockNow}
                  className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-rose-950/70 hover:bg-rose-900 border border-rose-500/40 text-rose-200 text-xs font-bold active:scale-95 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer shadow"
                >
                  <Lock className="w-4 h-4 text-rose-400" />
                  <span>🔒 Άμεσο Κλείδωμα</span>
                </button>

                <button
                  type="button"
                  disabled={actionLoading?.startsWith('extend')}
                  onClick={() => handleRemoteExtendTime(15)}
                  className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-indigo-950/70 hover:bg-indigo-900 border border-indigo-500/40 text-indigo-200 text-xs font-bold active:scale-95 transition-all cursor-pointer shadow"
                >
                  <Clock className="w-4 h-4 text-indigo-400" />
                  <span>+15 Λεπτά</span>
                </button>

                <button
                  type="button"
                  disabled={actionLoading?.startsWith('extend')}
                  onClick={() => handleRemoteExtendTime(30)}
                  className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-cyan-950/70 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-200 text-xs font-bold active:scale-95 transition-all cursor-pointer shadow"
                >
                  <Clock className="w-4 h-4 text-cyan-400" />
                  <span>+30 Λεπτά</span>
                </button>
              </div>
            </div>
          </div>

          {/* Allowed Apps Remote Manager */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-display font-bold text-white">
                  Επιτρεπόμενες Εφαρμογές Τάμπλετ
                </h3>
                <p className="text-xs text-slate-400">
                  Ενεργοποιήστε ή απενεργοποιήστε τις εφαρμογές που βλέπει το παιδί στο τάμπλετ
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {settings.allowedApps.map((app) => (
                <div
                  key={app.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-slate-800"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{app.iconEmoji}</span>
                    <div>
                      <h4 className="text-xs font-bold text-white">{app.name}</h4>
                      <p className="text-[10px] text-slate-400">{app.ageRating} • {app.category}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleApp(app.id)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                      app.enabled
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-slate-800 text-slate-500 border border-slate-700'
                    }`}
                  >
                    {app.enabled ? 'Ενεργή' : 'Ανενεργή'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: PIN Generator, Pairing Guide & Request Log */}
        <div className="space-y-6">
          {/* Emergency PIN Generator Card */}
          <div className="bg-gradient-to-br from-indigo-950/80 to-slate-900 border border-indigo-500/30 rounded-3xl p-6 shadow-xl backdrop-blur-md space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-display font-bold text-white">
                  Δημιουργία PIN Έκτακτης Ανάγκης
                </h3>
                <p className="text-[11px] text-slate-400">
                  Δημιουργήστε νέο κωδικό για χειροκίνητο ξεκλείδωμα
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGenerateCustomPin}
              className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/20 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Δημιουργία Νέου 4-ψήφιου PIN</span>
            </button>

            <div className="text-[11px] text-slate-400 bg-slate-950/60 p-3 rounded-2xl border border-slate-800 leading-relaxed">
              💡 <strong>Μόνιμος Κωδικός Έκτακτης Ανάγκης:</strong> Ο κωδικός <strong>`0000`</strong> λειτουργεί πάντα στο πληκτρολόγιο του τάμπλετ για άμεση παράκαμψη από τον γονέα.
            </div>
          </div>

          {/* Network Pairing Info Box */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3 text-xs">
            <h4 className="font-display font-bold text-white flex items-center gap-2">
              <Wifi className="w-4 h-4 text-cyan-400" />
              <span>Πώς λειτουργεί η σύνδεση</span>
            </h4>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              1. Ανοίξτε την εφαρμογή στο τάμπλετ του παιδιού και επιλέξτε <strong>«Συσκευή Παιδιού»</strong>.<br />
              2. Ανοίξτε την εφαρμογή στο κινητό σας και επιλέξτε <strong>«Λειτουργία Γονέα»</strong>.<br />
              3. Οι συσκευές συνδέονται αυτόματα μέσω του ίδιου δικτύου Wi-Fi και συγχρονίζουν σε πραγματικό χρόνο!
            </p>
          </div>

          {/* Recent Unlock Activity Log */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
            <h4 className="font-display font-bold text-white text-xs flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-400" />
              <span>Ιστορικό Αιτημάτων & Ενεργειών</span>
            </h4>
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1 text-xs">
              {roomState?.recentRequests && roomState.recentRequests.length > 0 ? (
                roomState.recentRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-[11px]"
                  >
                    <div>
                      <span className="font-semibold text-slate-200">{req.childName}</span>
                      <span className="text-slate-500 ml-1">({req.durationMinutes}λ)</span>
                      <div className="text-[10px] text-slate-400">
                        {new Date(req.requestedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          req.status === 'approved'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : req.status === 'rejected'
                            ? 'bg-rose-500/20 text-rose-300'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}
                      >
                        {req.status === 'approved' ? 'Εγκρίθηκε' : req.status === 'rejected' ? 'Απορρίφθηκε' : 'Σε αναμονή'}
                      </span>
                      <div className="font-mono text-cyan-300 text-[10px] mt-0.5">PIN: {req.pin}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-slate-500 text-xs">
                  Δεν υπάρχουν πρόσφατα αιτήματα
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Custom Generated PIN Modal */}
      {customPinModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-indigo-500/60 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 mx-auto flex items-center justify-center text-indigo-400">
              <Key className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Νέος Κωδικός Ξεκλειδώματος</h3>
            <p className="text-xs text-slate-300">
              Πληκτρολογήστε αυτόν τον κωδικό στην οθόνη του τάμπλετ για άμεσο ξεκλείδωμα:
            </p>

            <div className="bg-slate-950 border-2 border-indigo-400/80 rounded-2xl p-4 my-2">
              <div className="text-4xl font-mono font-black tracking-[12px] text-cyan-300">
                {customGeneratedPin}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleCopyText(customGeneratedPin)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-bold"
              >
                {copiedCode ? 'Αντιγράφηκε!' : 'Αντιγραφή'}
              </button>
              <button
                type="button"
                onClick={() => setCustomPinModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
              >
                Κλείσιμο
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
