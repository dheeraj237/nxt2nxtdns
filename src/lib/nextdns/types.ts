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
  id?: string;
  dnsServers?: string[];
  dnsOverTls?: string;
  dnsOverHttps?: string;
  ipv6Addresses?: string[];
  linkedIp?: string;
  linkedIpDNSServers?: string[];
  linkedIpUpdateToken?: string;
  ddnsHostname?: string;
}

export interface AnalyticsData {
  blocked: number;
  allowed: number;
  default: number;
  total: number;
  percentage: number;
  limit: number;
}

export interface LogEntry {
  timestamp: string;
  domain: string;
  root: string;
  protocol: string;
  clientIp: string;
  status: 'blocked' | 'allowed' | 'default' | 'error';
  device?: {
    id: string;
    name: string;
    model?: string;
  };
  encrypted: boolean;
  reasons?: Array<{ rule?: string; category?: string }>;
  tracker?: string;
}
