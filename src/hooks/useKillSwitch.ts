import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, type LiveProfile } from '@/lib/apiClient';

export function useKillSwitchProfile() {
  return useQuery({ queryKey: ['kill-switch'], queryFn: api.getKillSwitch });
}

export function useKillSwitchMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ['kill-switch'] });

  const addEntry = useMutation({
    mutationFn: ({ kind, entryId }: { kind: 'denylist' | 'allowlist'; entryId: string }) => api.addKillSwitchEntry(kind, entryId),
    onSuccess: invalidate,
  });
  const removeEntry = useMutation({
    mutationFn: ({ kind, entryId }: { kind: 'denylist' | 'allowlist'; entryId: string }) => api.removeKillSwitchEntry(kind, entryId),
    onSuccess: invalidate,
  });
  const patchPrivacy = useMutation({
    mutationFn: (patch: Partial<LiveProfile['privacy']>) => api.patchKillSwitchPrivacy(patch),
    onSuccess: invalidate,
  });
  const putBlocklists = useMutation({
    mutationFn: (blocklists: { id: string }[]) => api.putKillSwitchBlocklists(blocklists),
    onSuccess: invalidate,
  });
  const patchParentalControl = useMutation({
    mutationFn: (patch: Partial<LiveProfile['parentalControl']>) => api.patchKillSwitchParentalControl(patch),
    onSuccess: invalidate,
  });

  return { addEntry, removeEntry, patchPrivacy, putBlocklists, patchParentalControl };
}
