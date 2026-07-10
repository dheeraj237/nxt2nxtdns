import { schedulesRepo, profilesRepo } from '@/lib/db/repo';

function validateTimeFormat(time: string): boolean {
  const match = /^([0-1]\d|2[0-3]):[0-5]\d$/.test(time);
  return match;
}

export async function GET() {
  const schedules = schedulesRepo.list();
  return Response.json(schedules);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, startTime, endTime, targetProfileId } = body as Record<string, unknown>;

    if (!name || typeof name !== 'string') {
      return Response.json({ error: 'name is required and must be a string' }, { status: 400 });
    }

    if (!startTime || typeof startTime !== 'string') {
      return Response.json({ error: 'startTime is required and must be a string' }, { status: 400 });
    }

    if (!endTime || typeof endTime !== 'string') {
      return Response.json({ error: 'endTime is required and must be a string' }, { status: 400 });
    }

    if (!targetProfileId || typeof targetProfileId !== 'string') {
      return Response.json({ error: 'targetProfileId is required and must be a string' }, { status: 400 });
    }

    if (!validateTimeFormat(startTime)) {
      return Response.json({ error: 'startTime must be in HH:MM format' }, { status: 400 });
    }

    if (!validateTimeFormat(endTime)) {
      return Response.json({ error: 'endTime must be in HH:MM format' }, { status: 400 });
    }

    if (startTime >= endTime) {
      return Response.json({ error: 'startTime must be before endTime' }, { status: 400 });
    }

    const targetProfile = profilesRepo.get(targetProfileId);
    if (!targetProfile) {
      return Response.json({ error: 'targetProfileId does not exist' }, { status: 400 });
    }

    const schedule = schedulesRepo.create(name, startTime, endTime, targetProfileId);
    return Response.json(schedule, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Error creating schedule:', message);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
