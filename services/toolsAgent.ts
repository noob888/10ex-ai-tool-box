// AI Tools Discovery Agent - Uses Google Gemini with search grounding to discover new AI tools
import { GoogleGenAI } from "@google/genai";
import { ToolsRepository } from '@/database/repositories/tools.repository';
import { Tool, Category, PricingTier } from '@/types';

interface ToolSearchResult {
  name: string;
  tagline: string;
  description: string;
  websiteUrl: string;
  category: string;
  pricing: string;
  launchDate?: string;
}

/**
 * Sleep/delay utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry with exponential backoff for rate limit errors
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      // Check if it's a rate limit error (429)
      if (error?.status === 429 || error?.message?.includes('quota') || error?.message?.includes('429')) {
        const delay = initialDelay * Math.pow(2, attempt);
        // Try to extract retry delay from error details (Gemini API provides this in error.details)
        let retryAfter = delay;
        if (error?.retryDelay) {
          retryAfter = error.retryDelay;
        } else if (error?.details && Array.isArray(error.details)) {
          const retryInfo = error.details.find((d: any) => d['@type'] === 'type.googleapis.com/google.rpc.RetryInfo');
          if (retryInfo?.retryDelay) {
            // Convert seconds to milliseconds if needed
            retryAfter = typeof retryInfo.retryDelay === 'number' 
              ? retryInfo.retryDelay * 1000 
              : retryInfo.retryDelay;
          }
        }
        console.log(`   ⏳ Rate limit hit, waiting ${retryAfter}ms before retry (attempt ${attempt + 1}/${maxRetries})...`);
        await sleep(retryAfter);
        continue;
      }
      
      // For other errors, throw immediately
      throw error;
    }
  }
  
  throw lastError;
}

/**
 * Search for new AI tools using Gemini with search grounding
 */
async function searchAITools(query: string, maxResults: number = 10): Promise<ToolSearchResult[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const currentDate = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    const dateStr = new Date().toISOString().split('T')[0];

    const prompt = `You are an AI tools discovery agent. Search for new, trending, or recently launched AI tools.

Today's Date: ${currentDate} (${dateStr})
Search Query: "${query}"

IMPORTANT REQUIREMENTS:
1. Focus on REAL, ACTIVE AI tools that are currently available
2. Tools should be launched or updated within the last 6 months (prefer recent)
3. Extract accurate, factual information only
4. URLs MUST be real, accessible tool websites
5. URLs MUST start with https:// or http://
6. URLs MUST be complete (not truncated or partial)
7. DO NOT use placeholder URLs like example.com, test.com, or localhost
8. DO NOT use search result URLs (google.com/search, etc.)

For each tool found, extract:
- Tool name (exact name)
- Tagline (short 1-line description, max 100 chars)
- Description (2-3 sentences about what the tool does)
- Website URL (must be the actual tool's homepage)
- Category (one of: Writing & Content, Research & Search, Sales & Outreach, Marketing & Ads, Design & Images, Video & Audio, Coding & Dev Tools, Data & Analytics, Automation & Agents, Customer Support, HR & Recruiting, Productivity & Knowledge, Founders & Startups, Enterprise & Ops)
- Pricing tier (Free, Freemium, Paid, or Enterprise)
- Launch date (YYYY-MM-DD format, if available)

Return results as a JSON array:
[
  {
    "name": "Tool Name",
    "tagline": "Short tagline",
    "description": "Detailed description",
    "websiteUrl": "https://example.com",
    "category": "Writing & Content",
    "pricing": "Freemium",
    "launchDate": "2025-01-15"
  }
]

Return ONLY the JSON array, no additional text or markdown formatting.`;

    const result = await retryWithBackoff(async () => {
      return await ai.models.generateContent({
        model: 'gemini-2.0-flash-exp',
        contents: prompt,
        config: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,
        },
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
        ],
        tools: [{
          googleSearchRetrieval: {
            dynamicRetrievalConfig: {
              mode: 'MODE_DYNAMIC',
              dynamicThreshold: 0.3,
            },
          },
        }],
      } as any);
    });

    const responseText = result.text || '';
    
    // Parse JSON from response
    let tools: ToolSearchResult[] = [];
    try {
      // Try to extract JSON from markdown code blocks if present
      const jsonMatch = responseText.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : responseText.trim();
      tools = JSON.parse(jsonStr);
      
      if (!Array.isArray(tools)) {
        console.log('   ⚠ Response is not an array, attempting to wrap...');
        tools = [tools];
      }
    } catch (parseError) {
      console.log(`   ⚠ Failed to parse tools JSON: ${parseError}`);
      console.log(`   Response preview: ${responseText.substring(0, 200)}...`);
      return [];
    }

    // Validate and clean results
    const validTools: ToolSearchResult[] = [];
    for (const tool of tools) {
      if (!tool.name || !tool.websiteUrl) {
        console.log(`   ⚠ Skipping tool missing name or URL: ${JSON.stringify(tool)}`);
        continue;
      }

      const cleanedUrl = validateAndCleanUrl(tool.websiteUrl);
      if (!cleanedUrl) {
        console.log(`   ⚠ Invalid URL for tool "${tool.name}": ${tool.websiteUrl}`);
        continue;
      }

      validTools.push({
        ...tool,
        websiteUrl: cleanedUrl,
      });
    }

    return validTools.slice(0, maxResults);
  } catch (error: any) {
    console.error(`   ❌ Error searching for tools with query "${query}":`, error.message);
    throw error;
  }
}

/**
 * Validate and clean URL
 */
function validateAndCleanUrl(url: string): string | null {
  if (!url || typeof url !== 'string') {
    return null;
  }

  url = url.trim();
  url = url.replace(/[.,;:!?]+$/, '');
  url = url.replace(/[)\]}]$/, '');

  if (url.length < 10 || !url.includes('.')) {
    return null;
  }

  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }

  try {
    const urlObj = new URL(url);
    
    if (!urlObj.hostname || urlObj.hostname.length < 3) {
      return null;
    }

    const fakePatterns = [
      'example.com',
      'placeholder.com',
      'test.com',
      'localhost',
      '127.0.0.1',
    ];
    
    const hostname = urlObj.hostname.toLowerCase();
    if (fakePatterns.some(pattern => hostname.includes(pattern))) {
      return null;
    }

    const pathname = urlObj.pathname.toLowerCase();
    const searchParams = urlObj.search.toLowerCase();
    if (
      pathname.includes('/search') ||
      pathname.includes('/results') ||
      searchParams.includes('q=') ||
      searchParams.includes('query=')
    ) {
      return null;
    }

    return urlObj.toString();
  } catch (error) {
    return null;
  }
}

/**
 * Check if URL is accessible
 */
async function checkUrlAccessible(url: string, timeoutMs: number = 5000): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AI-Tools-Bot/1.0)',
      },
      redirect: 'follow',
    });

    clearTimeout(timeoutId);
    return response.status >= 200 && response.status < 400;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.log(`   ⚠ URL check timeout: ${url.substring(0, 60)}...`);
    } else {
      console.log(`   ⚠ URL check failed: ${url.substring(0, 60)}... (${error.message || 'Unknown error'})`);
    }
    return true; // Fail open
  }
}

/**
 * Enrich tool data using Gemini
 */
async function enrichToolData(tool: ToolSearchResult): Promise<Partial<Tool> & { growthRate6mo?: number | null; monthlyVisits?: number | null }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `You are analyzing an AI tool to extract detailed information.

Tool Name: ${tool.name}
Tagline: ${tool.tagline}
Description: ${tool.description}
Website: ${tool.websiteUrl}
Category: ${tool.category}
Pricing: ${tool.pricing}

Extract and generate:
1. Strengths (3-5 key features/benefits as an array of strings)
2. Weaknesses (2-3 limitations/drawbacks as an array of strings)
3. Best for (one sentence describing who should use this tool)
4. Overkill for (one sentence describing who should NOT use this tool)
5. Sub-category (more specific classification within the category)
6. Initial rating estimate (0-100, based on features, description, and market position)
7. Growth metrics if available (6-month growth percentage, monthly visits if known)

For growth metrics, if you find information about rapid growth (like "88% growth in 6 months" or "911M monthly visits"), include it. Otherwise, leave null.

Return as JSON:
{
  "strengths": ["feature1", "feature2", ...],
  "weaknesses": ["limitation1", "limitation2"],
  "bestFor": "Who should use this tool",
  "overkillFor": "Who should not use this tool",
  "subCategory": "Sub-category name",
  "rating": 75,
  "growthRate6mo": 50.0,
  "monthlyVisits": null
}

Return ONLY the JSON object, no additional text.`;

  try {
    const result = await retryWithBackoff(async () => {
      return await ai.models.generateContent({
        model: 'gemini-2.0-flash-exp',
        contents: prompt,
        config: {
          temperature: 0.5,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        },
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
        ],
        tools: [{
          googleSearchRetrieval: {
            dynamicRetrievalConfig: {
              mode: 'MODE_DYNAMIC',
              dynamicThreshold: 0.3,
            },
          },
        }],
      } as any);
    });

    const responseText = result.text || '';
    const jsonMatch = responseText.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    const jsonStr = jsonMatch ? jsonMatch[1] : responseText.trim();
    const enriched = JSON.parse(jsonStr);

    return {
      strengths: enriched.strengths || [],
      weaknesses: enriched.weaknesses || [],
      bestFor: enriched.bestFor || '',
      overkillFor: enriched.overkillFor || '',
      subCategory: enriched.subCategory || '',
      rating: Math.max(0, Math.min(100, enriched.rating || 50)),
      growthRate6mo: enriched.growthRate6mo || null,
      monthlyVisits: enriched.monthlyVisits || null,
    } as Partial<Tool> & { growthRate6mo?: number | null; monthlyVisits?: number | null };
  } catch (error: any) {
    console.log(`   ⚠ Failed to enrich tool data for "${tool.name}": ${error.message}`);
    // Return defaults if enrichment fails
    return {
      strengths: [],
      weaknesses: [],
      bestFor: '',
      overkillFor: '',
      subCategory: '',
      rating: 50,
    };
  }
}

/**
 * Generate tool ID from name
 */
function generateToolId(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 100);
}

/**
 * Check if tool already exists
 */
async function toolExists(name: string, websiteUrl: string): Promise<boolean> {
  const repo = new ToolsRepository();
  const tools = await repo.findAll({ search: name, limit: 10 });
  
  // Check by name similarity and URL
  return tools.some(tool => {
    const nameMatch = tool.name.toLowerCase() === name.toLowerCase() ||
                     tool.name.toLowerCase().includes(name.toLowerCase()) ||
                     name.toLowerCase().includes(tool.name.toLowerCase());
    const urlMatch = tool.websiteUrl === websiteUrl;
    return nameMatch || urlMatch;
  });
}

/**
 * Discover and save new AI tools
 */
export async function discoverAndSaveTools(): Promise<{
  discovered: number;
  saved: number;
  skipped: number;
  errors: number;
}> {
  console.log('🔍 Starting AI tools discovery...');
  
  const repo = new ToolsRepository();
  const categories = Object.values(Category);
  const currentMonth = new Date().toLocaleString('en-US', { month: 'long' });
  const currentYear = new Date().getFullYear();
  
  const searchQueries = [
    // Latest trending tools
    `trending AI tools ${currentMonth} ${currentYear}`,
    `new AI tools launched ${currentMonth} ${currentYear}`,
    `best AI tools ${currentMonth} ${currentYear}`,
    'Product Hunt trending AI tools this week',
    'Product Hunt AI tools launched today',
    'Hacker News trending AI tools',
    'Twitter trending AI tools',
    'Reddit r/artificial trending AI tools',
    // Category-specific trending
    'trending AI writing tools 2026',
    'trending AI coding tools 2026',
    'trending AI design tools 2026',
    'trending AI video tools 2026',
    'trending AI automation tools 2026',
    // Startup/VC focused
    'AI tools funded January 2026',
    'AI startups launched 2026',
    'Y Combinator AI tools 2026',
  ];

  let discovered = 0;
  let saved = 0;
  let skipped = 0;
  let errors = 0;

  try {
    for (const baseQuery of searchQueries) {
      console.log(`\n📡 Searching: "${baseQuery}"...`);
      
      try {
        const tools = await searchAITools(baseQuery, 10);
        discovered += tools.length;
        console.log(`   ✓ Found ${tools.length} tools`);

        for (const toolResult of tools) {
          try {
            // Check if tool already exists
            const exists = await toolExists(toolResult.name, toolResult.websiteUrl);
            if (exists) {
              console.log(`   ⊘ Skipping duplicate: ${toolResult.name}`);
              skipped++;
              continue;
            }

            // Validate URL is accessible
            const isAccessible = await checkUrlAccessible(toolResult.websiteUrl);
            if (!isAccessible) {
              console.log(`   ⚠ Skipping inaccessible URL: ${toolResult.name}`);
              skipped++;
              continue;
            }

            // Enrich tool data
            console.log(`   🔧 Enriching: ${toolResult.name}...`);
            const enriched = await enrichToolData(toolResult);

            // Map category
            const category = toolResult.category as Category || Category.PRODUCTIVITY;
            
            // Map pricing
            const pricing = (toolResult.pricing || 'Freemium') as PricingTier;

            // Create tool object
            const toolId = generateToolId(toolResult.name);
            const tool: Partial<Tool> & {
              discoveredAt?: string;
              discoverySource?: string;
              lastVerifiedAt?: string;
              verificationStatus?: string;
              growthRate6mo?: number;
              isRapidlyGrowing?: boolean;
              monthlyVisits?: number;
            } = {
              id: toolId,
              name: toolResult.name,
              tagline: toolResult.tagline || '',
              category,
              subCategory: enriched.subCategory || '',
              description: toolResult.description || '',
              strengths: enriched.strengths || [],
              weaknesses: enriched.weaknesses || [],
              pricing,
              rating: enriched.rating || 50,
              popularity: 0,
              votes: 0,
              alternatives: [],
              bestFor: enriched.bestFor || '',
              overkillFor: enriched.overkillFor || '',
              isVerified: false,
              launchDate: toolResult.launchDate || new Date().toISOString().split('T')[0],
              websiteUrl: toolResult.websiteUrl,
              // Discovery fields
              discoveredAt: new Date().toISOString(),
              discoverySource: 'ai_search',
              lastVerifiedAt: new Date().toISOString(),
              verificationStatus: 'verified',
              growthRate6mo: (enriched as any).growthRate6mo || null,
              isRapidlyGrowing: (enriched as any).growthRate6mo && (enriched as any).growthRate6mo > 50,
              monthlyVisits: (enriched as any).monthlyVisits || null,
            };

            // Save to database
            await repo.upsert(tool);
            console.log(`   ✓ Saved: ${toolResult.name}`);
            saved++;

            // Rate limiting: wait between tools
            await sleep(2000);
          } catch (error: any) {
            console.error(`   ❌ Error processing tool "${toolResult.name}":`, error.message);
            errors++;
          }
        }

        // Rate limiting: wait between search queries
        await sleep(7000);
      } catch (error: any) {
        console.error(`   ❌ Error searching with query "${baseQuery}":`, error.message);
        errors++;
      }
    }

    console.log(`\n✅ Tools discovery complete:`);
    console.log(`   Discovered: ${discovered}`);
    console.log(`   Saved: ${saved}`);
    console.log(`   Skipped: ${skipped}`);
    console.log(`   Errors: ${errors}`);

    return { discovered, saved, skipped, errors };
  } catch (error: any) {
    console.error('❌ Fatal error in tools discovery:', error);
    throw error;
  }
}
