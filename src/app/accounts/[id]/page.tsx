'use client';

import { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAccounts } from '@/hooks/useAccounts';
import { useProfiles, useDeleteProfile } from '@/hooks/useProfiles';
import { useProfileEditorAdapter } from '@/hooks/useProfileEditorAdapter';
import { useComputeDiff, useApplySync } from '@/hooks/useSync';
import { ProfileTabs } from '@/components/ProfileTabs';
import { SaveToModal } from '@/components/SaveToModal';
import { DiffPreviewModal } from '@/components/DiffPreviewModal';
import type { SyncDiff, SyncResult } from '@/lib/apiClient';

export default function AccountDetailPage() {
  const { id: accountId } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: accounts = [] } = useAccounts();
  const { data: profiles = [] } = useProfiles();
  const deleteProfile = useDeleteProfile();

  const account = accounts.find((a) => a.id === accountId);
  const accountProfiles = useMemo(() => profiles.filter((p) => p.account_id === accountId), [profiles, accountId]);

  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const activeProfileId = selectedProfileId ?? account?.default_profile_id ?? accountProfiles[0]?.id ?? '';

  const adapter = useProfileEditorAdapter(activeProfileId);

  const [savingTo, setSavingTo] = useState(false);
  const [diffs, setDiffs] = useState<SyncDiff[] | null>(null);
  const [results, setResults] = useState<SyncResult[] | null>(null);
  const [pendingTargetAccountIds, setPendingTargetAccountIds] = useState<string[]>([]);
  const computeDiff = useComputeDiff();
  const applySync = useApplySync();

  if (!account) return <p className="p-6 text-sm text-slate-500">Account not found.</p>;

  const isDefaultProfile = activeProfileId === account.default_profile_id;
  const canDeleteActiveProfile = accountProfiles.length > 1 && !isDefaultProfile;

  async function handleSaveToConfirm(targetAccountIds: string[]) {
    if (!adapter.profile) return;
    const diff = await computeDiff.mutateAsync({ sourceProfile: adapter.profile, targetAccountIds });
    setPendingTargetAccountIds(targetAccountIds);
    setSavingTo(false);
    setDiffs(diff);
  }

  async function handleConfirmApply() {
    if (!adapter.profile || !diffs) return;
    const applied = await applySync.mutateAsync({ sourceProfile: adapter.profile, targetAccountIds: pendingTargetAccountIds });
    setResults(applied);
  }

  async function handleDeleteProfile() {
    if (!confirm('Remove this profile from the app?')) return;
    await deleteProfile.mutateAsync(activeProfileId);
    setSelectedProfileId(null);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <button onClick={() => router.push('/')} className="text-sm text-slate-600 hover:underline">
          &larr; Accounts
        </button>
        <h1 className="text-lg font-semibold text-slate-900">{account.label}</h1>
        <span />
      </div>

      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-slate-600">Profile</label>
          <select
            value={activeProfileId}
            onChange={(e) => setSelectedProfileId(e.target.value)}
            className="rounded border border-slate-300 px-2 py-1 text-sm"
          >
            {accountProfiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.display_name || p.profile_id}
                {p.id === account.default_profile_id ? ' (default)' : ''}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={handleDeleteProfile}
          disabled={!canDeleteActiveProfile || deleteProfile.isPending}
          title={
            canDeleteActiveProfile
              ? undefined
              : isDefaultProfile
                ? 'Change the default profile before deleting this one'
                : 'An account must always have at least one profile'
          }
          className="text-xs text-red-600 hover:underline disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:no-underline"
        >
          Delete this profile
        </button>
      </div>

      <ProfileTabs adapter={adapter} />

      <div className="mt-4 flex justify-between">
        <button
          onClick={() => adapter.save()}
          disabled={!adapter.isDirty || adapter.saving}
          className="rounded bg-slate-900 px-3 py-1.5 text-sm text-white hover:bg-slate-700 disabled:opacity-50"
        >
          {adapter.saving ? 'Saving...' : 'Save'}
        </button>
        <button
          onClick={() => setSavingTo(true)}
          disabled={!adapter.profile}
          className="rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          Save to...
        </button>
      </div>

      {savingTo && (
        <SaveToModal accounts={accounts} onCancel={() => setSavingTo(false)} onConfirm={handleSaveToConfirm} pending={computeDiff.isPending} />
      )}

      {diffs && (
        <DiffPreviewModal
          title={`Save "${account.label}"'s profile to selected accounts`}
          diffs={diffs}
          profiles={profiles}
          results={results}
          applying={applySync.isPending}
          onConfirm={handleConfirmApply}
          onClose={() => {
            setDiffs(null);
            setResults(null);
          }}
        />
      )}
    </div>
  );
}
