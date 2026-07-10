'use client';

import type { Schedule } from '@/lib/apiClient';
import { useProfiles } from '@/hooks/useProfiles';
import { useCreateSchedule, useUpdateSchedule } from '@/hooks/useSchedules';
import { useState } from 'react';

export function ScheduleForm({ schedule, onSuccess, onCancel }: { schedule?: Schedule; onSuccess: () => void; onCancel: () => void }) {
  const { data: profiles = [] } = useProfiles();
  const createSchedule = useCreateSchedule();
  const updateSchedule = useUpdateSchedule();
  const isLoading = createSchedule.isPending || updateSchedule.isPending;

  const [name, setName] = useState(schedule?.name ?? '');
  const [startTime, setStartTime] = useState(schedule?.start_time ?? '');
  const [endTime, setEndTime] = useState(schedule?.end_time ?? '');
  const [targetProfileId, setTargetProfileId] = useState(schedule?.target_profile_id ?? '');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name || !startTime || !endTime || !targetProfileId) {
      setError('All fields are required');
      return;
    }

    if (startTime >= endTime) {
      setError('Start time must be before end time');
      return;
    }

    try {
      if (schedule) {
        await updateSchedule.mutateAsync({
          id: schedule.id,
          patch: { name, start_time: startTime, end_time: endTime, target_profile_id: targetProfileId },
        });
      } else {
        await createSchedule.mutateAsync({ name, startTime, endTime, targetProfileId });
      }
      onSuccess();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="rounded bg-red-50 p-2 text-sm text-red-600">{error}</div>}

      <div>
        <label className="block text-sm font-medium mb-1">Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Work Hours"
          className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
          disabled={isLoading}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Start Time (HH:MM)</label>
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
            disabled={isLoading}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">End Time (HH:MM)</label>
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
            disabled={isLoading}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Target Profile</label>
        <select
          value={targetProfileId}
          onChange={(e) => setTargetProfileId(e.target.value)}
          className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
          disabled={isLoading}
        >
          <option value="">Select a profile...</option>
          {profiles.map((p) => (
            <option key={p.id} value={p.id}>
              {p.account_label}/{p.display_name || p.profile_id}
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="rounded border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-50"
          disabled={isLoading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          disabled={isLoading}
        >
          {isLoading ? 'Saving...' : schedule ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  );
}
