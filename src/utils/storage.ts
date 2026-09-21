import { ParentSettings, OtpRecord, ParentEmailMessage, UnlockSession, AdminMember } from '../types';
import { DEFAULT_INSTALLED_APPS } from './defaultApps';

const SETTINGS_KEY = 'kids_tablet_parent_settings_v1';
const OTP_KEY = 'kids_tablet_current_otp_v1';
const EMAILS_KEY = 'kids_tablet_parent_emails_v1';
const SESSION_KEY = 'kids_tablet_active_session_v1';

export const DEFAULT_SETTINGS: ParentSettings = {
  parentEmail: 'savvas.mika2015@gmail.com',
  adminMembers: [
    {
      id: 'admin_primary',
      name: 'Primary Parent',
      email: 'savvas.mika2015@gmail.com',
      role: 'Primary Parent',
      isPrimary: true,
      addedAt: Date.now(),
    },
  ],
  allowedApps: DEFAULT_INSTALLED_APPS,
  childName: 'Maya',
  childAvatar: '🦊',
  unlockDurationMinutes: 30, // Default duration setting
  autoRelockWarningSeconds: 30,
  soundEffects: true,
  emergencyNumber: '911',
  themeColor: 'cyan',
  android15: {
    targetSdk: 35, // Android 15
    compileSdk: 35,
    minSdk: 26,
    edgeToEdgeEnabled: true,
    predictiveBackEnabled: true,
    privateSpaceProtection: true,
    kioskLockTaskMode: true,
    loudAlarmOnTamper: false,
    bedtimeScheduleEnabled: false,
    bedtimeStart: '20:30',
    bedtimeEnd: '07:00',
  },
};

export function loadParentSettings(): ParentSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);

    // Ensure adminMembers has at least the primary parent
    let admins: AdminMember[] = Array.isArray(parsed.adminMembers) && parsed.adminMembers.length > 0
      ? parsed.adminMembers
      : [
          {
            id: 'admin_primary',
            name: 'Primary Parent',
            email: parsed.parentEmail || DEFAULT_SETTINGS.parentEmail,
            role: 'Primary Parent',
            isPrimary: true,
            addedAt: Date.now(),
          },
        ];

    // Ensure allowedApps exists
    const allowedApps = Array.isArray(parsed.allowedApps) && parsed.allowedApps.length > 0
      ? parsed.allowedApps
      : DEFAULT_INSTALLED_APPS;

    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      adminMembers: admins,
      allowedApps,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveParentSettings(settings: ParentSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // localStorage full or unavailable
  }
}

export function isSetupComplete(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('kids_tablet_setup_completed') === 'true';
}

export function markSetupComplete(): void {
  try {
    localStorage.setItem('kids_tablet_setup_completed', 'true');
  } catch {
    // ignore
  }
}

// Generate random 4-digit code (0000 to 9999)
export function generateFourDigitCode(): string {
  const codeNum = Math.floor(Math.random() * 10000);
  return codeNum.toString().padStart(4, '0');
}

export function createAndStoreOtp(parentEmail: string, unlockDurationMinutes: number): { otp: OtpRecord; email: ParentEmailMessage } {
  const code = generateFourDigitCode();
  const now = Date.now();
  const validityMinutes = 10; // Code valid for 10 min
  
  const otp: OtpRecord = {
    code,
    generatedAt: now,
    expiresAt: now + validityMinutes * 60 * 1000,
    used: false,
    attemptCount: 0,
  };

  try {
    localStorage.setItem(OTP_KEY, JSON.stringify(otp));
  } catch {
    // ignore
  }

  const emailMsg: ParentEmailMessage = {
    id: `email-${now}-${Math.random().toString(36).substring(2, 7)}`,
    toEmail: parentEmail,
    subject: `Tablet Unlock Code: ${code}`,
    code,
    timestamp: now,
    deviceLabel: "Kid's Tablet (Android 15)",
    unlockDurationMinutes,
    expiresInMinutes: validityMinutes,
    read: false,
  };

  storeSentEmail(emailMsg);
  return { otp, email: emailMsg };
}

export function getStoredOtp(): OtpRecord | null {
  try {
    const raw = localStorage.getItem(OTP_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as OtpRecord;
  } catch {
    return null;
  }
}

export function markOtpUsed(): void {
  try {
    const otp = getStoredOtp();
    if (otp) {
      otp.used = true;
      localStorage.setItem(OTP_KEY, JSON.stringify(otp));
    }
  } catch {
    // ignore
  }
}

export function incrementOtpAttempt(): number {
  try {
    const otp = getStoredOtp();
    if (otp) {
      otp.attemptCount = (otp.attemptCount || 0) + 1;
      localStorage.setItem(OTP_KEY, JSON.stringify(otp));
      return otp.attemptCount;
    }
  } catch {
    // ignore
  }
  return 1;
}

export function getSentEmails(): ParentEmailMessage[] {
  try {
    const raw = localStorage.getItem(EMAILS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ParentEmailMessage[];
  } catch {
    return [];
  }
}

export function storeSentEmail(msg: ParentEmailMessage): void {
  try {
    const list = getSentEmails();
    const updated = [msg, ...list].slice(0, 20); // keep last 20 emails
    localStorage.setItem(EMAILS_KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }
}

export function clearEmailHistory(): void {
  try {
    localStorage.removeItem(EMAILS_KEY);
  } catch {
    // ignore
  }
}

// Active session storage
export function saveActiveSession(session: UnlockSession | null): void {
  try {
    if (!session) {
      localStorage.removeItem(SESSION_KEY);
    } else {
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    }
  } catch {
    // ignore
  }
}

export function getActiveSession(): UnlockSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as UnlockSession;
    if (Date.now() >= session.expiresAt) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}
