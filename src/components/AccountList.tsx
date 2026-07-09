'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Account, Profile } from '@/lib/apiClient';
import { useDeleteAccount } from '@/hooks/useAccounts';
import { EditAccountModal } from '@/components/EditAccountModal';

export function AccountList({ accounts, profiles }: { accounts: Account[]; profiles: Profile[] }) {
  const deleteAccount = useDeleteAccount();
  const [editing, setEditing] = useState<Account | null>(null);

  if (accounts.length === 0) {
    return <p className="text-sm text-slate-500">No accounts yet. Add one to get started.</p>;
  }

  return (
    <>
      <ul className="flex flex-col gap-2">
        {accounts.map((account) => (
          <li key={account.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
            <Link href={`/accounts/${account.id}`} className="flex-1 text-sm font-medium text-slate-800 hover:underline">
              {account.label}
            </Link>
            <div className="flex items-center gap-3 text-xs">
              <button onClick={() => setEditing(account)} className="text-slate-600 hover:underline">
                Edit
              </button>
              <button
                onClick={() =>
                  confirm(
                    `Remove account "${account.label}"? This only removes it from this app - it stays untouched on NextDNS.`,
                  ) && deleteAccount.mutate(account.id)
                }
                className="text-red-600 hover:underline"
                aria-label={`Delete ${account.label}`}
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>

      {editing && (
        <EditAccountModal
          account={editing}
          profiles={profiles.filter((p) => p.account_id === editing.id)}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}
