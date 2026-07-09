import { nextDnsFetch } from './client';
import type { ListItem, ParentalControlSettings, PrivacySettings, Profile } from './types';

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
