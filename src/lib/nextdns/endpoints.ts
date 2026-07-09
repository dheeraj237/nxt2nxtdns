import { nextDnsFetch } from './client';
import type { ListItem, ParentalControlSettings, PrivacySettings, Profile } from './types';

export interface ProfileSummary {
  id: string;
  fingerprint: string;
  role: string;
  name: string;
}

export interface ParentalControlServiceCatalogEntry {
  id: string;
  website: string;
}

export interface ParentalControlCategoryCatalogEntry {
  id: string;
}

export function listProfiles(apiKey: string): Promise<ProfileSummary[]> {
  return nextDnsFetch(apiKey, '/profiles');
}

export function listParentalControlServicesCatalog(apiKey: string): Promise<ParentalControlServiceCatalogEntry[]> {
  return nextDnsFetch(apiKey, '/parentalControl/services');
}

export function listParentalControlCategoriesCatalog(apiKey: string): Promise<ParentalControlCategoryCatalogEntry[]> {
  return nextDnsFetch(apiKey, '/parentalControl/categories');
}

export function getProfile(apiKey: string, profileId: string): Promise<Profile> {
  return nextDnsFetch(apiKey, `/profiles/${profileId}`);
}

export function addDenylistEntry(apiKey: string, profileId: string, entry: ListItem): Promise<void> {
  return nextDnsFetch(apiKey, `/profiles/${profileId}/denylist`, {
    method: 'POST',
    body: JSON.stringify(entry),
  });
}

export function patchDenylistEntry(apiKey: string, profileId: string, entryId: string, active: boolean): Promise<void> {
  return nextDnsFetch(apiKey, `/profiles/${profileId}/denylist/${encodeURIComponent(entryId)}`, {
    method: 'PATCH',
    body: JSON.stringify({ active }),
  });
}

export function removeDenylistEntry(apiKey: string, profileId: string, entryId: string): Promise<void> {
  return nextDnsFetch(apiKey, `/profiles/${profileId}/denylist/${encodeURIComponent(entryId)}`, {
    method: 'DELETE',
  });
}

export function addAllowlistEntry(apiKey: string, profileId: string, entry: ListItem): Promise<void> {
  return nextDnsFetch(apiKey, `/profiles/${profileId}/allowlist`, {
    method: 'POST',
    body: JSON.stringify(entry),
  });
}

export function patchAllowlistEntry(apiKey: string, profileId: string, entryId: string, active: boolean): Promise<void> {
  return nextDnsFetch(apiKey, `/profiles/${profileId}/allowlist/${encodeURIComponent(entryId)}`, {
    method: 'PATCH',
    body: JSON.stringify({ active }),
  });
}

export function removeAllowlistEntry(apiKey: string, profileId: string, entryId: string): Promise<void> {
  return nextDnsFetch(apiKey, `/profiles/${profileId}/allowlist/${encodeURIComponent(entryId)}`, {
    method: 'DELETE',
  });
}

export function getPrivacy(apiKey: string, profileId: string): Promise<PrivacySettings> {
  return nextDnsFetch(apiKey, `/profiles/${profileId}/privacy`);
}

export function patchPrivacy(apiKey: string, profileId: string, patch: Partial<PrivacySettings>): Promise<void> {
  return nextDnsFetch(apiKey, `/profiles/${profileId}/privacy`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}

export function putBlocklists(apiKey: string, profileId: string, blocklists: { id: string }[]): Promise<void> {
  return nextDnsFetch(apiKey, `/profiles/${profileId}/privacy/blocklists`, {
    method: 'PUT',
    body: JSON.stringify(blocklists),
  });
}

export function getParentalControl(apiKey: string, profileId: string): Promise<ParentalControlSettings> {
  return nextDnsFetch(apiKey, `/profiles/${profileId}/parentalControl`);
}

export function patchParentalControl(
  apiKey: string,
  profileId: string,
  patch: Partial<ParentalControlSettings>,
): Promise<void> {
  return nextDnsFetch(apiKey, `/profiles/${profileId}/parentalControl`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}
