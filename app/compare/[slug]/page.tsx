import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ToolsRepository } from '@/database/repositories/tools.repository';
import Link from 'next/link';
import { Check, X, Star, ExternalLink } from 'lucide-react';
import { Breadcrumbs } from '@/components/Breadcrumbs';

type Props = {
  params: Promise<{ slug: string }>;
};

// Parse slug like "chatgpt-vs-claude" or "tool-id-1-vs-tool-id-2"
function parseComparisonSlug(slug: string): { tool1Id?: string; tool2Id?: string; tool1Name?: string; tool2Name?: string } {
  const parts = slug.toLowerCase().split('-vs-');
  if (parts.length !== 2) {
    return {};
  }
  
  // Try to find tools by name or ID
  return {
    tool1Name: parts[0].replace(/-/g, ' '),
    tool2Name: parts[1].replace(/-/g, ' '),
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { tool1Name, tool2Name } = parseComparisonSlug(slug);
  
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://tools.10ex.ai';
  
  return {
    title: `${tool1Name || 'Tool 1'} vs ${tool2Name || 'Tool 2'} - Detailed Comparison 2026 | AI Tool Box`,
    description: `Compare ${tool1Name || 'Tool 1'} and ${tool2Name || 'Tool 2'}. Side-by-side comparison of features, pricing, ratings, and use cases to help you choose the best AI tool.`,
    keywords: [
      `${tool1Name} vs ${tool2Name}`,
      `${tool1Name} comparison`,
      `${tool2Name} comparison`,
      'AI tool comparison',
      'AI software comparison',
    ],
    openGraph: {
      title: `${tool1Name || 'Tool 1'} vs ${tool2Name || 'Tool 2'} - Comparison`,
      description: `Compare ${tool1Name || 'Tool 1'} and ${tool2Name || 'Tool 2'} side-by-side.`,
      type: 'website',
      url: `${baseUrl}/compare/${slug}`,
    },
    alternates: {
      canonical: `${baseUrl}/compare/${slug}`,
    },
  };
}

export default async function ComparisonPage({ params }: Props) {
  const { slug } = await params;
  const toolsRepo = new ToolsRepository();
  
  // For now, we'll create a generic comparison page
  // In production, you'd parse the slug and fetch the actual tools
  const { tool1Name, tool2Name } = parseComparisonSlug(slug);
  
  // Try to find tools by name (simplified - in production, use better matching)
  const allTools = await toolsRepo.findAll({ limit: 100 });
  const tool1 = allTools.find(t => 
    t.name.toLowerCase().includes(tool1Name?.toLowerCase() || '') ||
    t.id.toLowerCase() === tool1Name?.toLowerCase()
  );
  const tool2 = allTools.find(t => 
    t.name.toLowerCase().includes(tool2Name?.toLowerCase() || '') ||
    t.id.toLowerCase() === tool2Name?.toLowerCase()
  );

  if (!tool1 || !tool2) {
    // Show a comparison page template even if tools aren't found
    // In production, you might want to redirect or show a different page
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://tools.10ex.ai';

  // Structured data for comparison
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": `${tool1?.name || 'Tool 1'} vs ${tool2?.name || 'Tool 2'} Comparison`,
    "description": `Side-by-side comparison of ${tool1?.name || 'Tool 1'} and ${tool2?.name || 'Tool 2'}`,
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "item": tool1 ? {
          "@type": "SoftwareApplication",
          "name": tool1.name,
          "url": `${baseUrl}/tool/${tool1.id}`,
        } : null,
      },
      {
        "@type": "ListItem",
        "position": 2,
        "item": tool2 ? {
          "@type": "SoftwareApplication",
          "name": tool2.name,
          "url": `${baseUrl}/tool/${tool2.id}`,
        } : null,
      },
    ].filter(item => item.item !== null),
  };

  if (!tool1 || !tool2) {
    return (
      <div className="min-h-screen pt-20 pb-16 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <h1 className="text-4xl font-black">Comparison Not Found</h1>
          <p className="text-[#888]">
            The tools you're trying to compare could not be found.
          </p>
          <Link
            href="/tools"
            className="inline-block bg-white text-black px-6 py-3 rounded font-bold text-sm hover:bg-[#eee] transition-all uppercase tracking-widest mt-4"
          >
            Browse Tools
          </Link>
        </div>
      </div>
    );
  }

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
          {tool1 && tool2 && (
            <Breadcrumbs 
              items={[
                { label: tool1.name, href: `/tool/${tool1.id}` },
                { label: 'vs' },
                { label: tool2.name, href: `/tool/${tool2.id}` },
                { label: 'Comparison' },
              ]}
            />
          )}
          {/* Header */}
          <div className="space-y-4">
            <h1 className="text-4xl font-black">
              {tool1.name} vs {tool2.name}
            </h1>
            <p className="text-[#888]">
              Side-by-side comparison to help you choose the best AI tool for your needs.
            </p>
          </div>

          {/* Comparison Table */}
          <div className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg overflow-hidden">
            <div className="grid grid-cols-3 gap-0">
              {/* Header */}
              <div className="p-4 border-b border-r border-[#1f1f1f]">
                <span className="text-[#666] text-xs font-bold uppercase">Feature</span>
              </div>
              <div className="p-4 border-b border-r border-[#1f1f1f] text-center">
                <Link href={`/tool/${tool1.id}`} className="text-lg font-black hover:text-electric-blue transition-colors">
                  {tool1.name}
                </Link>
              </div>
              <div className="p-4 border-b border-[#1f1f1f] text-center">
                <Link href={`/tool/${tool2.id}`} className="text-lg font-black hover:text-electric-blue transition-colors">
                  {tool2.name}
                </Link>
              </div>

              {/* Rating */}
              <div className="p-4 border-b border-r border-[#1f1f1f] flex items-center">
                <span className="text-sm text-[#888]">Rating</span>
              </div>
              <div className="p-4 border-b border-r border-[#1f1f1f] text-center">
                <div className="flex items-center justify-center gap-2">
                  <Star size={16} className="text-yellow-500 fill-current" />
                  <span className="font-bold">{tool1.rating}%</span>
                </div>
              </div>
              <div className="p-4 border-b border-[#1f1f1f] text-center">
                <div className="flex items-center justify-center gap-2">
                  <Star size={16} className="text-yellow-500 fill-current" />
                  <span className="font-bold">{tool2.rating}%</span>
                </div>
              </div>

              {/* Pricing */}
              <div className="p-4 border-b border-r border-[#1f1f1f] flex items-center">
                <span className="text-sm text-[#888]">Pricing</span>
              </div>
              <div className="p-4 border-b border-r border-[#1f1f1f] text-center">
                <span className="font-bold">{tool1.pricing}</span>
              </div>
              <div className="p-4 border-b border-[#1f1f1f] text-center">
                <span className="font-bold">{tool2.pricing}</span>
              </div>

              {/* Category */}
              <div className="p-4 border-b border-r border-[#1f1f1f] flex items-center">
                <span className="text-sm text-[#888]">Category</span>
              </div>
              <div className="p-4 border-b border-r border-[#1f1f1f] text-center">
                <span className="text-sm">{tool1.category}</span>
              </div>
              <div className="p-4 border-b border-[#1f1f1f] text-center">
                <span className="text-sm">{tool2.category}</span>
              </div>

              {/* Best For */}
              <div className="p-4 border-b border-r border-[#1f1f1f] flex items-center">
                <span className="text-sm text-[#888]">Best For</span>
              </div>
              <div className="p-4 border-b border-r border-[#1f1f1f]">
                <p className="text-sm text-[#aaa]">{tool1.bestFor}</p>
              </div>
              <div className="p-4 border-b border-[#1f1f1f]">
                <p className="text-sm text-[#aaa]">{tool2.bestFor}</p>
              </div>

              {/* Actions */}
              <div className="p-4 border-r border-[#1f1f1f]"></div>
              <div className="p-4 border-r border-[#1f1f1f]">
                <Link
                  href={`/tool/${tool1.id}`}
                  className="block w-full bg-white text-black py-2 rounded text-center text-sm font-bold hover:bg-[#eee] transition-all uppercase tracking-widest"
                >
                  View {tool1.name}
                </Link>
              </div>
              <div className="p-4">
                <Link
                  href={`/tool/${tool2.id}`}
                  className="block w-full bg-white text-black py-2 rounded text-center text-sm font-bold hover:bg-[#eee] transition-all uppercase tracking-widest"
                >
                  View {tool2.name}
                </Link>
              </div>
            </div>
          </div>

          {/* Tool Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg p-6">
              <h2 className="text-xl font-black mb-4">{tool1.name}</h2>
              <p className="text-[#888] text-sm mb-4">{tool1.tagline}</p>
              <div className="space-y-2 mb-4">
                <h3 className="text-xs font-bold text-green-500 uppercase">Strengths</h3>
                <ul className="space-y-1">
                  {tool1.strengths.slice(0, 3).map((s, i) => (
                    <li key={i} className="text-xs text-[#666] flex items-center gap-2">
                      <Check size={12} className="text-green-500" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
              <Link
                href={`/tool/${tool1.id}`}
                className="text-sm text-electric-blue hover:underline"
              >
                View full details →
              </Link>
            </div>

            <div className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg p-6">
              <h2 className="text-xl font-black mb-4">{tool2.name}</h2>
              <p className="text-[#888] text-sm mb-4">{tool2.tagline}</p>
              <div className="space-y-2 mb-4">
                <h3 className="text-xs font-bold text-green-500 uppercase">Strengths</h3>
                <ul className="space-y-1">
                  {tool2.strengths.slice(0, 3).map((s, i) => (
                    <li key={i} className="text-xs text-[#666] flex items-center gap-2">
                      <Check size={12} className="text-green-500" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
              <Link
                href={`/tool/${tool2.id}`}
                className="text-sm text-electric-blue hover:underline"
              >
                View full details →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
