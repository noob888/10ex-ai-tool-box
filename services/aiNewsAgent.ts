// AI News Agent - Uses Google Gemini with search grounding to fetch latest AI news
import { GoogleGenAI } from "@google/genai";
import { NewsRepository, NewsArticle } from '@/database/repositories/news.repository';

interface NewsSearchResult {
  title: string;
  url: string;
  snippet: string;
  source: string;
  publishedDate?: string;
  imageUrl?: string;
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

async function searchAINews(query: string, maxResults: number = 10): Promise<NewsSearchResult[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    // Get current date for context
    const today = new Date();
    const currentDate = today.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    const dateStr = today.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    // Use Gemini with search grounding to find latest AI news
    const prompt = `Search for latest AI news articles from the past 24-48 hours.

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
    
    // Use Gemini with search grounding to find real news articles
    const response = await retryWithBackoff(async () => {
      return await ai.models.generateContent({
        model: "gemini-2.0-flash-exp",
        contents: prompt,
        config: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,
        },
        tools: [{
          googleSearchRetrieval: {
            dynamicRetrievalConfig: {
              mode: 'MODE_DYNAMIC',
              dynamicThreshold: 0.3,
            },
          },
        }],
      } as any);
    }, 3, 8000); // 3 retries, 8 second initial delay (to stay under 10 req/min)

    const text = response.text || '';
    
    // Try to extract JSON from response
    let jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      // Try to find JSON in code blocks
      jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/```\s*([\s\S]*?)\s*```/);
    }

    if (jsonMatch) {
      try {
        const results = JSON.parse(jsonMatch[0] || jsonMatch[1] || '[]');
        return Array.isArray(results) ? results.slice(0, maxResults) : [];
      } catch (parseError) {
        console.error('Error parsing JSON from Gemini:', parseError);
        // Fallback: try to extract structured data manually
        return extractNewsFromText(text);
      }
    }

    // Fallback: extract news from unstructured text
    return extractNewsFromText(text);
  } catch (error) {
    console.error('Error searching AI news:', error);
    throw error;
  }
}

/**
 * Fallback: Extract news from unstructured text response
 */
function extractNewsFromText(text: string): NewsSearchResult[] {
  const results: NewsSearchResult[] = [];
  
  // Try to find article patterns in the text
  const lines = text.split('\n').filter(line => line.trim());
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Look for URLs
    const urlMatch = line.match(/https?:\/\/[^\s\)]+/);
    if (urlMatch) {
      const rawUrl = urlMatch[0];
      
      // Validate and clean URL
      const url = validateAndCleanUrl(rawUrl);
      if (!url) {
        continue; // Skip invalid URLs
      }
      
      const title = lines[i - 1] || line.substring(0, 100);
      const source = extractSourceFromUrl(url);
      
      results.push({
        title: title.replace(rawUrl, '').trim() || 'AI News Article',
        url: url,
        snippet: lines[i + 1] || 'Latest AI news article',
        source: source,
      });
    }
  }
  
  return results.slice(0, 10);
}

/**
 * Check if URL is accessible (doesn't return 404)
 * Uses HEAD request with timeout to avoid blocking
 */
async function checkUrlAccessible(url: string, timeoutMs: number = 5000): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(url, {
      method: 'HEAD', // HEAD is faster than GET
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AI-News-Bot/1.0)',
      },
      redirect: 'follow', // Follow redirects
    });

    clearTimeout(timeoutId);

    // Consider 2xx and 3xx as accessible (not 404)
    // 404 = not found, 403 = forbidden (might be real but blocked), 5xx = server error
    const isAccessible = response.status >= 200 && response.status < 400;
    
    if (!isAccessible) {
      console.log(`   ⚠ URL returned ${response.status}: ${url.substring(0, 60)}...`);
    }
    
    return isAccessible;
  } catch (error: any) {
    // Timeout, network error, or other fetch error
    if (error.name === 'AbortError') {
      console.log(`   ⚠ URL check timeout: ${url.substring(0, 60)}...`);
    } else {
      console.log(`   ⚠ URL check failed: ${url.substring(0, 60)}... (${error.message || 'Unknown error'})`);
    }
    // On error, we'll still accept the URL (fail open) to avoid blocking valid URLs
    // that might have temporary network issues
    return true; // Fail open - assume accessible if we can't check
  }
}

/**
 * Validate and clean URL
 */
function validateAndCleanUrl(url: string): string | null {
  if (!url || typeof url !== 'string') {
    return null;
  }

  // Remove whitespace
  url = url.trim();

  // Remove trailing punctuation that might have been included
  url = url.replace(/[.,;:!?]+$/, '');

  // Remove parentheses and brackets from end
  url = url.replace(/[)\]}]$/, '');

  // Skip if URL is too short or looks invalid
  if (url.length < 10 || !url.includes('.')) {
    return null;
  }

  // Add protocol if missing
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }

  try {
    const urlObj = new URL(url);
    
    // Validate URL structure
    if (!urlObj.hostname || urlObj.hostname.length < 3) {
      return null;
    }

    // Reject common placeholder/fake URLs and search result pages
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

    // Reject search result pages and non-article URLs
    const pathname = urlObj.pathname.toLowerCase();
    const searchParams = urlObj.search.toLowerCase();
    if (
      pathname.includes('/search') ||
      pathname.includes('/results') ||
      searchParams.includes('q=') ||
      searchParams.includes('query=') ||
      pathname.includes('/watch') ||
      pathname.includes('/channel')
    ) {
      return null;
    }

    // Return cleaned URL
    return urlObj.toString();
  } catch (error) {
    // Invalid URL format
    return null;
  }
}

/**
 * Extract source name from URL
 */
function extractSourceFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname;
    // Remove www. and common TLDs, get main domain
    const source = domain.replace(/^www\./, '').split('.')[0];
    return source.charAt(0).toUpperCase() + source.slice(1);
  } catch {
    return 'AI News';
  }
}

/**
 * Retry a database operation with exponential backoff
 * MAX 3 retries total (1 initial + 2 retries)
 */
async function retryDbOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      
      // Don't retry on certain errors (fatal errors)
      if (
        error?.code === '42P01' || 
        error?.message?.includes('does not exist') ||
        error?.message?.includes('malformed array') ||
        error?.message?.includes('syntax error') ||
        error?.code === '23505' || // Unique constraint violation
        error?.message?.includes('duplicate key') ||
        error?.message?.includes('unique constraint')
      ) {
        console.error(`Fatal error (not retrying):`, error?.message || error);
        throw error; // Don't retry fatal errors
      }
      
      // Only retry if we haven't reached max retries
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt - 1);
        console.log(`Database operation failed (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        // Max retries reached, throw the error
        console.error(`Max retries (${maxRetries}) reached. Last error:`, error?.message || error);
        throw error;
      }
    }
  }
  
  // This should never be reached, but just in case
  throw lastError || new Error('Unknown error in retry operation');
}

/**
 * Fetch latest AI news using AI agent with search grounding
 */
export async function fetchAINewsWithAgent(): Promise<{ fetched: number; saved: number; errors: number }> {
  const newsRepo = new NewsRepository();
  let fetched = 0;
  let saved = 0;
  let errors = 0;

  // Test database connection first
  try {
    console.log('Testing database connection...');
    await retryDbOperation(async () => {
      const testArticle = await newsRepo.findAll({ limit: 1 });
      return testArticle;
    }, 2, 500);
    console.log('✓ Database connection successful');
  } catch (error: any) {
    console.error('✗ Database connection failed:', error?.message || error);
    throw new Error(`Database connection failed: ${error?.message || 'Unknown error'}`);
  }

  // Get current date for better search results
  const today = new Date();
  const currentDate = today.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  const currentYear = today.getFullYear();
  const currentMonth = today.toLocaleDateString('en-US', { month: 'long' });
  
  // Search queries for different AI news topics with dynamic dates
  const searchQueries = [
    `latest AI news ${currentYear} ${currentMonth}`,
    `artificial intelligence breakthroughs ${currentDate}`,
    `AI tools and startups ${currentYear}`,
    `machine learning research ${currentMonth} ${currentYear}`,
    `ChatGPT alternatives and AI models ${currentDate}`,
    `AI industry news ${currentDate}`,
    `generative AI updates ${currentMonth} ${currentYear}`,
  ];

  try {
    for (let i = 0; i < searchQueries.length; i++) {
      const query = searchQueries[i];
      try {
        console.log(`\n🔍 Searching for: ${query}`);
        
        // Add delay between requests to avoid rate limits (10 req/min = 6 seconds between requests)
        // Add extra buffer for safety
        if (i > 0) {
          const delayMs = 7000; // 7 seconds between requests
          console.log(`   ⏳ Waiting ${delayMs/1000}s to avoid rate limits...`);
          await sleep(delayMs);
        }
        
        const results = await searchAINews(query, 5);
        fetched += results.length;
        console.log(`   Found ${results.length} articles`);

        for (const result of results) {
          try {
            // Skip if no title or source
            if (!result.title || !result.source) {
              console.log(`   ⊘ Skipping: Missing title or source`);
              continue;
            }

            // Handle URL - construct from source if not provided or invalid
            let finalUrl: string | null = null;
            
            if (result.url) {
              // Validate and clean URL if provided
              const cleanedUrl = validateAndCleanUrl(result.url);
              if (cleanedUrl) {
                // Check if URL is accessible (doesn't return 404)
                const isAccessible = await checkUrlAccessible(cleanedUrl, 5000); // 5 second timeout
                if (isAccessible) {
                  finalUrl = cleanedUrl;
                } else {
                  console.log(`   ⚠ URL not accessible, will use source citation: ${cleanedUrl.substring(0, 60)}...`);
                }
              }
            }
            
            // If no valid URL, construct a basic URL from source (for citation purposes)
            // This won't be used for actual linking, just for reference
            if (!finalUrl && result.source) {
              // Create a placeholder URL based on source domain
              const sourceDomain = result.source.toLowerCase()
                .replace(/\s+/g, '')
                .replace(/[^a-z0-9]/g, '');
              finalUrl = `https://${sourceDomain}.com/article`; // Placeholder for citation
            }

            // Check if article already exists (with retry) - use title + source for deduplication
            let existing = null;
            if (finalUrl) {
              try {
                existing = await retryDbOperation(
                  () => newsRepo.findByUrl(finalUrl!),
                  2,
                  500
                );
              } catch (dbError: any) {
                if (dbError?.code === '42P01' || dbError?.message?.includes('does not exist')) {
                  console.error(`✗ News table does not exist. Please run migration.`);
                  throw dbError;
                }
                console.warn(`⚠ Database error checking URL:`, dbError?.message || dbError);
                // Continue anyway, will try to save
              }
            }
            
            // Also check by title + source for better deduplication
            if (!existing && result.title && result.source) {
              try {
                const allArticles = await retryDbOperation(
                  () => newsRepo.findAll({ limit: 1000 }),
                  1,
                  500
                );
                existing = allArticles.find(
                  a => a.title.toLowerCase() === result.title.toLowerCase() && 
                       a.source.toLowerCase() === result.source.toLowerCase()
                );
              } catch (dbError: any) {
                // Ignore errors, continue
              }
            }
            
            if (existing) {
              console.log(`   ⊘ Skipping duplicate: ${result.title.substring(0, 50)}...`);
              continue; // Skip duplicates
            }

            // Parse published date
            let publishedAt = new Date();
            if (result.publishedDate) {
              const parsed = new Date(result.publishedDate);
              if (!isNaN(parsed.getTime())) {
                publishedAt = parsed;
              }
            }

            // Only save articles from last 7 days
            const daysSincePublished = (Date.now() - publishedAt.getTime()) / (1000 * 60 * 60 * 24);
            if (daysSincePublished > 7) {
              console.log(`   ⊘ Skipping old article (${Math.round(daysSincePublished)} days old): ${result.title.substring(0, 50)}...`);
              continue;
            }

            // Extract tags from title and snippet
            const text = `${result.title} ${result.snippet}`.toLowerCase();
            const tags = extractTags(text);

            // Create news article (id is optional, will be generated by repository)
            const article = {
              title: result.title.trim(),
              description: result.snippet || null,
              url: finalUrl || `https://${result.source.toLowerCase().replace(/\s+/g, '')}.com`, // Use source-based URL if none provided
              source: result.source || 'AI News',
              author: null,
              imageUrl: result.imageUrl || null,
              publishedAt,
              category: 'AI',
              tags,
              isFeatured: false,
            } as Omit<NewsArticle, 'createdAt' | 'updatedAt' | 'fetchedAt' | 'viewCount'>;

            // Save article with retry mechanism (MAX 3 attempts total)
            try {
              await retryDbOperation(
                () => newsRepo.upsert(article),
                3, // Max 3 attempts: 1 initial + 2 retries
                1000
              );
              saved++;
              console.log(`   ✓ Saved: ${result.title.substring(0, 60)}...`);
            } catch (saveError: any) {
              // Handle duplicate key errors gracefully - they're not really errors if URL already exists
              if (saveError?.code === '23505' || saveError?.message?.includes('duplicate key') || saveError?.message?.includes('unique constraint')) {
                console.log(`   ⊘ Skipping duplicate: ${result.title.substring(0, 50)}...`);
                // Don't count as error - it's just a duplicate
              } else {
                // Don't retry again - retryDbOperation already handled retries
                console.error(`   ✗ Failed to save "${result.title.substring(0, 50)}...":`, saveError?.message || saveError);
                errors++;
              }
              // Continue to next article instead of retrying
            }
          } catch (error) {
            console.error(`   ✗ Error processing article ${result.url}:`, error);
            errors++;
          }
        }

        // Small delay between queries to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`✗ Error processing query "${query}":`, error);
        errors++;
      }
    }

    // Mark top articles as featured (with retry)
    try {
      console.log('\n⭐ Marking top articles as featured...');
      const recentArticles = await retryDbOperation(
        () => newsRepo.findAll({ limit: 10, featured: false }),
        2,
        1000
      );
      
      if (recentArticles.length > 0) {
        // Mark top 3 as featured
        for (let i = 0; i < Math.min(3, recentArticles.length); i++) {
          try {
            await retryDbOperation(
              () => newsRepo.setFeatured(recentArticles[i].id, true),
              2,
              500
            );
            console.log(`   ✓ Featured: ${recentArticles[i].title.substring(0, 50)}...`);
          } catch (err: any) {
            console.warn(`   ⚠ Failed to set featured for article ${recentArticles[i].id}:`, err?.message || err);
          }
        }
      }
    } catch (error: any) {
      console.warn('⚠ Error setting featured articles:', error?.message || error);
    }

    console.log(`\n📊 Summary: Fetched ${fetched}, Saved ${saved}, Errors ${errors}`);
    return { fetched, saved, errors };
  } catch (error) {
    console.error('Error in AI news agent:', error);
    throw error;
  }
}

/**
 * Extract relevant tags from text
 */
function extractTags(text: string): string[] {
  const aiKeywords = [
    'ai', 'artificial intelligence', 'machine learning', 'ml', 'deep learning',
    'neural network', 'llm', 'gpt', 'chatgpt', 'claude', 'openai', 'anthropic',
    'generative ai', 'genai', 'computer vision', 'nlp', 'natural language',
    'automation', 'robotics', 'algorithm', 'data science', 'big data',
    'transformer', 'diffusion', 'reinforcement learning', 'nlp'
  ];
  
  const foundTags: string[] = [];
  aiKeywords.forEach(keyword => {
    if (text.includes(keyword)) {
      foundTags.push(keyword);
    }
  });
  
  return foundTags.slice(0, 5);
}

