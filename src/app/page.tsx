'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAccounts } from '@/hooks/useAccounts';
import { useProfiles } from '@/hooks/useProfiles';
import { AccountList } from '@/components/AccountList';
import { AddAccountModal } from '@/components/AddAccountModal';
import { api } from '@/lib/apiClient';

export default function AccountsPage() {
  const router = useRouter();
  const { data: accounts = [], isLoading: accountsLoading } = useAccounts();
  const { data: profiles = [], isLoading: profilesLoading } = useProfiles();
  const [adding, setAdding] = useState(false);

  async function handleLogout() {
    await api.logout();
    router.push('/login');
    router.refresh();
  }

  if (accountsLoading || profilesLoading) {
    return <p className="p-6 text-sm text-slate-500">Loading...</p>;
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">NextDNS Manager</h1>
        <button onClick={handleLogout} className="text-sm text-slate-600 hover:underline">
          Sign out
        </button>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-medium text-slate-700">Accounts</h2>
        <button
          onClick={() => setAdding(true)}
          className="rounded border border-dashed border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:border-slate-400"
        >
          + Add account
        </button>
      </div>

      <AccountList accounts={accounts} profiles={profiles} />

      {adding && <AddAccountModal onClose={() => setAdding(false)} />}
    </div>
  );
}
