import type { Account, Profile } from '../../lib/api';
import { useDeleteAccount } from '../accounts/useAccounts';
import { useDeleteProfile, useSetMaster } from './useProfiles';

interface Props {
  accounts: Account[];
  profiles: Profile[];
  selected: Set<string>;
  onToggleSelect: (profileId: string) => void;
}

export function ProfileList({ accounts, profiles, selected, onToggleSelect }: Props) {
  const setMaster = useSetMaster();
  const deleteProfile = useDeleteProfile();
  const deleteAccount = useDeleteAccount();

  if (accounts.length === 0) {
    return <p className="text-sm text-slate-500">No accounts yet. Add one to get started.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {accounts.map((account) => {
        const accountProfiles = profiles.filter((p) => p.account_id === account.id);
        return (
          <div key={account.id} className="rounded-lg border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-3 py-2">
              <span className="font-medium text-slate-800">{account.label}</span>
              <button
                onClick={() => confirm(`Remove account "${account.label}" and its profiles?`) && deleteAccount.mutate(account.id)}
                className="text-xs text-red-600 hover:underline"
              >
                Remove
              </button>
            </div>
            {accountProfiles.length === 0 ? (
              <p className="px-3 py-2 text-sm text-slate-400">No profiles added under this account.</p>
            ) : (
              <ul>
                {accountProfiles.map((profile) => (
                  <li
                    key={profile.id}
                    className="flex flex-col gap-2 border-b border-slate-100 px-3 py-2 last:border-b-0 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        disabled={Boolean(profile.is_master)}
                        checked={selected.has(profile.id)}
                        onChange={() => onToggleSelect(profile.id)}
                        className="h-4 w-4"
                      />
                      <span className="text-sm text-slate-800">
                        {profile.display_name || profile.profile_id}{' '}
                        <span className="text-xs text-slate-400">({profile.profile_id})</span>
                      </span>
                      {Boolean(profile.is_master) && (
                        <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-800">Master</span>
                      )}
                    </label>
                    <div className="flex gap-3 text-xs">
                      {!profile.is_master && (
                        <button onClick={() => setMaster.mutate(profile.id)} className="text-slate-600 hover:underline">
                          Set as master
                        </button>
                      )}
                      <button
                        onClick={() => confirm('Remove this profile from the app?') && deleteProfile.mutate(profile.id)}
                        className="text-red-600 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}
