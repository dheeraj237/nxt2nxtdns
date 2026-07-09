'use client';

import { useLinkedIp } from '@/hooks/useLinkedIp';
import { useState } from 'react';

interface ProfileLinkedIpCardProps {
  profileId: string;
  profileLabel: string;
}

export function ProfileLinkedIpCard({ profileId, profileLabel }: ProfileLinkedIpCardProps) {
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

  return (
    <div className="rounded border border-gray-300 bg-white p-4">
      <h3 className="mb-3 text-lg font-semibold">Linked IP</h3>

      <div className="mb-4 rounded bg-gray-50 p-3">
        {linkedIp ? (
          <p className="font-mono text-sm">
            <span className="text-gray-600">Current IP: </span>
            <span className="font-semibold">{linkedIp}</span>
          </p>
        ) : (
          <p className="text-sm text-gray-500">No linked IP set</p>
        )}
      </div>

      <div className="mb-4 flex flex-col gap-3">
        <button
          onClick={handleLinkNow}
          disabled={loading}
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:bg-gray-400"
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

      <p className="text-xs text-gray-500">
        Note: NextDNS enforces one IP per profile. If multiple profiles have auto-refresh enabled, the last one
        processed will hold the IP.
      </p>
    </div>
  );
}
