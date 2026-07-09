import { useMutation } from '@tanstack/react-query';
import { api, type LiveProfile } from '@/lib/apiClient';

export function useComputeDiff() {
  return useMutation({
    mutationFn: ({ sourceProfile, targetAccountIds }: { sourceProfile: LiveProfile; targetAccountIds: string[] }) =>
      api.computeDiff(sourceProfile, targetAccountIds),
  });
}

export function useApplySync() {
  return useMutation({
    mutationFn: ({ sourceProfile, targetAccountIds }: { sourceProfile: LiveProfile; targetAccountIds: string[] }) =>
      api.applySync(sourceProfile, targetAccountIds),
  });
}
