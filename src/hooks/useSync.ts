import { useMutation } from '@tanstack/react-query';
import { api, type SyncSource } from '@/lib/apiClient';

export function useComputeDiff() {
  return useMutation({
    mutationFn: ({ source, targetProfileIds }: { source: SyncSource; targetProfileIds?: string[] }) =>
      api.computeDiff(source, targetProfileIds),
  });
}

export function useApplySync() {
  return useMutation({
    mutationFn: ({ source, targetProfileIds }: { source: SyncSource; targetProfileIds?: string[] }) =>
      api.applySync(source, targetProfileIds),
  });
}
