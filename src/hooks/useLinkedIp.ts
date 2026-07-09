import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '@/lib/apiClient';
import { profilesRepo } from '@/lib/db/repo';

export function useLinkedIp(profileId: string) {
  const queryClient = useQueryClient();

  const listProfilesQuery = useQuery({
    queryKey: ['profiles'],
    queryFn: () => api.listProfiles(),
  });

  const profile = listProfilesQuery.data?.find((p) => p.id === profileId);
  const isAutoRefreshEnabled = profile?.auto_refresh_linked_ip ?? false;

  const linkNowMutation = useMutation({
    mutationFn: () => api.linkProfileNow(profileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
    },
  });

  const updateAutoRefreshMutation = useMutation({
    mutationFn: (enabled: boolean) => api.updateProfile(profileId, { autoRefreshLinkedIp: enabled }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
    },
  });

  return {
    linkedIp: linkNowMutation.data?.linkedIp ?? null,
    isAutoRefreshEnabled,
    linkNow: () => linkNowMutation.mutateAsync(),
    toggleAutoRefresh: (enabled: boolean) => updateAutoRefreshMutation.mutateAsync(enabled),
    loading: linkNowMutation.isPending || updateAutoRefreshMutation.isPending || listProfilesQuery.isLoading,
    error: linkNowMutation.error || updateAutoRefreshMutation.error || listProfilesQuery.error,
  };
}
