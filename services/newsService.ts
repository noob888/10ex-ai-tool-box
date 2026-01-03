// News fetching service - aggregates AI news using AI agent with search grounding
import { NewsRepository, NewsArticle } from '@/database/repositories/news.repository';
import { fetchAINewsWithAgent } from './aiNewsAgent';

interface RSSFeed {
  url: string;
  source: string;
  category?: string;
}

// Popular AI news RSS feeds
const RSS_FEEDS: RSSFeed[] = [
  {
    url: 'https://feeds.feedburner.com/oreilly/radar',
    source: 'O\'Reilly Radar',
    category: 'AI',
  },
  {
    url: 'https://www.theverge.com/ai-artificial-intelligence/rss/index.xml',
    source: 'The Verge - AI',
    category: 'AI',
  },
  {
    url: 'https://techcrunch.com/tag/artificial-intelligence/feed/',
    source: 'TechCrunch - AI',
    category: 'AI',
  },
  {
    url: 'https://venturebeat.com/ai/feed/',
    source: 'VentureBeat - AI',
    category: 'AI',
  },
  {
    url: 'https://www.wired.com/feed/tag/artificial-intelligence/rss',
    source: 'Wired - AI',
    category: 'AI',
  },
  {
    url: 'https://www.artificialintelligence-news.com/feed/',
    source: 'AI News',
    category: 'AI',
  },
];

interface RSSItem {
  title: string;
  link: string;
  pubDate?: string;
  content?: string;
  contentSnippet?: string;
  'content:encoded'?: string;
  enclosure?: {
    url: string;
    type: string;
  };
  'media:content'?: {
    url: string;
  };
  author?: string;
}

/**
 * Fetch and parse RSS feed
 */
async function fetchRSSFeed(feedUrl: string): Promise<RSSItem[]> {
  try {
    // Use Next.js API route as proxy to avoid CORS issues
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/news/fetch-rss?url=${encodeURIComponent(feedUrl)}`, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch RSS: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.items || [];
  } catch (error) {
    console.error(`Error fetching RSS feed ${feedUrl}:`, error);
    return [];
  }
}

/**
 * Extract image URL from RSS item
 */
function extractImageUrl(item: RSSItem): string | null {
  // Try different image sources
  if (item.enclosure?.type?.startsWith('image/')) {
    return item.enclosure.url;
  }
  if (item['media:content']?.url) {
    return item['media:content'].url;
  }
  
  // Try to extract from content
  const content = item['content:encoded'] || item.content || '';
  const imgMatch = content.match(/<img[^>]+src="([^"]+)"/i);
  if (imgMatch) {
    return imgMatch[1];
  }
  
  return null;
}

/**
 * Extract description from RSS item
 */
function extractDescription(item: RSSItem): string {
  const description = item.contentSnippet || item.content || '';
  // Remove HTML tags and limit length
  const text = description.replace(/<[^>]*>/g, '').trim();
  return text.substring(0, 300);
}

/**
 * Extract tags from title and description
 */
function extractTags(title: string, description: string): string[] {
  const text = `${title} ${description}`.toLowerCase();
  const aiKeywords = [
    'ai', 'artificial intelligence', 'machine learning', 'ml', 'deep learning',
    'neural network', 'llm', 'gpt', 'chatgpt', 'claude', 'openai', 'anthropic',
    'generative ai', 'genai', 'computer vision', 'nlp', 'natural language',
    'automation', 'robotics', 'algorithm', 'data science', 'big data'
  ];
  
  const foundTags: string[] = [];
  aiKeywords.forEach(keyword => {
    if (text.includes(keyword)) {
      foundTags.push(keyword);
    }
  });
  
  return foundTags.slice(0, 5); // Limit to 5 tags
}

/**
 * Fetch all news using AI agent with search grounding
 * This replaces RSS feeds with AI-powered search for more reliable results
 */
export async function fetchAndSaveNews(): Promise<{ fetched: number; saved: number; errors: number }> {
  try {
    // Use AI agent with search grounding instead of RSS feeds
    return await fetchAINewsWithAgent();
  } catch (error) {
    console.error('Error fetching news with AI agent:', error);
    // Fallback: return empty result if AI agent fails
    return { fetched: 0, saved: 0, errors: 1 };
  }
}

/**
 * Get latest news articles
 */
export async function getLatestNews(limit: number = 10, featured?: boolean): Promise<NewsArticle[]> {
  const newsRepo = new NewsRepository();
  return newsRepo.findAll({ limit, featured });
}

