import { Metadata } from 'next';
import { ToolsRepository } from '@/database/repositories/tools.repository';
import { Tool } from '@/types';
import Link from 'next/link';
import { ArrowUpRight, Sparkles } from 'lucide-react';
import { Breadcrumbs } from '@/components/Breadcrumbs';

export const metadata: Metadata = {
  title: 'New AI Tools - Recently Launched AI Software | AI Tool Box',
  description: 'Discover the latest AI tools launched in the past 30 days. Find new AI software for writing, coding, design, and more.',
  keywords: ['new AI tools', 'latest AI tools', 'recent AI tools', 'new AI software 2026'],
  openGraph: {
    title: 'New AI Tools - Recently Launched',
    description: 'Discover the latest AI tools launched in the past 30 days.',
    type: 'website',
  },
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://tools.10ex.ai'}/new-ai-tools`,
  },
};

export default async function NewToolsPage() {
  const allTools: Tool[] = process.env.DATABASE_URL
    ? await new ToolsRepository().findAll({ limit: 1000 })
    : (await import('@/data/toolsData')).toolsDataset;
  
  // Filter tools from last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const newTools = allTools.filter(tool => {
    if (!tool.launchDate) return false;
    const launchDate = new Date(tool.launchDate);
    return launchDate >= thirtyDaysAgo;
  });

  // Sort by launch date (newest first)
  const sortedTools = newTools.sort((a, b) => {
    const dateA = a.launchDate ? new Date(a.launchDate).getTime() : 0;
    const dateB = b.launchDate ? new Date(b.launchDate).getTime() : 0;
    return dateB - dateA;
  });

  // Generate structured data
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "New AI Tools",
    "description": "Recently launched AI tools from the past 30 days",
    "url": `${process.env.NEXT_PUBLIC_SITE_URL || 'https://tools.10ex.ai'}/new-ai-tools`,
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
          "datePublished": tool.launchDate,
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
              { label: 'New AI Tools' },
            ]}
          />
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <Sparkles size={24} className="text-yellow-500" />
              <h1 className="text-5xl font-black tracking-tight uppercase italic">
                New AI Tools
              </h1>
            </div>
            <p className="text-lg text-[#888] font-medium leading-relaxed max-w-3xl">
              Discover the latest AI tools launched in the past 30 days. Find new AI software 
              for writing, coding, design, and more.
            </p>
          </div>

          {sortedTools.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-[#666] text-lg">No new tools found in the past 30 days.</p>
              <Link
                href="/"
                className="inline-block mt-4 px-6 py-3 rounded bg-[#0a0a0a] border border-[#1f1f1f] text-sm font-bold text-[#888] hover:text-white hover:border-[#333] transition-all"
              >
                Browse All Tools
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedTools.map((tool) => (
                <ToolCard key={tool.id} tool={tool} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function ToolCard({ tool }: { tool: Tool }) {
  const daysSinceLaunch = tool.launchDate 
    ? Math.floor((Date.now() - new Date(tool.launchDate).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <Link
      href={`/tool/${tool.id}`}
      className="block p-6 rounded-lg border border-[#1f1f1f] bg-[#0a0a0a] hover:bg-black transition-all group relative"
    >
      {daysSinceLaunch !== null && daysSinceLaunch <= 7 && (
        <div className="absolute top-4 right-4 px-2 py-1 rounded bg-yellow-500 text-black text-[10px] font-black uppercase">
          New
        </div>
      )}
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
        {tool.launchDate && (
          <>
            <span className="text-[#666]">•</span>
            <span className="text-[#666] text-[10px]">
              {daysSinceLaunch !== null 
                ? `${daysSinceLaunch}d ago`
                : new Date(tool.launchDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              }
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
