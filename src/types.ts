export type LockState = 'locked' | 'unlocked' | 'initial_setup';

export type DeviceRole = 'child' | 'parent' | 'dual_preview';

export interface DeviceInfo {
  deviceId: string;
  role: 'child' | 'parent';
  deviceName: string;
  lastSeen: number;
  online: boolean;
  ip?: string;
}

export interface UnlockRequest {
  id: string;
  familyCode: string;
  childDeviceId: string;
  childName: string;
  pin: string; // 4-digit generated PIN
  requestedAt: number;
  expiresAt: number;
  durationMinutes: number;
  status: 'pending' | 'approved' | 'rejected' | 'used';
  approvedBy?: string;
  responseNote?: string;
}

export interface FamilyRoomState {
  familyCode: string;
  familyName: string;
  childDevice: {
    deviceId: string;
    childName: string;
    childAvatar: string;
    lockState: LockState;
    remainingSeconds: number;
    activeApp: string;
    batteryLevel: number;
    lastSeen: number;
    online: boolean;
  } | null;
  parentDevices: {
    deviceId: string;
    parentName: string;
    lastSeen: number;
    online: boolean;
  }[];
  activeRequest: UnlockRequest | null;
  recentRequests: UnlockRequest[];
  settings: ParentSettings;
}

export interface Android15Config {
  targetSdk: number; // 35 (Android 15 / SDK 57)
  compileSdk: number; // 35
  minSdk: number; // 26
  edgeToEdgeEnabled: boolean; // Android 15 default
  predictiveBackEnabled: boolean;
  privateSpaceProtection: boolean; // Android 15 new feature
  kioskLockTaskMode: boolean; // Screen Pinning / Device Owner
  loudAlarmOnTamper: boolean;
  bedtimeScheduleEnabled: boolean;
  bedtimeStart: string; // "20:00"
  bedtimeEnd: string; // "07:00"
}

export interface EmailDeliveryConfig {
  provider: 'gmail' | 'smtp' | 'resend';
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string; // Gmail App Password (16 chars) or SMTP pass
  resendApiKey: string;
  configured: boolean;
}

export interface AdminMember {
  id: string;
  name: string;
  email: string;
  role: 'Primary Parent' | 'Co-Parent' | 'Guardian' | 'Relative' | 'Babysitter';
  isPrimary?: boolean;
  addedAt: number;
}

export type AppCategory = 'creative' | 'games' | 'education' | 'media' | 'books';

export interface InstalledApp {
  id: string;
  name: string;
  category: AppCategory;
  packageName?: string;
  iconEmoji: string;
  colorGradient: string;
  description: string;
  enabled: boolean;
  isBuiltIn?: boolean;
  ageRating: string;
  timeLimitMinutes?: number;
}

export interface ParentSettings {
  parentEmail: string;
  adminMembers: AdminMember[];
  allowedApps: InstalledApp[];
  childName: string;
  childAvatar: string;
  unlockDurationMinutes: number; // The setting requested by user: how long tablet remains unlocked
  autoRelockWarningSeconds: number; // Warning chime before lock (e.g. 30s)
  soundEffects: boolean;
  emergencyNumber: string;
  themeColor: 'cyan' | 'purple' | 'amber' | 'emerald' | 'rose';
  android15: Android15Config;
  emailDelivery?: EmailDeliveryConfig;
}

export interface OtpRecord {
  code: string; // 4-digit random code
  generatedAt: number; // timestamp
  expiresAt: number; // timestamp
  used: boolean;
  attemptCount: number;
}

export interface ParentEmailMessage {
  id: string;
  toEmail: string;
  subject: string;
  code: string;
  timestamp: number;
  deviceLabel: string;
  unlockDurationMinutes: number;
  expiresInMinutes: number;
  read: boolean;
}

export interface UnlockSession {
  unlockedAt: number;
  expiresAt: number;
  totalDurationSeconds: number;
}

export type ActiveApp = 'home' | 'drawing' | 'math' | 'storybook' | 'tunes';
