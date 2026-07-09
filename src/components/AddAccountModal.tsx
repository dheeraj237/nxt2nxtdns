'use client';

import { useState } from 'react';
import { usePreviewAccountProfiles, useCreateAccount } from '@/hooks/useAccounts';
import type { AccountProfilePreview } from '@/lib/apiClient';

export function AddAccountModal({ onClose }: { onClose: () => void }) {
  const [label, setLabel] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [profiles, setProfiles] = useState<AccountProfilePreview[] | null>(null);
  const [defaultIndex, setDefaultIndex] = useState(0);
  const preview = usePreviewAccountProfiles();
  const createAccount = useCreateAccount();

  async function handlePreview() {
    const result = await preview.mutateAsync(apiKey);
    setProfiles(result);
    setDefaultIndex(0);
  }

  async function handleSave() {
    await createAccount.mutateAsync({ label, apiKey, profiles: profiles!, defaultProfileIndex: defaultIndex });
    onClose();
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-4 shadow-xl">
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Add account</h2>

        {!profiles ? (
          <div className="flex flex-col gap-2">
            <div>
              <label className="block text-xs font-medium text-slate-600">Label</label>
              <input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="w-full rounded border border-slate-300 px-2 py-1"
                placeholder="e.g. Home"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600">NextDNS API key</label>
              <input
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                type="password"
                className="w-full rounded border border-slate-300 px-2 py-1"
                placeholder="from my.nextdns.io/account"
              />
            </div>
            {preview.isError && <p className="text-sm text-red-600">{(preview.error as Error).message}</p>}
            <div className="mt-2 flex justify-end gap-2">
              <button onClick={onClose} className="rounded px-3 py-1.5 text-sm text-slate-600">
                Cancel
              </button>
              <button
                onClick={handlePreview}
                disabled={!label || !apiKey || preview.isPending}
                className="rounded bg-slate-900 px-3 py-1.5 text-sm text-white hover:bg-slate-700 disabled:opacity-50"
              >
                {preview.isPending ? 'Checking key...' : 'Next'}
              </button>
            </div>
          </div>
        ) : profiles.length === 0 ? (
          <div>
            <p className="mb-3 text-sm text-slate-600">
              This API key has no profiles on NextDNS yet. Create a profile on NextDNS first, then add the account here.
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={onClose} className="rounded px-3 py-1.5 text-sm text-slate-600">
                Close
              </button>
              <button onClick={() => setProfiles(null)} className="rounded px-3 py-1.5 text-sm text-slate-600">
                Back
              </button>
            </div>
          </div>
        ) : (
          <div>
            <p className="mb-2 text-sm text-slate-600">Pick the default profile for &ldquo;{label}&rdquo;:</p>
            <div className="mb-3 flex flex-col gap-1">
              {profiles.map((p, i) => (
                <label key={p.id} className="flex items-center gap-2 rounded border border-slate-200 px-2 py-1.5 text-sm">
                  <input type="radio" name="default-profile" checked={defaultIndex === i} onChange={() => setDefaultIndex(i)} />
                  {p.name || p.id} <span className="text-xs text-slate-400">({p.id})</span>
                </label>
              ))}
            </div>
            {createAccount.isError && <p className="mb-2 text-sm text-red-600">{(createAccount.error as Error).message}</p>}
            <div className="flex justify-end gap-2">
              <button onClick={onClose} className="rounded px-3 py-1.5 text-sm text-slate-600">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={createAccount.isPending}
                className="rounded bg-slate-900 px-3 py-1.5 text-sm text-white hover:bg-slate-700 disabled:opacity-50"
              >
                {createAccount.isPending ? 'Saving...' : 'Save account'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
