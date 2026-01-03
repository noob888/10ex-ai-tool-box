import { MetadataRoute } from 'next';
import { ToolsRepository } from '@/database/repositories/tools.repository';
import { PromptsRepository } from '@/database/repositories/prompts.repository';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://tools.10ex.ai';
  
  const routes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/trending`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/leaderboards`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/stack`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/prompts`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
  ];

  // Add SEO pages
  const seoKeywords = [
    'top-chatgpt-alternatives-in-2026',
    'best-ai-writing-tools-2026',
    'free-ai-tools-for-startups',
    'best-ai-tools-comparison',
    'ai-design-tools-for-creators',
    'best-ai-coding-tools-2026',
    'ai-video-generation-tools',
    'ai-marketing-tools-for-business',
    'ai-research-tools-2026',
    'ai-sales-tools-outreach',
    'ai-productivity-tools',
    'ai-automation-tools',
  ];

  seoKeywords.forEach(keyword => {
    routes.push({
      url: `${baseUrl}/seo/${keyword}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    });
  });

  // Add individual tool pages if database is available
  // Skip during build if database is not accessible (sitemap will be generated dynamically at runtime)
  try {
    if (process.env.DATABASE_URL) {
      // Use Promise.race to add a timeout for database queries during build
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database query timeout')), 5000)
      );
      
      const toolsRepo = new ToolsRepository();
      const toolsPromise = toolsRepo.findAll({ limit: 1000 });
      
      const tools = await Promise.race([toolsPromise, timeoutPromise]) as any[];
      
      if (tools && Array.isArray(tools)) {
        tools.forEach(tool => {
          routes.push({
            url: `${baseUrl}/tool/${tool.id}`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.6,
          });
        });
      }
    }
  } catch (error) {
    // Silently fail during build - sitemap will be generated dynamically at runtime
    // Only log in development
    if (process.env.NODE_ENV === 'development') {
      console.warn('Skipping tool sitemap entries (database not available during build):', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  return routes;
}

