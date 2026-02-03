import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowUpRight, Bot, Mail } from 'lucide-react';

export const metadata: Metadata = {
  title: 'AI Agents Hub | 10ex Tools',
  description: 'Run high-conversion AI micro agents for sales, marketing, and operations. Start with the Email Template Generator.',
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://tools.10ex.ai'}/agents`,
  },
  robots: {
    index: true,
    follow: true,
  },
};

type AgentCard = {
  id: string;
  name: string;
  category: string;
  outcome: string;
  timeSaved: string;
  href: string;
};

const agents: AgentCard[] = [
  {
    id: 'email-template-generator',
    name: 'Email Template Generator',
    category: 'Sales & Outreach',
    outcome: 'Generate sales-ready emails that get replies.',
    timeSaved: 'Saves 20–40 min per email',
    href: '/agents/email-template-generator',
  },
];

export default function AgentsHubPage() {
  return (
    <div className="min-h-screen pt-20 pb-16 px-4">
      <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-500">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded bg-electric-blue/10 border border-electric-blue/20 flex items-center justify-center text-electric-blue">
              <Bot size={22} />
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight">
              AI Agents
            </h1>
          </div>
          <p className="text-[#888] text-base max-w-2xl">
            Premium micro agents built to ship outcomes fast. Pick an agent, answer a few prompts, get production-grade output.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {agents.map(agent => (
            <Link
              key={agent.id}
              href={agent.href}
              className="group block p-6 rounded-lg border border-[#1f1f1f] bg-[#0a0a0a] hover:bg-black transition-all"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-black border border-[#1f1f1f] text-[9px] font-black uppercase tracking-[0.2em] text-[#666]">
                      <Mail size={12} />
                      {agent.category}
                    </span>
                    <span className="inline-flex items-center px-2.5 py-1 rounded bg-electric-blue/5 border border-electric-blue/20 text-[9px] font-black uppercase tracking-[0.2em] text-electric-blue">
                      Free first run
                    </span>
                  </div>
                  <h2 className="text-xl font-black uppercase italic tracking-tight group-hover:text-[#ddd] transition-colors">
                    {agent.name}
                  </h2>
                  <p className="text-sm text-[#666] mt-2 leading-relaxed">
                    {agent.outcome}
                  </p>
                </div>
                <ArrowUpRight size={18} className="text-[#666] group-hover:text-white transition-colors shrink-0" />
              </div>

              <div className="mt-4 flex items-center justify-between gap-4">
                <p className="text-[11px] text-[#888] font-bold">
                  {agent.timeSaved}
                </p>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white bg-white/10 border border-white/10 px-3 py-2 rounded">
                  Run Agent
                </span>
              </div>
            </Link>
          ))}
        </div>

        <div className="p-6 rounded-lg border border-[#1f1f1f] bg-black">
          <p className="text-xs text-[#666] font-medium leading-relaxed">
            Coming soon: Cold Outreach Agent, LinkedIn Post Generator, Webinar Invite Agent, Lead Qualifier Agent.
            Want one next? Email{' '}
            <a className="text-electric-blue hover:underline" href="mailto:team@10ex.ai">
              team@10ex.ai
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}

