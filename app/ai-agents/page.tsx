import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowUpRight, Bot, Mail } from 'lucide-react';

export const metadata: Metadata = {
  title: 'AI Agents | Micro Agents Marketplace by 10ex',
  description: 'Discover and run high-conversion AI micro agents. Start with the Email Template Generator—free on your first run.',
  keywords: [
    'AI agents',
    'micro agents',
    'email template generator',
    'cold email generator',
    'sales email templates',
    'outreach email generator',
    'follow up email generator',
  ],
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://tools.10ex.ai'}/ai-agents`,
  },
  openGraph: {
    title: 'AI Agents | Micro Agents Marketplace',
    description: 'Run premium AI agents that ship outcomes fast.',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

const agents = [
  {
    id: 'email-template-generator',
    name: 'Email Template Generator',
    category: 'Sales & Outreach',
    headline: 'Generate sales-ready emails that get replies.',
    seoHref: '/ai-agents/email-template-generator',
    runHref: '/agents/email-template-generator',
    icon: Mail,
  },
];

export default function AIAgentsSEOHubPage() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://tools.10ex.ai';

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'AI Agents',
    description: 'A marketplace of practical AI micro agents for business outcomes.',
    url: `${baseUrl}/ai-agents`,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: agents.length,
      itemListElement: agents.map((a, idx) => ({
        '@type': 'ListItem',
        position: idx + 1,
        item: {
          '@type': 'SoftwareApplication',
          name: a.name,
          applicationCategory: 'BusinessApplication',
          operatingSystem: 'Web',
          url: `${baseUrl}${a.seoHref}`,
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
        <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-500">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded bg-electric-blue/10 border border-electric-blue/20 flex items-center justify-center text-electric-blue">
                <Bot size={22} />
              </div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight">AI Agents</h1>
            </div>
            <p className="text-[#888] text-base max-w-2xl">
              Practical micro agents designed to drive conversion and save time. Each agent has a dedicated experience and a dedicated SEO landing page.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {agents.map(agent => {
              const Icon = agent.icon;
              return (
                <div key={agent.id} className="p-6 rounded-lg border border-[#1f1f1f] bg-[#0a0a0a]">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-black border border-[#1f1f1f] text-[9px] font-black uppercase tracking-[0.2em] text-[#666] mb-3">
                        <Icon size={12} />
                        {agent.category}
                      </div>
                      <h2 className="text-xl font-black uppercase italic tracking-tight">{agent.name}</h2>
                      <p className="text-sm text-[#666] mt-2 leading-relaxed">{agent.headline}</p>
                    </div>
                    <ArrowUpRight size={18} className="text-[#666]" />
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <Link
                      href={agent.seoHref}
                      className="px-4 py-3 rounded border border-[#1f1f1f] bg-black text-[10px] font-black uppercase tracking-[0.2em] text-[#888] hover:text-white hover:border-[#333] transition-all"
                    >
                      View Details
                    </Link>
                    <Link
                      href={agent.runHref}
                      className="px-4 py-3 rounded bg-white text-black text-[10px] font-black uppercase tracking-[0.2em] hover:bg-[#eee] transition-all"
                    >
                      Try Free Agent
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

