import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, type AccountProfilePreview } from '@/lib/apiClient';

export function useAccounts() {
  return useQuery({ queryKey: ['accounts'], queryFn: api.listAccounts });
}

export function usePreviewAccountProfiles() {
  return useMutation({ mutationFn: (apiKey: string) => api.previewAccountProfiles(apiKey) });
}

export function useCreateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      label,
      apiKey,
      profiles,
      defaultProfileIndex,
    }: {
      label: string;
      apiKey: string;
      profiles: AccountProfilePreview[];
      defaultProfileIndex: number;
    }) => api.createAccount(label, apiKey, profiles, defaultProfileIndex),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accounts'] });
      qc.invalidateQueries({ queryKey: ['profiles'] });
    },
  });
}

export function useUpdateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: { label?: string; defaultProfileId?: string } }) =>
      api.updateAccount(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['accounts'] }),
  });
}

export function useDeleteAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteAccount(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accounts'] });
      qc.invalidateQueries({ queryKey: ['profiles'] });
    },
  });
}
