export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });

  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json();
      message = body?.error ?? message;
    } catch {
      // ignore
    }
    throw new ApiError(res.status, message);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export interface Account {
  id: string;
  label: string;
  is_master: 0 | 1;
  created_at: string;
}

export interface Profile {
  id: string;
  account_id: string;
  profile_id: string;
  display_name: string | null;
  account_label: string;
  created_at: string;
}

export interface ListItem {
  id: string;
  active: boolean;
}

export interface LiveProfile {
  id: string;
  name?: string;
  denylist: ListItem[];
  allowlist: ListItem[];
  privacy: {
    blocklists: { id: string }[];
    disguisedTrackers: boolean;
    allowAffiliate: boolean;
  };
  parentalControl: {
    services: ListItem[];
    categories: ListItem[];
    safeSearch: boolean;
    youtubeRestrictedMode: boolean;
  };
}

export interface SyncOp {
  kind: string;
  payload: unknown;
  description: string;
}

export interface SyncDiff {
  targetProfileId: string;
  ops: SyncOp[];
  summary: { toAdd: number; toRemove: number; toUpdate: number };
}

export interface SyncResult {
  profileId: string;
  success: boolean;
  opsApplied: number;
  error?: string;
}

export interface CatalogService {
  id: string;
  website: string;
}

export interface CatalogCategory {
  id: string;
}

export type SyncSource = 'master' | 'kill-switch';

export const api = {
  login: (password: string) => apiFetch<{ ok: true }>('/api/auth/login', { method: 'POST', body: JSON.stringify({ password }) }),
  logout: () => apiFetch<{ ok: true }>('/api/auth/logout', { method: 'POST' }),

  listAccounts: () => apiFetch<Account[]>('/api/accounts'),
  createAccount: (label: string, apiKey: string) =>
    apiFetch<Account>('/api/accounts', { method: 'POST', body: JSON.stringify({ label, apiKey }) }),
  deleteAccount: (id: string) => apiFetch<void>(`/api/accounts/${id}`, { method: 'DELETE' }),
  setMasterAccount: (id: string) => apiFetch<{ ok: true }>(`/api/accounts/${id}/master`, { method: 'PATCH' }),

  listProfiles: () => apiFetch<Profile[]>('/api/profiles'),
  createProfile: (accountId: string, profileId: string, displayName?: string) =>
    apiFetch<Profile>('/api/profiles', { method: 'POST', body: JSON.stringify({ accountId, profileId, displayName }) }),
  deleteProfile: (id: string) => apiFetch<void>(`/api/profiles/${id}`, { method: 'DELETE' }),
  getLiveProfile: (id: string) => apiFetch<LiveProfile>(`/api/profiles/${id}/live`),
  addLiveEntry: (id: string, kind: 'denylist' | 'allowlist', entryId: string) =>
    apiFetch(`/api/profiles/${id}/live/${kind}`, { method: 'POST', body: JSON.stringify({ id: entryId, active: true }) }),
  removeLiveEntry: (id: string, kind: 'denylist' | 'allowlist', entryId: string) =>
    apiFetch<void>(`/api/profiles/${id}/live/${kind}/${encodeURIComponent(entryId)}`, { method: 'DELETE' }),
  patchLivePrivacy: (id: string, patch: Partial<LiveProfile['privacy']>) =>
    apiFetch(`/api/profiles/${id}/live/privacy`, { method: 'PATCH', body: JSON.stringify(patch) }),
  putLiveBlocklists: (id: string, blocklists: { id: string }[]) =>
    apiFetch(`/api/profiles/${id}/live/privacy/blocklists`, { method: 'PUT', body: JSON.stringify(blocklists) }),
  patchLiveParentalControl: (id: string, patch: Partial<LiveProfile['parentalControl']>) =>
    apiFetch(`/api/profiles/${id}/live/parentalControl`, { method: 'PATCH', body: JSON.stringify(patch) }),

  getKillSwitch: () => apiFetch<LiveProfile>('/api/kill-switch'),
  addKillSwitchEntry: (kind: 'denylist' | 'allowlist', entryId: string) =>
    apiFetch(`/api/kill-switch/${kind}`, { method: 'POST', body: JSON.stringify({ id: entryId, active: true }) }),
  removeKillSwitchEntry: (kind: 'denylist' | 'allowlist', entryId: string) =>
    apiFetch<void>(`/api/kill-switch/${kind}/${encodeURIComponent(entryId)}`, { method: 'DELETE' }),
  patchKillSwitchPrivacy: (patch: Partial<LiveProfile['privacy']>) =>
    apiFetch('/api/kill-switch/privacy', { method: 'PATCH', body: JSON.stringify(patch) }),
  putKillSwitchBlocklists: (blocklists: { id: string }[]) =>
    apiFetch('/api/kill-switch/privacy/blocklists', { method: 'PUT', body: JSON.stringify(blocklists) }),
  patchKillSwitchParentalControl: (patch: Partial<LiveProfile['parentalControl']>) =>
    apiFetch('/api/kill-switch/parentalControl', { method: 'PATCH', body: JSON.stringify(patch) }),

  getParentalControlServicesCatalog: () => apiFetch<CatalogService[]>('/api/catalog/parental-control/services'),
  getParentalControlCategoriesCatalog: () => apiFetch<CatalogCategory[]>('/api/catalog/parental-control/categories'),

  computeDiff: (source: SyncSource, targetProfileIds?: string[]) =>
    apiFetch<SyncDiff[]>('/api/sync/diff', { method: 'POST', body: JSON.stringify({ source, targetProfileIds }) }),
  applySync: (source: SyncSource, targetProfileIds?: string[]) =>
    apiFetch<SyncResult[]>('/api/sync/apply', { method: 'POST', body: JSON.stringify({ source, targetProfileIds }) }),
};
