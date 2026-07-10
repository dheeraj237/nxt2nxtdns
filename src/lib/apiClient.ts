import type { Profile as NextDnsProfile } from '@/lib/nextdns/types';

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
  default_profile_id: string | null;
  created_at: string;
}

export interface AccountProfilePreview {
  id: string;
  fingerprint: string;
  role: string;
  name: string;
}

export interface Profile {
  id: string;
  account_id: string;
  profile_id: string;
  display_name: string | null;
  auto_refresh_linked_ip: boolean;
  account_label: string;
  created_at: string;
}

export type ListItem = NextDnsProfile['denylist'][number];
export type LiveProfile = NextDnsProfile;

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

export interface LinkedIpResponse {
  linkedIp: string | null;
  linkedIpDNSServers: string[];
  updatedAt: string;
}

export interface Schedule {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  target_profile_id: string;
  enabled: boolean;
  last_executed_at: string | null;
  created_at: string;
}

export interface ScheduleSnapshot {
  id: string;
  schedule_id: string;
  account_id: string;
  profile_id: string;
  snapshot_json: string;
  created_at: string;
}

export const api = {
  login: (password: string) => apiFetch<{ ok: true }>('/api/auth/login', { method: 'POST', body: JSON.stringify({ password }) }),
  logout: () => apiFetch<{ ok: true }>('/api/auth/logout', { method: 'POST' }),

  listAccounts: () => apiFetch<Account[]>('/api/accounts'),
  previewAccountProfiles: (apiKey: string) =>
    apiFetch<AccountProfilePreview[]>('/api/accounts/preview', { method: 'POST', body: JSON.stringify({ apiKey }) }),
  createAccount: (label: string, apiKey: string, profiles: AccountProfilePreview[], defaultProfileIndex: number) =>
    apiFetch<Account>('/api/accounts', {
      method: 'POST',
      body: JSON.stringify({ label, apiKey, profiles, defaultProfileIndex }),
    }),
  updateAccount: (id: string, patch: { label?: string; defaultProfileId?: string }) =>
    apiFetch<{ ok: true }>(`/api/accounts/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  deleteAccount: (id: string) => apiFetch<void>(`/api/accounts/${id}`, { method: 'DELETE' }),

  listProfiles: () => apiFetch<Profile[]>('/api/profiles'),
  deleteProfile: (id: string) => apiFetch<void>(`/api/profiles/${id}`, { method: 'DELETE' }),
  updateProfile: (id: string, patch: { autoRefreshLinkedIp?: boolean }) =>
    apiFetch<{ ok: true }>(`/api/profiles/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  linkProfileNow: (id: string) => apiFetch<LinkedIpResponse>(`/api/profiles/${id}/link-ip`, { method: 'POST' }),
  getLiveProfile: (id: string) => apiFetch<LiveProfile>(`/api/profiles/${id}/live`),
  addLiveEntry: (id: string, kind: 'denylist' | 'allowlist', entryId: string) =>
    apiFetch(`/api/profiles/${id}/live/${kind}`, { method: 'POST', body: JSON.stringify({ id: entryId, active: true }) }),
  removeLiveEntry: (id: string, kind: 'denylist' | 'allowlist', entryId: string) =>
    apiFetch<void>(`/api/profiles/${id}/live/${kind}/${encodeURIComponent(entryId)}`, { method: 'DELETE' }),
  patchLiveEntry: (id: string, kind: 'denylist' | 'allowlist', entryId: string, active: boolean) =>
    apiFetch(`/api/profiles/${id}/live/${kind}/${encodeURIComponent(entryId)}`, { method: 'PATCH', body: JSON.stringify({ active }) }),
  patchLivePrivacy: (id: string, patch: Partial<LiveProfile['privacy']>) =>
    apiFetch(`/api/profiles/${id}/live/privacy`, { method: 'PATCH', body: JSON.stringify(patch) }),
  putLiveBlocklists: (id: string, blocklists: { id: string }[]) =>
    apiFetch(`/api/profiles/${id}/live/privacy/blocklists`, { method: 'PUT', body: JSON.stringify(blocklists) }),
  patchLiveParentalControl: (id: string, patch: Partial<LiveProfile['parentalControl']>) =>
    apiFetch(`/api/profiles/${id}/live/parentalControl`, { method: 'PATCH', body: JSON.stringify(patch) }),

  getParentalControlServicesCatalog: () => apiFetch<CatalogService[]>('/api/catalog/parental-control/services'),
  getParentalControlCategoriesCatalog: () => apiFetch<CatalogCategory[]>('/api/catalog/parental-control/categories'),

  computeDiff: (sourceProfile: LiveProfile, targetAccountIds: string[]) =>
    apiFetch<SyncDiff[]>('/api/sync/diff', { method: 'POST', body: JSON.stringify({ sourceProfile, targetAccountIds }) }),
  applySync: (sourceProfile: LiveProfile, targetAccountIds: string[]) =>
    apiFetch<SyncResult[]>('/api/sync/apply', { method: 'POST', body: JSON.stringify({ sourceProfile, targetAccountIds }) }),

  listSchedules: () => apiFetch<Schedule[]>('/api/schedules'),
  createSchedule: (name: string, startTime: string, endTime: string, targetProfileId: string) =>
    apiFetch<Schedule>('/api/schedules', {
      method: 'POST',
      body: JSON.stringify({ name, startTime, endTime, targetProfileId }),
    }),
  getSchedule: (id: string) => apiFetch<Schedule>(`/api/schedules/${id}`),
  updateSchedule: (id: string, patch: Partial<Omit<Schedule, 'id' | 'created_at'>>) =>
    apiFetch<Schedule>(`/api/schedules/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  deleteSchedule: (id: string) => apiFetch<void>(`/api/schedules/${id}`, { method: 'DELETE' }),
};
