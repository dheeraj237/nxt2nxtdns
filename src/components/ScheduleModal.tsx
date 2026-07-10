'use client';

import type { Schedule } from '@/lib/apiClient';
import { ScheduleForm } from './ScheduleForm';

export function ScheduleModal({
  schedule,
  isOpen,
  onClose,
}: {
  schedule?: Schedule;
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-lg font-bold mb-4">{schedule ? 'Edit Schedule' : 'Create Schedule'}</h2>
        <ScheduleForm
          schedule={schedule}
          onSuccess={onClose}
          onCancel={onClose}
        />
      </div>
    </div>
  );
}
