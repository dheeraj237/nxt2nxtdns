'use client';

import { useAnalytics } from '@/hooks/useAnalytics';

function getQuotaColor(percentage: number): string {
  if (percentage < 70) return '#22c55e'; // green
  if (percentage < 90) return '#eab308'; // yellow
  return '#ef4444'; // red
}

function getQuotaLabel(percentage: number): string {
  if (percentage < 70) return 'Comfortable';
  if (percentage < 90) return 'Getting close';
  if (percentage >= 100) return 'Over limit';
  return 'Approaching limit';
}

interface AnalyticsTabProps {
  profileId: string;
}

export function AnalyticsTab({ profileId }: AnalyticsTabProps) {
  const { data, loading, error, refetch } = useAnalytics(profileId);

  if (loading && !data) {
    return <div className="py-8 text-center text-sm text-slate-400">Loading analytics...</div>;
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

  if (!data) {
    return <div className="py-8 text-center text-sm text-slate-400">No data available</div>;
  }

  const quotaColor = getQuotaColor(data.percentage);
  const quotaLabel = getQuotaLabel(data.percentage);
  const displayPercentage = Math.min(100, data.percentage);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        {/* Queries This Month Card */}
        <div className="rounded-lg border border-slate-200 p-4">
          <h3 className="mb-3 text-sm font-medium text-slate-700">Queries This Month</h3>
          <div className="mb-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold" style={{ color: quotaColor }}>
                {data.total.toLocaleString()}
              </span>
              <span className="text-sm text-slate-600">/ 300,000</span>
            </div>
            <span className="text-xs text-slate-500">{quotaLabel}</span>
          </div>
          <div className="mb-2 h-2 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              style={{
                width: `${displayPercentage}%`,
                backgroundColor: quotaColor,
              }}
              className="h-full transition-all"
            />
          </div>
          <div className="text-xs font-medium" style={{ color: quotaColor }}>
            {data.percentage.toFixed(2)}% used
          </div>
        </div>

        {/* Blocked This Month Card */}
        <div className="rounded-lg border border-slate-200 p-4">
          <h3 className="mb-3 text-sm font-medium text-slate-700">Blocked This Month</h3>
          <div className="text-2xl font-bold text-red-600">{data.blocked.toLocaleString()}</div>
          <p className="mt-2 text-xs text-slate-500">
            {data.total > 0 ? ((data.blocked / data.total) * 100).toFixed(2) : 0}% of total queries
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-slate-100 pt-4">
        <span className="text-xs text-slate-500">Data refreshes monthly on the 1st</span>
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
