'use client';

import type { Schedule } from '@/lib/apiClient';
import { useDeleteSchedule } from '@/hooks/useSchedules';

export function ScheduleDeleteModal({
  schedule,
  isOpen,
  onClose,
}: {
  schedule?: Schedule;
  isOpen: boolean;
  onClose: () => void;
}) {
  const deleteSchedule = useDeleteSchedule();
  const isLoading = deleteSchedule.isPending;

  if (!isOpen || !schedule) return null;

  const handleDelete = async () => {
    try {
      await deleteSchedule.mutateAsync(schedule.id);
      onClose();
    } catch (err) {
      console.error('Failed to delete schedule:', err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-lg font-bold mb-4">Delete Schedule</h2>
        <p className="text-slate-600 mb-6">
          Are you sure you want to delete <strong>{schedule.name}</strong>? This action cannot be undone.
        </p>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="rounded border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-50"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            className="rounded bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            disabled={isLoading}
          >
            {isLoading ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
