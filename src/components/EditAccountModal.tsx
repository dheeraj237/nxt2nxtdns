'use client';

import { useState } from 'react';
import type { Account, Profile } from '@/lib/apiClient';
import { useUpdateAccount } from '@/hooks/useAccounts';

export function EditAccountModal({ account, profiles, onClose }: { account: Account; profiles: Profile[]; onClose: () => void }) {
  const [label, setLabel] = useState(account.label);
  const [defaultProfileId, setDefaultProfileId] = useState(account.default_profile_id ?? '');
  const updateAccount = useUpdateAccount();

  async function handleSave() {
    await updateAccount.mutateAsync({ id: account.id, patch: { label, defaultProfileId } });
    onClose();
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-4 shadow-xl">
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Edit account</h2>
        <div className="flex flex-col gap-2">
          <div>
            <label className="block text-xs font-medium text-slate-600">Label</label>
            <input value={label} onChange={(e) => setLabel(e.target.value)} className="w-full rounded border border-slate-300 px-2 py-1" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600">Default profile</label>
            <select
              value={defaultProfileId}
              onChange={(e) => setDefaultProfileId(e.target.value)}
              className="w-full rounded border border-slate-300 px-2 py-1"
            >
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.display_name || p.profile_id}
                </option>
              ))}
            </select>
          </div>
          {updateAccount.isError && <p className="text-sm text-red-600">{(updateAccount.error as Error).message}</p>}
          <div className="mt-2 flex justify-end gap-2">
            <button onClick={onClose} className="rounded px-3 py-1.5 text-sm text-slate-600">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!label || updateAccount.isPending}
              className="rounded bg-slate-900 px-3 py-1.5 text-sm text-white hover:bg-slate-700 disabled:opacity-50"
            >
              {updateAccount.isPending ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
