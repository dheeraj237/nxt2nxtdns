'use client';

import { useState } from 'react';
import type { Account } from '@/lib/apiClient';

export function SaveToModal({
  accounts,
  onCancel,
  onConfirm,
  pending,
}: {
  accounts: Account[];
  onCancel: () => void;
  onConfirm: (accountIds: string[]) => void;
  pending: boolean;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const allSelected = accounts.length > 0 && selected.size === accounts.length;

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(accounts.map((a) => a.id)));
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-lg bg-white p-4 shadow-xl">
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Save to accounts</h2>
        <label className="mb-2 flex items-center gap-2 border-b border-slate-200 pb-2 text-sm font-medium text-slate-700">
          <input type="checkbox" checked={allSelected} onChange={toggleAll} />
          Select all
        </label>
        <ul className="mb-4 flex flex-col gap-1">
          {accounts.map((a) => (
            <li key={a.id}>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={selected.has(a.id)} onChange={() => toggle(a.id)} />
                {a.label}
              </label>
            </li>
          ))}
        </ul>
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="rounded px-3 py-1.5 text-sm text-slate-600">
            Cancel
          </button>
          <button
            onClick={() => onConfirm(Array.from(selected))}
            disabled={selected.size === 0 || pending}
            className="rounded bg-slate-900 px-3 py-1.5 text-sm text-white hover:bg-slate-700 disabled:opacity-50"
          >
            {pending ? 'Comparing...' : `Preview diff for ${selected.size} account(s)`}
          </button>
        </div>
      </div>
    </div>
  );
}
