import React, { useState } from 'react';
import {
  ShieldCheck,
  Mail,
  Clock,
  ArrowRight,
  Check,
  Smartphone,
  Users,
  Plus,
  Trash2,
  Gamepad2,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { ParentSettings, AdminMember, InstalledApp } from '../types';
import { DEFAULT_INSTALLED_APPS, POPULAR_CATALOG_SUGGESTIONS } from '../utils/defaultApps';
import { sound } from '../utils/audio';

interface InitialSetupModalProps {
  isOpen: boolean;
  onComplete: (settings: ParentSettings) => void;
  defaultSettings: ParentSettings;
}

const PRESET_DURATIONS = [15, 30, 45, 60, 90, 120];

export const InitialSetupModal: React.FC<InitialSetupModalProps> = ({
  isOpen,
  onComplete,
  defaultSettings,
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: Parent & Admins
  const [primaryEmail, setPrimaryEmail] = useState<string>(defaultSettings.parentEmail);
  const [admins, setAdmins] = useState<AdminMember[]>(defaultSettings.adminMembers || []);
  const [newAdminName, setNewAdminName] = useState<string>('');
  const [newAdminEmail, setNewAdminEmail] = useState<string>('');
  const [newAdminRole, setNewAdminRole] = useState<'Co-Parent' | 'Guardian' | 'Relative' | 'Babysitter'>('Co-Parent');
  const [showAddAdminForm, setShowAddAdminForm] = useState<boolean>(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [adminError, setAdminError] = useState<string | null>(null);

  // Step 2: Child Profile
  const [childName, setChildName] = useState<string>(defaultSettings.childName);
  const [childAvatar, setChildAvatar] = useState<string>(defaultSettings.childAvatar);

  // Step 3: Allowed Device Apps & Games
  const [allowedApps, setAllowedApps] = useState<InstalledApp[]>(
    defaultSettings.allowedApps?.length ? defaultSettings.allowedApps : DEFAULT_INSTALLED_APPS
  );

  // Step 4: Duration
  const [unlockDuration, setUnlockDuration] = useState<number>(defaultSettings.unlockDurationMinutes);

  if (!isOpen) return null;

  const validateEmail = (val: string) => {
    return /\S+@\S+\.\S+/.test(val);
  };

  const handleAddAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminName.trim()) {
      setAdminError('Please enter admin name.');
      sound.playErrorTone();
      return;
    }
    if (!validateEmail(newAdminEmail.trim())) {
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

    setAdmins([...admins, newMember]);
    setNewAdminName('');
    setNewAdminEmail('');
    setAdminError(null);
    setShowAddAdminForm(false);
  };

  const handleRemoveAdmin = (id: string) => {
    sound.playKeyClick();
    setAdmins(admins.filter((a) => a.id !== id));
  };

  const handleToggleApp = (appId: string) => {
    sound.playKeyClick();
    setAllowedApps((prev) =>
      prev.map((a) => (a.id === appId ? { ...a, enabled: !a.enabled } : a))
    );
  };

  const handleNext = () => {
    if (step === 1) {
      if (!validateEmail(primaryEmail)) {
        setEmailError('Please enter a valid primary parent email address.');
        sound.playErrorTone();
        return;
      }
      setEmailError(null);
      sound.playKeyClick();
      setStep(2);
    } else if (step === 2) {
      if (!childName.trim()) {
        setChildName('Maya');
      }
      sound.playKeyClick();
      setStep(3);
    } else if (step === 3) {
      sound.playKeyClick();
      setStep(4);
    } else if (step === 4) {
      sound.playUnlockChime();

      // Ensure primary parent is always in admins list
      const updatedAdmins: AdminMember[] = [
        {
          id: 'admin_primary',
          name: 'Primary Parent',
          email: primaryEmail.trim().toLowerCase(),
          role: 'Primary Parent',
          isPrimary: true,
          addedAt: Date.now(),
        },
        ...admins.filter((a) => a.email.toLowerCase() !== primaryEmail.trim().toLowerCase()),
      ];

      const finalSettings: ParentSettings = {
        ...defaultSettings,
        parentEmail: primaryEmail.trim().toLowerCase(),
        adminMembers: updatedAdmins,
        allowedApps,
        childName: childName.trim() || 'Maya',
        childAvatar,
        unlockDurationMinutes: unlockDuration,
      };
      onComplete(finalSettings);
    }
  };

  return (
    <div
      id="initial-setup-backdrop"
      className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
    >
      <div
        id="initial-setup-container"
        className="w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-200 my-6"
      >
        {/* Header with Progress Steps */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-display font-bold text-lg sm:text-xl text-white">
                Initial Tablet Setup & Parental Lock
              </h1>
              <p className="text-xs text-slate-400">
                Configure primary parent email, admin members, and allowed games
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`h-2 rounded-full transition-all duration-300 ${
                  s === step ? 'w-6 bg-cyan-400' : s < step ? 'w-2 bg-emerald-400' : 'w-2 bg-slate-700'
                }`}
              />
            ))}
          </div>
        </div>

        {/* STEP 1: PARENT EMAIL & MULTI-ADMIN MEMBERS */}
        {step === 1 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/30">
              <div className="flex items-center gap-2 text-cyan-300 font-semibold text-sm mb-1">
                <Mail className="w-4 h-4 text-cyan-400" />
                <span>Primary Parent Email</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                When your child requests to unlock the tablet, 4-digit codes will be sent to this email address.
              </p>
            </div>

            <div>
              <label className="text-xs uppercase tracking-wider font-semibold text-slate-400 block mb-2">
                Parent Email Address:
              </label>
              <input
                id="setup-email-input"
                type="email"
                value={primaryEmail}
                onChange={(e) => {
                  setPrimaryEmail(e.target.value);
                  if (emailError) setEmailError(null);
                }}
                placeholder="savvas.mika2015@gmail.com"
                className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-2xl text-white text-base focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
                autoFocus
              />
              {emailError && (
                <p className="text-rose-400 text-xs mt-1.5 font-medium">{emailError}</p>
              )}
            </div>

            {/* Additional Admin Members Option */}
            <div className="pt-3 border-t border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-xs uppercase tracking-wider font-bold text-slate-300">
                  <Users className="w-4 h-4 text-cyan-400" />
                  <span>Additional Family Admins (Optional)</span>
                </div>
                {!showAddAdminForm && (
                  <button
                    type="button"
                    onClick={() => {
                      sound.playKeyClick();
                      setShowAddAdminForm(true);
                    }}
                    className="text-xs font-semibold text-cyan-300 hover:text-cyan-200 flex items-center gap-1 bg-slate-800 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Member as Admin</span>
                  </button>
                )}
              </div>

              <p className="text-xs text-slate-400 mb-3">
                Add co-parents, guardians, or babysitters who can also receive unlock codes and manage the tablet.
              </p>

              {/* Add Admin Form */}
              {showAddAdminForm && (
                <div className="p-4 rounded-2xl bg-slate-950 border border-cyan-500/40 space-y-3 mb-3 animate-in fade-in">
                  <div className="text-xs font-bold text-cyan-300">New Admin Member</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <input
                      type="text"
                      value={newAdminName}
                      onChange={(e) => setNewAdminName(e.target.value)}
                      placeholder="Name (e.g. Dad, Mom, Grandma)"
                      className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400"
                    />
                    <input
                      type="email"
                      value={newAdminEmail}
                      onChange={(e) => setNewAdminEmail(e.target.value)}
                      placeholder="Admin Email Address"
                      className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-400">Role:</span>
                      <select
                        value={newAdminRole}
                        onChange={(e) => setNewAdminRole(e.target.value as any)}
                        className="px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200"
                      >
                        <option value="Co-Parent">Co-Parent</option>
                        <option value="Guardian">Guardian</option>
                        <option value="Relative">Relative</option>
                        <option value="Babysitter">Babysitter</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowAddAdminForm(false)}
                        className="px-3 py-1 rounded-lg text-xs text-slate-400 hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleAddAdmin}
                        className="px-3.5 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md transition-all cursor-pointer"
                      >
                        Save Admin
                      </button>
                    </div>
                  </div>

                  {adminError && <p className="text-rose-400 text-[11px] font-semibold">{adminError}</p>}
                </div>
              )}

              {/* List of Added Admins */}
              {admins.length > 0 ? (
                <div className="space-y-2">
                  {admins.map((adm) => (
                    <div
                      key={adm.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/70 border border-slate-800"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold text-xs">
                          {adm.name.slice(0, 1).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-200 flex items-center gap-2">
                            <span>{adm.name}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                              {adm.role}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400">{adm.email}</div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveAdmin(adm.id)}
                        className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Remove Admin"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-[11px] text-slate-500 italic">
                  No additional admins added yet. You can also add more admins later in Parent Controls.
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 2: CHILD PROFILE */}
        {step === 2 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div>
              <label className="text-xs uppercase tracking-wider font-semibold text-slate-400 block mb-2">
                Child's Name:
              </label>
              <input
                id="setup-child-name"
                type="text"
                value={childName}
                onChange={(e) => setChildName(e.target.value)}
                placeholder="e.g. Maya, Leo"
                className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-2xl text-white text-base focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="text-xs uppercase tracking-wider font-semibold text-slate-400 block mb-2">
                Choose Tablet Avatar:
              </label>
              <div className="grid grid-cols-6 gap-2">
                {['🦊', '🐻', '🐼', '🦁', '🚀', '🦄'].map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => {
                      sound.playKeyClick();
                      setChildAvatar(emoji);
                    }}
                    className={`h-14 rounded-2xl text-2xl flex items-center justify-center transition-all ${
                      childAvatar === emoji
                        ? 'bg-cyan-500 text-white ring-4 ring-cyan-400/40 scale-105 shadow-lg'
                        : 'bg-slate-950 hover:bg-slate-800 border border-slate-800'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 text-xs text-slate-300">
              Greeting on lock screen will show: <strong className="text-cyan-300">{childAvatar} {childName || 'Maya'}'s Learning Tablet</strong>
            </div>
          </div>
        )}

        {/* STEP 3: ALLOWED DEVICE APPS & GAMES */}
        {step === 3 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="p-3.5 rounded-2xl bg-cyan-950/40 border border-cyan-500/30">
              <div className="flex items-center gap-2 text-cyan-300 font-semibold text-sm mb-1">
                <Gamepad2 className="w-4 h-4 text-cyan-400" />
                <span>Installed Apps & Games for Unlocked Screen</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Admins control exactly which installed apps and games are visible to your child when the tablet is unlocked. Toggle any app below:
              </p>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {allowedApps.map((app) => (
                <div
                  key={app.id}
                  onClick={() => handleToggleApp(app.id)}
                  className={`p-3 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                    app.enabled
                      ? 'bg-slate-800/90 border-slate-700 shadow-sm'
                      : 'bg-slate-950/40 border-slate-800/60 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{app.iconEmoji}</span>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>{app.name}</span>
                        <span className="text-[10px] text-slate-400 font-normal">({app.category})</span>
                      </div>
                      <div className="text-[11px] text-slate-400 line-clamp-1">{app.description}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-xl transition-all ${
                        app.enabled
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {app.enabled ? 'Enabled' : 'Off'}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
              <span>
                Active on unlocked screen: <strong className="text-cyan-300">{allowedApps.filter((a) => a.enabled).length} apps</strong>
              </span>
              <span className="text-[11px] text-slate-400">Admins can add more games anytime in Settings</span>
            </div>
          </div>
        )}

        {/* STEP 4: UNLOCK DURATION & FINISH */}
        {step === 4 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/30">
              <div className="flex items-center gap-2 text-cyan-300 font-semibold text-sm mb-1">
                <Clock className="w-4 h-4 text-cyan-400" />
                <span>How long should the tablet stay unlocked?</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                When unlocked with your 4-digit code, the tablet will remain active for this amount of time before automatically relocking.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {PRESET_DURATIONS.map((m) => {
                const isSelected = unlockDuration === m;
                return (
                  <button
                    key={m}
                    id={`setup-duration-${m}`}
                    type="button"
                    onClick={() => {
                      sound.playKeyClick();
                      setUnlockDuration(m);
                    }}
                    className={`py-3.5 px-3 rounded-2xl border text-center font-bold transition-all ${
                      isSelected
                        ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-lg ring-2 ring-cyan-400/40 scale-105'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    <div className="text-base">{m >= 60 ? `${m / 60} hour${m > 60 ? 's' : ''}` : `${m} minutes`}</div>
                    <div className="text-[10px] opacity-75 font-normal">Auto-relock after {m}m</div>
                  </button>
                );
              })}
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 flex items-center justify-between text-xs text-emerald-300">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-emerald-400" />
                <span>Android 15 (SDK 57) Edge-to-Edge & Lock Task Enabled</span>
              </div>
              <span className="font-bold text-[11px] bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/40">
                Ready
              </span>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-5 border-t border-slate-800 mt-6">
          {step > 1 ? (
            <button
              id="setup-back-btn"
              type="button"
              onClick={() => {
                sound.playKeyClick();
                setStep((s) => (s - 1) as 1 | 2 | 3);
              }}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
            >
              Back
            </button>
          ) : (
            <span />
          )}

          <button
            id="setup-next-btn"
            type="button"
            onClick={handleNext}
            className="px-6 py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 active:scale-95 text-slate-950 font-bold text-sm shadow-xl transition-all flex items-center gap-2 cursor-pointer"
          >
            {step === 4 ? (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Finish Setup & Lock Tablet</span>
              </>
            ) : (
              <>
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
