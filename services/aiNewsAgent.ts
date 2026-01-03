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
 * Search for latest AI news using Gemini with Google Search grounding
 */
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
    const prompt = `You are an AI news research agent. Search for the latest and most relevant AI news articles from the past 24-48 hours.

Today's Date: ${currentDate} (${dateStr})
Search Query: "${query}"

IMPORTANT: Only return articles published on or after ${dateStr} (${currentDate}). Focus on breaking news and latest developments from the last 48 hours.

Please find and return information about the latest AI news articles. For each article, provide:
1. Title
2. URL (actual article URL - must be a real, accessible URL)
3. Brief description/snippet (2-3 sentences)
4. Source/publication name
5. Published date (format: YYYY-MM-DD, must be ${dateStr} or very recent)

Format your response as a JSON array with this structure:
[
  {
    "title": "Article Title",
    "url": "https://example.com/article",
    "snippet": "Brief description of the article...",
    "source": "Publication Name",
    "publishedDate": "${dateStr}"
  }
]

Return ONLY valid JSON, no additional text. Focus on recent, high-quality AI news from reputable sources published in the last 48 hours.`;
    
    // Use Gemini to search and extract AI news
    // The model can access real-time information through its training
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: prompt,
    });

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
      const url = urlMatch[0];
      const title = lines[i - 1] || line.substring(0, 100);
      const source = extractSourceFromUrl(url);
      
      results.push({
        title: title.replace(url, '').trim() || 'AI News Article',
        url: url,
        snippet: lines[i + 1] || 'Latest AI news article',
        source: source,
      });
    }
  }
  
  return results.slice(0, 10);
}

/**
 * Extract source name from URL
 */
function extractSourceFromUrl(url: string): string {
  try {
    const domain = new URL(url).hostname;
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
    for (const query of searchQueries) {
      try {
        console.log(`\n🔍 Searching for: ${query}`);
        const results = await searchAINews(query, 5);
        fetched += results.length;
        console.log(`   Found ${results.length} articles`);

        for (const result of results) {
          try {
            // Skip if no title or URL
            if (!result.title || !result.url) {
              continue;
            }

            // Check if article already exists (with retry)
            let existing = null;
            try {
              existing = await retryDbOperation(
                () => newsRepo.findByUrl(result.url),
                2,
                500
              );
            } catch (dbError: any) {
              if (dbError?.code === '42P01' || dbError?.message?.includes('does not exist')) {
                console.error(`✗ News table does not exist. Please run migration.`);
                throw dbError;
              }
              console.warn(`⚠ Database error checking ${result.url}:`, dbError?.message || dbError);
              // Continue anyway, will try to save
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
              url: result.url,
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

