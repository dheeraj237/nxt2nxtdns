'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAccounts } from '@/hooks/useAccounts';
import { useProfiles } from '@/hooks/useProfiles';
import { useComputeDiff, useApplySync } from '@/hooks/useSync';
import { AddAccountForm } from '@/components/AddAccountForm';
import { AddProfileForm } from '@/components/AddProfileForm';
import { ProfileList } from '@/components/ProfileList';
import { SourceProfileEditor } from '@/components/SourceProfileEditor';
import { ActionBar } from '@/components/ActionBar';
import { DiffPreviewModal } from '@/components/DiffPreviewModal';
import { api, type SourceRole, type SyncDiff, type SyncResult } from '@/lib/apiClient';

export default function DashboardPage() {
  const router = useRouter();
  const { data: accounts = [], isLoading: accountsLoading } = useAccounts();
  const { data: profiles = [], isLoading: profilesLoading } = useProfiles();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [action, setAction] = useState<{ role: SourceRole; title: string } | null>(null);
  const [diffs, setDiffs] = useState<SyncDiff[] | null>(null);
  const [results, setResults] = useState<SyncResult[] | null>(null);
  const computeDiff = useComputeDiff();
  const applySync = useApplySync();

  const master = profiles.find((p) => p.is_master);
  const basic = profiles.find((p) => p.is_basic);

  function toggleSelect(profileId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(profileId)) next.delete(profileId);
      else next.add(profileId);
      return next;
    });
  }

  async function runAction(role: SourceRole, scope: 'selected' | 'all', title: string) {
    setResults(null);
    const targetProfileIds = scope === 'selected' ? Array.from(selected) : undefined;
    const diff = await computeDiff.mutateAsync({ source: role, targetProfileIds });
    setAction({ role, title });
    setDiffs(diff);
  }

  async function handleConfirmApply() {
    if (!action) return;
    const targetProfileIds = diffs?.map((d) => d.targetProfileId);
    const applied = await applySync.mutateAsync({ source: action.role, targetProfileIds });
    setResults(applied);
  }

  async function handleLogout() {
    await api.logout();
    router.push('/login');
    router.refresh();
  }

  if (accountsLoading || profilesLoading) {
    return <p className="p-6 text-sm text-slate-500">Loading...</p>;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">NextDNS Manager</h1>
        <button onClick={handleLogout} className="text-sm text-slate-600 hover:underline">
          Sign out
        </button>
      </div>

      {master && (
        <div className="mb-6">
          <SourceProfileEditor label="Master profile" profile={master} />
        </div>
      )}

      {basic && (
        <div className="mb-6">
          <SourceProfileEditor label="Basic profile" profile={basic} />
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        <AddAccountForm />
        <AddProfileForm accounts={accounts} />
      </div>

      <ProfileList accounts={accounts} profiles={profiles} selected={selected} onToggleSelect={toggleSelect} />

      <div className="mt-6 border-t border-slate-200 pt-4">
        <ActionBar
          selectedCount={selected.size}
          hasMaster={Boolean(master)}
          hasBasic={Boolean(basic)}
          disabled={computeDiff.isPending}
          onApplyMaster={(scope) => runAction('master', scope, `Apply master to ${scope === 'all' ? 'all profiles' : 'selected'}`)}
          onKillSwitch={(scope) => runAction('basic', scope, `Kill switch: apply basic to ${scope === 'all' ? 'all profiles' : 'selected'}`)}
        />
      </div>

      {diffs && action && (
        <DiffPreviewModal
          title={action.title}
          diffs={diffs}
          profiles={profiles}
          results={results}
          applying={applySync.isPending}
          onConfirm={handleConfirmApply}
          onClose={() => {
            setDiffs(null);
            setResults(null);
            setAction(null);
          }}
        />
      )}
    </div>
  );
}
