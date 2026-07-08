import { useMutation } from '@tanstack/react-query';
import { api } from '../../lib/api';

export function useComputeDiff() {
  return useMutation({ mutationFn: (targetProfileIds: string[]) => api.computeDiff(targetProfileIds) });
}

export function useApplySync() {
  return useMutation({ mutationFn: (targetProfileIds: string[]) => api.applySync(targetProfileIds) });
}
