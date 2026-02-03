export function extractFirstJsonObject(text: string): string | null {
  if (!text) return null;

  // Prefer fenced blocks first
  const fenced = text.match(/```json\s*([\s\S]*?)\s*```/i) || text.match(/```\s*([\s\S]*?)\s*```/);
  if (fenced?.[1]) {
    const candidate = fenced[1].trim();
    if (candidate.startsWith('{') && candidate.endsWith('}')) return candidate;
  }

  // Otherwise find the first balanced JSON object-ish substring.
  const start = text.indexOf('{');
  if (start === -1) return null;

  let depth = 0;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (ch === '{') depth++;
    if (ch === '}') depth--;
    if (depth === 0) {
      const candidate = text.slice(start, i + 1).trim();
      if (candidate.startsWith('{') && candidate.endsWith('}')) return candidate;
      return null;
    }
  }
  return null;
}

export function safeJsonParse<T>(text: string): { ok: true; value: T } | { ok: false; error: string } {
  try {
    return { ok: true, value: JSON.parse(text) as T };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Failed to parse JSON' };
  }
}

export function nonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export function asTrimmedString(value: unknown, fallback = ''): string {
  return nonEmptyString(value) ? value.trim() : fallback;
}

export function uniqueStrings(items: unknown[], limit = 10): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const it of items) {
    if (!nonEmptyString(it)) continue;
    const s = it.trim();
    if (!s) continue;
    if (seen.has(s.toLowerCase())) continue;
    seen.add(s.toLowerCase());
    out.push(s);
    if (out.length >= limit) break;
  }
  return out;
}

