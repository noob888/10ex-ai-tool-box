// AI Prompts Discovery Agent - Uses Google Gemini with search grounding to discover best prompts
import { GoogleGenAI } from "@google/genai";
import { PromptsRepository } from '@/database/repositories/prompts.repository';
import { PromptTemplate, Category } from '@/types';

interface PromptSearchResult {
  title: string;
  category: string;
  useCase: string;
  prompt: string;
  level: string;
  source?: string;
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
        let retryAfter = delay;
        if (error?.retryDelay) {
          retryAfter = error.retryDelay;
        } else if (error?.details && Array.isArray(error.details)) {
          const retryInfo = error.details.find((d: any) => d['@type'] === 'type.googleapis.com/google.rpc.RetryInfo');
          if (retryInfo?.retryDelay) {
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
 * Generate a unique ID from prompt title
 */
function generatePromptId(title: string): string {
  let id = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 100);
  
  // Ensure ID is not empty (fallback to timestamp-based ID)
  if (!id || id.length === 0) {
    id = `prompt-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
  
  return id;
}

/**
 * Search for best prompts using Gemini with search grounding
 */
async function searchPrompts(query: string, maxResults: number = 15): Promise<PromptSearchResult[]> {
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

    const prompt = `You are a prompt discovery agent. Search for the best, most effective AI prompts that are currently popular, trending, or highly rated.

Today's Date: ${currentDate} (${dateStr})
Search Query: "${query}"

IMPORTANT REQUIREMENTS:
1. Focus on REAL, WORKING prompts that are currently being used successfully
2. Prompts should be practical and actionable (not theoretical)
3. Extract the COMPLETE prompt text (not truncated)
4. Prompts should be well-structured and effective
5. Include prompts from various sources: PromptBase, FlowGPT, GitHub, Reddit, Twitter, blogs
6. Prioritize prompts with high ratings, upvotes, or usage counts
7. Ensure prompts are appropriate and safe

For each prompt found, extract:
- Title (clear, descriptive name for the prompt, max 100 chars)
- Category (one of: Writing & Content, Research & Search, Sales & Outreach, Marketing & Ads, Design & Images, Video & Audio, Coding & Dev Tools, Data & Analytics, Automation & Agents, Customer Support, HR & Recruiting, Productivity & Knowledge, Founders & Startups, Enterprise & Ops)
- Use Case (brief description of what this prompt is used for, max 150 chars)
- Prompt (the complete, full prompt text - DO NOT truncate)
- Level (Beginner, Advanced, or Pro - based on complexity)
- Source (optional: where you found it, e.g., "PromptBase", "FlowGPT", "GitHub", "Reddit")

Return results as a JSON array:
[
  {
    "title": "Prompt Title",
    "category": "Writing & Content",
    "useCase": "Use case description",
    "prompt": "Complete prompt text here...",
    "level": "Beginner",
    "source": "PromptBase"
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
    let prompts: PromptSearchResult[] = [];
    try {
      // Try to extract JSON from markdown code blocks if present
      const jsonMatch = responseText.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : responseText.trim();
      prompts = JSON.parse(jsonStr);
      
      if (!Array.isArray(prompts)) {
        console.log('   ⚠ Response is not an array, attempting to wrap...');
        prompts = [prompts];
      }
    } catch (parseError) {
      console.log(`   ⚠ Failed to parse prompts JSON: ${parseError}`);
      return [];
    }

    // Validate and filter prompts
    return prompts
      .filter(p => p.title && p.prompt && p.category && p.useCase && p.level)
      .filter(p => p.prompt.length > 50) // Ensure prompt is substantial
      .slice(0, maxResults);
  } catch (error: any) {
    console.error(`   ❌ Error searching prompts: ${error.message}`);
    throw error;
  }
}

/**
 * Check if prompt already exists
 */
async function promptExists(title: string, promptText: string): Promise<boolean> {
  const repo = new PromptsRepository();
  const prompts = await repo.findAll({ search: title });
  
  // Check by title similarity and prompt text similarity
  return prompts.some(p => {
    const titleMatch = p.title.toLowerCase() === title.toLowerCase() ||
                     p.title.toLowerCase().includes(title.toLowerCase()) ||
                     title.toLowerCase().includes(p.title.toLowerCase());
    // Check if prompt text is very similar (80% match)
    const promptSimilarity = calculateSimilarity(p.prompt.toLowerCase(), promptText.toLowerCase());
    return titleMatch || promptSimilarity > 0.8;
  });
}

/**
 * Calculate simple string similarity (Jaccard-like)
 */
function calculateSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2 || str1.length === 0 || str2.length === 0) {
    return 0;
  }
  
  const words1 = new Set(str1.split(/\s+/).filter(w => w.length > 0));
  const words2 = new Set(str2.split(/\s+/).filter(w => w.length > 0));
  
  if (words1.size === 0 && words2.size === 0) {
    return 0;
  }
  
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  return union.size > 0 ? intersection.size / union.size : 0;
}

/**
 * Discover and save best prompts
 */
export async function discoverAndSavePrompts(): Promise<{
  discovered: number;
  saved: number;
  skipped: number;
  errors: number;
}> {
  console.log('🔍 Starting AI prompts discovery...');
  
  const repo = new PromptsRepository();
  const currentMonth = new Date().toLocaleString('en-US', { month: 'long' });
  const currentYear = new Date().getFullYear();
  
  const searchQueries = [
    // General trending prompts
    `best AI prompts ${currentMonth} ${currentYear}`,
    `trending ChatGPT prompts ${currentYear}`,
    `most popular AI prompts ${currentYear}`,
    'PromptBase trending prompts',
    'FlowGPT top prompts',
    'GitHub awesome prompts repository',
    'Reddit r/ChatGPT best prompts',
    'Reddit r/PromptEngineering top prompts',
    // Category-specific prompts
    'best AI prompts for writing content',
    'best AI prompts for coding',
    'best AI prompts for marketing',
    'best AI prompts for design',
    'best AI prompts for research',
    'best AI prompts for sales',
    'best AI prompts for automation',
    'best AI prompts for data analysis',
    // Use case specific
    'AI prompts for email writing',
    'AI prompts for social media',
    'AI prompts for code generation',
    'AI prompts for image generation',
    'AI prompts for customer support',
    'AI prompts for content strategy',
    'AI prompts for SEO',
    'AI prompts for product descriptions',
    // Advanced prompts
    'advanced prompt engineering techniques',
    'system prompts for AI assistants',
    'chain of thought prompts',
    'few-shot learning prompts',
  ];

  let discovered = 0;
  let saved = 0;
  let skipped = 0;
  let errors = 0;

  try {
    for (const baseQuery of searchQueries) {
      console.log(`\n📡 Searching: "${baseQuery}"...`);
      
      try {
        const prompts = await searchPrompts(baseQuery, 15);
        discovered += prompts.length;
        console.log(`   ✓ Found ${prompts.length} prompts`);

        for (const promptResult of prompts) {
          try {
            // Check if prompt already exists
            const exists = await promptExists(promptResult.title, promptResult.prompt);
            if (exists) {
              console.log(`   ⊘ Skipping duplicate: ${promptResult.title}`);
              skipped++;
              continue;
            }

            // Map category
            const category = promptResult.category as Category || Category.PRODUCTIVITY;
            
            // Map level
            const level = (promptResult.level === 'Beginner' || promptResult.level === 'Advanced' || promptResult.level === 'Pro')
              ? promptResult.level as 'Beginner' | 'Advanced' | 'Pro'
              : 'Beginner';

            // Create prompt object
            let promptId = generatePromptId(promptResult.title);
            
            // Double-check ID doesn't already exist with different title (handle edge case where different titles generate same ID)
            const existingPrompt = await repo.findById(promptId);
            if (existingPrompt && existingPrompt.title !== promptResult.title) {
              // ID collision - append timestamp to make it unique
              promptId = `${promptId}-${Date.now()}`;
              console.log(`   ⚠ ID collision detected, using unique ID: ${promptId}`);
            }
            
            const prompt: PromptTemplate = {
              id: promptId,
              title: promptResult.title,
              category,
              useCase: promptResult.useCase,
              prompt: promptResult.prompt,
              level,
              copyCount: 0,
            };

            // Save to database (upsert handles updates if same ID)
            await repo.upsert(prompt);
            console.log(`   ✓ Saved: ${promptResult.title} (${category})`);
            saved++;

            // Rate limiting: wait between prompts
            await sleep(2000);
          } catch (error: any) {
            console.error(`   ❌ Error processing prompt "${promptResult.title}":`, error.message);
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

    console.log(`\n✅ Prompts discovery complete:`);
    console.log(`   Discovered: ${discovered}`);
    console.log(`   Saved: ${saved}`);
    console.log(`   Skipped: ${skipped}`);
    console.log(`   Errors: ${errors}`);

    return { discovered, saved, skipped, errors };
  } catch (error: any) {
    console.error('❌ Fatal error in prompts discovery:', error);
    throw error;
  }
}
