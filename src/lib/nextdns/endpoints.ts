import { nextDnsFetch } from './client';
import type { ListItem, ParentalControlSettings, PrivacySettings, Profile, ProfileSetup } from './types';

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

export async function getProfileSetup(apiKey: string, profileId: string): Promise<ProfileSetup> {
  const response = (await nextDnsFetch(apiKey, `/profiles/${profileId}/setup`)) as {
    ipv4?: string[];
    ipv6?: string[];
    linkedIp?: {
      servers?: string[];
      ip?: string;
      updateToken?: string;
      ddns?: string | null;
    };
    dnscrypt?: string;
  };

  const data = response;
  const linkedIpData = data.linkedIp || {};

  return {
    id: profileId,
    dnsServers: data.ipv4 && data.ipv4.length > 0 ? data.ipv4 : undefined,
    dnsOverTls: `${profileId}.dns.nextdns.io`,
    dnsOverHttps: `https://dns.nextdns.io/${profileId}`,
    ipv6Addresses: data.ipv6,
    linkedIp: linkedIpData.ip,
    linkedIpDNSServers: linkedIpData.servers,
    linkedIpUpdateToken: linkedIpData.updateToken,
    ddnsHostname: linkedIpData.ddns || undefined,
  };
}

export async function linkProfileToCurrentIp(linkedIpUpdateToken: string, profileId: string): Promise<string> {
  try {
    const response = await fetch(`https://link-ip.nextdns.io/${profileId}/${linkedIpUpdateToken}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`NextDNS link-ip returned ${response.status}: ${response.statusText}`);
    }

    const linkedIp = await response.text();
    return linkedIp;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to link IP to profile ${profileId}: ${message}`);
  }
}

export interface AnalyticsStatusItem {
  status: 'blocked' | 'allowed' | 'default';
  queries: number;
}

export async function getAnalyticsStatus(
  apiKey: string,
  profileId: string,
  from: string,
  to: string,
): Promise<AnalyticsStatusItem[]> {
  return nextDnsFetch(apiKey, `/profiles/${profileId}/analytics/status?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
}

export async function getLogs(apiKey: string, profileId: string, limit: number = 50): Promise<any[]> {
  return nextDnsFetch(apiKey, `/profiles/${profileId}/logs?limit=${limit}&sort=desc`);
}
