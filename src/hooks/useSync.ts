import { useMutation } from '@tanstack/react-query';
import { api, type SourceRole } from '@/lib/apiClient';

export function useComputeDiff() {
  return useMutation({
    mutationFn: ({ source, targetProfileIds }: { source: SourceRole; targetProfileIds?: string[] }) =>
      api.computeDiff(source, targetProfileIds),
  });
}

export function useApplySync() {
  return useMutation({
    mutationFn: ({ source, targetProfileIds }: { source: SourceRole; targetProfileIds?: string[] }) =>
      api.applySync(source, targetProfileIds),
  });
}
