import Anthropic from '@anthropic-ai/sdk';

let cached: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
  if (cached) return cached;

  const raw = process.env.ANTHROPIC_API_KEY;
  const apiKey = typeof raw === 'string' ? raw.trim() : '';
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not configured');
  }

  cached = new Anthropic({ apiKey });
  return cached;
}

/** Default: from docs.anthropic.com/en/api/messages/create (claude-3-5-sonnet-* are deprecated). */
export function getAnthropicModel(): string {
  return process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5-20250929';
}

