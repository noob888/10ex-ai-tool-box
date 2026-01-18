import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SEOSection } from '@/components/SEOPages';
import { ToolsRepository } from '@/database/repositories/tools.repository';
import { SEOPagesRepository } from '@/database/repositories/seoPages.repository';
import { Category } from '@/types';

type Props = {
  params: Promise<{ slug: string }>;
};

// Map slugs to keywords
const slugToKeyword: Record<string, string> = {
  'top-chatgpt-alternatives-in-2026': 'Top ChatGPT Alternatives in 2026',
  'best-ai-writing-tools-2026': 'Best AI Writing Tools 2026',
  'free-ai-tools-for-startups': 'Free AI Tools for Startups',
  'best-ai-tools-comparison': 'Best AI Tools Comparison',
  'ai-design-tools-for-creators': 'AI Design Tools for Creators',
  'best-ai-coding-tools-2026': 'Best AI Coding Tools 2026',
  'ai-video-generation-tools': 'AI Video Generation Tools',
  'ai-marketing-tools-for-business': 'AI Marketing Tools for Business',
  'ai-research-tools-2026': 'AI Research Tools 2026',
  'ai-sales-tools-outreach': 'AI Sales Tools & Outreach',
  'ai-productivity-tools': 'AI Productivity Tools',
  'ai-automation-tools': 'AI Automation Tools',
};

/**
 * Get category from keyword (for optimized queries)
 */
function getCategoryFromKeyword(keyword: string): Category | null {
  const lowerKeyword = keyword.toLowerCase();
  
  if (lowerKeyword.includes('chatgpt alternative') || lowerKeyword.includes('chatgpt alternatives') || lowerKeyword.includes('writing tool')) {
    return Category.WRITING;
  } else if (lowerKeyword.includes('design tool')) {
    return Category.DESIGN;
  } else if (lowerKeyword.includes('coding tool')) {
    return Category.CODING;
  } else if (lowerKeyword.includes('video tool')) {
    return Category.VIDEO;
  } else if (lowerKeyword.includes('marketing tool')) {
    return Category.MARKETING;
  } else if (lowerKeyword.includes('research tool')) {
    return Category.RESEARCH;
  } else if (lowerKeyword.includes('sales tool')) {
    return Category.SALES;
  } else if (lowerKeyword.includes('productivity tool')) {
    return Category.PRODUCTIVITY;
  } else if (lowerKeyword.includes('automation tool')) {
    return Category.AUTOMATION;
  }
  
  return null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://tools.10ex.ai';
  
  // Check if this is a dynamically generated SEO page
  const seoPagesRepo = new SEOPagesRepository();
  const seoPage = await seoPagesRepo.findBySlug(slug);
  
  let keyword: string;
  let title: string;
  let description: string;
  let featuredImage: string | null = null;
  
  if (seoPage && seoPage.isPublished) {
    keyword = seoPage.keyword;
    title = seoPage.title;
    description = seoPage.metaDescription || `Discover the best ${seoPage.keyword.toLowerCase()} in 2026. Comprehensive guide with reviews and recommendations.`;
    featuredImage = seoPage.featuredImageUrl;
  } else {
    keyword = slugToKeyword[slug] || slug.replace(/-/g, ' ');
    title = `Best ${keyword} for 2026`;
    description = `Discover the best ${keyword.toLowerCase()} in 2026. We've audited 600+ AI tools to bring you the top performing options based on latency, output quality, and cost-efficiency.`;
  }
  
  return {
    title,
    description,
    keywords: [
      keyword,
      'AI tools',
      'best AI tools 2026',
      'AI tool comparison',
      'AI tool reviews',
      ...(seoPage?.targetKeywords || []),
    ],
    openGraph: {
      title,
      description,
      type: 'website',
      url: `${baseUrl}/seo/${slug}`,
      images: featuredImage ? [
        {
          url: featuredImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: featuredImage ? [featuredImage] : undefined,
    },
    alternates: {
      canonical: seoPage?.canonicalUrl || `${baseUrl}/seo/${slug}`,
    },
  };
}

export default async function SEOPage({ params }: Props) {
  const { slug } = await params;
  
  // Validate slug - return 404 for invalid slugs
  if (!slug.match(/^[a-z0-9-]+$/)) {
    notFound();
  }
  
  // First, check if this is a dynamically generated SEO page
  const seoPagesRepo = new SEOPagesRepository();
  const seoPage = await seoPagesRepo.findBySlug(slug);
  
  let keyword: string;
  let filteredTools: any[];
  
  const toolsRepo = new ToolsRepository();
  const MAX_TOOLS = 10; // Limit to top 10 tools for SEO pages

  if (seoPage && seoPage.isPublished) {
    // Use dynamically generated page
    keyword = seoPage.keyword;
    
    // Optimize: Query only the related tools by IDs (don't load all tools)
    if (seoPage.relatedToolIds && seoPage.relatedToolIds.length > 0) {
      filteredTools = await toolsRepo.findByIds(seoPage.relatedToolIds);
      // Limit to top 100
      filteredTools = filteredTools.slice(0, MAX_TOOLS);
    } else {
      // Fallback: Query by category if available
      const category = getCategoryFromKeyword(keyword);
      if (category) {
        filteredTools = await toolsRepo.findAll({ category, limit: MAX_TOOLS });
      } else {
        // Last resort: Search with limit
        filteredTools = await toolsRepo.findAll({ search: keyword, limit: MAX_TOOLS });
      }
    }
  } else {
    // Fall back to static keyword mapping
    if (!slugToKeyword[slug]) {
      // If not in static mapping, try to generate keyword from slug
      keyword = slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    } else {
      keyword = slugToKeyword[slug];
    }
    
    // Optimize: Query by category or search with limit
    const category = getCategoryFromKeyword(keyword);
    if (category) {
      filteredTools = await toolsRepo.findAll({ category, limit: MAX_TOOLS });
    } else if (keyword.toLowerCase().includes('free')) {
      // For "free tools", we need to search all tools but with limit
      filteredTools = await toolsRepo.findAll({ limit: MAX_TOOLS });
      filteredTools = filteredTools.filter(t => t.pricing === 'Free').slice(0, MAX_TOOLS);
    } else {
      // Search with limit
      filteredTools = await toolsRepo.findAll({ search: keyword, limit: MAX_TOOLS });
    }
    
    // Return 404 if no tools found
    if (filteredTools.length === 0) {
      notFound();
    }
  }

  // Generate structured data (use from DB if available, otherwise generate)
  const structuredData = seoPage?.structuredData || {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": `Best ${keyword} for 2026`,
    "description": `Comprehensive list of the best ${keyword.toLowerCase()} in 2026`,
    "mainEntity": {
      "@type": "ItemList",
      "numberOfItems": filteredTools.length,
      "itemListElement": filteredTools.slice(0, 10).map((tool, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "item": {
          "@type": "SoftwareApplication",
          "name": tool.name,
          "description": tool.tagline,
          "url": `${process.env.NEXT_PUBLIC_SITE_URL || 'https://tools.10ex.ai'}/tool/${tool.id}`,
        },
      })),
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData),
        }}
      />
      <div className="min-h-screen pt-20 pb-16 px-4">
        <SEOSection
          keyword={keyword}
          alternatives={filteredTools}
          featuredImageUrl={seoPage?.featuredImageUrl || null}
          introduction={seoPage?.introduction || null}
          sections={seoPage?.sections || undefined}
        />
      </div>
    </>
  );
}

