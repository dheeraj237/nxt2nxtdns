'use client';

import type { Schedule } from '@/lib/apiClient';
import { useSchedules, useUpdateSchedule, useDeleteSchedule } from '@/hooks/useSchedules';
import { useProfiles } from '@/hooks/useProfiles';
import { useState } from 'react';

export function ScheduleList({ onEdit, onDelete }: { onEdit: (schedule: Schedule) => void; onDelete: (schedule: Schedule) => void }) {
  const { data: schedules, isLoading, error } = useSchedules();
  const { data: profiles = [] } = useProfiles();
  const updateSchedule = useUpdateSchedule();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  if (isLoading) return <p className="text-center text-slate-500">Loading schedules...</p>;
  if (error) return <p className="text-center text-red-600">Failed to load schedules</p>;

  if (!schedules || schedules.length === 0) {
    return <p className="text-center text-slate-400 py-8">No schedules yet. Create one to get started.</p>;
  }

  const profileMap = new Map(profiles.map((p) => [p.id, p]));

  const handleToggle = async (schedule: Schedule) => {
    setUpdatingId(schedule.id);
    try {
      await updateSchedule.mutateAsync({
        id: schedule.id,
        patch: { enabled: !schedule.enabled },
      });
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="border-b border-slate-200 bg-slate-50">
          <tr>
            <th className="px-4 py-2 text-left font-medium">Name</th>
            <th className="px-4 py-2 text-left font-medium">Start Time</th>
            <th className="px-4 py-2 text-left font-medium">End Time</th>
            <th className="px-4 py-2 text-left font-medium">Target Profile</th>
            <th className="px-4 py-2 text-left font-medium">Enabled</th>
            <th className="px-4 py-2 text-left font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {schedules.map((schedule) => {
            const targetProfile = profileMap.get(schedule.target_profile_id);
            return (
              <tr key={schedule.id} className={`border-b border-slate-100 ${!schedule.enabled ? 'bg-slate-50' : ''}`}>
                <td className="px-4 py-2">{schedule.name}</td>
                <td className="px-4 py-2">{schedule.start_time}</td>
                <td className="px-4 py-2">{schedule.end_time}</td>
                <td className="px-4 py-2 text-slate-600">
                  {targetProfile ? `${targetProfile.account_label}/${targetProfile.display_name || targetProfile.profile_id}` : '(deleted)'}
                </td>
                <td className="px-4 py-2">
                  <label className="inline-flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={schedule.enabled}
                      onChange={() => handleToggle(schedule)}
                      disabled={updatingId === schedule.id || updateSchedule.isPending}
                      className="cursor-pointer"
                    />
                  </label>
                </td>
                <td className="px-4 py-2 text-right">
                  <button
                    onClick={() => onEdit(schedule)}
                    className="mr-2 text-xs text-blue-600 hover:underline"
                    disabled={updatingId === schedule.id}
                  >
                    Edit
                  </button>
                  <button onClick={() => onDelete(schedule)} className="text-xs text-red-600 hover:underline" disabled={updatingId === schedule.id}>
                    Delete
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
