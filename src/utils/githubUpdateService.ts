import { GitHubUpdateStatus, GitHubCommitInfo, GitHubReleaseInfo } from '../types';

export const CURRENT_APP_VERSION = 'v1.0.0';
export const DEFAULT_GITHUB_REPO = 'savvasmika/SafeKidsLock';

const STORAGE_LAST_KNOWN_SHA_KEY = 'kids_tablet_installed_sha_v1';
const STORAGE_LAST_CHECKED_KEY = 'kids_tablet_update_last_checked_v1';
const STORAGE_CUSTOM_REPO_KEY = 'kids_tablet_custom_github_repo_v1';

export function getSavedGitHubRepo(): string {
  if (typeof window === 'undefined') return DEFAULT_GITHUB_REPO;
  return localStorage.getItem(STORAGE_CUSTOM_REPO_KEY) || DEFAULT_GITHUB_REPO;
}

export function saveGitHubRepo(repo: string): void {
  if (typeof window === 'undefined') return;
  const clean = repo.trim().replace(/^https?:\/\/github\.com\//i, '').replace(/\.git$/i, '');
  localStorage.setItem(STORAGE_CUSTOM_REPO_KEY, clean || DEFAULT_GITHUB_REPO);
}

export function getInstalledCommitSha(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_LAST_KNOWN_SHA_KEY);
}

export function markCommitAsInstalled(sha: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_LAST_KNOWN_SHA_KEY, sha);
}

/**
 * Checks GitHub repository for new commits, releases, and workflow APK builds.
 */
export async function checkGitHubUpdates(repoOverride?: string): Promise<GitHubUpdateStatus> {
  const repo = (repoOverride || getSavedGitHubRepo()).trim().replace(/^https?:\/\/github\.com\//i, '').replace(/\.git$/i, '');
  const installedSha = getInstalledCommitSha();
  const currentCommitDate = new Date().toISOString().split('T')[0];

  const baseStatus: GitHubUpdateStatus = {
    isChecking: false,
    hasUpdate: false,
    currentVersion: CURRENT_APP_VERSION,
    currentCommitDate,
    status: 'up-to-date',
  };

  if (!repo || !repo.includes('/')) {
    return {
      ...baseStatus,
      status: 'error',
      errorMessage: 'Μη έγκυρο όνομα αποθετηρίου GitHub (π.χ. username/repo-name)',
    };
  }

  try {
    // 1. Fetch latest commits
    const commitsRes = await fetch(`https://api.github.com/repos/${repo}/commits?per_page=5`, {
      headers: {
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!commitsRes.ok) {
      if (commitsRes.status === 404) {
        return {
          ...baseStatus,
          status: 'error',
          errorMessage: `Το αποθετήριο "${repo}" δεν βρέθηκε ή είναι ιδιωτικό (Private). Βεβαιωθείτε ότι το όνομα είναι σωστό ή ότι έχετε πρόσβαση.`,
        };
      } else if (commitsRes.status === 403) {
        return {
          ...baseStatus,
          status: 'error',
          errorMessage: 'Υπερβήκατε το όριο κλήσεων του GitHub API. Δοκιμάστε ξανά σε λίγα λεπτά.',
        };
      } else {
        throw new Error(`GitHub API error HTTP ${commitsRes.status}`);
      }
    }

    const commits = await commitsRes.json();
    if (!Array.isArray(commits) || commits.length === 0) {
      return {
        ...baseStatus,
        status: 'up-to-date',
      };
    }

    const latest = commits[0];
    const latestSha = latest.sha;
    const shortSha = latestSha.substring(0, 7);
    const commitMsg = latest.commit?.message?.split('\n')[0] || 'Ενημέρωση κώδικα';
    const authorName = latest.commit?.author?.name || latest.author?.login || 'Developer';
    const commitDate = latest.commit?.author?.date || new Date().toISOString();
    const commitUrl = latest.html_url || `https://github.com/${repo}/commit/${latestSha}`;

    const commitInfo: GitHubCommitInfo = {
      sha: latestSha,
      shortSha,
      message: commitMsg,
      author: authorName,
      date: commitDate,
      url: commitUrl,
    };

    // 2. Fetch latest release if available
    let releaseInfo: GitHubReleaseInfo | undefined;
    try {
      const releaseRes = await fetch(`https://api.github.com/repos/${repo}/releases/latest`);
      if (releaseRes.ok) {
        const release = await releaseRes.json();
        const apkAsset = release.assets?.find((a: any) => a.name?.endsWith('.apk'));
        releaseInfo = {
          tagName: release.tag_name,
          name: release.name || release.tag_name,
          body: release.body || '',
          publishedAt: release.published_at,
          apkDownloadUrl: apkAsset ? apkAsset.browser_download_url : undefined,
          htmlUrl: release.html_url,
        };
      }
    } catch {
      // Releases not required
    }

    // Determine if update is available:
    // If we have an installed SHA saved and it doesn't match latest SHA, or if first check
    const hasNewCommit = installedSha ? installedSha !== latestSha : false;

    // Save checked timestamp
    const now = Date.now();
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_LAST_CHECKED_KEY, now.toString());
      // If no installed SHA was ever saved, record the current one
      if (!installedSha) {
        localStorage.setItem(STORAGE_LAST_KNOWN_SHA_KEY, latestSha);
      }
    }

    return {
      isChecking: false,
      hasUpdate: hasNewCommit,
      latestCommit: commitInfo,
      latestRelease: releaseInfo,
      currentVersion: CURRENT_APP_VERSION,
      currentCommitDate: new Date(commitDate).toLocaleDateString('el-GR'),
      lastCheckedTime: now,
      status: hasNewCommit ? 'update-available' : 'up-to-date',
    };
  } catch (err: any) {
    return {
      ...baseStatus,
      status: 'error',
      errorMessage: err.message || 'Αποτυχία σύνδεσης με το GitHub API.',
    };
  }
}
