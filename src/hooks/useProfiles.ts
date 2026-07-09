import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/apiClient';

export function useProfiles() {
  return useQuery({ queryKey: ['profiles'], queryFn: api.listProfiles });
}

export function useCreateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ accountId, profileId, displayName }: { accountId: string; profileId: string; displayName?: string }) =>
      api.createProfile(accountId, profileId, displayName),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profiles'] }),
  });
}

export function useDeleteProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteProfile(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profiles'] }),
  });
}
