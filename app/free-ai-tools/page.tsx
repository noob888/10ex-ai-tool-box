import { Metadata } from 'next';
import { ToolsRepository } from '@/database/repositories/tools.repository';
import { Tool } from '@/types';
import Link from 'next/link';
import { ArrowUpRight, TrendingUp } from 'lucide-react';
import { Breadcrumbs } from '@/components/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Free AI Tools - No Cost AI Software & Tools | AI Tool Box',
  description: 'Discover the best free AI tools available. Browse free and freemium AI software for writing, coding, design, and more. No sign-up required options included.',
  keywords: ['free AI tools', 'free AI software', 'freemium AI tools', 'no cost AI', 'free ChatGPT alternatives'],
  openGraph: {
    title: 'Free AI Tools - No Cost AI Software',
    description: 'Discover the best free AI tools available. Browse free and freemium AI software.',
    type: 'website',
  },
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://tools.10ex.ai'}/free-ai-tools`,
  },
};

export default async function FreeToolsPage() {
  const toolsRepo = new ToolsRepository();
  const allTools = await toolsRepo.findAll({ limit: 1000 });
  
  // Filter free and freemium tools
  const freeTools = allTools.filter(tool => 
    tool.pricing === 'Free' || tool.pricing === 'Freemium'
  );

  // Sort by rating and popularity
  const sortedTools = freeTools.sort((a, b) => {
    // Prioritize rapidly growing tools if available
    const aGrowth = (a as any).isRapidlyGrowing ? 1000 : 0;
    const bGrowth = (b as any).isRapidlyGrowing ? 1000 : 0;
    return (bGrowth + b.rating + b.popularity) - (aGrowth + a.rating + a.popularity);
  });

  // Get rapidly growing tools for featured section
  const rapidlyGrowing = sortedTools.filter((tool: any) => tool.isRapidlyGrowing).slice(0, 6);
  
  // Get no-sign-up tools (tools with "no sign up" in description or tagline)
  const noSignUpTools = sortedTools.filter(tool => {
    const text = `${tool.description} ${tool.tagline}`.toLowerCase();
    return text.includes('no sign') || text.includes('no signup') || text.includes('no account');
  }).slice(0, 10);

  // Generate structured data
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Free AI Tools",
    "description": "A comprehensive collection of free and freemium AI tools",
    "url": `${process.env.NEXT_PUBLIC_SITE_URL || 'https://tools.10ex.ai'}/free-ai-tools`,
    "mainEntity": {
      "@type": "ItemList",
      "numberOfItems": sortedTools.length,
      "itemListElement": sortedTools.slice(0, 20).map((tool, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "item": {
          "@type": "SoftwareApplication",
          "name": tool.name,
          "description": tool.description,
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
        <div className="max-w-6xl mx-auto">
          <Breadcrumbs 
            items={[
              { label: 'Free AI Tools' },
            ]}
          />
          <div className="mb-12">
            <h1 className="text-5xl font-black tracking-tight uppercase italic mb-4">
              Free AI Tools
            </h1>
            <p className="text-lg text-[#888] font-medium leading-relaxed max-w-3xl">
              Discover the best free and freemium AI tools available. No cost, no credit card required. 
              Find tools for writing, coding, design, and more.
            </p>
          </div>

          {rapidlyGrowing.length > 0 && (
            <section className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <TrendingUp size={20} className="text-green-500" />
                <h2 className="text-2xl font-black uppercase tracking-tight">
                  Rapidly Growing Free Tools
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {rapidlyGrowing.map((tool) => (
                  <ToolCard key={tool.id} tool={tool} showGrowth={true} />
                ))}
              </div>
            </section>
          )}

          {noSignUpTools.length > 0 && (
            <section className="mb-12">
              <h2 className="text-2xl font-black uppercase tracking-tight mb-6">
                No Sign-Up Required
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {noSignUpTools.map((tool) => (
                  <ToolCard key={tool.id} tool={tool} />
                ))}
              </div>
            </section>
          )}

          <section>
            <h2 className="text-2xl font-black uppercase tracking-tight mb-6">
              All Free AI Tools ({sortedTools.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedTools.map((tool) => (
                <ToolCard key={tool.id} tool={tool} />
              ))}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

function ToolCard({ tool, showGrowth = false }: { tool: Tool; showGrowth?: boolean }) {
  return (
    <Link
      href={`/tool/${tool.id}`}
      className="block p-6 rounded-lg border border-[#1f1f1f] bg-[#0a0a0a] hover:bg-black transition-all group"
    >
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-black uppercase italic group-hover:text-[#888] transition-colors truncate">
            {tool.name}
          </h3>
          <p className="text-sm text-[#666] mt-1 line-clamp-2">
            {tool.tagline}
          </p>
        </div>
        <ArrowUpRight 
          size={18} 
          className="text-[#666] group-hover:text-white transition-colors shrink-0" 
        />
      </div>
      <div className="flex items-center gap-3 text-xs">
        <span className="px-2 py-1 rounded bg-black border border-[#1f1f1f] text-[#666] font-bold">
          {tool.pricing}
        </span>
        <span className="text-[#666]">•</span>
        <span className="text-[#666] font-bold">{tool.rating}%</span>
        {showGrowth && (tool as any).isRapidlyGrowing && (
          <>
            <span className="text-[#666]">•</span>
            <span className="text-green-500 font-bold flex items-center gap-1">
              <TrendingUp size={12} />
              Growing
            </span>
          </>
        )}
      </div>
      {tool.bestFor && (
        <p className="text-xs text-[#666] mt-3 line-clamp-1">
          Best for: {tool.bestFor}
        </p>
      )}
    </Link>
  );
}
