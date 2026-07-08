import type { Profile, SyncDiff, SyncResult } from '../../lib/api';

interface Props {
  diffs: SyncDiff[];
  profiles: Profile[];
  results: SyncResult[] | null;
  applying: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

function profileLabel(profiles: Profile[], profileRowId: string) {
  const p = profiles.find((p) => p.id === profileRowId);
  return p ? p.display_name || p.profile_id : profileRowId;
}

export function DiffPreviewModal({ diffs, profiles, results, applying, onConfirm, onClose }: Props) {
  const totalOps = diffs.reduce((sum, d) => sum + d.ops.length, 0);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-4 shadow-xl">
        <h2 className="mb-3 text-lg font-semibold text-slate-900">
          {results ? 'Sync results' : `Apply master to ${diffs.length} profile(s)`}
        </h2>

        {!results && totalOps === 0 && <p className="text-sm text-slate-500">All selected profiles already match the master.</p>}

        <div className="flex flex-col gap-3">
          {diffs.map((diff) => {
            const result = results?.find((r) => r.profileId === diff.targetProfileId);
            return (
              <div key={diff.targetProfileId} className="rounded border border-slate-200 p-2">
                <div className="mb-1 flex items-center justify-between text-sm font-medium text-slate-800">
                  <span>{profileLabel(profiles, diff.targetProfileId)}</span>
                  {result && (
                    <span className={result.success ? 'text-green-600' : 'text-red-600'}>
                      {result.success ? `Applied ${result.opsApplied} change(s)` : `Failed: ${result.error}`}
                    </span>
                  )}
                </div>
                <p className="mb-1 text-xs text-slate-500">
                  +{diff.summary.toAdd} add, -{diff.summary.toRemove} remove, {diff.summary.toUpdate} update
                </p>
                {diff.ops.length > 0 && (
                  <ul className="list-inside list-disc text-xs text-slate-600">
                    {diff.ops.slice(0, 8).map((op, i) => (
                      <li key={i}>{op.description}</li>
                    ))}
                    {diff.ops.length > 8 && <li>...and {diff.ops.length - 8} more</li>}
                  </ul>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="rounded px-3 py-1.5 text-sm text-slate-600">
            Close
          </button>
          {!results && totalOps > 0 && (
            <button
              onClick={onConfirm}
              disabled={applying}
              className="rounded bg-slate-900 px-3 py-1.5 text-sm text-white hover:bg-slate-700 disabled:opacity-50"
            >
              {applying ? 'Applying...' : 'Confirm apply'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
