import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ToolsRepository } from '@/database/repositories/tools.repository';
import { Category } from '@/types';
import Link from 'next/link';
import { Star, ArrowRight } from 'lucide-react';
import { Breadcrumbs } from '@/components/Breadcrumbs';

type Props = {
  params: Promise<{ category: string }>;
};

const categoryMap: Record<string, Category> = {
  'writing': Category.WRITING,
  'coding': Category.CODING,
  'design': Category.DESIGN,
  'marketing': Category.MARKETING,
  'productivity': Category.PRODUCTIVITY,
  'research': Category.RESEARCH,
  'video': Category.VIDEO,
  'sales': Category.SALES,
  'automation': Category.AUTOMATION,
};

const categoryTitles: Record<string, string> = {
  'writing': 'Writing & Content Creation',
  'coding': 'Coding & Development',
  'design': 'Design & Creative',
  'marketing': 'Marketing & SEO',
  'productivity': 'Productivity & Workflow',
  'research': 'Research & Analysis',
  'video': 'Video Creation & Editing',
  'sales': 'Sales & Outreach',
  'automation': 'Automation & Workflows',
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  const categoryTitle = categoryTitles[category] || category;
  
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://tools.10ex.ai';
  
  return {
    title: `Best AI Tools for ${categoryTitle} in 2026 | AI Tool Box`,
    description: `Discover the best AI tools for ${categoryTitle.toLowerCase()}. Compare features, pricing, and ratings to find the perfect AI tool for your needs.`,
    keywords: [
      `best AI tools for ${category}`,
      `AI ${category} tools`,
      `${categoryTitle} AI tools`,
      'AI tool recommendations',
    ],
    openGraph: {
      title: `Best AI Tools for ${categoryTitle} in 2026`,
      description: `Discover the best AI tools for ${categoryTitle.toLowerCase()}.`,
      type: 'website',
      url: `${baseUrl}/best-ai-for/${category}`,
    },
    alternates: {
      canonical: `${baseUrl}/best-ai-for/${category}`,
    },
  };
}

export default async function BestAIForPage({ params }: Props) {
  const { category } = await params;
  const categoryEnum = categoryMap[category.toLowerCase()];
  
  if (!categoryEnum) {
    notFound();
  }

  const toolsRepo = new ToolsRepository();
  const tools = await toolsRepo.findAll({
    category: categoryEnum,
    limit: 50,
  });

  const sortedTools = tools.sort((a, b) => b.rating - a.rating);
  const topTools = sortedTools.slice(0, 10);
  const categoryTitle = categoryTitles[category] || category;

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://tools.10ex.ai';

  // Structured data
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": `Best AI Tools for ${categoryTitle}`,
    "description": `Comprehensive list of the best AI tools for ${categoryTitle.toLowerCase()} in 2026`,
    "mainEntity": {
      "@type": "ItemList",
      "numberOfItems": topTools.length,
      "itemListElement": topTools.map((tool, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "item": {
          "@type": "SoftwareApplication",
          "name": tool.name,
          "description": tool.tagline,
          "url": `${baseUrl}/tool/${tool.id}`,
          "applicationCategory": categoryTitle,
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
        <div className="max-w-6xl mx-auto space-y-8">
          <Breadcrumbs 
            items={[
              { label: `Best AI for ${categoryTitle}` },
            ]}
          />
          {/* Header */}
          <div className="space-y-4">
            
            <h1 className="text-4xl font-black">
              Best AI Tools for {categoryTitle}
            </h1>
            <p className="text-[#888] text-lg">
              Discover the top-rated AI tools for {categoryTitle.toLowerCase()} in 2026. Compare features, pricing, and ratings to find the perfect tool for your workflow.
            </p>
          </div>

          {/* Top Tools */}
          <div className="space-y-4">
            <h2 className="text-2xl font-black">
              Top {categoryTitle} AI Tools ({tools.length} total)
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {topTools.map((tool, index) => (
                <Link
                  key={tool.id}
                  href={`/tool/${tool.id}`}
                  className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg p-6 hover:border-[#333] hover:bg-[#111] transition-all group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-black text-[#333]">#{index + 1}</span>
                      <div 
                        className="w-12 h-12 rounded bg-white text-black flex items-center justify-center text-xl font-black"
                        role="img"
                        aria-label={`${tool.name} logo`}
                      >
                        {tool.name[0]}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-yellow-500">
                      <Star size={14} fill="currentColor" />
                      <span className="text-xs font-bold">{tool.rating}%</span>
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-black mb-2 group-hover:text-electric-blue transition-colors">
                    {tool.name}
                  </h3>
                  
                  <p className="text-sm text-[#888] mb-4 line-clamp-2">
                    {tool.tagline}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#666]">{tool.pricing}</span>
                    <span className="text-[#666] flex items-center gap-1 group-hover:text-white transition-colors">
                      View <ArrowRight size={12} />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Related Categories */}
          <div className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg p-6">
            <h3 className="text-xl font-black mb-4">Explore More Categories</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(categoryMap).filter(([key]) => key !== category).slice(0, 6).map(([key, cat]) => (
                <Link
                  key={key}
                  href={`/best-ai-for/${key}`}
                  className="px-4 py-2 rounded bg-black border border-[#1f1f1f] text-sm font-bold text-[#888] hover:text-white hover:border-[#333] transition-all text-center"
                >
                  Best for {categoryTitles[key]?.split(' ')[0] || key}
                </Link>
              ))}
            </div>
          </div>

          {/* All Tools Link */}
          {tools.length > 10 && (
            <div className="text-center">
              <Link
                href={`/tools?category=${categoryEnum}`}
                className="inline-block bg-white text-black px-6 py-3 rounded font-bold text-sm hover:bg-[#eee] transition-all uppercase tracking-widest"
              >
                View All {tools.length} {categoryTitle} Tools
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
