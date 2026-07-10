'use client';

import { useCallback, useEffect, useState } from 'react';
import type { AnalyticsData } from '@/lib/nextdns/types';

export function useAnalytics(profileId: string) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/profiles/${profileId}/analytics`);
      if (!res.ok) {
        const errorBody = await res.json();
        throw new Error(errorBody.error || res.statusText);
      }
      const result = await res.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [profileId]);

  useEffect(() => {
    fetchAnalytics();
  }, [profileId, fetchAnalytics]);

  return { data, loading, error, refetch: fetchAnalytics };
}
