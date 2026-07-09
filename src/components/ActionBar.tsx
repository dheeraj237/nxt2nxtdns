'use client';

interface Props {
  selectedCount: number;
  hasMaster: boolean;
  hasBasic: boolean;
  disabled: boolean;
  onApplyMaster: (scope: 'selected' | 'all') => void;
  onKillSwitch: (scope: 'selected' | 'all') => void;
}

export function ActionBar({ selectedCount, hasMaster, hasBasic, disabled, onApplyMaster, onKillSwitch }: Props) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm text-slate-600">{selectedCount} profile(s) selected</span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {hasMaster ? (
          <>
            <button
              onClick={() => onApplyMaster('selected')}
              disabled={disabled || selectedCount === 0}
              className="rounded bg-slate-900 px-3 py-1.5 text-sm text-white hover:bg-slate-700 disabled:opacity-50"
            >
              Apply master to selected
            </button>
            <button
              onClick={() => onApplyMaster('all')}
              disabled={disabled}
              className="rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Apply master to all
            </button>
          </>
        ) : (
          <p className="text-sm text-amber-700">Set a master profile to enable master sync.</p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {hasBasic ? (
          <>
            <button
              onClick={() => onKillSwitch('selected')}
              disabled={disabled || selectedCount === 0}
              className="rounded bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-500 disabled:opacity-50"
            >
              Kill switch: selected
            </button>
            <button
              onClick={() => onKillSwitch('all')}
              disabled={disabled}
              className="rounded bg-red-700 px-3 py-1.5 text-sm text-white hover:bg-red-600 disabled:opacity-50"
            >
              Kill switch: all profiles
            </button>
          </>
        ) : (
          <p className="text-sm text-amber-700">Set a basic profile to enable the kill switch.</p>
        )}
      </div>
    </div>
  );
}
