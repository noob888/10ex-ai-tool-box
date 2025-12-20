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
    'top-chatgpt-alternatives-in-2025',
    'best-ai-writing-tools-2025',
    'free-ai-tools-for-startups',
    'best-ai-tools-comparison',
    'ai-design-tools-for-creators',
    'best-ai-coding-tools-2025',
    'ai-video-generation-tools',
    'ai-marketing-tools-for-business',
    'ai-research-tools-2025',
    'ai-sales-tools-outreach',
    'ai-productivity-tools',
    'ai-automation-tools',
  ];

  seoKeywords.forEach(keyword => {
    routes.push({
      url: `${baseUrl}/?q=${keyword}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    });
  });

  // Add individual tool pages if database is available
  try {
    if (process.env.DATABASE_URL) {
      const toolsRepo = new ToolsRepository();
      const tools = await toolsRepo.findAll({ limit: 1000 }); // Get top 1000 tools
      
      tools.forEach(tool => {
        routes.push({
          url: `${baseUrl}/tool/${tool.id}`,
          lastModified: new Date(),
          changeFrequency: 'monthly',
          priority: 0.6,
        });
      });
    }
  } catch (error) {
    console.error('Error generating tool sitemap entries:', error);
  }

  return routes;
}

