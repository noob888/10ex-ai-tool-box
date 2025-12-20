import { Metadata } from 'next';
import { SEOSection } from '@/components/SEOPages';
import { ToolsRepository } from '@/database/repositories/tools.repository';
import { Category } from '@/types';

type Props = {
  params: Promise<{ slug: string }>;
};

// Map slugs to keywords
const slugToKeyword: Record<string, string> = {
  'top-chatgpt-alternatives-in-2025': 'Top ChatGPT Alternatives in 2025',
  'best-ai-writing-tools-2025': 'Best AI Writing Tools 2025',
  'free-ai-tools-for-startups': 'Free AI Tools for Startups',
  'best-ai-tools-comparison': 'Best AI Tools Comparison',
  'ai-design-tools-for-creators': 'AI Design Tools for Creators',
  'best-ai-coding-tools-2025': 'Best AI Coding Tools 2025',
  'ai-video-generation-tools': 'AI Video Generation Tools',
  'ai-marketing-tools-for-business': 'AI Marketing Tools for Business',
  'ai-research-tools-2025': 'AI Research Tools 2025',
  'ai-sales-tools-outreach': 'AI Sales Tools & Outreach',
  'ai-productivity-tools': 'AI Productivity Tools',
  'ai-automation-tools': 'AI Automation Tools',
};

function getFilteredToolsForSEO(keyword: string, allTools: any[]): any[] {
  const lowerKeyword = keyword.toLowerCase();
  
  if (lowerKeyword.includes('chatgpt alternative') || lowerKeyword.includes('chatgpt alternatives')) {
    const chatgpt = allTools.find(t => t.id === 'chatgpt' || t.name.toLowerCase().includes('chatgpt'));
    if (chatgpt) {
      return allTools
        .filter(t => t.category === chatgpt.category && t.id !== chatgpt.id)
        .sort((a, b) => b.rating - a.rating);
    }
    return allTools.filter(t => t.category === Category.WRITING).sort((a, b) => b.rating - a.rating);
  } else if (lowerKeyword.includes('writing tool')) {
    return allTools.filter(t => t.category === Category.WRITING).sort((a, b) => b.rating - a.rating);
  } else if (lowerKeyword.includes('design tool')) {
    return allTools.filter(t => t.category === Category.DESIGN).sort((a, b) => b.rating - a.rating);
  } else if (lowerKeyword.includes('coding tool')) {
    return allTools.filter(t => t.category === Category.CODING).sort((a, b) => b.rating - a.rating);
  } else if (lowerKeyword.includes('video tool')) {
    return allTools.filter(t => t.category === Category.VIDEO).sort((a, b) => b.rating - a.rating);
  } else if (lowerKeyword.includes('marketing tool')) {
    return allTools.filter(t => t.category === Category.MARKETING).sort((a, b) => b.rating - a.rating);
  } else if (lowerKeyword.includes('research tool')) {
    return allTools.filter(t => t.category === Category.RESEARCH).sort((a, b) => b.rating - a.rating);
  } else if (lowerKeyword.includes('sales tool')) {
    return allTools.filter(t => t.category === Category.SALES).sort((a, b) => b.rating - a.rating);
  } else if (lowerKeyword.includes('productivity tool')) {
    return allTools.filter(t => t.category === Category.PRODUCTIVITY).sort((a, b) => b.rating - a.rating);
  } else if (lowerKeyword.includes('automation tool')) {
    return allTools.filter(t => t.category === Category.AUTOMATION).sort((a, b) => b.rating - a.rating);
  } else if (lowerKeyword.includes('free tool')) {
    return allTools.filter(t => t.pricing === 'Free').sort((a, b) => b.rating - a.rating);
  }
  
  return allTools.filter(t => 
    t.name.toLowerCase().includes(lowerKeyword) ||
    t.tagline.toLowerCase().includes(lowerKeyword) ||
    t.category.toLowerCase().includes(lowerKeyword)
  ).sort((a, b) => b.rating - a.rating);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const keyword = slugToKeyword[slug] || slug.replace(/-/g, ' ');
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://tools.10ex.ai';
  
  return {
    title: `Best ${keyword} for 2025`,
    description: `Discover the best ${keyword.toLowerCase()} in 2025. We've audited 600+ AI tools to bring you the top performing options based on latency, output quality, and cost-efficiency.`,
    keywords: [
      keyword,
      'AI tools',
      'best AI tools 2025',
      'AI tool comparison',
      'AI tool reviews',
    ],
    openGraph: {
      title: `Best ${keyword} for 2025`,
      description: `Discover the best ${keyword.toLowerCase()} in 2025. We've audited 600+ AI tools to bring you the top performing options.`,
      type: 'website',
      url: `${baseUrl}/seo/${slug}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: `Best ${keyword} for 2025`,
      description: `Discover the best ${keyword.toLowerCase()} in 2025.`,
    },
    alternates: {
      canonical: `${baseUrl}/seo/${slug}`,
    },
  };
}

export default async function SEOPage({ params }: Props) {
  const { slug } = await params;
  const keyword = slugToKeyword[slug] || slug.replace(/-/g, ' ');
  const toolsRepo = new ToolsRepository();
  const allTools = await toolsRepo.findAll();
  const filteredTools = getFilteredToolsForSEO(keyword, allTools);

  // Generate structured data
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": `Best ${keyword} for 2025`,
    "description": `Comprehensive list of the best ${keyword.toLowerCase()} in 2025`,
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
          onBack={() => {}}
          onToolClick={(tool) => {}}
          onVote={() => {}}
        />
      </div>
    </>
  );
}

