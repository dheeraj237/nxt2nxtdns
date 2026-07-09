export interface ListItem {
  id: string;
  active: boolean;
}

export interface PrivacySettings {
  blocklists: { id: string }[];
  natives?: unknown;
  disguisedTrackers: boolean;
  allowAffiliate: boolean;
}

export interface ParentalControlSettings {
  services: ListItem[];
  categories: ListItem[];
  safeSearch: boolean;
  youtubeRestrictedMode: boolean;
  blockBypass: unknown;
}

export interface Profile {
  id: string;
  name?: string;
  denylist: ListItem[];
  allowlist: ListItem[];
  parentalControl: ParentalControlSettings;
  privacy: PrivacySettings;
}

export interface ProfileSetup {
  linkedIp?: string;
  linkedIpDNSServers?: string[];
  linkedIpUpdateToken?: string;
  ddnsHostname?: string;
}
