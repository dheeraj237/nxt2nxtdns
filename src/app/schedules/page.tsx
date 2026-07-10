'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Schedule } from '@/lib/apiClient';
import { ScheduleList } from '@/components/ScheduleList';
import { ScheduleModal } from '@/components/ScheduleModal';
import { ScheduleDeleteModal } from '@/components/ScheduleDeleteModal';

export default function SchedulesPage() {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | undefined>();
  const [deleteSchedule, setDeleteSchedule] = useState<Schedule | undefined>();

  const handleEdit = (schedule: Schedule) => {
    setEditingSchedule(schedule);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingSchedule(undefined);
  };

  const handleOpenCreate = () => {
    setEditingSchedule(undefined);
    setModalOpen(true);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <button onClick={() => router.back()} className="text-sm text-blue-600 hover:underline mb-2">
            ← Back
          </button>
          <h1 className="text-xl font-semibold text-slate-900">Scheduled Profile Swaps</h1>
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-slate-600">
          Automatically swap DNS profiles at scheduled times. Snapshots are taken at start time and restored at end time.
        </p>
        <button
          onClick={handleOpenCreate}
          className="rounded border border-dashed border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:border-slate-400"
        >
          + New Schedule
        </button>
      </div>

      <div className="rounded border border-slate-200 bg-white">
        <ScheduleList onEdit={handleEdit} onDelete={setDeleteSchedule} />
      </div>

      <ScheduleModal schedule={editingSchedule} isOpen={modalOpen} onClose={handleCloseModal} />
      <ScheduleDeleteModal schedule={deleteSchedule} isOpen={!!deleteSchedule} onClose={() => setDeleteSchedule(undefined)} />
    </div>
  );
}
