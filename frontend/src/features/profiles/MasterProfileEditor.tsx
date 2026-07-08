import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api, type Profile } from '../../lib/api';
import { apiFetch } from '../../lib/api';

function useLiveProfile(profileRowId: string) {
  return useQuery({ queryKey: ['live-profile', profileRowId], queryFn: () => api.getLiveProfile(profileRowId) });
}

export function MasterProfileEditor({ master }: { master: Profile }) {
  const { data: live, isLoading, error } = useLiveProfile(master.id);
  const qc = useQueryClient();
  const [newDenylistEntry, setNewDenylistEntry] = useState('');
  const [newAllowlistEntry, setNewAllowlistEntry] = useState('');

  async function handleAdd(kind: 'denylist' | 'allowlist', value: string) {
    if (!value) return;
    await apiFetch(`/api/profiles/${master.id}/live/${kind}`, { method: 'POST', body: JSON.stringify({ id: value, active: true }) });
    qc.invalidateQueries({ queryKey: ['live-profile', master.id] });
  }

  if (isLoading) return <p className="text-sm text-slate-500">Loading master profile from NextDNS...</p>;
  if (error) return <p className="text-sm text-red-600">Failed to load master profile: {(error as Error).message}</p>;
  if (!live) return null;

  return (
    <div className="rounded-lg border border-slate-200 p-3">
      <h3 className="mb-2 font-medium text-slate-800">Master profile: {live.name || master.display_name || master.profile_id}</h3>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <h4 className="mb-1 text-sm font-semibold text-slate-700">Denylist ({live.denylist.length})</h4>
          <ul className="mb-2 max-h-32 overflow-y-auto text-sm text-slate-600">
            {live.denylist.map((e) => (
              <li key={e.id}>{e.id}</li>
            ))}
          </ul>
          <div className="flex gap-1">
            <input
              value={newDenylistEntry}
              onChange={(e) => setNewDenylistEntry(e.target.value)}
              placeholder="domain.com"
              className="flex-1 rounded border border-slate-300 px-2 py-1 text-sm"
            />
            <button
              onClick={() => {
                handleAdd('denylist', newDenylistEntry);
                setNewDenylistEntry('');
              }}
              className="rounded bg-slate-900 px-2 py-1 text-sm text-white"
            >
              Add
            </button>
          </div>
        </div>

        <div>
          <h4 className="mb-1 text-sm font-semibold text-slate-700">Allowlist ({live.allowlist.length})</h4>
          <ul className="mb-2 max-h-32 overflow-y-auto text-sm text-slate-600">
            {live.allowlist.map((e) => (
              <li key={e.id}>{e.id}</li>
            ))}
          </ul>
          <div className="flex gap-1">
            <input
              value={newAllowlistEntry}
              onChange={(e) => setNewAllowlistEntry(e.target.value)}
              placeholder="domain.com"
              className="flex-1 rounded border border-slate-300 px-2 py-1 text-sm"
            />
            <button
              onClick={() => {
                handleAdd('allowlist', newAllowlistEntry);
                setNewAllowlistEntry('');
              }}
              className="rounded bg-slate-900 px-2 py-1 text-sm text-white"
            >
              Add
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
