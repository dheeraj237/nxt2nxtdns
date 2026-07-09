import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/apiClient';

export function useLiveProfile(profileRowId: string) {
  return useQuery({
    queryKey: ['live-profile', profileRowId],
    queryFn: () => api.getLiveProfile(profileRowId),
    enabled: profileRowId !== '',
  });
}

/** Denylist/allowlist add, remove, and active-toggle are immediate - they hit NextDNS directly, independent of Save. */
export function useLiveEntryMutations(profileRowId: string) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ['live-profile', profileRowId] });

  const addEntry = useMutation({
    mutationFn: ({ kind, entryId }: { kind: 'denylist' | 'allowlist'; entryId: string }) => api.addLiveEntry(profileRowId, kind, entryId),
    onSuccess: invalidate,
  });
  const removeEntry = useMutation({
    mutationFn: ({ kind, entryId }: { kind: 'denylist' | 'allowlist'; entryId: string }) => api.removeLiveEntry(profileRowId, kind, entryId),
    onSuccess: invalidate,
  });
  const toggleEntryActive = useMutation({
    mutationFn: ({ kind, entryId, active }: { kind: 'denylist' | 'allowlist'; entryId: string; active: boolean }) =>
      api.patchLiveEntry(profileRowId, kind, entryId, active),
    onSuccess: invalidate,
  });

  return { addEntry, removeEntry, toggleEntryActive };
}
