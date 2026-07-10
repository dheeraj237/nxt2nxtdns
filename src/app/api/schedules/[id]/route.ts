import { schedulesRepo, profilesRepo, scheduleSnapshotsRepo } from '@/lib/db/repo';

function validateTimeFormat(time: string): boolean {
  const match = /^([0-1]\d|2[0-3]):[0-5]\d$/.test(time);
  return match;
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const schedule = schedulesRepo.get(id);
  if (!schedule) {
    return Response.json({ error: 'Schedule not found' }, { status: 404 });
  }
  return Response.json(schedule);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const schedule = schedulesRepo.get(id);
    if (!schedule) {
      return Response.json({ error: 'Schedule not found' }, { status: 404 });
    }

    const body = await req.json();
    const patch: Record<string, unknown> = {};

    if ('name' in body) {
      if (typeof body.name !== 'string') {
        return Response.json({ error: 'name must be a string' }, { status: 400 });
      }
      patch.name = body.name;
    }

    if ('startTime' in body) {
      if (typeof body.startTime !== 'string') {
        return Response.json({ error: 'startTime must be a string' }, { status: 400 });
      }
      if (!validateTimeFormat(body.startTime)) {
        return Response.json({ error: 'startTime must be in HH:MM format' }, { status: 400 });
      }
      patch.start_time = body.startTime;
    }

    if ('endTime' in body) {
      if (typeof body.endTime !== 'string') {
        return Response.json({ error: 'endTime must be a string' }, { status: 400 });
      }
      if (!validateTimeFormat(body.endTime)) {
        return Response.json({ error: 'endTime must be in HH:MM format' }, { status: 400 });
      }
      patch.end_time = body.endTime;
    }

    if ('targetProfileId' in body) {
      if (typeof body.targetProfileId !== 'string') {
        return Response.json({ error: 'targetProfileId must be a string' }, { status: 400 });
      }
      const targetProfile = profilesRepo.get(body.targetProfileId);
      if (!targetProfile) {
        return Response.json({ error: 'targetProfileId does not exist' }, { status: 400 });
      }
      patch.target_profile_id = body.targetProfileId;
    }

    if ('enabled' in body) {
      if (typeof body.enabled !== 'boolean') {
        return Response.json({ error: 'enabled must be a boolean' }, { status: 400 });
      }
      patch.enabled = body.enabled;
    }

    const startTime = (patch.start_time as string) || schedule.start_time;
    const endTime = (patch.end_time as string) || schedule.end_time;
    if (startTime >= endTime) {
      return Response.json({ error: 'startTime must be before endTime' }, { status: 400 });
    }

    schedulesRepo.update(id, patch as Parameters<typeof schedulesRepo.update>[1]);
    const updated = schedulesRepo.get(id);
    return Response.json(updated);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Error updating schedule:', message);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const schedule = schedulesRepo.get(id);
    if (!schedule) {
      return Response.json({ error: 'Schedule not found' }, { status: 404 });
    }

    scheduleSnapshotsRepo.deleteByScheduleId(id);
    schedulesRepo.delete(id);
    return new Response(null, { status: 204 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Error deleting schedule:', message);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
