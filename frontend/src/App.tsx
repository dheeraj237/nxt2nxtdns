import { useState } from 'react';
import { useAuth } from './features/auth/AuthContext';
import { LoginForm } from './features/auth/LoginForm';
import { useAccounts } from './features/accounts/useAccounts';
import { AddAccountForm } from './features/accounts/AddAccountForm';
import { useProfiles } from './features/profiles/useProfiles';
import { AddProfileForm } from './features/profiles/AddProfileForm';
import { ProfileList } from './features/profiles/ProfileList';
import { MasterProfileEditor } from './features/profiles/MasterProfileEditor';
import { ApplyBar } from './features/master-sync/ApplyBar';
import { DiffPreviewModal } from './features/master-sync/DiffPreviewModal';
import { useApplySync, useComputeDiff } from './features/master-sync/useMasterSync';
import type { SyncDiff, SyncResult } from './lib/api';

function Dashboard() {
  const { logout } = useAuth();
  const { data: accounts = [], isLoading: accountsLoading } = useAccounts();
  const { data: profiles = [], isLoading: profilesLoading } = useProfiles();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [diffs, setDiffs] = useState<SyncDiff[] | null>(null);
  const [results, setResults] = useState<SyncResult[] | null>(null);
  const computeDiff = useComputeDiff();
  const applySync = useApplySync();

  const master = profiles.find((p) => p.is_master);

  function toggleSelect(profileId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(profileId)) next.delete(profileId);
      else next.add(profileId);
      return next;
    });
  }

  async function handleOpenDiff() {
    setResults(null);
    const diff = await computeDiff.mutateAsync(Array.from(selected));
    setDiffs(diff);
  }

  async function handleConfirmApply() {
    const applied = await applySync.mutateAsync(Array.from(selected));
    setResults(applied);
  }

  if (accountsLoading || profilesLoading) {
    return <p className="p-6 text-sm text-slate-500">Loading...</p>;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">NextDNS Manager</h1>
        <button onClick={() => logout()} className="text-sm text-slate-600 hover:underline">
          Sign out
        </button>
      </div>

      {master && (
        <div className="mb-6">
          <MasterProfileEditor master={master} />
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        <AddAccountForm />
        <AddProfileForm accounts={accounts} />
      </div>

      <ProfileList accounts={accounts} profiles={profiles} selected={selected} onToggleSelect={toggleSelect} />

      <div className="mt-6 border-t border-slate-200 pt-4">
        <ApplyBar
          selectedCount={selected.size}
          hasMaster={Boolean(master)}
          onApply={handleOpenDiff}
          disabled={computeDiff.isPending}
        />
      </div>

      {diffs && (
        <DiffPreviewModal
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

function App() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Dashboard /> : <LoginForm />;
}

export default App;
