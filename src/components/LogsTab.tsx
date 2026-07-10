'use client';

import { useLogs } from '@/hooks/useLogs';
import type { LogEntry } from '@/lib/nextdns/types';

function getStatusColor(status: string): { bg: string; text: string } {
  switch (status) {
    case 'blocked':
      return { bg: 'bg-red-50', text: 'text-red-700' };
    case 'allowed':
      return { bg: 'bg-green-50', text: 'text-green-700' };
    case 'error':
      return { bg: 'bg-orange-50', text: 'text-orange-700' };
    case 'default':
    default:
      return { bg: 'bg-slate-50', text: 'text-slate-600' };
  }
}

function formatTimestamp(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch {
    return isoString;
  }
}

interface LogsTabProps {
  profileId: string;
}

export function LogsTab({ profileId }: LogsTabProps) {
  const { logs, loading, error, refetch } = useLogs(profileId);

  if (loading && logs.length === 0) {
    return <div className="py-8 text-center text-sm text-slate-400">Loading logs...</div>;
  }

  if (error) {
    return (
      <div className="py-8">
        <div className="mb-4 rounded border border-red-300 bg-red-50 p-4 text-sm text-red-700">
          Error: {error}
        </div>
        <button
          onClick={() => refetch()}
          disabled={loading}
          className="rounded bg-slate-900 px-3 py-1 text-sm text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {loading ? 'Reloading...' : 'Reload ⟳'}
        </button>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="space-y-4 py-8">
        <div className="text-center text-sm text-slate-400">No queries recorded</div>
        <div className="flex justify-center">
          <button
            onClick={() => refetch()}
            disabled={loading}
            className="rounded bg-slate-900 px-3 py-1 text-sm text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {loading ? 'Reloading...' : 'Reload ⟳'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="px-3 py-2 text-left font-medium text-slate-600">Time</th>
              <th className="px-3 py-2 text-left font-medium text-slate-600">Domain</th>
              <th className="px-3 py-2 text-left font-medium text-slate-600">Status</th>
              <th className="px-3 py-2 text-left font-medium text-slate-600">Device</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log: LogEntry, idx: number) => {
              const colors = getStatusColor(log.status);
              return (
                <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-3 py-2 text-xs text-slate-600">{formatTimestamp(log.timestamp)}</td>
                  <td className="max-w-xs overflow-hidden text-ellipsis px-3 py-2 font-mono text-xs text-slate-700">
                    {log.domain}
                  </td>
                  <td className={`px-3 py-2 ${colors.bg}`}>
                    <span className={`rounded px-2 py-1 text-xs font-medium ${colors.text}`}>
                      {log.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-xs text-slate-600">{log.device?.name || '-'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-slate-100 pt-4">
        <span className="text-xs text-slate-500">Showing last 50 queries</span>
        <button
          onClick={() => refetch()}
          disabled={loading}
          className="rounded bg-slate-900 px-3 py-1 text-sm text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {loading ? 'Reloading...' : 'Reload ⟳'}
        </button>
      </div>
    </div>
  );
}
