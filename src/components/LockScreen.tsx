import React, { useState, useEffect } from 'react';
import {
  Lock,
  Mail,
  RefreshCw,
  Settings,
  PhoneCall,
  CheckCircle2,
  Clock,
  Shield,
  Loader2,
  AlertCircle,
  Inbox,
  Send,
  Wifi,
  Smartphone,
  Sparkles,
} from 'lucide-react';
import { ParentSettings, OtpRecord, UnlockRequest } from '../types';
import { Keypad } from './Keypad';
import { sound } from '../utils/audio';
import { TabType } from './ParentSettingsModal';
import { pairingService } from '../utils/pairingService';

export interface DispatchStatus {
  success: boolean;
  notConfigured?: boolean;
  deliveryMethod?: string;
  previewUrl?: string;
  error?: string;
}

interface LockScreenProps {
  settings: ParentSettings;
  activeOtp: OtpRecord | null;
  isSendingCode?: boolean;
  lastDispatchResult?: DispatchStatus | null;
  sessionExpiredNotice?: boolean;
  onDismissExpiredNotice?: () => void;
  onRequestNewOtp: () => Promise<DispatchStatus | void> | void;
  onVerifyOtp: (pin: string) => Promise<boolean> | boolean;
  onOpenSettings: (tab?: TabType) => void;
  onOpenEmergency: () => void;
}

export const LockScreen: React.FC<LockScreenProps> = ({
  settings,
  activeOtp,
  isSendingCode = false,
  lastDispatchResult = null,
  sessionExpiredNotice = false,
  onDismissExpiredNotice,
  onRequestNewOtp,
  onVerifyOtp,
  onOpenSettings,
  onOpenEmergency,
}) => {
  const [pin, setPin] = useState<string>('');
  const [isError, setIsError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);
  const [resendCooldown, setResendCooldown] = useState<number>(0);
  const [failedAttempts, setFailedAttempts] = useState<number>(0);
  const [codeDispatched, setCodeDispatched] = useState<boolean>(false);
  const [dispatchedAt, setDispatchedAt] = useState<Date | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [networkRequestActive, setNetworkRequestActive] = useState<boolean>(false);
  const [isParentConnected, setIsParentConnected] = useState<boolean>(true);

  // Kiosk mode defense: trap browser Back button to prevent escaping lock
  useEffect(() => {
    window.history.pushState(null, '', window.location.href);
    const handlePopState = () => {
      window.history.pushState(null, '', window.location.href);
      sound.playErrorBuzz();
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Listen for real-time unlock from paired parent phone
  useEffect(() => {
    const unsubApprove = pairingService.on('unlock:approved', (data: any) => {
      sound.playUnlockChime();
      if (data.autoUnlock) {
        // Auto unlock tablet directly!
        onVerifyOtp('0000');
      } else if (data.pin) {
        setPin(data.pin);
        onVerifyOtp(data.pin);
      }
    });

    const unsubState = pairingService.on('room:state', (room: any) => {
      const hasOnlineParent = room?.parentDevices?.some((p: any) => p.online) ?? false;
      setIsParentConnected(hasOnlineParent);
    });

    return () => {
      unsubApprove();
      unsubState();
    };
  }, [onVerifyOtp]);

  // Sync state if an activeOtp already exists
  useEffect(() => {
    if (activeOtp) {
      setCodeDispatched(true);
      setDispatchedAt(new Date(activeOtp.generatedAt));
    }
  }, [activeOtp]);

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Lockout cooldown timer
  useEffect(() => {
    if (cooldownRemaining <= 0) return;
    const interval = setInterval(() => {
      setCooldownRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldownRemaining]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const handleSendCodeClick = async () => {
    sound.playKeyClick();
    setPin('');
    setIsError(false);
    setErrorMessage(null);

    try {
      // 1. Send real-time pairing request to Parent Device over network
      setNetworkRequestActive(true);
      await pairingService.requestUnlock(settings.childName, settings.unlockDurationMinutes);

      // 2. Also dispatch email as backup
      await onRequestNewOtp();

      setCodeDispatched(true);
      setDispatchedAt(new Date());
      setResendCooldown(25);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to dispatch request. Please check network.');
    }
  };

  const handlePinSubmit = async (enteredPin: string) => {
    if (cooldownRemaining > 0 || isVerifying) return;

    setIsVerifying(true);
    try {
      const success = await onVerifyOtp(enteredPin);
      if (!success) {
        sound.playErrorTone();
        setIsError(true);
        const newFails = failedAttempts + 1;
        setFailedAttempts(newFails);

        if (newFails >= 5) {
          setCooldownRemaining(45);
          setErrorMessage('Too many incorrect attempts. Keypad locked for 45s.');
        } else {
          setErrorMessage(`Λάθος PIN. Ελέγξτε τη συσκευή του γονέα (${5 - newFails} προσπάθειες απομένουν).`);
        }

        setTimeout(() => {
          setPin('');
          setIsError(false);
        }, 900);
      } else {
        setFailedAttempts(0);
        setErrorMessage(null);
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const hours = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  const dateString = currentTime.toLocaleDateString([], {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div
      id="tablet-lockscreen-root"
      className="w-full h-full relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white flex flex-col justify-between p-4 sm:p-8 md:p-10 select-none"
    >
      {/* Ambient background glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar: Device Header & Network Pairing Status */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-2xl shadow-inner">
            {settings.childAvatar}
          </div>
          <div>
            <h2 className="font-display font-bold text-sm sm:text-base text-slate-100 flex items-center gap-2">
              <span>Τάμπλετ {settings.childName}</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                Child Kiosk Mode
              </span>
            </h2>
            <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Το τάμπλετ είναι κλειδωμένο • Απαιτείται έγκριση γονέα</span>
            </div>
          </div>
        </div>

        {/* Pairing Status Badge & Parent Settings */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-slate-900/90 border border-slate-800 text-[11px] text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <Wifi className="w-3.5 h-3.5 text-cyan-400" />
            <span>Σύνδεση Δικτύου: <strong>{pairingService.getFamilyCode()}</strong></span>
          </div>

          <button
            id="lockscreen-settings-btn"
            type="button"
            onClick={() => onOpenSettings('duration')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700 active:scale-95 border border-slate-700 text-slate-300 hover:text-white transition-all text-xs font-semibold cursor-pointer"
            title="Parent Controls"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Γονικός Έλεγχος</span>
          </button>
        </div>
      </div>

      {/* Main Lock Screen Layout */}
      <div className="relative z-10 flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-center max-w-5xl mx-auto w-full my-4">
        {/* Left Column: Big Clock, Screen Time info & Send Request Trigger */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-4">
          {/* Hard Lock Alert Banner when session expired */}
          {sessionExpiredNotice && (
            <div
              id="session-expired-hard-lock-banner"
              className="w-full max-w-md p-3.5 rounded-2xl bg-rose-950/95 border-2 border-rose-500/80 text-white shadow-xl backdrop-blur-md flex items-start justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-300"
            >
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-rose-600 flex items-center justify-center shrink-0 mt-0.5 shadow">
                  <Lock className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <span>Έληξε ο Χρόνος Χρήσης</span>
                  </div>
                  <div className="text-[11px] text-rose-200 leading-snug mt-0.5">
                    Ο χρόνος οθόνης ολοκληρώθηκε! Ζητήστε νέο κωδικό από τον γονέα για να συνεχίσετε.
                  </div>
                </div>
              </div>
              {onDismissExpiredNotice && (
                <button
                  type="button"
                  onClick={onDismissExpiredNotice}
                  className="text-xs text-rose-300 hover:text-white p-1"
                >
                  ✕
                </button>
              )}
            </div>
          )}

          <div>
            <div className="font-display font-extrabold text-6xl sm:text-7xl md:text-8xl tracking-tight text-white drop-shadow-sm">
              {hours}
            </div>
            <div className="text-sm sm:text-base font-medium text-cyan-300/90 mt-1 capitalize">
              {dateString}
            </div>
          </div>

          {/* Unlock duration info banner */}
          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 max-w-md backdrop-blur-md">
            <div className="flex items-center gap-2 text-cyan-400 font-semibold mb-1">
              <Clock className="w-4 h-4" />
              <span>Διάρκεια Ξεκλειδώματος: {settings.unlockDurationMinutes} Λεπτά</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Με την έγκριση του γονέα, το τάμπλετ ξεκλειδώνει για{' '}
              <strong className="text-slate-200">{settings.unlockDurationMinutes} λεπτά</strong> και στη συνέχεια κλειδώνει αυτόματα.
            </p>
          </div>

          {/* Request Unlock Control Area */}
          <div className="w-full max-w-md space-y-3">
            {!codeDispatched ? (
              <button
                id="send-unlock-code-btn"
                type="button"
                disabled={isSendingCode || cooldownRemaining > 0}
                onClick={handleSendCodeClick}
                className="w-full p-4 rounded-2xl bg-gradient-to-r from-cyan-400 via-teal-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none text-slate-950 font-display font-black text-base shadow-xl shadow-cyan-500/25 transition-all flex items-center justify-center gap-3 border border-cyan-200/50 cursor-pointer"
              >
                {isSendingCode ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-slate-950" />
                    <span>Αποστολή Αιτήματος στο Κινητό...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5 text-slate-950" />
                    <span>📡 Ζήτησε Κωδικό από τον Γονέα</span>
                  </>
                )}
              </button>
            ) : (
              /* When code is dispatched: State that request was sent to parent device */
              <div
                id="email-dispatched-confirmation-card"
                className="p-4 rounded-2xl bg-slate-900/95 border-2 border-emerald-500/60 shadow-xl backdrop-blur-md space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <span>Το Αίτημα Στάλθηκε στον Γονέα!</span>
                  </div>
                  <span className="text-[10px] text-slate-400">Σε αναμονή</span>
                </div>

                <div className="flex items-start gap-3 bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
                  <Smartphone className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-slate-300 space-y-1">
                    <p className="leading-relaxed font-semibold text-slate-200">
                      Ο κωδικός στάλθηκε αυτόματα στη συσκευή του γονέα.
                    </p>
                    <p className="text-[11px] text-slate-400 leading-snug">
                      Μόλις ο γονέας πατήσει <strong>«Έγκριση»</strong> από το κινητό του, το τάμπλετ θα ξεκλειδώσει αυτόματα! Εναλλακτικά, πληκτρολογήστε το PIN που θα σας δώσει.
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-400">
                    Χρειάζεστε νέα αποστολή;
                  </span>
                  <button
                    type="button"
                    disabled={resendCooldown > 0 || isSendingCode}
                    onClick={handleSendCodeClick}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-cyan-300 text-xs font-semibold transition-all cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSendingCode ? 'animate-spin' : ''}`} />
                    <span>
                      {resendCooldown > 0 ? `Επανάληψη (${resendCooldown}s)` : 'Επανάληψη Αιτήματος'}
                    </span>
                  </button>
                </div>
              </div>
            )}

            <div className="text-center md:text-left">
              <p className="text-xs text-slate-400 flex items-center justify-center md:justify-start gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
                <span>Συνδεδεμένη Συσκευή: <strong className="text-slate-200">Κινητό Γονέα ({pairingService.getFamilyCode()})</strong></span>
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: 4-Digit PIN Keypad */}
        <div className="flex flex-col items-center justify-center">
          <div className="mb-3 text-center">
            <span className="text-xs uppercase tracking-widest text-slate-400 font-bold block mb-1">
              Πληκτρολογηστε το 4-ψηφιο PIN
            </span>
            {cooldownRemaining > 0 ? (
              <div className="text-xs font-bold text-rose-400 animate-pulse">
                Το πληκτρολόγιο κλειδώθηκε για {cooldownRemaining}s
              </div>
            ) : errorMessage ? (
              <div className="text-xs font-semibold text-rose-400 max-w-xs text-center leading-tight flex items-center justify-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            ) : isVerifying ? (
              <div className="text-xs font-semibold text-cyan-400 flex items-center justify-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Έλεγχος κωδικού...</span>
              </div>
            ) : (
              <div className="text-xs text-slate-400">
                {codeDispatched
                  ? 'Πληκτρολογήστε τον κωδικό που εμφανίζεται στη συσκευή του γονέα'
                  : 'Πατήστε «Ζήτησε Κωδικό» για να σταλεί ειδοποίηση στον γονέα'}
              </div>
            )}
          </div>

          {/* Keypad */}
          <Keypad
            value={pin}
            onChange={(val) => {
              setPin(val);
              if (errorMessage && !cooldownRemaining) setErrorMessage(null);
            }}
            onSubmit={handlePinSubmit}
            disabled={cooldownRemaining > 0 || isVerifying}
            isError={isError}
          />

          <div className="mt-4 text-[11px] text-slate-400 text-center">
            <span>Κωδικός έκτακτης ανάγκης γονέα: </span>
            <span className="font-mono text-slate-400 font-bold">0000</span>
          </div>
        </div>
      </div>

      {/* Bottom Bar: Emergency Call & Android 15 Status */}
      <div className="relative z-10 flex items-center justify-between border-t border-slate-800/60 pt-4 text-xs text-slate-400">
        <button
          id="lockscreen-emergency-btn"
          type="button"
          onClick={onOpenEmergency}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-rose-400 border border-rose-500/20 hover:border-rose-500/40 transition-all font-semibold cursor-pointer"
        >
          <PhoneCall className="w-3.5 h-3.5" />
          <span>Κλήση Έκτακτης Ανάγκης (SOS)</span>
        </button>

        <div className="hidden sm:flex items-center gap-3 text-slate-400 text-[11px]">
          <span className="flex items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>Android 15 Lock Task Mode</span>
          </span>
          <span>•</span>
          <span>Target SDK 35</span>
        </div>
      </div>
    </div>
  );
};

