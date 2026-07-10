'use client';

import { useState } from 'react';
import { useLinkedIp } from '@/hooks/useLinkedIp';
import type { ProfileSetup } from '@/lib/nextdns/types';

interface SetupTabProps {
  profileId: string;
  profileLabel: string;
  setup: ProfileSetup | null;
  setupLoading: boolean;
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="flex items-center justify-between rounded bg-gray-50 p-3">
      <div className="flex-1">
        <p className="text-xs text-gray-500">{label}</p>
        <p className="font-mono text-sm text-gray-900">{value}</p>
      </div>
      <button
        onClick={handleCopy}
        className="ml-2 rounded bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-200 transition-colors"
      >
        {copied ? 'Copied!' : 'Copy'}
      </button>
    </div>
  );
}

export function SetupTab({ profileId, profileLabel, setup, setupLoading }: SetupTabProps) {
  const { linkedIp, isAutoRefreshEnabled, linkNow, toggleAutoRefresh, loading, error } = useLinkedIp(profileId);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleLinkNow = async () => {
    try {
      await linkNow();
      setSuccessMessage(`Linked ${profileLabel} to current IP`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      // Error will be displayed via the error state
    }
  };

  const handleToggleAutoRefresh = async (checked: boolean) => {
    try {
      await toggleAutoRefresh(checked);
    } catch (err) {
      // Error will be displayed via the error state
    }
  };

  const errorMessage = error instanceof Error ? error.message : null;

  if (setupLoading) {
    return <p className="py-4 text-sm text-slate-500">Loading setup info...</p>;
  }

  if (!setup) {
    return <p className="py-4 text-sm text-slate-500">No setup info available.</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-3 text-sm font-semibold text-slate-900">Endpoints</h3>
        <p className="mb-4 text-xs text-slate-600">Set up NextDNS with this profile using one of the endpoints below.</p>

        <div className="space-y-2">
          {setup.id && <CopyButton value={setup.id} label="ID" />}

          {setup.dnsOverTls && <CopyButton value={setup.dnsOverTls} label="DNS-over-TLS/QUIC" />}

          {setup.dnsOverHttps && <CopyButton value={setup.dnsOverHttps} label="DNS-over-HTTPS" />}

          {setup.dnsServers && setup.dnsServers.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium text-slate-600">DNS Servers</p>
              <div className="space-y-1">
                {setup.dnsServers.map((server) => (
                  <CopyButton key={server} value={server} label="" />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-slate-900">Linked IP</h3>
        <p className="mb-4 text-xs text-slate-600">
          If you are unable to set up NextDNS using our apps, DNS-over-TLS, DNS-over-HTTPS or IPv6, then use the DNS servers below and link your IP.
        </p>

        {setup.linkedIpDNSServers && setup.linkedIpDNSServers.length > 0 && (
          <div className="mb-4">
            <p className="mb-2 text-xs font-medium text-slate-600">DNS Servers</p>
            <div className="space-y-1">
              {setup.linkedIpDNSServers.map((server) => (
                <CopyButton key={server} value={server} label="" />
              ))}
            </div>
          </div>
        )}

        {linkedIp && (
          <div className="mb-4">
            <CopyButton value={linkedIp} label="Current Linked IP" />
          </div>
        )}

        <div className="mb-4 flex flex-col gap-3">
          <button
            onClick={handleLinkNow}
            disabled={loading}
            className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? 'Linking...' : 'Link IP Now'}
          </button>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isAutoRefreshEnabled}
              onChange={(e) => handleToggleAutoRefresh(e.target.checked)}
              disabled={loading}
              className="h-4 w-4 cursor-pointer"
            />
            <span className="text-sm font-medium">Auto-refresh linked IP (hourly)</span>
          </label>
        </div>

        {successMessage && (
          <div className="mb-3 rounded border border-green-300 bg-green-50 p-2 text-sm text-green-700">
            {successMessage}
          </div>
        )}

        {errorMessage && (
          <div className="mb-3 rounded border border-red-300 bg-red-50 p-2 text-sm text-red-700">
            Error: {errorMessage}
          </div>
        )}

        <p className="text-xs text-slate-500">
          Note: NextDNS enforces one IP per profile. If multiple profiles have auto-refresh enabled, the last one processed will hold the IP.
        </p>
      </div>
    </div>
  );
}
