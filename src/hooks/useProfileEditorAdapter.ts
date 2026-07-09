import type { LiveProfile } from '@/lib/apiClient';
import { useKillSwitchProfile, useKillSwitchMutations } from './useKillSwitch';
import { useLiveProfile, useLiveProfileMutations } from './useLiveProfile';

export interface ProfileEditorAdapter {
  profile: LiveProfile | undefined;
  isLoading: boolean;
  error: unknown;
  pending: boolean;
  addEntry: (kind: 'denylist' | 'allowlist', id: string) => void;
  removeEntry: (kind: 'denylist' | 'allowlist', id: string) => void;
  patchPrivacy: (patch: Partial<LiveProfile['privacy']>) => void;
  putBlocklists: (ids: string[]) => void;
  patchParentalControl: (patch: Partial<LiveProfile['parentalControl']>) => void;
}

export function useLiveProfileEditorAdapter(profileRowId: string): ProfileEditorAdapter {
  const { data, isLoading, error } = useLiveProfile(profileRowId);
  const m = useLiveProfileMutations(profileRowId);
  return {
    profile: data,
    isLoading,
    error,
    pending:
      m.addEntry.isPending || m.removeEntry.isPending || m.patchPrivacy.isPending || m.putBlocklists.isPending || m.patchParentalControl.isPending,
    addEntry: (kind, id) => m.addEntry.mutate({ kind, entryId: id }),
    removeEntry: (kind, id) => m.removeEntry.mutate({ kind, entryId: id }),
    patchPrivacy: (patch) => m.patchPrivacy.mutate(patch),
    putBlocklists: (ids) => m.putBlocklists.mutate(ids.map((id) => ({ id }))),
    patchParentalControl: (patch) => m.patchParentalControl.mutate(patch),
  };
}

export function useKillSwitchEditorAdapter(): ProfileEditorAdapter {
  const { data, isLoading, error } = useKillSwitchProfile();
  const m = useKillSwitchMutations();
  return {
    profile: data,
    isLoading,
    error,
    pending:
      m.addEntry.isPending || m.removeEntry.isPending || m.patchPrivacy.isPending || m.putBlocklists.isPending || m.patchParentalControl.isPending,
    addEntry: (kind, id) => m.addEntry.mutate({ kind, entryId: id }),
    removeEntry: (kind, id) => m.removeEntry.mutate({ kind, entryId: id }),
    patchPrivacy: (patch) => m.patchPrivacy.mutate(patch),
    putBlocklists: (ids) => m.putBlocklists.mutate(ids.map((id) => ({ id }))),
    patchParentalControl: (patch) => m.patchParentalControl.mutate(patch),
  };
}
