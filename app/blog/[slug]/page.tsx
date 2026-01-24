import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SEOSection } from '@/components/SEOPages';
import { ToolsRepository } from '@/database/repositories/tools.repository';
import { SEOPagesRepository } from '@/database/repositories/seoPages.repository';
import { Category } from '@/types';
import { Breadcrumbs } from '@/components/Breadcrumbs';

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
      url: `${baseUrl}/blog/${slug}`,
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
      canonical: seoPage?.canonicalUrl || `${baseUrl}/blog/${slug}`,
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
  let relatedToolIds: string[] = [];
  let category: Category | null = null;
  
  if (seoPage && seoPage.isPublished) {
    // Use dynamically generated page
    keyword = seoPage.keyword;
    relatedToolIds = seoPage.relatedToolIds || [];
  } else {
    // Fall back to static keyword mapping
    if (!slugToKeyword[slug]) {
      // If not in static mapping, try to generate keyword from slug
      keyword = slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    } else {
      keyword = slugToKeyword[slug];
    }
    category = getCategoryFromKeyword(keyword);
  }
  
  // Get minimal tool data for structured data only (max 10)
  const toolsRepo = new ToolsRepository();
  let structuredDataTools: any[] = [];
  
  try {
    if (relatedToolIds.length > 0) {
      structuredDataTools = await toolsRepo.findByIds(relatedToolIds.slice(0, 10));
    } else if (category) {
      structuredDataTools = await toolsRepo.findAll({ category, limit: 10 });
    } else {
      structuredDataTools = await toolsRepo.findAll({ search: keyword, limit: 10 });
    }
  } catch (error) {
    console.warn('Error fetching tools for structured data:', error);
    // Continue without structured data tools
  }

  // Generate Article schema for blog post
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://tools.10ex.ai';
  const articleData = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": seoPage?.title || `Best ${keyword} for 2026`,
    "description": seoPage?.metaDescription || `Discover the best ${keyword.toLowerCase()} in 2026. Comprehensive guide with reviews and recommendations.`,
    "url": `${baseUrl}/blog/${slug}`,
    "datePublished": seoPage?.createdAt ? new Date(seoPage.createdAt).toISOString() : new Date().toISOString(),
    "dateModified": seoPage?.updatedAt ? new Date(seoPage.updatedAt).toISOString() : new Date().toISOString(),
    "author": {
      "@type": "Organization",
      "name": "10ex AI Toolbox",
      "url": baseUrl,
    },
    "publisher": {
      "@type": "Organization",
      "name": "10ex AI Toolbox",
      "url": baseUrl,
    },
    ...(seoPage?.featuredImageUrl && {
      "image": {
        "@type": "ImageObject",
        "url": seoPage.featuredImageUrl,
        "width": 1200,
        "height": 630,
      },
    }),
  };

  // Generate structured data (use from DB if available, otherwise generate)
  const structuredData = seoPage?.structuredData || {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": `Best ${keyword} for 2026`,
    "description": `Comprehensive list of the best ${keyword.toLowerCase()} in 2026`,
    "mainEntity": {
      "@type": "ItemList",
      "numberOfItems": structuredDataTools.length,
      "itemListElement": structuredDataTools.slice(0, 10).map((tool, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "item": {
          "@type": "SoftwareApplication",
          "name": tool.name,
          "description": tool.tagline,
          "url": `${baseUrl}/tool/${tool.id}`,
        },
      })),
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(articleData),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData),
        }}
      />
      <div className="min-h-screen pt-20 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          <Breadcrumbs
            items={[
              { label: 'Blog', href: '/blog' },
              { label: keyword },
            ]}
          />
          <SEOSection
            keyword={keyword}
            relatedToolIds={relatedToolIds.length > 0 ? relatedToolIds.slice(0, 10) : undefined}
            category={category || undefined}
            featuredImageUrl={seoPage?.featuredImageUrl || null}
            introduction={seoPage?.introduction || null}
            sections={seoPage?.sections || undefined}
          />
        </div>
      </div>
    </>
  );
}

