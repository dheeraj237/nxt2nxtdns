import { useQuery } from '@tanstack/react-query';
import type { ProfileSetup } from '@/lib/nextdns/types';

async function fetchProfileSetup(profileId: string): Promise<ProfileSetup> {
  const response = await fetch(`/api/profiles/${profileId}/setup`);
  if (!response.ok) {
    throw new Error('Failed to fetch profile setup');
  }
  return response.json();
}

export function useProfileSetup(profileId: string) {
  return useQuery({
    queryKey: ['profileSetup', profileId],
    queryFn: () => fetchProfileSetup(profileId),
    enabled: !!profileId,
  });
}
