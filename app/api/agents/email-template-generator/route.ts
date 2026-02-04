import { NextRequest, NextResponse } from 'next/server';
import {
  EmailTemplateGeneratorAgent,
  generateEmailTemplateFallback,
  validateEmailTemplateGeneratorInput,
} from '@/backend/agents/claude/emailTemplateGenerator';

export async function POST(request: NextRequest) {
  let body: any = null;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const validated = validateEmailTemplateGeneratorInput(body);
  if (!validated.ok) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();
  const ip = request.headers.get('x-forwarded-for')?.split(',')?.[0]?.trim() || null;
  const userAgent = request.headers.get('user-agent') || null;
  const userId = typeof body?.userId === 'string' ? body.userId : null;

  const apiKey = (typeof process.env.ANTHROPIC_API_KEY === 'string' && process.env.ANTHROPIC_API_KEY.trim()) || '';
  if (!apiKey) {
    const output = generateEmailTemplateFallback(validated.value);
    return NextResponse.json({
      output,
      meta: { requestId, isFallback: true, provider: 'fallback' },
    });
  }

  try {
    const agent = new EmailTemplateGeneratorAgent();
    const result = await agent.run(validated.value, { requestId, ip, userAgent, userId });

    return NextResponse.json({
      output: result.output,
      meta: { requestId, isFallback: false, provider: 'anthropic', model: result.model, usage: result.usage },
    });
  } catch (error: any) {
    const message = error?.message ?? String(error);
    const status = error?.status ?? error?.statusCode;
    console.error('[agents/email-template-generator] error', {
      requestId,
      message,
      status,
      code: error?.code,
      name: error?.name,
    });

    const output = generateEmailTemplateFallback(validated.value);
    return NextResponse.json(
      {
        output,
        meta: { requestId, isFallback: true, provider: 'fallback_after_error' },
      },
      { status: 200 }
    );
  }
}

