// NextDNS has no discoverable global catalog endpoint for privacy blocklists
// (GET /blocklists 404s) - this is a hand-maintained, best-effort list of known
// blocklist ids/names. It will drift out of date; extend as needed. Checked
// state in the UI is derived by cross-referencing ids against a profile's
// actual privacy.blocklists.
export interface BlocklistCatalogEntry {
  id: string;
  name: string;
}

export const BLOCKLIST_CATALOG: BlocklistCatalogEntry[] = [
  { id: 'nextdns-recommended', name: 'NextDNS Ads & Trackers Blocklist' },
  { id: 'oisd', name: 'OISD Blocklist (Big)' },
  { id: 'oisd-nsfw', name: 'OISD NSFW Blocklist' },
  { id: 'hagezi-multi-pro-plus', name: 'HaGeZi Pro++ Multi Blocklist' },
  { id: 'hagezi-multi-normal', name: 'HaGeZi Normal Multi Blocklist' },
  { id: 'adguard-dns-filter', name: 'AdGuard DNS Filter' },
  { id: 'easylist', name: 'EasyList' },
  { id: 'easyprivacy', name: 'EasyPrivacy' },
  { id: '1hosts-lite', name: '1Hosts (Lite)' },
  { id: '1hosts-pro', name: '1Hosts (Pro)' },
  { id: 'stevenblack-hosts', name: "Steven Black's Unified Hosts" },
  { id: 'urlhaus', name: 'URLhaus Malicious URL Blocklist' },
  { id: 'phishing-army', name: 'Phishing Army' },
  { id: 'nocoin', name: 'NoCoin (Crypto-mining Protection)' },
  { id: 'goodbye-ads', name: 'Goodbye Ads' },
];
