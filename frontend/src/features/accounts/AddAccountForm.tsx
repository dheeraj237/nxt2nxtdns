import { useState, type FormEvent } from 'react';
import { useCreateAccount } from './useAccounts';

export function AddAccountForm() {
  const [label, setLabel] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [open, setOpen] = useState(false);
  const createAccount = useCreateAccount();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await createAccount.mutateAsync({ label, apiKey });
    setLabel('');
    setApiKey('');
    setOpen(false);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded border border-dashed border-slate-300 px-3 py-2 text-sm text-slate-600 hover:border-slate-400"
      >
        + Add account
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 rounded border border-slate-200 p-3 sm:flex-row sm:items-end">
      <div className="flex-1">
        <label className="block text-xs font-medium text-slate-600">Label</label>
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          required
          className="w-full rounded border border-slate-300 px-2 py-1"
          placeholder="e.g. Home"
        />
      </div>
      <div className="flex-1">
        <label className="block text-xs font-medium text-slate-600">NextDNS API key</label>
        <input
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          required
          type="password"
          className="w-full rounded border border-slate-300 px-2 py-1"
          placeholder="from my.nextdns.io/account"
        />
      </div>
      {createAccount.isError && <p className="text-sm text-red-600">{(createAccount.error as Error).message}</p>}
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
