import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ToolsRepository } from '@/database/repositories/tools.repository';
import { Category } from '@/types';
import Link from 'next/link';
import { ArrowRight, Star, ExternalLink } from 'lucide-react';
import { Breadcrumbs } from '@/components/Breadcrumbs';

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const toolsRepo = new ToolsRepository();
  const tool = await toolsRepo.findById(id);

  if (!tool) {
    return {
      title: 'Tool Not Found',
    };
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://tools.10ex.ai';
  
  return {
    title: `${tool.name} Alternatives - Best Similar AI Tools 2026 | AI Tool Box`,
    description: `Find the best alternatives to ${tool.name}. Compare ${tool.name} with similar AI tools based on features, pricing, and use cases.`,
    keywords: [
      `${tool.name} alternatives`,
      `${tool.name} vs`,
      `similar to ${tool.name}`,
      tool.category,
      'AI tool alternatives',
      'AI tool comparison',
    ],
    openGraph: {
      title: `${tool.name} Alternatives - Best Similar AI Tools 2026`,
      description: `Find the best alternatives to ${tool.name}. Compare features, pricing, and use cases.`,
      type: 'website',
      url: `${baseUrl}/alternative/${tool.id}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${tool.name} Alternatives`,
      description: `Find the best alternatives to ${tool.name}.`,
    },
    alternates: {
      canonical: `${baseUrl}/alternative/${tool.id}`,
    },
  };
}

export default async function AlternativesPage({ params }: Props) {
  const { id } = await params;
  const toolsRepo = new ToolsRepository();
  const tool = await toolsRepo.findById(id);

  if (!tool) {
    notFound();
  }

  // Find alternatives - same category, similar rating, exclude the current tool
  const alternatives = await toolsRepo.findAll({
    category: tool.category as Category,
    limit: 20,
  });

  const filteredAlternatives = alternatives
    .filter(t => t.id !== tool.id)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 10);

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://tools.10ex.ai';

  // Structured data for alternatives page
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": `${tool.name} Alternatives`,
    "description": `Best alternatives to ${tool.name}`,
    "itemListElement": filteredAlternatives.map((alt, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "SoftwareApplication",
        "name": alt.name,
        "description": alt.tagline,
        "url": `${baseUrl}/tool/${alt.id}`,
        "applicationCategory": alt.category,
      },
    })),
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
              { label: tool.category, href: `/best-ai-for/${tool.category.toLowerCase().replace(/\s+/g, '-').replace(/&/g, '')}` },
              { label: tool.name, href: `/tool/${tool.id}` },
              { label: 'Alternatives' },
            ]}
          />
          {/* Header */}
          <div className="space-y-4">
            
            <div className="flex items-center gap-4">
              <div 
                className="w-16 h-16 rounded bg-white text-black flex items-center justify-center text-2xl font-black"
                role="img"
                aria-label={`${tool.name} logo`}
              >
                {tool.name[0]}
              </div>
              <div>
                <h1 className="text-4xl font-black">
                  {tool.name} Alternatives
                </h1>
                <p className="text-[#888] mt-2">
                  Find the best alternatives to {tool.name} based on features, pricing, and use cases.
                </p>
              </div>
            </div>
          </div>

          {/* Current Tool Info */}
          <div className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black mb-2">About {tool.name}</h2>
                <p className="text-[#888] text-sm mb-4">{tool.tagline}</p>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-[#666]">Rating:</span>
                  <span className="text-white font-bold">{tool.rating}%</span>
                  <span className="text-[#666]">Pricing:</span>
                  <span className="text-white font-bold">{tool.pricing}</span>
                  <span className="text-[#666]">Category:</span>
                  <span className="text-white font-bold">{tool.category}</span>
                </div>
              </div>
              <Link
                href={`/tool/${tool.id}`}
                className="bg-white text-black px-6 py-3 rounded font-bold text-sm hover:bg-[#eee] transition-all uppercase tracking-widest"
              >
                View Tool
              </Link>
            </div>
          </div>

          {/* Alternatives List */}
          <div className="space-y-4">
            <h2 className="text-2xl font-black">
              Best {tool.name} Alternatives ({filteredAlternatives.length})
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAlternatives.map((alt) => (
                <Link
                  key={alt.id}
                  href={`/tool/${alt.id}`}
                  className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg p-6 hover:border-[#333] hover:bg-[#111] transition-all group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div 
                      className="w-12 h-12 rounded bg-white text-black flex items-center justify-center text-xl font-black"
                      role="img"
                      aria-label={`${alt.name} logo`}
                    >
                      {alt.name[0]}
                    </div>
                    <div className="flex items-center gap-1 text-yellow-500">
                      <Star size={14} fill="currentColor" />
                      <span className="text-xs font-bold">{alt.rating}%</span>
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-black mb-2 group-hover:text-electric-blue transition-colors">
                    {alt.name}
                  </h3>
                  
                  <p className="text-sm text-[#888] mb-4 line-clamp-2">
                    {alt.tagline}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#666]">{alt.pricing}</span>
                    <span className="text-[#666] flex items-center gap-1 group-hover:text-white transition-colors">
                      View <ArrowRight size={12} />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Comparison CTA */}
          <div className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg p-6 text-center">
            <h3 className="text-xl font-black mb-2">Want to Compare?</h3>
            <p className="text-[#888] mb-4">
              See detailed side-by-side comparisons of {tool.name} and its alternatives.
            </p>
            <Link
              href={`/compare/${tool.id}`}
              className="inline-block bg-white text-black px-6 py-3 rounded font-bold text-sm hover:bg-[#eee] transition-all uppercase tracking-widest"
            >
              Compare Tools
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
