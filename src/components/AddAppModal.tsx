import React, { useState } from 'react';
import {
  X,
  Plus,
  Gamepad2,
  Sparkles,
  Smartphone,
  Check,
  CheckCircle2,
  Trash2,
  Search,
  Filter,
} from 'lucide-react';
import { InstalledApp, AppCategory } from '../types';
import { POPULAR_CATALOG_SUGGESTIONS } from '../utils/defaultApps';
import { sound } from '../utils/audio';

interface AddAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  allowedApps: InstalledApp[];
  onSaveApps: (updatedApps: InstalledApp[]) => void;
}

const EMOJI_PALETTE = ['🎮', '🕹️', '⛏️', '🛹', '🧱', '🚗', '🚀', '🦉', '🐯', '🧩', '♟️', '🏰', '🦄', '⚽', '🎸', '🎨', '📚', '🦖', '🍎', '⭐'];

const GRADIENT_PALETTE = [
  { label: 'Emerald Emerald', val: 'from-emerald-600 to-green-800' },
  { label: 'Cyan Ocean', val: 'from-cyan-500 to-blue-600' },
  { label: 'Purple Violet', val: 'from-purple-500 to-indigo-600' },
  { label: 'Sunset Amber', val: 'from-amber-500 to-orange-600' },
  { label: 'Rose Berry', val: 'from-pink-500 to-rose-600' },
  { label: 'Fire Red', val: 'from-red-500 to-rose-700' },
  { label: 'Dark Slate', val: 'from-slate-700 to-slate-900' },
  { label: 'Teal Forest', val: 'from-teal-500 to-emerald-700' },
];

export const AddAppModal: React.FC<AddAppModalProps> = ({
  isOpen,
  onClose,
  allowedApps,
  onSaveApps,
}) => {
  const [activeTab, setActiveTab] = useState<'catalog' | 'custom'>('catalog');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Custom App Form State
  const [customName, setCustomName] = useState<string>('');
  const [customCategory, setCustomCategory] = useState<AppCategory>('games');
  const [customPackage, setCustomPackage] = useState<string>('');
  const [customEmoji, setCustomEmoji] = useState<string>('🎮');
  const [customGradient, setCustomGradient] = useState<string>(GRADIENT_PALETTE[0].val);
  const [customDesc, setCustomDesc] = useState<string>('');
  const [customAge, setCustomAge] = useState<string>('All Ages');
  const [formError, setFormError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleToggleApp = (appId: string) => {
    sound.playKeyClick();
    const updated = allowedApps.map((a) => (a.id === appId ? { ...a, enabled: !a.enabled } : a));
    onSaveApps(updated);
  };

  const handleAddFromCatalog = (catalogItem: (typeof POPULAR_CATALOG_SUGGESTIONS)[0]) => {
    sound.playUnlockChime();
    const existing = allowedApps.find((a) => a.id === catalogItem.id);
    if (existing) {
      handleToggleApp(existing.id);
      return;
    }

    const newApp: InstalledApp = {
      ...catalogItem,
      enabled: true,
    };
    onSaveApps([...allowedApps, newApp]);
  };

  const handleRemoveApp = (appId: string) => {
    sound.playKeyClick();
    const updated = allowedApps.filter((a) => a.id !== appId);
    onSaveApps(updated);
  };

  const handleCreateCustomApp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) {
      setFormError('Please enter an app or game name.');
      sound.playErrorTone();
      return;
    }

    sound.playUnlockChime();
    const cleanId = `custom_${Date.now()}_${customName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    const newApp: InstalledApp = {
      id: cleanId,
      name: customName.trim(),
      category: customCategory,
      packageName: customPackage.trim() || `com.tablet.${cleanId}`,
      iconEmoji: customEmoji,
      colorGradient: customGradient,
      description: customDesc.trim() || 'Parent-approved installed game on tablet',
      enabled: true,
      isBuiltIn: false,
      ageRating: customAge,
    };

    onSaveApps([...allowedApps, newApp]);
    // Reset form
    setCustomName('');
    setCustomPackage('');
    setCustomDesc('');
    setFormError(null);
    setActiveTab('catalog');
  };

  const filteredApps = allowedApps.filter((app) => {
    const matchesSearch =
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (app.packageName && app.packageName.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCat = filterCategory === 'all' || app.category === filterCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div
      id="add-app-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
    >
      <div
        id="add-app-modal-container"
        className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl p-6 sm:p-8 my-8 animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
              <Gamepad2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-display font-bold text-xl text-white flex items-center gap-2">
                <span>Manage Tablet Apps & Games</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-700">
                  Admin Only
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Choose which installed games & apps appear on your child's unlocked screen
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher: Installed Catalog vs Add Custom App */}
        <div className="flex items-center gap-2 mb-6 border-b border-slate-800 pb-3">
          <button
            type="button"
            onClick={() => setActiveTab('catalog')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'catalog'
                ? 'bg-cyan-500 text-slate-950 shadow-md'
                : 'bg-slate-800/80 text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Allowed Apps Catalog ({allowedApps.filter((a) => a.enabled).length} Enabled)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('custom')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'custom'
                ? 'bg-cyan-500 text-slate-950 shadow-md'
                : 'bg-slate-800/80 text-slate-400 hover:text-white'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Installed App or Game</span>
          </button>
        </div>

        {/* TAB 1: ALLOWED APPS & POPULAR PRESETS */}
        {activeTab === 'catalog' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Search & Category Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search apps by name or category..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                {['all', 'games', 'education', 'creative', 'media'].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setFilterCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize whitespace-nowrap transition-colors ${
                      filterCategory === cat
                        ? 'bg-slate-700 text-white'
                        : 'bg-slate-950 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {cat === 'all' ? 'All' : cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Current Tablet Apps List */}
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {filteredApps.map((app) => (
                <div
                  key={app.id}
                  className={`p-3 rounded-2xl border transition-all flex items-center justify-between ${
                    app.enabled
                      ? 'bg-slate-800/80 border-slate-700 shadow-sm'
                      : 'bg-slate-950/50 border-slate-800/60 opacity-65'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-11 h-11 rounded-xl bg-gradient-to-br ${app.colorGradient} flex items-center justify-center text-xl shadow-md shrink-0`}
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
                      <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{app.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleApp(app.id)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
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
                        title="Delete from allowed list"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Popular Catalog Suggestions Bar */}
            <div className="pt-2 border-t border-slate-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Quick-Add Other Games & Educational Apps Installed on Android</span>
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {POPULAR_CATALOG_SUGGESTIONS.map((item) => {
                  const alreadyAdded = allowedApps.some((a) => a.id === item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleAddFromCatalog(item)}
                      className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
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
          </div>
        )}

        {/* TAB 2: CUSTOM APP / GAME CREATOR */}
        {activeTab === 'custom' && (
          <form onSubmit={handleCreateCustomApp} className="space-y-4 animate-in fade-in duration-150">
            <div className="p-3.5 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 text-xs text-slate-300">
              <div className="font-semibold text-cyan-300 mb-0.5">Admin App Authorization</div>
              Enter the details of any APK or game installed on this tablet (e.g. from Google Play Store or APK) to grant your child access when unlocked.
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs uppercase tracking-wider font-semibold text-slate-400 block mb-1.5">
                  App or Game Name *
                </label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => {
                    setCustomName(e.target.value);
                    if (formError) setFormError(null);
                  }}
                  placeholder="e.g. Subway Surfers, ScratchJr, Chess"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-xs uppercase tracking-wider font-semibold text-slate-400 block mb-1.5">
                  Category
                </label>
                <select
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value as AppCategory)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-400"
                >
                  <option value="games">🎮 Games & Puzzles</option>
                  <option value="education">📐 Educational & Learning</option>
                  <option value="creative">🎨 Creative & Art</option>
                  <option value="media">📺 Media & Videos</option>
                  <option value="books">📚 Books & Reading</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs uppercase tracking-wider font-semibold text-slate-400 block mb-1.5">
                Android Package Identifier (Optional)
              </label>
              <input
                type="text"
                value={customPackage}
                onChange={(e) => setCustomPackage(e.target.value)}
                placeholder="e.g. com.developer.gameapp"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm font-mono text-cyan-300 focus:outline-none focus:border-cyan-400"
              />
            </div>

            {/* Emoji Selector */}
            <div>
              <label className="text-xs uppercase tracking-wider font-semibold text-slate-400 block mb-1.5">
                Choose App Icon:
              </label>
              <div className="flex items-center gap-2 overflow-x-auto p-2 bg-slate-950 rounded-2xl border border-slate-800">
                {EMOJI_PALETTE.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => {
                      sound.playKeyClick();
                      setCustomEmoji(emoji);
                    }}
                    className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all ${
                      customEmoji === emoji
                        ? 'bg-cyan-500 text-white scale-110 shadow-md ring-2 ring-cyan-400'
                        : 'hover:bg-slate-800'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Gradient Selector */}
            <div>
              <label className="text-xs uppercase tracking-wider font-semibold text-slate-400 block mb-1.5">
                Color Gradient Theme:
              </label>
              <div className="grid grid-cols-4 gap-2">
                {GRADIENT_PALETTE.map((g) => (
                  <button
                    key={g.val}
                    type="button"
                    onClick={() => {
                      sound.playKeyClick();
                      setCustomGradient(g.val);
                    }}
                    className={`h-9 rounded-xl bg-gradient-to-r ${g.val} flex items-center justify-center transition-all ${
                      customGradient === g.val ? 'ring-2 ring-white scale-105 shadow-md' : 'opacity-70 hover:opacity-100'
                    }`}
                  >
                    {customGradient === g.val && <Check className="w-4 h-4 text-white" />}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs uppercase tracking-wider font-semibold text-slate-400 block mb-1.5">
                Description / Notes
              </label>
              <input
                type="text"
                value={customDesc}
                onChange={(e) => setCustomDesc(e.target.value)}
                placeholder="e.g. Fun racing game for weekend screen time"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-400"
              />
            </div>

            {formError && <p className="text-rose-400 text-xs font-semibold">{formError}</p>}

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setActiveTab('catalog')}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 active:scale-95 text-slate-950 font-bold text-xs shadow-lg transition-all flex items-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                <span>Add App to Unlocked Screen</span>
              </button>
            </div>
          </form>
        )}

        {/* Footer info */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>
            {allowedApps.filter((a) => a.enabled).length} of {allowedApps.length} apps active on unlocked screen
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
