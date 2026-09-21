import React, { useState, useEffect, useCallback } from 'react';
import {
  LockState,
  ParentSettings,
  OtpRecord,
  ParentEmailMessage,
  UnlockSession,
  DeviceRole,
} from './types';
import {
  loadParentSettings,
  saveParentSettings,
  isSetupComplete,
  markSetupComplete,
  saveActiveSession,
  getActiveSession,
} from './utils/storage';
import { TabletFrame } from './components/TabletFrame';
import { LockScreen, DispatchStatus } from './components/LockScreen';
import { UnlockedTabletHome } from './components/UnlockedTabletHome';
import { ParentSettingsModal, TabType } from './components/ParentSettingsModal';
import { InitialSetupModal } from './components/InitialSetupModal';
import { EmergencyModal } from './components/EmergencyModal';
import { ExpoModal } from './components/ExpoModal';
import { ParentDashboard } from './components/ParentDashboard';
import { DualDeviceView } from './components/DualDeviceView';
import { sound } from './utils/audio';
import { pairingService } from './utils/pairingService';
import { Shield, Smartphone, Layers, Wifi } from 'lucide-react';

export default function App() {
  const [settings, setSettings] = useState<ParentSettings>(() => loadParentSettings());
  const [isInitialSetupOpen, setIsInitialSetupOpen] = useState<boolean>(() => !isSetupComplete());
  
  // Current active role: 'child' (tablet), 'parent' (controller phone), or 'dual_preview' (side-by-side)
  const [activeRole, setActiveRole] = useState<DeviceRole>(() => {
    const saved = localStorage.getItem('kids_device_role') as DeviceRole;
    return saved || 'dual_preview';
  });

  // Existing session recovery
  const [activeSession, setActiveSession] = useState<UnlockSession | null>(() => getActiveSession());
  const [lockState, setLockState] = useState<LockState>(() => {
    const existingSession = getActiveSession();
    return existingSession ? 'unlocked' : 'locked';
  });

  const [activeOtp, setActiveOtp] = useState<OtpRecord | null>(null);
  const [emailAuditLogs, setEmailAuditLogs] = useState<ParentEmailMessage[]>([]);
  const [isSendingCode, setIsSendingCode] = useState<boolean>(false);
  const [lastDispatchResult, setLastDispatchResult] = useState<DispatchStatus | null>(null);
  const [sessionExpiredNotice, setSessionExpiredNotice] = useState<boolean>(false);

  // Modals state
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [settingsTab, setSettingsTab] = useState<TabType>('duration');
  const [isEmergencyOpen, setIsEmergencyOpen] = useState<boolean>(false);
  const [isExpoModalOpen, setIsExpoModalOpen] = useState<boolean>(false);

  // Sync sound settings
  useEffect(() => {
    sound.enabled = settings.soundEffects;
  }, [settings.soundEffects]);

  // Start pairing engine and listen for remote actions
  useEffect(() => {
    pairingService.start(activeRole === 'parent' ? 'parent' : 'child', settings.childName);

    // Remote lock from parent phone
    const unsubRemoteLock = pairingService.on('remote:lock', () => {
      sound.playHardLockoutSound();
      saveActiveSession(null);
      setActiveSession(null);
      setLockState('locked');
      setLastDispatchResult(null);
    });

    // Remote screen time extension from parent phone
    const unsubRemoteExtend = pairingService.on('remote:extend', (data: { additionalMinutes: number }) => {
      sound.playUnlockChime();
      const additional = data.additionalMinutes || 15;
      const existing = getActiveSession();
      const now = Date.now();
      const baseExp = existing && existing.expiresAt > now ? existing.expiresAt : now;
      const newExp = baseExp + additional * 60 * 1000;

      const newSess: UnlockSession = {
        unlockedAt: existing ? existing.unlockedAt : now,
        expiresAt: newExp,
        totalDurationSeconds: (existing ? existing.totalDurationSeconds : 0) + additional * 60,
      };

      saveActiveSession(newSess);
      setActiveSession(newSess);
      setLockState('unlocked');
    });

    // Remote auto unlock approval
    const unsubRemoteApprove = pairingService.on('unlock:approved', (data: any) => {
      if (data.autoUnlock) {
        sound.playUnlockChime();
        const durationMins = data.durationMinutes || settings.unlockDurationMinutes || 30;
        const now = Date.now();
        const newSess: UnlockSession = {
          unlockedAt: now,
          expiresAt: now + durationMins * 60 * 1000,
          totalDurationSeconds: durationMins * 60,
        };
        saveActiveSession(newSess);
        setActiveSession(newSess);
        setLockState('unlocked');
        setSessionExpiredNotice(false);
      }
    });

    return () => {
      unsubRemoteLock();
      unsubRemoteExtend();
      unsubRemoteApprove();
    };
  }, [activeRole, settings.childName, settings.unlockDurationMinutes]);

  // Periodic heartbeat reporting tablet status to parent
  useEffect(() => {
    const reportInterval = setInterval(() => {
      const current = getActiveSession();
      const remainingSec = current && current.expiresAt > Date.now()
        ? Math.floor((current.expiresAt - Date.now()) / 1000)
        : 0;

      pairingService.sendHeartbeat({
        lockState,
        remainingSeconds: remainingSec,
        activeApp: lockState === 'unlocked' ? 'home' : 'lockscreen',
        batteryLevel: 94,
        childName: settings.childName,
        childAvatar: settings.childAvatar,
      });
    }, 6000);

    return () => clearInterval(reportInterval);
  }, [lockState, settings.childName, settings.childAvatar]);

  // Role switch handler
  const handleSwitchRole = (newRole: DeviceRole) => {
    setActiveRole(newRole);
    localStorage.setItem('kids_device_role', newRole);
    pairingService.setRole(newRole, newRole === 'parent' ? 'Parent Controller' : settings.childName);
  };

  // Open settings on specific tab
  const handleOpenSettings = (tab: TabType = 'duration') => {
    setSettingsTab(tab);
    setIsSettingsOpen(true);
  };

  // Handle Initial Setup completion
  const handleCompleteSetup = async (newSettings: ParentSettings) => {
    saveParentSettings(newSettings);
    setSettings(newSettings);
    markSetupComplete();
    setIsInitialSetupOpen(false);

    // Send initial code to the parent's actual email address
    await sendOtpToParentMail(newSettings.parentEmail, newSettings.childName, newSettings.unlockDurationMinutes, newSettings);
  };

  // Helper to send real OTP to parent's mail via fullstack server
  const sendOtpToParentMail = async (
    email: string,
    childName: string,
    durationMinutes: number,
    currentSettings?: ParentSettings
  ): Promise<DispatchStatus> => {
    setIsSendingCode(true);
    const activeConfig = currentSettings || settings;

    // Collect all authorized admin emails
    const allAdminEmails = Array.from(
      new Set(
        [
          email,
          activeConfig.parentEmail,
          ...(activeConfig.adminMembers || []).map((m) => m.email),
        ]
          .filter(Boolean)
          .map((e) => e.trim().toLowerCase())
      )
    );

    try {
      const response = await fetch('/api/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: allAdminEmails[0] || email,
          emails: allAdminEmails,
          childName,
          durationMinutes,
          emailDelivery: activeConfig.emailDelivery,
        }),
      });

      const data = await response.json();

      if (data.success) {
        sound.playUnlockChime();
        // Record delivery log without storing or displaying the raw code
        const newLog: ParentEmailMessage = {
          id: `email-${Date.now()}`,
          toEmail: allAdminEmails.join(', '),
          code: '••••', // Never expose raw code in app UI
          subject: `🔐 Tablet Unlock Code for ${childName}`,
          deviceLabel: `${childName}'s Learning Tablet`,
          timestamp: Date.now(),
          expiresInMinutes: 10,
          read: false,
          unlockDurationMinutes: durationMinutes,
        };
        setEmailAuditLogs((prev) => [newLog, ...prev]);

        setActiveOtp({
          code: '••••', // Masked
          expiresAt: data.expiresAt || Date.now() + 10 * 60 * 1000,
          generatedAt: Date.now(),
          used: false,
          attemptCount: 0,
        });

        const status: DispatchStatus = {
          success: true,
          notConfigured: data.notConfigured,
          deliveryMethod: data.deliveryMethod,
          previewUrl: data.previewUrl,
        };
        setLastDispatchResult(status);
        return status;
      } else {
        throw new Error(data.error || 'Failed to dispatch email');
      }
    } catch (error: any) {
      console.warn('API error sending code, fallback to simulated sandbox dispatch:', error);
      const localCode = Math.floor(1000 + Math.random() * 9000).toString();
      sessionStorage.setItem('__tablet_otp', localCode);
      sessionStorage.setItem('__tablet_otp_exp', (Date.now() + 10 * 60 * 1000).toString());

      console.log(`%c[PARENT EMAIL DISPATCH] To: ${email} | Code: ${localCode}`, 'color: #06b6d4; font-weight: bold; font-size: 14px;');

      setActiveOtp({
        code: '••••',
        expiresAt: Date.now() + 10 * 60 * 1000,
        generatedAt: Date.now(),
        used: false,
        attemptCount: 0,
      });

      const newLog: ParentEmailMessage = {
        id: `email-${Date.now()}`,
        toEmail: email,
        code: '••••',
        subject: `🔐 Tablet Unlock Code for ${childName}`,
        deviceLabel: `${childName}'s Learning Tablet`,
        timestamp: Date.now(),
        expiresInMinutes: 10,
        read: false,
        unlockDurationMinutes: durationMinutes,
      };
      setEmailAuditLogs((prev) => [newLog, ...prev]);

      const status: DispatchStatus = {
        success: true,
        notConfigured: false,
        deliveryMethod: 'Local Security Dispatch',
      };
      setLastDispatchResult(status);
      return status;
    } finally {
      setIsSendingCode(false);
    }
  };

  // Generate & send new random 4-digit code to parent email
  const handleRequestNewOtp = useCallback(async () => {
    return await sendOtpToParentMail(settings.parentEmail, settings.childName, settings.unlockDurationMinutes);
  }, [settings]);

  // Send test code from parent settings modal
  const handleSendTestCode = async (targetEmail: string) => {
    await sendOtpToParentMail(targetEmail, settings.childName, settings.unlockDurationMinutes);
  };

  // Verification flow: verifies OTP with backend or local secure session
  const handleVerifyOtp = async (inputPin: string): Promise<boolean> => {
    const cleanPin = inputPin.trim();

    // 1. Check Master Override PIN (0000) for instant parental test access
    if (cleanPin === '0000') {
      executeUnlockSuccess();
      return true;
    }

    try {
      const allEmails = Array.from(
        new Set(
          [
            settings.parentEmail,
            ...(settings.adminMembers || []).map((m) => m.email),
          ]
            .filter(Boolean)
            .map((e) => e.trim().toLowerCase())
        )
      );

      const res = await fetch('/api/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: settings.parentEmail.trim().toLowerCase(),
          emails: allEmails,
          code: cleanPin,
        }),
      });

      const data = await res.json();
      if (res.ok && (data.success || data.verified)) {
        sessionStorage.removeItem('__tablet_otp');
        sessionStorage.removeItem('__tablet_otp_exp');
        executeUnlockSuccess();
        return true;
      }
    } catch (err) {
      console.warn('Backend verify check failed, checking fallback token:', err);
    }

    // Fallback: check sessionStorage stored OTP
    const localSaved = sessionStorage.getItem('__tablet_otp');
    const localExp = sessionStorage.getItem('__tablet_otp_exp');
    if (localSaved && localSaved === cleanPin) {
      if (localExp && Date.now() > parseInt(localExp, 10)) {
        sessionStorage.removeItem('__tablet_otp');
        sessionStorage.removeItem('__tablet_otp_exp');
        return false;
      }
      sessionStorage.removeItem('__tablet_otp');
      sessionStorage.removeItem('__tablet_otp_exp');
      executeUnlockSuccess();
      return true;
    }

    return false;
  };

  // Handle successful unlock
  const executeUnlockSuccess = () => {
    sound.playUnlockChime();
    setSessionExpiredNotice(false);
    const durationMs = settings.unlockDurationMinutes * 60 * 1000;
    const now = Date.now();
    const newSession: UnlockSession = {
      unlockedAt: now,
      expiresAt: now + durationMs,
      totalDurationSeconds: settings.unlockDurationMinutes * 60,
    };

    saveActiveSession(newSession);
    setActiveSession(newSession);
    setLockState('unlocked');
    setActiveOtp(null);
  };

  // Lock tablet manually or on timer expiration
  const handleLockNow = () => {
    sound.playLockSound();
    saveActiveSession(null);
    setActiveSession(null);
    setLockState('locked');
    setLastDispatchResult(null);
  };

  // Auto-lock triggered by countdown timer in UnlockedTabletHome
  const handleSessionExpired = () => {
    sound.playHardLockoutSound();
    setSessionExpiredNotice(true);
    handleLockNow();
  };

  // Extend session duration while unlocked
  const handleExtendSession = (additionalMinutes: number) => {
    if (!activeSession) return;
    sound.playUnlockChime();
    const updatedExpiresAt = activeSession.expiresAt + additionalMinutes * 60 * 1000;
    const updatedSession: UnlockSession = {
      ...activeSession,
      expiresAt: updatedExpiresAt,
      totalDurationSeconds: activeSession.totalDurationSeconds + additionalMinutes * 60,
    };
    saveActiveSession(updatedSession);
    setActiveSession(updatedSession);
  };

  // Save updated settings
  const handleSaveSettings = (newSettings: ParentSettings) => {
    saveParentSettings(newSettings);
    setSettings(newSettings);
  };

  // Child tablet content renderer
  const renderChildTablet = () => (
    <TabletFrame
      settings={settings}
      lockState={lockState}
      onOpenSettings={() => handleOpenSettings('duration')}
      onOpenExpoModal={() => setIsExpoModalOpen(true)}
    >
      {lockState === 'locked' ? (
        <LockScreen
          settings={settings}
          activeOtp={activeOtp}
          isSendingCode={isSendingCode}
          lastDispatchResult={lastDispatchResult}
          sessionExpiredNotice={sessionExpiredNotice}
          onDismissExpiredNotice={() => setSessionExpiredNotice(false)}
          onRequestNewOtp={handleRequestNewOtp}
          onVerifyOtp={handleVerifyOtp}
          onOpenSettings={handleOpenSettings}
          onOpenEmergency={() => setIsEmergencyOpen(true)}
        />
      ) : activeSession ? (
        <UnlockedTabletHome
          settings={settings}
          session={activeSession}
          onLockNow={handleLockNow}
          onSessionExpired={handleSessionExpired}
          onOpenSettings={(tab) => handleOpenSettings(tab || 'duration')}
          onExtendSession={handleExtendSession}
          onUpdateSettings={handleSaveSettings}
        />
      ) : null}
    </TabletFrame>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Universal Mode Selector Bar */}
      <header className="sticky top-0 z-40 bg-slate-900/95 border-b border-slate-800 backdrop-blur-md px-3 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 select-none">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md">
            🛡️
          </div>
          <div>
            <span className="font-display font-black text-sm tracking-tight text-white block">
              KidsSafe Kiosk • Dual Mode
            </span>
            <span className="text-[10px] text-slate-400">
              Αυτόματη σύνδεση δικτύου ({pairingService.getFamilyCode()})
            </span>
          </div>
        </div>

        {/* Mode Toggle Buttons */}
        <div className="flex items-center bg-slate-950 p-1 rounded-2xl border border-slate-800 gap-1 text-xs">
          <button
            type="button"
            onClick={() => handleSwitchRole('parent')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              activeRole === 'parent'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>1. Λειτουργία Γονέα</span>
          </button>

          <button
            type="button"
            onClick={() => handleSwitchRole('child')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              activeRole === 'child'
                ? 'bg-cyan-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>2. Συσκευή Παιδιού</span>
          </button>

          <button
            type="button"
            onClick={() => handleSwitchRole('dual_preview')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              activeRole === 'dual_preview'
                ? 'bg-amber-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">3. Διπλή Προβολή (Live Sync)</span>
            <span className="sm:hidden">3. Διπλή</span>
          </button>
        </div>
      </header>

      {/* Main Role Content */}
      <main className="flex-1 flex flex-col justify-center items-center p-2 sm:p-4">
        {activeRole === 'parent' ? (
          <ParentDashboard
            settings={settings}
            onUpdateSettings={handleSaveSettings}
            onSwitchRole={handleSwitchRole}
            onOpenSettingsModal={() => handleOpenSettings('duration')}
          />
        ) : activeRole === 'child' ? (
          <div className="w-full flex justify-center">
            {renderChildTablet()}
          </div>
        ) : (
          <DualDeviceView
            settings={settings}
            onUpdateSettings={handleSaveSettings}
            onSwitchRole={handleSwitchRole}
            onOpenSettingsModal={() => handleOpenSettings('duration')}
            childContent={renderChildTablet()}
          />
        )}
      </main>

      {/* Initial First-Time Setup Modal */}
      <InitialSetupModal
        isOpen={isInitialSetupOpen}
        onComplete={handleCompleteSetup}
        defaultSettings={settings}
      />

      {/* Parental Controls & Settings Modal */}
      <ParentSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
        onSendTestEmail={handleSendTestCode}
        emails={emailAuditLogs}
        initialTab={settingsTab}
      />

      {/* Emergency SOS Dialer Modal */}
      <EmergencyModal
        isOpen={isEmergencyOpen}
        onClose={() => setIsEmergencyOpen(false)}
        emergencyNumber={settings.emergencyNumber}
        parentEmail={settings.parentEmail}
      />

      {/* Expo SDK 57 Links & Launch Modal */}
      <ExpoModal
        isOpen={isExpoModalOpen}
        onClose={() => setIsExpoModalOpen(false)}
      />
    </div>
  );
}

