import React, { useState, useEffect } from 'react';
import {
  Clock,
  Lock,
  PlusCircle,
  Sparkles,
  Palette,
  Calculator,
  BookOpen,
  Music,
  Settings,
  AlertTriangle,
  Smile,
  ShieldCheck,
  Gamepad2,
  Plus,
} from 'lucide-react';
import { ParentSettings, UnlockSession, ActiveApp, InstalledApp } from '../types';
import { DrawingApp } from './apps/DrawingApp';
import { MathQuestApp } from './apps/MathQuestApp';
import { StorybookApp } from './apps/StorybookApp';
import { KidTunesApp } from './apps/KidTunesApp';
import { DeviceAppRunner } from './apps/DeviceAppRunner';
import { FullTabletDesktop } from './FullTabletDesktop';
import { AddAppModal } from './AddAppModal';
import { TabType } from './ParentSettingsModal';
import { DEFAULT_INSTALLED_APPS } from '../utils/defaultApps';
import { sound } from '../utils/audio';

interface UnlockedTabletHomeProps {
  settings: ParentSettings;
  session: UnlockSession;
  onLockNow: () => void;
  onSessionExpired: () => void;
  onOpenSettings: (tab?: TabType) => void;
  onExtendSession: (extraMinutes: number) => void;
  onUpdateSettings?: (newSettings: ParentSettings) => void;
}

export const UnlockedTabletHome: React.FC<UnlockedTabletHomeProps> = ({
  settings,
  session,
  onLockNow,
  onSessionExpired,
  onOpenSettings,
  onExtendSession,
  onUpdateSettings,
}) => {
  const [isAddAppModalOpen, setIsAddAppModalOpen] = useState<boolean>(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(() => {
    return Math.max(0, Math.floor((session.expiresAt - Date.now()) / 1000));
  });
  const [warningFired, setWarningFired] = useState<boolean>(false);

  // Live countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = Math.max(0, Math.floor((session.expiresAt - Date.now()) / 1000));
      setSecondsRemaining(remaining);

      // Warning chime at 30 seconds
      if (
        remaining <= 30 &&
        remaining > 0 &&
        !warningFired &&
        settings.autoRelockWarningSeconds > 0
      ) {
        sound.playWarningChime();
        setWarningFired(true);
      }

      // Hard auto-lock when session reaches 0
      if (remaining <= 0) {
        clearInterval(timer);
        sound.playHardLockoutSound();
        onSessionExpired();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [session.expiresAt, warningFired, settings.autoRelockWarningSeconds, onSessionExpired]);

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const timeFormatted = `${minutes.toString().padStart(2, '0')}:${seconds
    .toString()
    .padStart(2, '0')}`;

  const isLowTime = secondsRemaining <= 60;

  return (
    <div className="w-full h-full relative overflow-hidden flex flex-col">
      <FullTabletDesktop
        settings={settings}
        session={session}
        secondsRemaining={secondsRemaining}
        timeFormatted={timeFormatted}
        isLowTime={isLowTime}
        onLockNow={onLockNow}
        onOpenSettings={onOpenSettings}
        onExtendSession={onExtendSession}
        onOpenAddApps={() => setIsAddAppModalOpen(true)}
      />

      {/* Add / Manage Apps Modal for Admins & Parents */}
      <AddAppModal
        isOpen={isAddAppModalOpen}
        onClose={() => setIsAddAppModalOpen(false)}
        allowedApps={settings.allowedApps || []}
        onSaveApps={(updated) => {
          sound.playUnlockChime();
          onUpdateSettings?.({ ...settings, allowedApps: updated });
          setIsAddAppModalOpen(false);
        }}
      />
    </div>
  );
};
