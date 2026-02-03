import { NextRequest, NextResponse } from 'next/server';

function asString(v: unknown): string {
  return typeof v === 'string' ? v : '';
}

export async function POST(request: NextRequest) {
  let body: any = null;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const agentId = asString(body?.agentId).trim();
  const eventType = asString(body?.eventType).trim();
  const userId = asString(body?.userId).trim() || null;
  const sessionId = asString(body?.sessionId).trim() || null;
  const payload = body?.payload ?? {};

  if (!agentId || !eventType) {
    return NextResponse.json({ error: 'agentId and eventType are required' }, { status: 400 });
  }

  const id = crypto.randomUUID();
  const ip = request.headers.get('x-forwarded-for')?.split(',')?.[0]?.trim() || null;

  // Always log (observability), even if DB isn't configured.
  console.log('[agent-event]', {
    id,
    agentId,
    eventType,
    userId,
    sessionId,
    ip,
  });

  // Store in DB only when configured. Fail open if table/migration isn't applied yet.
  if (process.env.DATABASE_URL) {
    try {
      const { AgentEventsRepository } = await import('@/database/repositories/agentEvents.repository');
      const repo = new AgentEventsRepository();
      await repo.insert({ id, agentId, eventType, userId, sessionId, payload });
    } catch (e) {
      const message = (e as any)?.message || '';
      // If the DB is reachable but the events table isn't set up yet, fail silently.
      if (message.includes('toolbox_agent_events') && message.includes('does not exist')) {
        return NextResponse.json({ ok: true, id });
      }
      console.warn('[agent-event] db insert failed', { message });
    }
  }

  return NextResponse.json({ ok: true, id });
}

