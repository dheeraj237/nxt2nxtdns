'use client';

import { useState, type FormEvent } from 'react';
import type { Account } from '@/lib/apiClient';
import { useCreateProfile } from '@/hooks/useProfiles';

export function AddProfileForm({ accounts }: { accounts: Account[] }) {
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? '');
  const [profileId, setProfileId] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [open, setOpen] = useState(false);
  const createProfile = useCreateProfile();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await createProfile.mutateAsync({ accountId, profileId, displayName: displayName || undefined });
    setProfileId('');
    setDisplayName('');
    setOpen(false);
  }

  if (accounts.length === 0) return null;

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded border border-dashed border-slate-300 px-3 py-2 text-sm text-slate-600 hover:border-slate-400"
      >
        + Add profile
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 rounded border border-slate-200 p-3 sm:flex-row sm:items-end">
      <div>
        <label className="block text-xs font-medium text-slate-600">Account</label>
        <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className="rounded border border-slate-300 px-2 py-1">
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex-1">
        <label className="block text-xs font-medium text-slate-600">Profile ID</label>
        <input
          value={profileId}
          onChange={(e) => setProfileId(e.target.value)}
          required
          maxLength={6}
          className="w-full rounded border border-slate-300 px-2 py-1"
          placeholder="6-char id from dashboard URL"
        />
      </div>
      <div className="flex-1">
        <label className="block text-xs font-medium text-slate-600">Display name (optional)</label>
        <input
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="w-full rounded border border-slate-300 px-2 py-1"
        />
      </div>
      {createProfile.isError && <p className="text-sm text-red-600">{(createProfile.error as Error).message}</p>}
      <div className="flex gap-2">
        <button type="submit" className="rounded bg-slate-900 px-3 py-1.5 text-sm text-white hover:bg-slate-700">
          Save
        </button>
        <button type="button" onClick={() => setOpen(false)} className="rounded px-3 py-1.5 text-sm text-slate-600">
          Cancel
        </button>
      </div>
    </form>
  );
}
