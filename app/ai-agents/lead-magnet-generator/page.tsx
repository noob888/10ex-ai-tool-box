import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, FileText, Sparkles } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Lead Magnet Generator (Checklist / Playbook / Report) | 10ex AI Agent',
  description:
    'Generate high-converting lead magnets in minutes: title options, full PDF-style draft (checklist/playbook/report/template), landing page copy, CTAs + form prompts, and a nurture email.',
  keywords: [
    'lead magnet generator',
    'pdf lead magnet',
    'checklist generator',
    'playbook generator',
    'landing page copy generator',
    'demand generation lead magnet',
    'email nurture generator',
  ],
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://tools.10ex.ai'}/ai-agents/lead-magnet-generator`,
  },
  openGraph: {
    title: 'Lead Magnet Generator | 10ex AI Agent',
    description:
      'Create a complete lead magnet draft plus landing page copy, CTAs, form prompts, and nurture email—tailored to your ICP.',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function LeadMagnetGeneratorSEOPage() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://tools.10ex.ai';

  const faqs = [
    {
      q: 'What does the Lead Magnet Generator create?',
      a: 'You get 3–5 title options, multiple format variants (checklist/playbook/report/template), a full structured lead magnet draft, landing page copy snippet, CTA + form prompt suggestions, and a follow-up nurture email draft.',
    },
    {
      q: 'What inputs do I need?',
      a: 'Provide your industry, ICP persona, goal (capture leads, webinar, outbound, etc.), your topic/pain point focus, and preferred tone. Optionally add a company description and brand style notes.',
    },
    {
      q: 'What formats work best?',
      a: 'Checklists convert well for quick wins, playbooks work for higher-consideration topics, reports work for data/insights positioning, and templates work great for outbound and internal alignment.',
    },
    {
      q: 'Is it free?',
      a: 'You can generate one lead magnet for free. On your second run, you’ll be prompted to sign up for unlimited generations.',
    },
    {
      q: 'Can I use it as a PDF?',
      a: 'Yes—the draft is structured like a PDF-style asset with headings, bullets, and templates you can paste into a doc designer. PDF export can be added next.',
    },
  ];

  const faqStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(f => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: f.a,
      },
    })),
  };

  const softwareStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Lead Magnet Generator',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    url: `${baseUrl}/ai-agents/lead-magnet-generator`,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      description: 'Generate a complete lead magnet in minutes—title options, format variants (checklist/playbook/report/template), a full draft, landing page copy, CTAs + form prompts, and a nurture email—tailored to your ICP.',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqStructuredData),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(softwareStructuredData),
        }}
      />

      <div className="min-h-screen pt-20 pb-16 px-4">
        <div className="max-w-6xl mx-auto space-y-14 animate-in fade-in duration-500">
          {/* Hero */}
          <section className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-2 rounded border border-electric-blue/20 bg-electric-blue/5 text-electric-blue text-[10px] font-black uppercase tracking-[0.2em]">
              <Sparkles size={14} /> 10ex Micro Agent
            </div>
            <div className="space-y-3">
              <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight">
                Lead Magnet Generator for Demand Gen (PDF-style Drafts)
              </h1>
              <p className="text-[#888] text-base md:text-lg max-w-3xl font-medium leading-relaxed">
                Generate a complete lead magnet in minutes—title options, format variants (checklist/playbook/report/template), a full draft, landing page copy, CTAs + form prompts, and a nurture email.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/ai-agents/lead-magnet-generator"
                className="bg-white text-black px-6 py-4 rounded font-black text-xs uppercase tracking-widest hover:bg-[#eee] transition-all flex items-center gap-2"
              >
                Generate Free Lead Magnet <ArrowRight size={14} />
              </Link>
              <Link
                href="/ai-agents"
                className="bg-black border border-[#1f1f1f] text-[#888] px-6 py-4 rounded font-black text-xs uppercase tracking-widest hover:text-white hover:border-[#333] transition-all"
              >
                Browse All Agents
              </Link>
            </div>
          </section>

          {/* Benefits */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                title: 'High-converting positioning',
                body: 'Generates hooks, promises, and titles aligned to your ICP’s priorities—without generic fluff.',
              },
              {
                title: 'Persona-first structure',
                body: 'Ships a PDF-style asset with quick start, steps, templates, and a clear next step CTA.',
              },
              {
                title: 'Full funnel bundle',
                body: 'Includes landing page snippet, CTA + form prompts, and a nurture email to drive conversion.',
              },
            ].map((b, idx) => (
              <div key={idx} className="p-6 rounded-lg border border-[#1f1f1f] bg-[#0a0a0a]">
                <h2 className="text-lg font-black uppercase italic tracking-tight">{b.title}</h2>
                <p className="text-sm text-[#666] mt-3 leading-relaxed">{b.body}</p>
              </div>
            ))}
          </section>

          {/* Examples */}
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded bg-electric-blue/10 border border-electric-blue/20 flex items-center justify-center text-electric-blue">
                <FileText size={22} />
              </div>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight">Example output</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              <div className="lg:col-span-5 p-6 rounded-lg border border-[#1f1f1f] bg-[#0a0a0a] space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#444]">Title options</h3>
                <ul className="space-y-2 text-sm text-[#ddd]">
                  <li>Pipeline Quality Playbook for B2B SaaS RevOps</li>
                  <li>Stop Wasting SDR Cycles: A Checklist to Fix Lead Quality</li>
                  <li>The 7-Day Plan to Improve Demo-to-Close</li>
                  <li>A Practical Template for Lead Scoring That Sales Trusts</li>
                </ul>
              </div>
              <div className="lg:col-span-7 p-6 rounded-lg border border-[#1f1f1f] bg-black space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#444]">Draft snippet</h3>
                <pre className="whitespace-pre-wrap text-sm text-[#ddd] leading-relaxed font-sans">
{`QUICK START (15 minutes)
- Pick one metric: meeting rate, demo-to-close, or pipeline coverage
- Score your readiness checklist (0–2 each)
- Choose one experiment to run this week

TOP 5 FAILURE MODES (AND FIXES)
1) Vague qualification → Fix: add 3 must-have fields + 2 disqualifiers
2) MQL ≠ SQL → Fix: define "sales-ready" with Sales + Marketing
3) Bad routing → Fix: enforce fast response SLA + ownership`}
                </pre>
                <div className="pt-2 flex flex-wrap gap-2">
                  <span className="px-3 py-2 rounded border border-[#1f1f1f] bg-[#0a0a0a] text-[11px] text-[#ddd]">
                    Landing page copy included
                  </span>
                  <span className="px-3 py-2 rounded border border-[#1f1f1f] bg-[#0a0a0a] text-[11px] text-[#ddd]">
                    Nurture email included
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* FAQ */}
          <section className="space-y-6">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight">FAQ</h2>
            <div className="space-y-3">
              {faqs.map((f, idx) => (
                <details key={idx} className="p-6 rounded-lg border border-[#1f1f1f] bg-[#0a0a0a]">
                  <summary className="cursor-pointer text-sm font-black text-white">{f.q}</summary>
                  <p className="mt-3 text-sm text-[#666] leading-relaxed">{f.a}</p>
                </details>
              ))}
            </div>
          </section>

          {/* CTA */}
          <section className="p-8 rounded-lg border border-electric-blue/20 bg-electric-blue/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-black tracking-tight">Generate your lead magnet free</h2>
              <p className="text-sm text-[#666] max-w-2xl">
                Answer a few prompts and get a complete PDF-style draft plus landing page copy and follow-up email.
              </p>
            </div>
            <Link
              href="/ai-agents/lead-magnet-generator"
              className="bg-white text-black px-6 py-4 rounded font-black text-xs uppercase tracking-widest hover:bg-[#eee] transition-all flex items-center gap-2"
            >
              Run Agent <ArrowRight size={14} />
            </Link>
          </section>
        </div>
      </div>
    </>
  );
}

