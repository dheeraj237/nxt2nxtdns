'use client';

import { useCallback, useEffect, useState } from 'react';
import type { LogEntry } from '@/lib/nextdns/types';

export function useLogs(profileId: string) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/profiles/${profileId}/logs`);
      if (!res.ok) {
        const errorBody = await res.json();
        throw new Error(errorBody.error || res.statusText);
      }
      const result = await res.json();
      setLogs(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [profileId]);

  useEffect(() => {
    fetchLogs();
  }, [profileId, fetchLogs]);

  return { logs, loading, error, refetch: fetchLogs };
}
