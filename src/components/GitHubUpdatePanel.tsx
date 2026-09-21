import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  GitBranch,
  GitCommit,
  Sparkles,
  Download,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Clock,
  Github,
  Check,
  Edit2,
  Save,
  Package,
} from 'lucide-react';
import { GitHubUpdateStatus } from '../types';
import {
  checkGitHubUpdates,
  getSavedGitHubRepo,
  saveGitHubRepo,
  markCommitAsInstalled,
  CURRENT_APP_VERSION,
} from '../utils/githubUpdateService';
import { sound } from '../utils/audio';

interface GitHubUpdatePanelProps {
  onDownloadApk?: () => void;
  compact?: boolean;
}

export const GitHubUpdatePanel: React.FC<GitHubUpdatePanelProps> = ({
  onDownloadApk,
  compact = false,
}) => {
  const [repoName, setRepoName] = useState<string>(() => getSavedGitHubRepo());
  const [isEditingRepo, setIsEditingRepo] = useState<boolean>(false);
  const [tempRepoInput, setTempRepoInput] = useState<string>(repoName);
  const [updateStatus, setUpdateStatus] = useState<GitHubUpdateStatus | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [appliedToast, setAppliedToast] = useState<boolean>(false);

  const handleCheckUpdates = async (overrideRepo?: string) => {
    setIsLoading(true);
    sound.playKeyClick();
    const targetRepo = overrideRepo || repoName;
    try {
      const res = await checkGitHubUpdates(targetRepo);
      setUpdateStatus(res);
      if (res.status === 'update-available') {
        sound.playUnlockChime();
      } else if (res.status === 'up-to-date') {
        sound.playKeyClick();
      } else if (res.status === 'error') {
        sound.playErrorTone();
      }
    } catch {
      sound.playErrorTone();
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveRepo = () => {
    const clean = tempRepoInput.trim().replace(/^https?:\/\/github\.com\//i, '').replace(/\.git$/i, '');
    if (!clean) return;
    saveGitHubRepo(clean);
    setRepoName(clean);
    setIsEditingRepo(false);
    handleCheckUpdates(clean);
  };

  const handleMarkAsUpdated = (sha?: string) => {
    if (sha) {
      markCommitAsInstalled(sha);
      setAppliedToast(true);
      sound.playUnlockChime();
      setTimeout(() => {
        setAppliedToast(false);
        setUpdateStatus((prev) => (prev ? { ...prev, hasUpdate: false, status: 'up-to-date' } : null));
      }, 1200);
    }
  };

  useEffect(() => {
    // Initial silent check on mount
    handleCheckUpdates();
  }, []);

  if (compact) {
    return (
      <div className="p-3.5 bg-slate-900/90 border border-slate-700/70 rounded-2xl flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20 shrink-0">
            <Github className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-white">Έκδοση {CURRENT_APP_VERSION}</span>
              {updateStatus?.hasUpdate && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-pulse">
                  ΝΕΑ ΕΚΔΟΣΗ
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 truncate">
              GitHub: {repoName}
            </p>
          </div>
        </div>

        <button
          id="compact-check-update-btn"
          onClick={() => handleCheckUpdates()}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium transition-all shadow-sm cursor-pointer disabled:opacity-50 shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>{isLoading ? 'Έλεγχος...' : 'Ενημέρωση'}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header card with Repo & Version */}
      <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
              <Github className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm text-white">Ενημέρωση Εφαρμογής από GitHub</h3>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-slate-800 text-cyan-300 border border-slate-700">
                  {CURRENT_APP_VERSION}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Αυτόματος έλεγχος για νέες αλλαγές κώδικα, εκδόσεις και builds APK
              </p>
            </div>
          </div>

          <button
            id="btn-check-github-updates-main"
            onClick={() => handleCheckUpdates()}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition-all shadow-md hover:shadow-cyan-500/20 active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Έλεγχος στο GitHub...' : 'Έλεγχος για Ενημερώσεις'}</span>
          </button>
        </div>

        {/* Repository Source Configuration */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-300 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <GitBranch className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400">Αποθετήριο GitHub:</span>
            {isEditingRepo ? (
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={tempRepoInput}
                  onChange={(e) => setTempRepoInput(e.target.value)}
                  placeholder="savvasmika/SafeKidsLock"
                  className="px-2 py-1 bg-slate-900 border border-cyan-500/50 rounded-lg text-white font-mono text-xs focus:outline-none focus:ring-1 focus:ring-cyan-400"
                />
                <button
                  onClick={handleSaveRepo}
                  className="p-1 text-emerald-400 hover:bg-slate-800 rounded-md transition-colors"
                  title="Αποθήκευση"
                >
                  <Save className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <a
                href={`https://github.com/${repoName}`}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-cyan-400 hover:underline flex items-center gap-1"
              >
                <span>{repoName}</span>
                <ExternalLink className="w-3 h-3 text-slate-500" />
              </a>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!isEditingRepo && (
              <button
                onClick={() => {
                  setTempRepoInput(repoName);
                  setIsEditingRepo(true);
                }}
                className="text-[11px] text-slate-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
              >
                <Edit2 className="w-3 h-3" />
                <span>Αλλαγή Repo</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Result Status Cards */}
      {updateStatus && (
        <div className="space-y-3 animate-in fade-in duration-200">
          {/* Case 1: Update Available */}
          {updateStatus.status === 'update-available' && updateStatus.latestCommit && (
            <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/40 via-slate-900 to-cyan-950/30 border border-emerald-500/40 shadow-lg shadow-emerald-950/20 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-emerald-300">
                      🚀 Βρέθηκε Νέα Ενημέρωση στο GitHub!
                    </h4>
                    <p className="text-xs text-slate-300">
                      Υπάρχει νεότερο commit/έκδοση διαθέσιμη στο αποθετήριο.
                    </p>
                  </div>
                </div>

                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  #{updateStatus.latestCommit.shortSha}
                </span>
              </div>

              {/* Commit Details */}
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1.5 text-xs">
                <div className="flex items-center gap-2 text-slate-200 font-medium">
                  <GitCommit className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span className="line-clamp-2">{updateStatus.latestCommit.message}</span>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-slate-400">
                  <span>Συντάκτης: {updateStatus.latestCommit.author}</span>
                  <span>•</span>
                  <span>
                    Ημ/νία: {new Date(updateStatus.latestCommit.date).toLocaleString('el-GR')}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
                <div className="flex items-center gap-2">
                  <a
                    href={`https://github.com/${repoName}/actions`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
                  >
                    <Package className="w-3.5 h-3.5 text-cyan-400" />
                    <span>GitHub Actions APK</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </a>

                  <a
                    href={updateStatus.latestCommit.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
                  >
                    <span>Προβολή Αλλαγών</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </a>
                </div>

                <div className="flex items-center gap-2">
                  {onDownloadApk && (
                    <button
                      onClick={onDownloadApk}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Λήψη Νέου APK</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleMarkAsUpdated(updateStatus.latestCommit?.sha)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
                    title="Σήμανση της εφαρμογής ως συγχρονισμένης"
                  >
                    {appliedToast ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Ενημερώθηκε!</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>Σήμανση Ενημερωμένου</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Case 2: Up to Date */}
          {updateStatus.status === 'up-to-date' && (
            <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800 space-y-2.5">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <h4 className="font-semibold text-xs text-white">
                    Η εφαρμογή είναι πλήρως ενημερωμένη!
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Έχετε την πιο πρόσφατη έκδοση του κώδικα και των ρυθμίσεων ασφαλείας.
                  </p>
                </div>
              </div>

              {updateStatus.latestCommit && (
                <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between gap-2 flex-wrap">
                  <span className="truncate">
                    Τελευταίο commit: <span className="text-slate-300 font-mono font-bold">#{updateStatus.latestCommit.shortSha}</span> ({updateStatus.latestCommit.message})
                  </span>
                  <a
                    href={updateStatus.latestCommit.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-cyan-400 hover:underline flex items-center gap-1 shrink-0"
                  >
                    <span>GitHub</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Case 3: Error */}
          {updateStatus.status === 'error' && (
            <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-500/30 text-xs space-y-2">
              <div className="flex items-center gap-2 text-rose-300 font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Αδυναμία ελέγχου ενημερώσεων</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                {updateStatus.errorMessage}
              </p>
              <div className="pt-1 flex items-center gap-3">
                <a
                  href={`https://github.com/${repoName}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-cyan-400 hover:underline flex items-center gap-1 font-medium"
                >
                  <span>Άνοιγμα GitHub Repo απευθείας</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quick shortcuts info card */}
      <div className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-xl flex items-center justify-between text-[11px] text-slate-400 flex-wrap gap-2">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span>
            {updateStatus?.lastCheckedTime
              ? `Τελευταίος έλεγχος: ${new Date(updateStatus.lastCheckedTime).toLocaleTimeString('el-GR')}`
              : 'Δεν έχει πραγματοποιηθεί έλεγχος ακόμα'}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <a
            href={`https://github.com/${repoName}/releases`}
            target="_blank"
            rel="noreferrer"
            className="hover:text-cyan-300 transition-colors flex items-center gap-1"
          >
            <span>Εκδόσεις / Releases</span>
            <ExternalLink className="w-3 h-3" />
          </a>
          <span>•</span>
          <a
            href={`https://github.com/${repoName}/actions`}
            target="_blank"
            rel="noreferrer"
            className="hover:text-cyan-300 transition-colors flex items-center gap-1"
          >
            <span>Workflows / APKs</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
};
