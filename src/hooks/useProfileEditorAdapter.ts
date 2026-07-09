import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api, type LiveProfile } from '@/lib/apiClient';
import { useLiveProfile, useLiveEntryMutations } from './useLiveProfile';

export interface ProfileEditorAdapter {
  profile: LiveProfile | undefined;
  isLoading: boolean;
  error: unknown;
  isDirty: boolean;
  saving: boolean;
  save: () => void;
  addEntry: (kind: 'denylist' | 'allowlist', id: string) => void;
  removeEntry: (kind: 'denylist' | 'allowlist', id: string) => void;
  toggleEntryActive: (kind: 'denylist' | 'allowlist', id: string, active: boolean) => void;
  patchPrivacy: (patch: Partial<LiveProfile['privacy']>) => void;
  putBlocklists: (ids: string[]) => void;
  patchParentalControl: (patch: Partial<LiveProfile['parentalControl']>) => void;
}

/**
 * Denylist/allowlist add/remove/active-toggle hit NextDNS immediately.
 * Privacy and Parental Control edits are staged locally and only sent to
 * NextDNS when `save()` is called - that's what the page's Save button does.
 */
export function useProfileEditorAdapter(profileRowId: string): ProfileEditorAdapter {
  const qc = useQueryClient();
  const { data, isLoading, error } = useLiveProfile(profileRowId);
  const entries = useLiveEntryMutations(profileRowId);

  const [privacyDraft, setPrivacyDraft] = useState<LiveProfile['privacy'] | null>(null);
  const [parentalDraft, setParentalDraft] = useState<LiveProfile['parentalControl'] | null>(null);

  useEffect(() => {
    setPrivacyDraft(null);
    setParentalDraft(null);
  }, [profileRowId]);

  const privacy = privacyDraft ?? data?.privacy;
  const parentalControl = parentalDraft ?? data?.parentalControl;

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (privacyDraft) {
        await api.patchLivePrivacy(profileRowId, privacyDraft);
        await api.putLiveBlocklists(profileRowId, privacyDraft.blocklists);
      }
      if (parentalDraft) await api.patchLiveParentalControl(profileRowId, parentalDraft);
    },
    onSuccess: () => {
      setPrivacyDraft(null);
      setParentalDraft(null);
      qc.invalidateQueries({ queryKey: ['live-profile', profileRowId] });
    },
  });

  const profile: LiveProfile | undefined = data && privacy && parentalControl ? { ...data, privacy, parentalControl } : data;

  return {
    profile,
    isLoading,
    error,
    isDirty: privacyDraft !== null || parentalDraft !== null,
    saving: saveMutation.isPending,
    save: () => saveMutation.mutate(),
    addEntry: (kind, id) => entries.addEntry.mutate({ kind, entryId: id }),
    removeEntry: (kind, id) => entries.removeEntry.mutate({ kind, entryId: id }),
    toggleEntryActive: (kind, id, active) => entries.toggleEntryActive.mutate({ kind, entryId: id, active }),
    patchPrivacy: (patch) => setPrivacyDraft({ ...(privacy as LiveProfile['privacy']), ...patch }),
    putBlocklists: (ids) => setPrivacyDraft({ ...(privacy as LiveProfile['privacy']), blocklists: ids.map((id) => ({ id })) }),
    patchParentalControl: (patch) => setParentalDraft({ ...(parentalControl as LiveProfile['parentalControl']), ...patch }),
  };
}
