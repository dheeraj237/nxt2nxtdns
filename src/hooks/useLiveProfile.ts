import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, type LiveProfile } from '@/lib/apiClient';

export function useLiveProfile(profileRowId: string) {
  return useQuery({
    queryKey: ['live-profile', profileRowId],
    queryFn: () => api.getLiveProfile(profileRowId),
    enabled: profileRowId !== '',
  });
}

export function useLiveProfileMutations(profileRowId: string) {
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
  const patchPrivacy = useMutation({
    mutationFn: (patch: Partial<LiveProfile['privacy']>) => api.patchLivePrivacy(profileRowId, patch),
    onSuccess: invalidate,
  });
  const putBlocklists = useMutation({
    mutationFn: (blocklists: { id: string }[]) => api.putLiveBlocklists(profileRowId, blocklists),
    onSuccess: invalidate,
  });
  const patchParentalControl = useMutation({
    mutationFn: (patch: Partial<LiveProfile['parentalControl']>) => api.patchLiveParentalControl(profileRowId, patch),
    onSuccess: invalidate,
  });

  return { addEntry, removeEntry, patchPrivacy, putBlocklists, patchParentalControl };
}
