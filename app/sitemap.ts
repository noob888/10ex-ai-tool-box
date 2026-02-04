import { MetadataRoute } from 'next';
import { ToolsRepository } from '@/database/repositories/tools.repository';
import { PromptsRepository } from '@/database/repositories/prompts.repository';
import { SEOPagesRepository } from '@/database/repositories/seoPages.repository';
import { getDatabasePool } from '@/database/connection';

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
      url: `${baseUrl}/ai-agents`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/ai-agents/email-template-generator`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/ai-agents/lead-magnet-generator`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
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
    {
      url: `${baseUrl}/news`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/free-ai-tools`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/new-ai-tools`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    // Best AI for X pages
    {
      url: `${baseUrl}/best-ai-for/writing`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/best-ai-for/coding`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/best-ai-for/design`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/best-ai-for/marketing`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/best-ai-for/productivity`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/best-ai-for/research`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/best-ai-for/video`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/best-ai-for/sales`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/best-ai-for/automation`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
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
      url: `${baseUrl}/blog/${keyword}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    });
  });

  // Add dynamically generated SEO pages if database is available
  try {
    if (process.env.DATABASE_URL) {
      const pool = getDatabasePool();
      // Test connection with a timeout
      const client = await Promise.race([
        pool.connect(),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Database connection timeout')), 5000))
      ]) as any;
      
      if (client && typeof client.release === 'function') {
        try {
          const seoPagesRepo = new SEOPagesRepository();
          const seoPages = await Promise.race([
            seoPagesRepo.findAll({ published: true, limit: 100 }),
            new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Database query timeout')), 10000))
          ]) as any[];
          
          seoPages.forEach(page => {
                routes.push({
                  url: `${baseUrl}/blog/${page.slug}`,
                  lastModified: new Date(page.updatedAt || page.createdAt),
                  changeFrequency: 'weekly',
                  priority: 0.8,
                });
          });
        } finally {
          if (client && typeof client.release === 'function') {
            client.release();
          }
        }
      }
    }
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error generating SEO pages sitemap entries:', error);
    } else {
      console.warn('Sitemap: SEO pages database access failed during build, skipping dynamic SEO pages.');
    }
  }

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

