/**
 * Minimal repro for "Gemini returns [] for news prompt"
 *
 * Runs the EXACT strict prompt used by aiNewsAgent and prints:
 * - raw text preview
 * - parsed array length
 *
 * Also runs a couple variants WITHOUT changing the prompt text:
 * - different query strings (with/without year/month)
 * - with vs without googleSearchRetrieval tool
 */
import { config } from 'dotenv';
import { GoogleGenAI } from '@google/genai';

config({ path: '.env.local' });

function extractJsonArray(text: string): any[] | null {
  const trimmed = (text || '').trim();
  const m =
    trimmed.match(/\[[\s\S]*\]/) ||
    trimmed.match(/```json\s*([\s\S]*?)\s*```/) ||
    trimmed.match(/```\s*([\s\S]*?)\s*```/);
  if (!m) return null;
  const jsonStr = (m[1] || m[0]).trim();
  try {
    const parsed = JSON.parse(jsonStr);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function buildStrictPrompt(query: string): string {
  const today = new Date();
  const currentDate = today.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const dateStr = today.toISOString().split('T')[0]; // YYYY-MM-DD

  // IMPORTANT: Keep this prompt text identical to services/aiNewsAgent.ts
  return `Search for latest AI news articles from the past 24-48 hours.

Today: ${currentDate} (${dateStr})
Query: "${query}"

Requirements:
- Only articles from ${dateStr} or recent
- Cite real sources (TechCrunch, The Verge, Wired, VentureBeat, etc.)
- Use search grounding to find actual articles
- If no real articles found, return empty array []

For each article found:
- Title (from actual article)
- Source (publication name)
- URL (if available from search, otherwise null)
- Snippet (2-3 sentences)
- Published date (YYYY-MM-DD)

Return JSON array:
[
  {
    "title": "Article Title",
    "source": "Publication Name",
    "url": "https://url-if-available.com/article" or null,
    "snippet": "Brief description...",
    "publishedDate": "${dateStr}"
  }
]

Return ONLY valid JSON.`;
}

async function runCase(label: string, opts: { query: string; useGrounding: boolean }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set');

  const ai = new GoogleGenAI({ apiKey });
  const prompt = buildStrictPrompt(opts.query);

  const res = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 8192,
      ...(opts.useGrounding ? { tools: [{ googleSearch: {} }] } : {}),
    },
  } as any);

  const text = (res.text || '').trim();
  const arr = extractJsonArray(text);

  console.log('\n============================================================');
  console.log(label);
  console.log('============================================================');
  console.log('query:', JSON.stringify(opts.query));
  console.log('useGrounding:', opts.useGrounding);
  console.log('\nRAW (first 800 chars):\n' + text.slice(0, 800));
  console.log('\nPARSED:', arr ? `array len=${arr.length}` : 'failed to parse array');
  if (arr && arr.length > 0) {
    console.log('FIRST ITEM:', JSON.stringify(arr[0], null, 2).slice(0, 800));
  }
}

async function main() {
  await runCase('A) Strict prompt + grounding + query includes year/month', {
    query: 'latest AI news 2026 January',
    useGrounding: true,
  });

  await runCase('B) Strict prompt + grounding + query WITHOUT year/month', {
    query: 'latest AI news',
    useGrounding: true,
  });

  await runCase('C) Strict prompt WITHOUT grounding + query includes year/month', {
    query: 'latest AI news 2026 January',
    useGrounding: false,
  });

  await runCase('D) Strict prompt WITHOUT grounding + query WITHOUT year/month', {
    query: 'latest AI news',
    useGrounding: false,
  });
}

main().catch((e) => {
  console.error('\nFAILED:', e?.message || e);
  process.exit(1);
});

