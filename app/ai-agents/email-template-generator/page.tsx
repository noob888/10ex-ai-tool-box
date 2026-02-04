import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Mail, Sparkles } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Email Template Generator (Cold Outbound + Follow-ups) | 10ex AI Agent',
  description:
    'Generate high-performing email templates for cold outreach, follow-ups, partnerships, webinar invites, onboarding, and re-engagement. Includes subject lines, short + long versions, CTA variants, and follow-up suggestions.',
  keywords: [
    'email template generator',
    'cold email generator',
    'sales email templates',
    'outreach email generator',
    'follow up email generator',
    'partnership email template',
    'webinar invite email',
    'customer onboarding email template',
  ],
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://tools.10ex.ai'}/ai-agents/email-template-generator`,
  },
  openGraph: {
    title: 'Email Template Generator | 10ex AI Agent',
    description:
      'Sales-ready email templates with subject lines, short + long versions, CTA variants, and follow-up suggestions.',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function EmailTemplateGeneratorSEOPage() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://tools.10ex.ai';

  const faqs = [
    {
      q: 'What does the Email Template Generator create?',
      a: 'You get 3–5 subject lines, a short version, a long version, personalization tokens/placeholders, multiple CTA variants, and a suggested follow-up email.',
    },
    {
      q: 'What inputs do I need?',
      a: 'Provide your email goal (cold outreach, follow-up, etc.), target persona, a brief company/product description, your preferred tone, and optional context like LinkedIn info, pain points, and industry.',
    },
    {
      q: 'Does it avoid spam-trigger language?',
      a: 'Yes—outputs are formatted for clarity and professionalism and avoid common spammy patterns (excessive punctuation, manipulative phrasing, and overly promotional language).',
    },
    {
      q: 'Can I personalize at scale?',
      a: 'Yes—the agent outputs tokens like {{first_name}} and {{company}} so you can merge data from your CRM or spreadsheet quickly.',
    },
    {
      q: 'Is it free?',
      a: 'You can run the agent free once. After that, you’ll be prompted to sign up for unlimited generations.',
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
    name: 'Email Template Generator',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    url: `${baseUrl}/ai-agents/email-template-generator`,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      description: 'Generate high-performing email templates tailored to your target persona and tone.',
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
                Email Template Generator for Cold Outreach + Follow-ups
              </h1>
              <p className="text-[#888] text-base md:text-lg max-w-3xl font-medium leading-relaxed">
                Generate high-performing email templates tailored to your target persona and tone. Includes multiple subject lines, short + long versions, CTA variants, and a follow-up suggestion—ready to paste into your outbound tool.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/ai-agents/email-template-generator"
                className="bg-white text-black px-6 py-4 rounded font-black text-xs uppercase tracking-widest hover:bg-[#eee] transition-all flex items-center gap-2"
              >
                Try Free Agent <ArrowRight size={14} />
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
                title: 'Conversion frameworks baked-in',
                body: 'Uses proven structures (PAS, AIDA, value + proof + CTA) without sounding templated.',
              },
              {
                title: 'Persona + tone control',
                body: 'Tailors the message for role, context, and industry while keeping your voice consistent.',
              },
              {
                title: 'Fast personalization',
                body: 'Outputs tokens/placeholders so you can personalize at scale without rewriting.',
              },
            ].map((b, idx) => (
              <div key={idx} className="p-6 rounded-lg border border-[#1f1f1f] bg-[#0a0a0a]">
                <h2 className="text-lg font-black uppercase italic tracking-tight">{b.title}</h2>
                <p className="text-sm text-[#666] mt-3 leading-relaxed">{b.body}</p>
              </div>
            ))}
          </section>

          {/* Use Cases */}
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded bg-electric-blue/10 border border-electric-blue/20 flex items-center justify-center text-electric-blue">
                <Mail size={22} />
              </div>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight">Use cases</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                'Cold outbound (new prospect)',
                'Follow-up (no reply)',
                'Partnership outreach',
                'Webinar invites',
                'Customer onboarding sequences',
                'Re-engagement for churn-risk accounts',
              ].map((u, idx) => (
                <div key={idx} className="p-5 rounded border border-[#1f1f1f] bg-black text-sm text-[#ddd]">
                  {u}
                </div>
              ))}
            </div>
          </section>

          {/* Examples */}
          <section className="space-y-6">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight">Example output</h2>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              <div className="lg:col-span-5 p-6 rounded-lg border border-[#1f1f1f] bg-[#0a0a0a] space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#444]">
                  Subject lines
                </h3>
                <ul className="space-y-2 text-sm text-[#ddd]">
                  <li>Quick question about {'{{company}}'}’s outbound</li>
                  <li>
                    {'{{first_name}}'}, is this a priority in Q{'{{quarter}}'}?
                  </li>
                  <li>Idea to reduce {'{{pain_point}}'} by 20%+</li>
                  <li>Worth a 10-min sanity check?</li>
                </ul>
                <div className="pt-3">
                  <p className="text-[11px] text-[#666]">
                    Includes tokens like <span className="font-mono text-[#888]">{'{{first_name}}'}</span> and{' '}
                    <span className="font-mono text-[#888]">{'{{company}}'}</span>.
                  </p>
                </div>
              </div>
              <div className="lg:col-span-7 p-6 rounded-lg border border-[#1f1f1f] bg-black space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#444]">
                  Short version (example)
                </h3>
                <pre className="whitespace-pre-wrap text-sm text-[#ddd] leading-relaxed font-sans">
{`Hi {{first_name}} —

Noticed {{company}} is hiring for {{role_or_team}}. Usually that’s a signal {{pain_point}} is becoming a priority.

We help teams like yours {{primary_outcome}} (e.g., cut cycle time by {{proof_point}}) without adding headcount.

Open to a quick 10 minutes next week to see if it’s relevant?`}
                </pre>
                <div className="pt-2 flex flex-wrap gap-2">
                  <span className="px-3 py-2 rounded border border-[#1f1f1f] bg-[#0a0a0a] text-[11px] text-[#ddd]">
                    CTA variants included
                  </span>
                  <span className="px-3 py-2 rounded border border-[#1f1f1f] bg-[#0a0a0a] text-[11px] text-[#ddd]">
                    Follow-up suggestion included
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
                  <summary className="cursor-pointer text-sm font-black text-white">
                    {f.q}
                  </summary>
                  <p className="mt-3 text-sm text-[#666] leading-relaxed">{f.a}</p>
                </details>
              ))}
            </div>
          </section>

          {/* CTA */}
          <section className="p-8 rounded-lg border border-electric-blue/20 bg-electric-blue/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-black tracking-tight">Try it free</h2>
              <p className="text-sm text-[#666] max-w-2xl">
                Answer a few prompts and get production-ready subject lines, email drafts, and follow-ups.
              </p>
            </div>
            <Link
              href="/ai-agents/email-template-generator"
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

