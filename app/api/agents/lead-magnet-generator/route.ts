import { NextRequest, NextResponse } from 'next/server';
import {
  LeadMagnetGeneratorAgent,
  generateLeadMagnetFallback,
  validateLeadMagnetGeneratorInput,
} from '@/backend/agents/claude/leadMagnetGenerator';

export async function POST(request: NextRequest) {
  let body: any = null;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const validated = validateLeadMagnetGeneratorInput(body);
  if (!validated.ok) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();
  const ip = request.headers.get('x-forwarded-for')?.split(',')?.[0]?.trim() || null;
  const userAgent = request.headers.get('user-agent') || null;
  const userId = typeof body?.userId === 'string' ? body.userId : null;

  // If Claude isn't configured, return a deterministic fallback (still useful for users & local dev).
  if (!process.env.ANTHROPIC_API_KEY) {
    const output = generateLeadMagnetFallback(validated.value);
    return NextResponse.json({
      output,
      meta: { requestId, isFallback: true, provider: 'fallback' },
    });
  }

  try {
    const agent = new LeadMagnetGeneratorAgent();
    const result = await agent.run(validated.value, { requestId, ip, userAgent, userId });

    return NextResponse.json({
      output: result.output,
      meta: { requestId, isFallback: false, provider: 'anthropic', model: result.model, usage: result.usage },
    });
  } catch (error: any) {
    console.error('[agents/lead-magnet-generator] error', {
      requestId,
      message: error?.message,
    });

    // If the model returns non-JSON or partial fields, degrade gracefully.
    const output = generateLeadMagnetFallback(validated.value);
    return NextResponse.json(
      {
        output,
        meta: { requestId, isFallback: true, provider: 'fallback_after_error' },
      },
      { status: 200 }
    );
  }
}

