import React, { useState } from 'react';
import {
  X,
  Clock,
  Mail,
  Shield,
  Smartphone,
  Check,
  Volume2,
  VolumeX,
  FileCode,
  Copy,
  AlertCircle,
  Sparkles,
  Sliders,
  History,
  Send,
  Key,
  ExternalLink,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  HelpCircle,
  Info,
  Users,
  Gamepad2,
  Plus,
  Trash2,
  Github,
  RefreshCw,
} from 'lucide-react';
import { ParentSettings, ParentEmailMessage, EmailDeliveryConfig, AdminMember, InstalledApp } from '../types';
import { sound } from '../utils/audio';
import { DEFAULT_INSTALLED_APPS, POPULAR_CATALOG_SUGGESTIONS } from '../utils/defaultApps';
import {
  ANDROID_15_SPECS,
  generateAndroidManifestXml,
  generateExpoSdk57Config,
  generateKotlinLockScreen,
} from '../utils/android15';
import { GitHubUpdatePanel } from './GitHubUpdatePanel';

interface ParentSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ParentSettings;
  onSaveSettings: (newSettings: ParentSettings) => void;
  onSendTestEmail: (email: string) => void;
  emails: ParentEmailMessage[];
  initialTab?: TabType;
  onDownloadApk?: () => void;
}

export type TabType = 'duration' | 'admins' | 'apps' | 'delivery' | 'email' | 'android15' | 'history' | 'updates';

const DURATION_PRESETS = [5, 15, 30, 45, 60, 90, 120];

export const ParentSettingsModal: React.FC<ParentSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  onSendTestEmail,
  emails,
  initialTab = 'duration',
  onDownloadApk,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [localSettings, setLocalSettings] = useState<ParentSettings>(settings);
  const [customDurationInput, setCustomDurationInput] = useState<string>(
    settings.unlockDurationMinutes.toString()
  );
  const [copiedCodeType, setCopiedCodeType] = useState<string | null>(null);
  const [saveToast, setSaveToast] = useState(false);

  // Email Delivery configuration state
  const [provider, setProvider] = useState<'gmail' | 'resend' | 'smtp'>(
    localSettings.emailDelivery?.provider || (localSettings.parentEmail.endsWith('@gmail.com') ? 'gmail' : 'gmail')
  );
  const [gmailAppPass, setGmailAppPass] = useState<string>(localSettings.emailDelivery?.smtpPass || '');
  const [resendKey, setResendKey] = useState<string>(localSettings.emailDelivery?.resendApiKey || '');
  const [smtpHost, setSmtpHost] = useState<string>(localSettings.emailDelivery?.smtpHost || 'smtp.gmail.com');
  const [smtpPort, setSmtpPort] = useState<number>(localSettings.emailDelivery?.smtpPort || 465);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Live Test feedback
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    error?: string;
    previewUrl?: string;
  } | null>(null);

  // Admin Management State
  const [newAdminName, setNewAdminName] = useState<string>('');
  const [newAdminEmail, setNewAdminEmail] = useState<string>('');
  const [newAdminRole, setNewAdminRole] = useState<'Co-Parent' | 'Guardian' | 'Relative' | 'Babysitter'>('Co-Parent');
  const [adminError, setAdminError] = useState<string | null>(null);

  // Custom App Creation State
  const [newAppName, setNewAppName] = useState<string>('');
  const [newAppCategory, setNewAppCategory] = useState<'games' | 'education' | 'creative' | 'media' | 'books'>('games');
  const [newAppPackage, setNewAppPackage] = useState<string>('');
  const [newAppEmoji, setNewAppEmoji] = useState<string>('🎮');
  const [newAppGradient, setNewAppGradient] = useState<string>('from-emerald-600 to-green-800');
  const [newAppDesc, setNewAppDesc] = useState<string>('');
  const [showAddAppForm, setShowAddAppForm] = useState<boolean>(false);
  const [appFormError, setAppFormError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminName.trim()) {
      setAdminError('Please enter member name.');
      sound.playErrorTone();
      return;
    }
    if (!/\S+@\S+\.\S+/.test(newAdminEmail.trim())) {
      setAdminError('Please enter a valid email address.');
      sound.playErrorTone();
      return;
    }
    sound.playUnlockChime();
    const newMember: AdminMember = {
      id: `admin_${Date.now()}`,
      name: newAdminName.trim(),
      email: newAdminEmail.trim().toLowerCase(),
      role: newAdminRole,
      isPrimary: false,
      addedAt: Date.now(),
    };
    const currentAdmins = localSettings.adminMembers || [];
    setLocalSettings((prev) => ({
      ...prev,
      adminMembers: [...currentAdmins, newMember],
    }));
    setNewAdminName('');
    setNewAdminEmail('');
    setAdminError(null);
  };

  const handleRemoveAdmin = (id: string) => {
    sound.playKeyClick();
    setLocalSettings((prev) => ({
      ...prev,
      adminMembers: (prev.adminMembers || []).filter((a) => a.id !== id),
    }));
  };

  const handleToggleApp = (appId: string) => {
    sound.playKeyClick();
    setLocalSettings((prev) => ({
      ...prev,
      allowedApps: (prev.allowedApps || []).map((a) => (a.id === appId ? { ...a, enabled: !a.enabled } : a)),
    }));
  };

  const handleAddCatalogApp = (catalogItem: (typeof POPULAR_CATALOG_SUGGESTIONS)[0]) => {
    sound.playUnlockChime();
    const current = localSettings.allowedApps || [];
    const existing = current.find((a) => a.id === catalogItem.id);
    if (existing) {
      handleToggleApp(existing.id);
      return;
    }
    setLocalSettings((prev) => ({
      ...prev,
      allowedApps: [...(prev.allowedApps || []), { ...catalogItem, enabled: true }],
    }));
  };

  const handleRemoveApp = (appId: string) => {
    sound.playKeyClick();
    setLocalSettings((prev) => ({
      ...prev,
      allowedApps: (prev.allowedApps || []).filter((a) => a.id !== appId),
    }));
  };

  const handleCreateCustomApp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAppName.trim()) {
      setAppFormError('Please enter app or game name.');
      sound.playErrorTone();
      return;
    }
    sound.playUnlockChime();
    const cleanId = `custom_${Date.now()}_${newAppName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    const newApp: InstalledApp = {
      id: cleanId,
      name: newAppName.trim(),
      category: newAppCategory,
      packageName: newAppPackage.trim() || `com.tablet.${cleanId}`,
      iconEmoji: newAppEmoji,
      colorGradient: newAppGradient,
      description: newAppDesc.trim() || 'Parent-approved device game',
      enabled: true,
      isBuiltIn: false,
      ageRating: 'All Ages',
    };
    setLocalSettings((prev) => ({
      ...prev,
      allowedApps: [...(prev.allowedApps || []), newApp],
    }));
    setNewAppName('');
    setNewAppPackage('');
    setNewAppDesc('');
    setAppFormError(null);
    setShowAddAppForm(false);
  };

  const handleSave = () => {
    sound.playUnlockChime();
    const updatedDelivery: EmailDeliveryConfig = {
      provider,
      smtpHost: provider === 'gmail' ? 'smtp.gmail.com' : smtpHost,
      smtpPort: provider === 'gmail' ? 465 : smtpPort,
      smtpUser: localSettings.parentEmail,
      smtpPass: gmailAppPass.trim(),
      resendApiKey: resendKey.trim(),
      configured: Boolean(
        (provider === 'gmail' && gmailAppPass.trim()) ||
        (provider === 'resend' && resendKey.trim()) ||
        (provider === 'smtp' && gmailAppPass.trim())
      ),
    };

    const newSettings: ParentSettings = {
      ...localSettings,
      emailDelivery: updatedDelivery,
    };

    onSaveSettings(newSettings);
    setSaveToast(true);
    setTimeout(() => {
      setSaveToast(false);
      onClose();
    }, 700);
  };

  const handleTestEmailDelivery = async () => {
    setIsTesting(true);
    setTestResult(null);
    sound.playKeyClick();

    const configPayload: EmailDeliveryConfig = {
      provider,
      smtpHost: provider === 'gmail' ? 'smtp.gmail.com' : smtpHost,
      smtpPort: provider === 'gmail' ? 465 : smtpPort,
      smtpUser: localSettings.parentEmail,
      smtpPass: gmailAppPass.trim(),
      resendApiKey: resendKey.trim(),
      configured: true,
    };

    try {
      const res = await fetch('/api/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toEmail: localSettings.parentEmail,
          emailDelivery: configPayload,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        sound.playUnlockChime();
        if (data.notConfigured) {
          setTestResult({
            success: false,
            message: 'No real email provider credentials entered yet. Please enter your 16-character Google App Password or Resend API key above.',
            previewUrl: data.previewUrl,
          });
        } else {
          setTestResult({
            success: true,
            message: `Delivered successfully to ${localSettings.parentEmail} via ${data.method}! Please check your inbox now.`,
          });
          // Update configured status in local state
          setLocalSettings((prev) => ({
            ...prev,
            emailDelivery: { ...configPayload, configured: true },
          }));
        }
      } else {
        sound.playErrorTone();
        setTestResult({
          success: false,
          message: data.error || 'Failed to dispatch test email',
          error: data.error,
        });
      }
    } catch (err: any) {
      sound.playErrorTone();
      setTestResult({
        success: false,
        message: err.message || 'Network connection failed when connecting to email service',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handlePresetSelect = (minutes: number) => {
    sound.playKeyClick();
    setLocalSettings((prev) => ({ ...prev, unlockDurationMinutes: minutes }));
    setCustomDurationInput(minutes.toString());
  };

  const handleCustomDurationChange = (val: string) => {
    setCustomDurationInput(val);
    const parsed = parseInt(val, 10);
    if (!isNaN(parsed) && parsed > 0 && parsed <= 720) {
      setLocalSettings((prev) => ({ ...prev, unlockDurationMinutes: parsed }));
    }
  };

  const handleCopyCode = (text: string, type: string) => {
    sound.playKeyClick();
    navigator.clipboard?.writeText(text);
    setCopiedCodeType(type);
    setTimeout(() => setCopiedCodeType(null), 1500);
  };

  return (
    <div
      id="parent-settings-backdrop"
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="parent-settings-modal"
        className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 bg-slate-800/90 border-b border-slate-700/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg text-white flex items-center gap-2">
                <span>Parental Controls & Settings</span>
              </h2>
              <p className="text-xs text-slate-400">
                Configure unlock duration, Gmail OTP dispatch, and Android 15 tablet features
              </p>
            </div>
          </div>
          <button
            id="close-parent-settings-btn"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700/60 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-4 pt-2 gap-1 overflow-x-auto">
          <button
            id="tab-btn-duration"
            onClick={() => setActiveTab('duration')}
            className={`flex items-center gap-2 px-3.5 py-3 border-b-2 text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'duration'
                ? 'border-cyan-400 text-cyan-400 bg-cyan-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Unlock Duration</span>
          </button>

          <button
            id="tab-btn-admins"
            onClick={() => setActiveTab('admins')}
            className={`flex items-center gap-2 px-3.5 py-3 border-b-2 text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'admins'
                ? 'border-cyan-400 text-cyan-400 bg-cyan-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Family Admins ({localSettings.adminMembers?.length || 1})</span>
          </button>

          <button
            id="tab-btn-apps"
            onClick={() => setActiveTab('apps')}
            className={`flex items-center gap-2 px-3.5 py-3 border-b-2 text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'apps'
                ? 'border-cyan-400 text-cyan-400 bg-cyan-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Gamepad2 className="w-4 h-4" />
            <span>Allowed Apps ({localSettings.allowedApps?.filter((a) => a.enabled).length || 0})</span>
          </button>

          <button
            id="tab-btn-delivery"
            onClick={() => setActiveTab('delivery')}
            className={`flex items-center gap-2 px-3.5 py-3 border-b-2 text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'delivery'
                ? 'border-cyan-400 text-cyan-400 bg-cyan-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>Email Delivery</span>
            {!localSettings.emailDelivery?.configured && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            )}
          </button>

          <button
            id="tab-btn-email"
            onClick={() => setActiveTab('email')}
            className={`flex items-center gap-2 px-3.5 py-3 border-b-2 text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'email'
                ? 'border-cyan-400 text-cyan-400 bg-cyan-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>Profile</span>
          </button>

          <button
            id="tab-btn-android15"
            onClick={() => setActiveTab('android15')}
            className={`flex items-center gap-2 px-3.5 py-3 border-b-2 text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'android15'
                ? 'border-cyan-400 text-cyan-400 bg-cyan-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Android 15</span>
          </button>

          <button
            id="tab-btn-history"
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-3.5 py-3 border-b-2 text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'border-cyan-400 text-cyan-400 bg-cyan-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Audit ({emails.length})</span>
          </button>

          <button
            id="tab-btn-updates"
            onClick={() => setActiveTab('updates')}
            className={`flex items-center gap-2 px-3.5 py-3 border-b-2 text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'updates'
                ? 'border-cyan-400 text-cyan-400 bg-cyan-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Github className="w-4 h-4 text-cyan-400" />
            <span>Ενημερώσεις GitHub</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: UNLOCK DURATION */}
          {activeTab === 'duration' && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 flex items-start gap-3.5">
                <Clock className="w-6 h-6 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-sm text-cyan-200">
                    Tablet Screen-Time Auto-Lock Duration
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    Specifies exactly how long the tablet stays unlocked after entering the parent's
                    4-digit email verification code. When this time elapses, the tablet locks automatically.
                  </p>
                </div>
              </div>

              {/* Presets */}
              <div>
                <label className="text-xs uppercase tracking-wider font-semibold text-slate-400 block mb-2.5">
                  Select Preset Duration:
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                  {DURATION_PRESETS.map((m) => {
                    const isSelected = localSettings.unlockDurationMinutes === m;
                    return (
                      <button
                        key={m}
                        id={`duration-preset-${m}m`}
                        type="button"
                        onClick={() => handlePresetSelect(m)}
                        className={`py-3 px-2 rounded-2xl border text-center font-bold text-sm transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md ring-2 ring-cyan-400/40 scale-105'
                            : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'
                        }`}
                      >
                        {m >= 60 ? `${m / 60} hr` : `${m} min`}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Duration Input */}
              <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/70">
                <label className="text-xs uppercase tracking-wider font-semibold text-slate-400 block mb-2">
                  Custom Minutes (1 - 720 minutes):
                </label>
                <div className="flex items-center gap-3">
                  <input
                    id="custom-duration-input"
                    type="number"
                    min="1"
                    max="720"
                    value={customDurationInput}
                    onChange={(e) => handleCustomDurationChange(e.target.value)}
                    className="w-32 px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-lg font-bold focus:outline-none focus:border-cyan-400"
                  />
                  <span className="text-sm font-semibold text-slate-300">minutes</span>
                  <div className="text-xs text-cyan-400 ml-auto font-medium">
                    Current: <strong>{localSettings.unlockDurationMinutes} minutes</strong>
                  </div>
                </div>
              </div>

              {/* Audio & Alert Settings */}
              <div className="space-y-3 pt-2">
                <label className="text-xs uppercase tracking-wider font-semibold text-slate-400 block">
                  Alerts & Audio Feedback:
                </label>

                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-800/50 border border-slate-700/60">
                  <div className="flex items-center gap-3">
                    {localSettings.soundEffects ? (
                      <Volume2 className="w-5 h-5 text-cyan-400" />
                    ) : (
                      <VolumeX className="w-5 h-5 text-slate-500" />
                    )}
                    <div>
                      <div className="text-sm font-medium text-slate-200">Tactile Audio Effects</div>
                      <div className="text-xs text-slate-400">Keypad clicks and lock chimes</div>
                    </div>
                  </div>
                  <input
                    id="toggle-sound-effects"
                    type="checkbox"
                    checked={localSettings.soundEffects}
                    onChange={(e) => {
                      sound.enabled = e.target.checked;
                      setLocalSettings((prev) => ({ ...prev, soundEffects: e.target.checked }));
                    }}
                    className="w-5 h-5 accent-cyan-500 rounded cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-800/50 border border-slate-700/60">
                  <div>
                    <div className="text-sm font-medium text-slate-200">30-Second Warning Alert</div>
                    <div className="text-xs text-slate-400">
                      Plays gentle reminder sound 30 seconds before auto-locking
                    </div>
                  </div>
                  <input
                    id="toggle-warning-alert"
                    type="checkbox"
                    checked={localSettings.autoRelockWarningSeconds > 0}
                    onChange={(e) =>
                      setLocalSettings((prev) => ({
                        ...prev,
                        autoRelockWarningSeconds: e.target.checked ? 30 : 0,
                      }))
                    }
                    className="w-5 h-5 accent-cyan-500 rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: EMAIL DELIVERY (GMAIL SETUP) */}
          {activeTab === 'delivery' && (
            <div className="space-y-6">
              {/* Educational banner explaining Gmail SMTP */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/60 to-blue-950/60 border border-cyan-500/40 text-xs text-slate-300">
                <div className="flex items-center gap-2 font-bold text-cyan-300 mb-1.5 text-sm">
                  <Info className="w-4 h-4" />
                  <span>Why is a Google App Password needed?</span>
                </div>
                <p className="leading-relaxed text-slate-300">
                  Google protects all Gmail accounts by blocking automated third-party server logins with regular passwords.
                  To deliver real 4-digit codes straight to your Gmail inbox, Google provides a free <strong>16-character App Password</strong> that authorizes this tablet app to send security emails to you.
                </p>
              </div>

              {/* Provider Selection */}
              <div>
                <label className="text-xs uppercase tracking-wider font-semibold text-slate-400 block mb-2">
                  Choose Email Dispatch Method:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      sound.playKeyClick();
                      setProvider('gmail');
                    }}
                    className={`p-3 rounded-2xl border text-xs font-bold transition-all text-center cursor-pointer ${
                      provider === 'gmail'
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 ring-1 ring-cyan-400'
                        : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Google Gmail (Recommended)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      sound.playKeyClick();
                      setProvider('resend');
                    }}
                    className={`p-3 rounded-2xl border text-xs font-bold transition-all text-center cursor-pointer ${
                      provider === 'resend'
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 ring-1 ring-cyan-400'
                        : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Resend API
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      sound.playKeyClick();
                      setProvider('smtp');
                    }}
                    className={`p-3 rounded-2xl border text-xs font-bold transition-all text-center cursor-pointer ${
                      provider === 'smtp'
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 ring-1 ring-cyan-400'
                        : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Custom SMTP
                  </button>
                </div>
              </div>

              {/* Provider Form: GMAIL */}
              {provider === 'gmail' && (
                <div className="space-y-4 p-5 rounded-2xl bg-slate-800/50 border border-slate-700">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Parent Gmail Address:
                    </label>
                    <input
                      type="text"
                      disabled
                      value={localSettings.parentEmail}
                      className="w-full px-4 py-2.5 bg-slate-900/80 border border-slate-700/60 rounded-xl text-slate-400 text-sm font-mono"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                        <Key className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Google 16-Character App Password:</span>
                      </label>
                      <a
                        href="https://myaccount.google.com/apppasswords"
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-cyan-400 hover:underline flex items-center gap-1"
                      >
                        <span>Generate on Google</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>

                    <div className="relative">
                      <input
                        id="gmail-app-pass-input"
                        type={showPassword ? 'text' : 'password'}
                        value={gmailAppPass}
                        onChange={(e) => setGmailAppPass(e.target.value)}
                        placeholder="e.g. abcd efgh ijkl mnop"
                        className="w-full px-4 py-3 bg-slate-900 border border-slate-700 focus:border-cyan-400 rounded-xl text-white font-mono text-sm tracking-wider pr-10 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* 3-Step Guide */}
                  <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 space-y-1.5">
                    <div className="font-semibold text-cyan-300">How to get your 16-character password in 30 seconds:</div>
                    <ol className="list-decimal list-inside space-y-1 text-slate-400 text-[11px] leading-relaxed">
                      <li>
                        Open <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer" className="text-cyan-400 underline">Google Account App Passwords</a> (requires 2-Step Verification turned on).
                      </li>
                      <li>In the "App name" box, type <strong>Kids Tablet</strong> and tap <strong>Create</strong>.</li>
                      <li>Google displays a yellow box with 16 letters (e.g. <code>abcd efgh ijkl mnop</code>). Paste it above!</li>
                    </ol>
                  </div>
                </div>
              )}

              {/* Provider Form: RESEND */}
              {provider === 'resend' && (
                <div className="space-y-4 p-5 rounded-2xl bg-slate-800/50 border border-slate-700">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-200">
                        Resend API Key:
                      </label>
                      <a
                        href="https://resend.com"
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-cyan-400 hover:underline flex items-center gap-1"
                      >
                        <span>Free at resend.com</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <input
                      type="password"
                      value={resendKey}
                      onChange={(e) => setResendKey(e.target.value)}
                      placeholder="re_123456789abcdef..."
                      className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 focus:border-cyan-400 rounded-xl text-white font-mono text-sm focus:outline-none"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Resend provides 100 free emails per day with instant delivery to Gmail inboxes.
                    </p>
                  </div>
                </div>
              )}

              {/* Provider Form: CUSTOM SMTP */}
              {provider === 'smtp' && (
                <div className="space-y-4 p-5 rounded-2xl bg-slate-800/50 border border-slate-700">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <label className="text-xs font-semibold text-slate-300 block mb-1">SMTP Host:</label>
                      <input
                        type="text"
                        value={smtpHost}
                        onChange={(e) => setSmtpHost(e.target.value)}
                        placeholder="smtp.example.com"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">Port:</label>
                      <input
                        type="number"
                        value={smtpPort}
                        onChange={(e) => setSmtpPort(parseInt(e.target.value, 10))}
                        placeholder="465"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">SMTP Password / Token:</label>
                    <input
                      type="password"
                      value={gmailAppPass}
                      onChange={(e) => setGmailAppPass(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs"
                    />
                  </div>
                </div>
              )}

              {/* Test Email Action Button */}
              <div className="space-y-3">
                <button
                  id="test-real-email-delivery-btn"
                  type="button"
                  disabled={isTesting}
                  onClick={handleTestEmailDelivery}
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer disabled:opacity-50"
                >
                  {isTesting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Verifying & Sending Test to {localSettings.parentEmail}...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 text-slate-950" />
                      <span>Send Real Test Email to {localSettings.parentEmail}</span>
                    </>
                  )}
                </button>

                {/* Test Feedback Result */}
                {testResult && (
                  <div
                    className={`p-4 rounded-2xl border text-xs leading-relaxed animate-in fade-in duration-200 ${
                      testResult.success
                        ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-200'
                        : 'bg-rose-950/80 border-rose-500/60 text-rose-200'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      {testResult.success ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <div className="font-bold mb-1">
                          {testResult.success ? 'Delivery Verified!' : 'Email Delivery Error'}
                        </div>
                        <div>{testResult.message}</div>
                        {testResult.previewUrl && (
                          <div className="mt-2">
                            <a
                              href={testResult.previewUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-cyan-400 underline font-semibold flex items-center gap-1"
                            >
                              <span>View message in sandbox viewer</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Master PIN reminder */}
              <div className="p-3.5 rounded-2xl bg-slate-800/40 border border-slate-700/60 text-[11px] text-slate-400 flex items-center gap-2.5">
                <Shield className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  <strong>Master Override:</strong> You can enter <strong>0000</strong> on the tablet's lock screen keypad at any time to unlock the device without waiting for an email.
                </span>
              </div>
            </div>
          )}

          {/* TAB: FAMILY ADMINS & GUARDIANS */}
          {activeTab === 'admins' && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 flex items-start gap-3.5">
                <Users className="w-6 h-6 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-sm text-cyan-200">
                    Authorized Family Admins & Guardians
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    All registered admins can receive 4-digit unlock codes in their email and configure allowed apps or tablet screen-time.
                  </p>
                </div>
              </div>

              {/* Current Admins List */}
              <div className="space-y-2.5">
                <label className="text-xs uppercase tracking-wider font-semibold text-slate-400 block">
                  Current Tablet Admins ({localSettings.adminMembers?.length || 1})
                </label>

                {(localSettings.adminMembers || []).map((admin) => (
                  <div
                    key={admin.id}
                    className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/80 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center justify-center font-bold text-sm">
                        {admin.name.slice(0, 1).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-white">{admin.name}</span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              admin.isPrimary
                                ? 'bg-cyan-950 text-cyan-300 border border-cyan-700'
                                : 'bg-slate-900 text-slate-400 border border-slate-700'
                            }`}
                          >
                            {admin.role}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400">{admin.email}</div>
                      </div>
                    </div>

                    {!admin.isPrimary && (
                      <button
                        type="button"
                        onClick={() => handleRemoveAdmin(admin.id)}
                        className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-slate-700/60 transition-colors cursor-pointer"
                        title="Remove Admin"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Add New Admin Form */}
              <form onSubmit={handleAddAdmin} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3.5">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400">
                  <Plus className="w-4 h-4" />
                  <span>Add Another Member as Admin</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Name:</label>
                    <input
                      type="text"
                      value={newAdminName}
                      onChange={(e) => setNewAdminName(e.target.value)}
                      placeholder="e.g. Mom, Dad, Uncle Chris"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Email Address:</label>
                    <input
                      type="email"
                      value={newAdminEmail}
                      onChange={(e) => setNewAdminEmail(e.target.value)}
                      placeholder="e.g. parent2@example.com"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Role:</span>
                    <select
                      value={newAdminRole}
                      onChange={(e) => setNewAdminRole(e.target.value as any)}
                      className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400"
                    >
                      <option value="Co-Parent">Co-Parent</option>
                      <option value="Guardian">Guardian</option>
                      <option value="Relative">Relative</option>
                      <option value="Babysitter">Babysitter</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Save New Admin</span>
                  </button>
                </div>

                {adminError && <p className="text-rose-400 text-xs font-semibold">{adminError}</p>}
              </form>
            </div>
          )}

          {/* TAB: ALLOWED APPS & GAMES */}
          {activeTab === 'apps' && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 flex items-start gap-3.5">
                <Gamepad2 className="w-6 h-6 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-sm text-cyan-200">
                    Manage Installed Apps & Games for Unlocked Screen
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    Admins can toggle which apps or games installed on this device are available when the tablet is unlocked.
                  </p>
                </div>
              </div>

              {/* List of Allowed Apps with Toggles */}
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {(localSettings.allowedApps || []).map((app) => (
                  <div
                    key={app.id}
                    className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                      app.enabled
                        ? 'bg-slate-800/80 border-slate-700 shadow-sm'
                        : 'bg-slate-950/40 border-slate-800/60 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl bg-gradient-to-br ${app.colorGradient} flex items-center justify-center text-xl shadow`}
                      >
                        {app.iconEmoji}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-white">{app.name}</span>
                          <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-slate-900 text-slate-400 border border-slate-800">
                            {app.category}
                          </span>
                          {app.isBuiltIn && (
                            <span className="text-[10px] text-cyan-300 font-semibold bg-cyan-950 px-1.5 py-0.2 rounded">
                              Built-in
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 line-clamp-1 mt-0.5">{app.description}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleApp(app.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          app.enabled
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                            : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700 hover:text-white'
                        }`}
                      >
                        {app.enabled ? 'Enabled' : 'Hidden'}
                      </button>

                      {!app.isBuiltIn && (
                        <button
                          type="button"
                          onClick={() => handleRemoveApp(app.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Delete app from allowed list"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick Add from Popular Catalog */}
              <div className="pt-2 border-t border-slate-800">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Quick-Add Popular Tablet Games & Apps</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {POPULAR_CATALOG_SUGGESTIONS.map((item) => {
                    const alreadyAdded = (localSettings.allowedApps || []).some((a) => a.id === item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleAddCatalogApp(item)}
                        className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                          alreadyAdded
                            ? 'bg-emerald-950/40 border-emerald-600/40 text-emerald-300'
                            : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <span className="text-xl">{item.iconEmoji}</span>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold truncate text-white">{item.name}</div>
                          <div className="text-[10px] text-slate-400 capitalize">{item.category}</div>
                        </div>
                        {alreadyAdded ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        ) : (
                          <Plus className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Form to add custom installed game */}
              {!showAddAppForm ? (
                <button
                  type="button"
                  onClick={() => {
                    sound.playKeyClick();
                    setShowAddAppForm(true);
                  }}
                  className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-semibold text-xs border border-slate-700 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Add Another Installed Game or App</span>
                </button>
              ) : (
                <form onSubmit={handleCreateCustomApp} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 animate-in fade-in">
                  <div className="text-xs font-bold text-cyan-300">Add Custom Installed App / Game</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={newAppName}
                      onChange={(e) => setNewAppName(e.target.value)}
                      placeholder="App / Game Name *"
                      className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400"
                    />
                    <select
                      value={newAppCategory}
                      onChange={(e) => setNewAppCategory(e.target.value as any)}
                      className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400"
                    >
                      <option value="games">🎮 Games & Puzzles</option>
                      <option value="education">📐 Educational</option>
                      <option value="creative">🎨 Creative</option>
                      <option value="media">📺 Media & Videos</option>
                      <option value="books">📚 Books</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={newAppPackage}
                      onChange={(e) => setNewAppPackage(e.target.value)}
                      placeholder="Package Name (e.g. com.developer.game)"
                      className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-cyan-300 font-mono focus:outline-none focus:border-cyan-400"
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">Emoji:</span>
                      {['🎮', '🕹️', '⛏️', '🛹', '🧱', '🦉', '🧩', '🚀'].map((em) => (
                        <button
                          key={em}
                          type="button"
                          onClick={() => setNewAppEmoji(em)}
                          className={`w-7 h-7 rounded-lg text-sm flex items-center justify-center ${
                            newAppEmoji === em ? 'bg-cyan-500 scale-110' : 'bg-slate-900'
                          }`}
                        >
                          {em}
                        </button>
                      ))}
                    </div>
                  </div>

                  <input
                    type="text"
                    value={newAppDesc}
                    onChange={(e) => setNewAppDesc(e.target.value)}
                    placeholder="Short description..."
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400"
                  />

                  {appFormError && <p className="text-rose-400 text-xs font-semibold">{appFormError}</p>}

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAddAppForm(false)}
                      className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs"
                    >
                      Add to Tablet
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* TAB 3: PARENT EMAIL & CHILD PROFILE */}
          {activeTab === 'email' && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/80">
                <label className="text-xs uppercase tracking-wider font-semibold text-slate-400 block mb-2">
                  Parent's Authorized Email Address:
                </label>
                <div className="flex gap-2">
                  <input
                    id="parent-email-input"
                    type="email"
                    value={localSettings.parentEmail}
                    onChange={(e) =>
                      setLocalSettings((prev) => ({ ...prev, parentEmail: e.target.value }))
                    }
                    placeholder="parent@example.com"
                    className="flex-1 px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-400"
                  />
                  <button
                    id="switch-to-delivery-tab-btn"
                    type="button"
                    onClick={() => setActiveTab('delivery')}
                    className="px-4 py-2.5 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-300 font-semibold text-xs rounded-xl transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Setup Delivery</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-2">
                  Whenever the child requests to unlock the tablet, a fresh 4-digit code is sent to this address.
                </p>
              </div>

              {/* Child Profile */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/80">
                  <label className="text-xs uppercase tracking-wider font-semibold text-slate-400 block mb-2">
                    Child's Display Name:
                  </label>
                  <input
                    id="child-name-input"
                    type="text"
                    value={localSettings.childName}
                    onChange={(e) =>
                      setLocalSettings((prev) => ({ ...prev, childName: e.target.value }))
                    }
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/80">
                  <label className="text-xs uppercase tracking-wider font-semibold text-slate-400 block mb-2">
                    Child Avatar:
                  </label>
                  <div className="flex gap-2">
                    {['🦊', '🐻', '🐼', '🦁', '🚀', '🦄'].map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => {
                          sound.playKeyClick();
                          setLocalSettings((prev) => ({ ...prev, childAvatar: emoji }));
                        }}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl border transition-all cursor-pointer ${
                          localSettings.childAvatar === emoji
                            ? 'bg-cyan-500/30 border-cyan-400 scale-110 shadow'
                            : 'bg-slate-900 border-slate-700 hover:bg-slate-800'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Emergency SOS Phone Number */}
              <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/80">
                <label className="text-xs uppercase tracking-wider font-semibold text-slate-400 block mb-2">
                  Emergency SOS Dial Target:
                </label>
                <input
                  id="emergency-number-input"
                  type="text"
                  value={localSettings.emergencyNumber}
                  onChange={(e) =>
                    setLocalSettings((prev) => ({ ...prev, emergencyNumber: e.target.value }))
                  }
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-400"
                />
                <p className="text-[11px] text-slate-400 mt-1.5">
                  The phone number dialed when the child or supervisor taps "Emergency SOS" on the lock screen.
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: ANDROID 15 / EXPO SDK 57 */}
          {activeTab === 'android15' && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/80 flex items-start gap-3">
                <Smartphone className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-sm text-slate-200">
                    Android 15 (Target SDK 35) & Expo SDK 57 Specs
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    This tablet software includes complete source code for Android 15 Lock Task Mode and Expo SDK 57 integration.
                  </p>
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-2.5">
                <div className="p-3.5 rounded-2xl bg-slate-800/40 border border-slate-700/60 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-slate-200">Kiosk Lock Task Mode</div>
                    <div className="text-[11px] text-slate-400">
                      Disables Home, Overview and Notification shade until parent OTP is entered
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={localSettings.android15.kioskLockTaskMode}
                    onChange={(e) =>
                      setLocalSettings((prev) => ({
                        ...prev,
                        android15: { ...prev.android15, kioskLockTaskMode: e.target.checked },
                      }))
                    }
                    className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
                  />
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-800/40 border border-slate-700/60 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-slate-200">Edge-to-Edge Display</div>
                    <div className="text-[11px] text-slate-400">
                      Mandatory on Android 15 with zero letterboxing
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={localSettings.android15.edgeToEdgeEnabled}
                    onChange={(e) =>
                      setLocalSettings((prev) => ({
                        ...prev,
                        android15: { ...prev.android15, edgeToEdgeEnabled: e.target.checked },
                      }))
                    }
                    className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
                  />
                </div>
              </div>

              {/* Export code snippets */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <FileCode className="w-3.5 h-3.5 text-cyan-400" />
                    <span>AndroidManifest.xml (Target SDK 35)</span>
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopyCode(
                        generateAndroidManifestXml(localSettings.android15),
                        'manifest'
                      )
                    }
                    className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                  >
                    {copiedCodeType === 'manifest' ? (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Copied
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <Copy className="w-3 h-3" /> Copy XML
                      </span>
                    )}
                  </button>
                </div>
                <pre className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-[10px] font-mono text-slate-300 overflow-x-auto max-h-36">
                  {generateAndroidManifestXml(localSettings.android15)}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 5: AUDIT LOG */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-400">
                Log of unlock verification codes dispatched to{' '}
                <strong className="text-slate-200">{localSettings.parentEmail}</strong>:
              </p>

              {emails.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs">
                  No verification codes generated yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {emails.map((e) => (
                    <div
                      key={e.id}
                      className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs font-bold text-emerald-400 px-2 py-1 rounded bg-slate-900 border border-slate-700 flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" />
                          <span>Dispatched</span>
                        </span>
                        <div>
                          <div className="font-medium text-slate-200">{e.subject}</div>
                          <div className="text-[11px] text-slate-400">
                            Sent to {localSettings.parentEmail} • Session: {e.unlockDurationMinutes} mins
                          </div>
                        </div>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {new Date(e.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 8: GITHUB UPDATES */}
          {activeTab === 'updates' && (
            <div className="space-y-4">
              <GitHubUpdatePanel onDownloadApk={onDownloadApk} />
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-800/90 border-t border-slate-700/70 flex items-center justify-between">
          <button
            id="cancel-settings-btn"
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            Cancel
          </button>
          <div className="flex items-center gap-3">
            {saveToast && (
              <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                <Check className="w-4 h-4" />
                <span>Settings Saved!</span>
              </span>
            )}
            <button
              id="save-settings-btn"
              type="button"
              onClick={handleSave}
              className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 active:scale-95 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Apply & Save</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
