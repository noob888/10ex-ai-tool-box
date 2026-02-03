'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Bot, Copy, FileText, Globe, Loader2, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';

type LeadMagnetGoal = 'Capture leads' | 'Webinar' | 'Outbound' | 'Product education' | 'Newsletter growth';
type Tone = 'Professional' | 'Direct' | 'Friendly' | 'Founder-style';
type LeadMagnetFormat = 'Checklist' | 'Playbook' | 'Report' | 'Template';

type LeadMagnetGeneratorInput = {
  industry: string;
  icpPersona: string;
  leadMagnetGoal: LeadMagnetGoal;
  topicOrPainPoint: string;
  tone: Tone;
  companyDescription?: string;
  brandStyleNotes?: string;
};

type LeadMagnetGeneratorOutput = {
  titleOptions: string[];
  recommendedFormat: LeadMagnetFormat;
  formatVariants: Array<{
    format: LeadMagnetFormat;
    hook: string;
    outline: string[];
  }>;
  leadMagnetDraft: string;
  landingPageCopySnippet: string;
  ctaSuggestions: string[];
  formPromptSuggestions: string[];
  nurtureEmailDraft: {
    subject: string;
    body: string;
  };
};

type User = {
  id: string;
  name: string;
  email: string;
  points: number;
  referralCode: string;
  joinedAt: string;
  likedToolIds?: string[];
  starredToolIds?: string[];
  bookmarkedToolIds?: string[];
};

const FREE_RUNS_KEY = 'agents:lead-magnet-generator:freeRunsUsed';
const SESSION_ID_KEY = 'agents:sessionId';

function getOrCreateSessionId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const existing = localStorage.getItem(SESSION_ID_KEY);
    if (existing && existing.trim()) return existing;
    const id = `s_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
    localStorage.setItem(SESSION_ID_KEY, id);
    return id;
  } catch {
    return null;
  }
}

async function trackAgentEvent(event: {
  eventType: string;
  agentId: string;
  userId?: string | null;
  payload?: any;
}) {
  try {
    const sessionId = getOrCreateSessionId();
    await fetch('/api/agents/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...event, sessionId }),
    });
  } catch {
    // fail silently
  }
}

function safeCopy(text: string) {
  if (!text) return;
  navigator.clipboard.writeText(text).catch(() => {});
}

export default function LeadMagnetGeneratorPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [freeRunsUsed, setFreeRunsUsed] = useState(0);

  const [form, setForm] = useState<LeadMagnetGeneratorInput>({
    industry: '',
    icpPersona: '',
    leadMagnetGoal: 'Capture leads',
    topicOrPainPoint: '',
    tone: 'Professional',
    companyDescription: '',
    brandStyleNotes: '',
  });

  const [output, setOutput] = useState<LeadMagnetGeneratorOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const canRun = useMemo(() => {
    if (user) return true;
    return freeRunsUsed < 1;
  }, [user, freeRunsUsed]);

  useEffect(() => {
    const raw = localStorage.getItem(FREE_RUNS_KEY);
    const n = raw ? Number(raw) : 0;
    setFreeRunsUsed(Number.isFinite(n) ? n : 0);

    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        // ignore
      }
    }
  }, []);

  useEffect(() => {
    trackAgentEvent({
      eventType: 'view',
      agentId: 'lead-magnet-generator',
      userId: user?.id || null,
    });
  }, [user?.id]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const formEl = e.target as HTMLFormElement;
    const formData = new FormData(formEl);
    const name = (formData.get('name') as string) || 'User';
    const email = (formData.get('email') as string) || '';

    if (!email) return;

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email }),
      });
      const data = await response.json();
      if (data.user) {
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
        setShowAuthModal(false);
        trackAgentEvent({
          eventType: 'signup',
          agentId: 'lead-magnet-generator',
          userId: data.user.id,
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerate = async () => {
    setError(null);
    setOutput(null);

    if (!canRun) {
      setShowAuthModal(true);
      return;
    }

    if (!form.industry.trim() || !form.icpPersona.trim() || !form.topicOrPainPoint.trim()) {
      setError('Please add an industry, ICP persona, and topic/pain point focus.');
      return;
    }

    setIsLoading(true);
    try {
      trackAgentEvent({
        eventType: 'run',
        agentId: 'lead-magnet-generator',
        userId: user?.id || null,
        payload: {
          leadMagnetGoal: form.leadMagnetGoal,
          tone: form.tone,
          industry: form.industry,
        },
      });

      const resp = await fetch('/api/agents/lead-magnet-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, userId: user?.id || null }),
      });
      const data = await resp.json();

      if (!resp.ok) {
        setError(data?.error || 'Failed to generate lead magnet. Please try again.');
        return;
      }

      setOutput(data.output as LeadMagnetGeneratorOutput);

      if (!user) {
        const nextRuns = Math.max(0, freeRunsUsed) + 1;
        localStorage.setItem(FREE_RUNS_KEY, String(nextRuns));
        setFreeRunsUsed(nextRuns);
      }

      trackAgentEvent({
        eventType: 'generated',
        agentId: 'lead-magnet-generator',
        userId: user?.id || null,
        payload: {
          leadMagnetGoal: form.leadMagnetGoal,
          tone: form.tone,
          industry: form.industry,
        },
      });
    } catch (e: any) {
      setError(e?.message || 'Failed to generate lead magnet. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const fullCopyText = useMemo(() => {
    if (!output) return '';
    const lines = [
      'TITLE OPTIONS:',
      ...output.titleOptions.map(s => `- ${s}`),
      '',
      `RECOMMENDED FORMAT: ${output.recommendedFormat}`,
      '',
      'FORMAT VARIANTS:',
      ...output.formatVariants.flatMap(v => [
        `- ${v.format}: ${v.hook}`,
        ...v.outline.map(o => `  • ${o}`),
      ]),
      '',
      'LEAD MAGNET DRAFT:',
      output.leadMagnetDraft,
      '',
      'LANDING PAGE COPY SNIPPET:',
      output.landingPageCopySnippet,
      '',
      'CTA SUGGESTIONS:',
      ...output.ctaSuggestions.map(c => `- ${c}`),
      '',
      'FORM PROMPT SUGGESTIONS:',
      ...output.formPromptSuggestions.map(p => `- ${p}`),
      '',
      'NURTURE EMAIL:',
      `Subject: ${output.nurtureEmailDraft.subject}`,
      '',
      output.nurtureEmailDraft.body,
    ];
    return lines.join('\n');
  }, [output]);

  return (
    <div className="min-h-screen pt-20 pb-16 px-4">
      <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-500">
        <div className="space-y-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-[#666] hover:text-white transition-colors text-xs font-bold uppercase tracking-widest"
          >
            <ArrowLeft size={14} /> Back
          </button>

          <div className="flex items-start justify-between gap-6 flex-col md:flex-row">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded bg-electric-blue/10 border border-electric-blue/20 flex items-center justify-center text-electric-blue">
                  <FileText size={22} />
                </div>
                <h1 className="text-3xl md:text-4xl font-black tracking-tight">Lead Magnet Generator</h1>
              </div>
              <p className="text-[#888] text-base max-w-2xl">
                Generate a high-converting PDF-style lead magnet draft plus landing page copy, CTAs, form prompts, and a nurture email.
              </p>

              {!user && (
                <div className="inline-flex items-center gap-2 px-3 py-2 rounded border border-electric-blue/20 bg-electric-blue/5 text-electric-blue text-[10px] font-black uppercase tracking-[0.2em]">
                  <Sparkles size={14} /> Free first run, sign up for unlimited
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <a
                href="/ai-agents/lead-magnet-generator"
                className="px-4 py-3 rounded border border-[#1f1f1f] bg-black text-[10px] font-black uppercase tracking-[0.2em] text-[#888] hover:text-white hover:border-[#333] transition-all"
              >
                SEO Page
              </a>
              {!user && (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="px-4 py-3 rounded bg-white text-black text-[10px] font-black uppercase tracking-[0.2em] hover:bg-[#eee] transition-all"
                >
                  Sign Up
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-4">
            <div className="p-6 rounded-lg border border-[#1f1f1f] bg-[#0a0a0a] space-y-5">
              <div className="space-y-2">
                <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#444]">Inputs</h2>
                <p className="text-xs text-[#666] font-medium leading-relaxed">
                  Tip: Add one proof point placeholder (a stat, case study result, or customer quote) to make the asset more credible.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <label className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#666]">Industry</span>
                  <input
                    value={form.industry}
                    onChange={e => setForm(prev => ({ ...prev, industry: e.target.value }))}
                    placeholder="e.g., B2B SaaS, Healthcare, Fintech"
                    className="w-full bg-black border border-[#1f1f1f] rounded py-3 px-4 focus:outline-none focus:border-[#333] text-sm font-medium"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#666]">ICP persona</span>
                  <input
                    value={form.icpPersona}
                    onChange={e => setForm(prev => ({ ...prev, icpPersona: e.target.value }))}
                    placeholder="e.g., VP Marketing at Series B B2B SaaS, Director of RevOps at mid-market"
                    className="w-full bg-black border border-[#1f1f1f] rounded py-3 px-4 focus:outline-none focus:border-[#333] text-sm font-medium"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#666]">Lead magnet goal</span>
                  <select
                    value={form.leadMagnetGoal}
                    onChange={e => setForm(prev => ({ ...prev, leadMagnetGoal: e.target.value as LeadMagnetGoal }))}
                    className="w-full bg-black border border-[#1f1f1f] rounded py-3 px-4 focus:outline-none focus:border-[#333] text-sm font-medium"
                  >
                    <option>Capture leads</option>
                    <option>Webinar</option>
                    <option>Outbound</option>
                    <option>Product education</option>
                    <option>Newsletter growth</option>
                  </select>
                </label>

                <label className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#666]">Topic / pain point focus</span>
                  <input
                    value={form.topicOrPainPoint}
                    onChange={e => setForm(prev => ({ ...prev, topicOrPainPoint: e.target.value }))}
                    placeholder="e.g., improving demo-to-close, pipeline quality, churn reduction, onboarding speed"
                    className="w-full bg-black border border-[#1f1f1f] rounded py-3 px-4 focus:outline-none focus:border-[#333] text-sm font-medium"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#666]">Tone</span>
                  <select
                    value={form.tone}
                    onChange={e => setForm(prev => ({ ...prev, tone: e.target.value as Tone }))}
                    className="w-full bg-black border border-[#1f1f1f] rounded py-3 px-4 focus:outline-none focus:border-[#333] text-sm font-medium"
                  >
                    <option>Professional</option>
                    <option>Direct</option>
                    <option>Friendly</option>
                    <option>Founder-style</option>
                  </select>
                </label>

                <label className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#666]">Company description (optional)</span>
                  <textarea
                    value={form.companyDescription}
                    onChange={e => setForm(prev => ({ ...prev, companyDescription: e.target.value }))}
                    placeholder="What do you sell? Who is it for? One differentiator + one proof point."
                    rows={4}
                    className="w-full bg-black border border-[#1f1f1f] rounded py-3 px-4 focus:outline-none focus:border-[#333] text-sm font-medium"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#666]">Brand style notes (optional)</span>
                  <textarea
                    value={form.brandStyleNotes}
                    onChange={e => setForm(prev => ({ ...prev, brandStyleNotes: e.target.value }))}
                    placeholder="e.g., crisp, no fluff, slightly opinionated. Avoid buzzwords."
                    rows={3}
                    className="w-full bg-black border border-[#1f1f1f] rounded py-3 px-4 focus:outline-none focus:border-[#333] text-sm font-medium"
                  />
                </label>

                {error && (
                  <div className="p-4 rounded border border-pink-500/30 bg-pink-500/5 text-pink-200 text-xs font-medium">
                    {error}
                  </div>
                )}

                <button
                  onClick={handleGenerate}
                  disabled={isLoading}
                  className="w-full bg-white text-black py-4 rounded font-black text-xs flex items-center justify-center gap-3 hover:bg-[#eee] transition-all uppercase tracking-widest disabled:opacity-60"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Bot size={16} />
                      Generate Lead Magnet
                    </>
                  )}
                </button>

                {!user && !canRun && (
                  <p className="text-[11px] text-[#666] text-center">
                    You’ve used your free run. Sign up to generate more.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4">
            <div className="p-6 rounded-lg border border-[#1f1f1f] bg-[#0a0a0a] space-y-5">
              <div className="flex items-start justify-between gap-4 flex-col sm:flex-row">
                <div className="space-y-1">
                  <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#444]">Output</h2>
                  <p className="text-xs text-[#666] font-medium">
                    You’ll get title options, format variants, a full draft, conversion copy, and a nurture email.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      safeCopy(fullCopyText);
                      trackAgentEvent({
                        eventType: 'copy',
                        agentId: 'lead-magnet-generator',
                        userId: user?.id || null,
                        payload: { scope: 'all' },
                      });
                    }}
                    disabled={!output}
                    className="px-4 py-3 rounded bg-black border border-[#1f1f1f] text-[10px] font-black uppercase tracking-[0.2em] text-[#888] hover:text-white hover:border-[#333] transition-all disabled:opacity-50"
                  >
                    <Copy size={14} className="inline-block mr-2" />
                    Copy All
                  </button>
                  <button
                    onClick={() => {
                      if (!fullCopyText) return;
                      const blob = new Blob([fullCopyText], { type: 'text/plain;charset=utf-8' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'lead-magnet.txt';
                      document.body.appendChild(a);
                      a.click();
                      a.remove();
                      URL.revokeObjectURL(url);
                      trackAgentEvent({
                        eventType: 'download',
                        agentId: 'lead-magnet-generator',
                        userId: user?.id || null,
                        payload: { scope: 'all' },
                      });
                    }}
                    disabled={!output}
                    className="px-4 py-3 rounded bg-black border border-[#1f1f1f] text-[10px] font-black uppercase tracking-[0.2em] text-[#888] hover:text-white hover:border-[#333] transition-all disabled:opacity-50"
                  >
                    Download
                  </button>
                </div>
              </div>

              {!output && (
                <div className="p-10 rounded border border-dashed border-[#1f1f1f] bg-black text-center space-y-3">
                  <div className="w-14 h-14 rounded-full bg-electric-blue/5 border border-electric-blue/20 mx-auto flex items-center justify-center text-electric-blue">
                    <Sparkles size={22} />
                  </div>
                  <p className="text-sm text-[#888] font-medium">
                    Fill the inputs and click Generate to get a full lead magnet draft + landing page copy.
                  </p>
                  <p className="text-[11px] text-[#666]">
                    Output is optimized for persona relevance and conversion-focused framing.
                  </p>
                </div>
              )}

              {output && (
                <div className="space-y-6">
                  <section className="space-y-3">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#666]">Title options</h3>
                    <ul className="space-y-2">
                      {output.titleOptions.map((t, idx) => (
                        <li key={idx} className="p-3 rounded border border-[#1f1f1f] bg-black text-sm text-[#ddd]">
                          {t}
                        </li>
                      ))}
                    </ul>
                  </section>

                  <section className="space-y-3">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#666]">
                      Recommended format: <span className="text-white">{output.recommendedFormat}</span>
                    </h3>
                    <div className="grid grid-cols-1 gap-3">
                      {output.formatVariants.map((v, idx) => (
                        <div key={idx} className="p-5 rounded border border-[#1f1f1f] bg-black space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-black text-white">{v.format}</p>
                              <p className="text-sm text-[#666] mt-1">{v.hook}</p>
                            </div>
                          </div>
                          <ul className="space-y-1 text-sm text-[#ddd]">
                            {v.outline.map((o, j) => (
                              <li key={j}>• {o}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="space-y-3">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#666]">Lead magnet draft</h3>
                    <pre className="whitespace-pre-wrap p-4 rounded border border-[#1f1f1f] bg-black text-sm text-[#ddd] leading-relaxed font-sans">
                      {output.leadMagnetDraft}
                    </pre>
                  </section>

                  <section className="space-y-3">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#666]">Landing page copy snippet</h3>
                    <pre className="whitespace-pre-wrap p-4 rounded border border-[#1f1f1f] bg-black text-sm text-[#ddd] leading-relaxed font-sans">
                      {output.landingPageCopySnippet}
                    </pre>
                  </section>

                  <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-5 rounded border border-[#1f1f1f] bg-black space-y-3">
                      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#666]">CTA suggestions</h3>
                      <ul className="space-y-2 text-sm text-[#ddd]">
                        {output.ctaSuggestions.map((c, idx) => (
                          <li key={idx}>• {c}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-5 rounded border border-[#1f1f1f] bg-black space-y-3">
                      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#666]">Form prompt suggestions</h3>
                      <ul className="space-y-2 text-sm text-[#ddd]">
                        {output.formPromptSuggestions.map((p, idx) => (
                          <li key={idx}>• {p}</li>
                        ))}
                      </ul>
                    </div>
                  </section>

                  <section className="p-5 rounded border border-[#1f1f1f] bg-black space-y-3">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#666]">Follow-up nurture email</h3>
                    <p className="text-sm text-[#ddd] font-bold">Subject: {output.nurtureEmailDraft.subject}</p>
                    <pre className="whitespace-pre-wrap text-sm text-[#ddd] leading-relaxed font-sans">
                      {output.nurtureEmailDraft.body}
                    </pre>
                  </section>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/95" onClick={() => setShowAuthModal(false)}></div>
          <div className="relative bg-[#0a0a0a] w-full max-w-sm p-10 rounded-lg border border-[#1f1f1f] space-y-10 shadow-2xl">
            <div className="text-center space-y-3">
              <h3 className="text-3xl font-black">Unlock Unlimited.</h3>
              <p className="text-[#666] text-xs font-medium leading-relaxed">
                You’ve used the free run. Sign up to generate unlimited lead magnets and save outputs.
              </p>
            </div>
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => {
                  trackAgentEvent({
                    eventType: 'signup_intent_google',
                    agentId: 'lead-magnet-generator',
                    userId: user?.id || null,
                  });
                  alert('Google sign-in is coming soon. Use the email signup below for now.');
                }}
                className="w-full bg-white text-black py-4 rounded font-bold text-xs flex items-center justify-center gap-3 hover:bg-[#eee] transition-all uppercase tracking-widest"
              >
                <Globe size={18} /> Continue with Google
              </button>
              <div className="flex items-center gap-4 py-2 opacity-20">
                <div className="h-px bg-white flex-1"></div>
                <span className="text-[10px] text-white font-black">OR</span>
                <div className="h-px bg-white flex-1"></div>
              </div>
              <form onSubmit={handleSignup} className="space-y-4">
                <input
                  required
                  type="text"
                  name="name"
                  placeholder="Name"
                  className="w-full bg-black border border-[#1f1f1f] rounded py-3.5 px-4 focus:outline-none focus:border-[#333] text-sm font-medium"
                />
                <input
                  required
                  type="email"
                  name="email"
                  placeholder="Email address"
                  className="w-full bg-black border border-[#1f1f1f] rounded py-3.5 px-4 focus:outline-none focus:border-[#333] text-sm font-medium"
                />
                <button
                  type="submit"
                  className="w-full bg-[#111] border border-[#1f1f1f] text-white py-4 rounded font-bold text-xs hover:bg-[#1a1a1a] transition-all uppercase tracking-widest"
                >
                  Sign Up
                </button>
              </form>
            </div>
            <p className="text-[9px] text-center text-[#333] uppercase tracking-[0.2em] font-black">
              Secure protocol enabled • powered by 10ex
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Bot, Copy, FileText, Globe, Loader2, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';

type LeadMagnetGoal = 'Capture leads' | 'Webinar' | 'Outbound' | 'Product education' | 'Newsletter growth';
type Tone = 'Professional' | 'Direct' | 'Friendly' | 'Founder-style';
type LeadMagnetFormat = 'Checklist' | 'Playbook' | 'Report' | 'Template';

type LeadMagnetGeneratorInput = {
  industry: string;
  icpPersona: string;
  leadMagnetGoal: LeadMagnetGoal;
  topicOrPainPoint: string;
  tone: Tone;
  companyDescription?: string;
  brandStyleNotes?: string;
};

type LeadMagnetGeneratorOutput = {
  titleOptions: string[];
  recommendedFormat: LeadMagnetFormat;
  formatVariants: Array<{
    format: LeadMagnetFormat;
    hook: string;
    outline: string[];
  }>;
  leadMagnetDraft: string;
  landingPageCopySnippet: string;
  ctaSuggestions: string[];
  formPromptSuggestions: string[];
  nurtureEmailDraft: {
    subject: string;
    body: string;
  };
};

type User = {
  id: string;
  name: string;
  email: string;
  points: number;
  referralCode: string;
  joinedAt: string;
  likedToolIds?: string[];
  starredToolIds?: string[];
  bookmarkedToolIds?: string[];
};

const FREE_RUNS_KEY = 'agents:lead-magnet-generator:freeRunsUsed';
const SESSION_ID_KEY = 'agents:sessionId';

function getOrCreateSessionId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const existing = localStorage.getItem(SESSION_ID_KEY);
    if (existing && existing.trim()) return existing;
    const id = `s_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
    localStorage.setItem(SESSION_ID_KEY, id);
    return id;
  } catch {
    return null;
  }
}

async function trackAgentEvent(event: { eventType: string; agentId: string; userId?: string | null; payload?: any }) {
  try {
    const sessionId = getOrCreateSessionId();
    await fetch('/api/agents/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...event, sessionId }),
    });
  } catch {
    // fail silently
  }
}

function safeCopy(text: string) {
  if (!text) return;
  navigator.clipboard.writeText(text).catch(() => {});
}

export default function LeadMagnetGeneratorPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [freeRunsUsed, setFreeRunsUsed] = useState(0);

  const [form, setForm] = useState<LeadMagnetGeneratorInput>({
    industry: '',
    icpPersona: '',
    leadMagnetGoal: 'Capture leads',
    topicOrPainPoint: '',
    tone: 'Professional',
    companyDescription: '',
    brandStyleNotes: '',
  });

  const [output, setOutput] = useState<LeadMagnetGeneratorOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const canRun = useMemo(() => {
    if (user) return true;
    return freeRunsUsed < 1;
  }, [user, freeRunsUsed]);

  useEffect(() => {
    const raw = localStorage.getItem(FREE_RUNS_KEY);
    const n = raw ? Number(raw) : 0;
    setFreeRunsUsed(Number.isFinite(n) ? n : 0);

    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        // ignore
      }
    }
  }, []);

  useEffect(() => {
    trackAgentEvent({
      eventType: 'view',
      agentId: 'lead-magnet-generator',
      userId: user?.id || null,
    });
  }, [user?.id]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const formEl = e.target as HTMLFormElement;
    const formData = new FormData(formEl);
    const name = (formData.get('name') as string) || 'User';
    const email = (formData.get('email') as string) || '';

    if (!email) return;

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email }),
      });
      const data = await response.json();
      if (data.user) {
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
        setShowAuthModal(false);
        trackAgentEvent({
          eventType: 'signup',
          agentId: 'lead-magnet-generator',
          userId: data.user.id,
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerate = async () => {
    setError(null);
    setOutput(null);

    if (!canRun) {
      setShowAuthModal(true);
      return;
    }

    if (!form.industry.trim() || !form.icpPersona.trim() || !form.topicOrPainPoint.trim()) {
      setError('Please add an industry, ICP persona, and a topic/pain point focus.');
      return;
    }

    setIsLoading(true);
    try {
      trackAgentEvent({
        eventType: 'run',
        agentId: 'lead-magnet-generator',
        userId: user?.id || null,
        payload: {
          leadMagnetGoal: form.leadMagnetGoal,
          tone: form.tone,
          industry: form.industry,
          icpPersona: form.icpPersona,
        },
      });

      const resp = await fetch('/api/agents/lead-magnet-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, userId: user?.id || null }),
      });
      const data = await resp.json();

      if (!resp.ok) {
        setError(data?.error || 'Failed to generate lead magnet. Please try again.');
        return;
      }

      setOutput(data.output as LeadMagnetGeneratorOutput);

      if (!user) {
        const nextRuns = Math.max(0, freeRunsUsed) + 1;
        localStorage.setItem(FREE_RUNS_KEY, String(nextRuns));
        setFreeRunsUsed(nextRuns);
      }

      trackAgentEvent({
        eventType: 'generated',
        agentId: 'lead-magnet-generator',
        userId: user?.id || null,
        payload: {
          leadMagnetGoal: form.leadMagnetGoal,
          tone: form.tone,
          industry: form.industry,
        },
      });
    } catch (e: any) {
      setError(e?.message || 'Failed to generate lead magnet. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const fullCopyText = useMemo(() => {
    if (!output) return '';
    const lines = [
      'TITLE OPTIONS:',
      ...output.titleOptions.map(t => `- ${t}`),
      '',
      `RECOMMENDED FORMAT: ${output.recommendedFormat}`,
      '',
      'FORMAT VARIANTS:',
      ...output.formatVariants.flatMap(v => [
        `- ${v.format}: ${v.hook}`,
        ...v.outline.map(o => `  • ${o}`),
      ]),
      '',
      'LEAD MAGNET DRAFT:',
      output.leadMagnetDraft,
      '',
      'LANDING PAGE COPY SNIPPET:',
      output.landingPageCopySnippet,
      '',
      'CTA SUGGESTIONS:',
      ...output.ctaSuggestions.map(c => `- ${c}`),
      '',
      'FORM PROMPT SUGGESTIONS:',
      ...output.formPromptSuggestions.map(p => `- ${p}`),
      '',
      'FOLLOW-UP NURTURE EMAIL:',
      `Subject: ${output.nurtureEmailDraft.subject}`,
      '',
      output.nurtureEmailDraft.body,
    ];
    return lines.join('\n');
  }, [output]);

  return (
    <div className="min-h-screen pt-20 pb-16 px-4">
      <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-500">
        <div className="space-y-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-[#666] hover:text-white transition-colors text-xs font-bold uppercase tracking-widest"
          >
            <ArrowLeft size={14} /> Back
          </button>

          <div className="flex items-start justify-between gap-6 flex-col md:flex-row">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded bg-electric-blue/10 border border-electric-blue/20 flex items-center justify-center text-electric-blue">
                  <FileText size={22} />
                </div>
                <h1 className="text-3xl md:text-4xl font-black tracking-tight">Lead Magnet Generator</h1>
              </div>
              <p className="text-[#888] text-base max-w-2xl">
                Generate a high-converting lead magnet draft (PDF-style) plus landing page copy, CTA ideas, and a follow-up nurture email.
              </p>

              {!user && (
                <div className="inline-flex items-center gap-2 px-3 py-2 rounded border border-electric-blue/20 bg-electric-blue/5 text-electric-blue text-[10px] font-black uppercase tracking-[0.2em]">
                  <Sparkles size={14} /> Free first run, sign up for unlimited
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <a
                href="/ai-agents/lead-magnet-generator"
                className="px-4 py-3 rounded border border-[#1f1f1f] bg-black text-[10px] font-black uppercase tracking-[0.2em] text-[#888] hover:text-white hover:border-[#333] transition-all"
              >
                SEO Page
              </a>
              {!user && (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="px-4 py-3 rounded bg-white text-black text-[10px] font-black uppercase tracking-[0.2em] hover:bg-[#eee] transition-all"
                >
                  Sign Up
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-4">
            <div className="p-6 rounded-lg border border-[#1f1f1f] bg-[#0a0a0a] space-y-5">
              <div className="space-y-2">
                <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#444]">Inputs</h2>
                <p className="text-xs text-[#666] font-medium leading-relaxed">
                  Tip: For best results, include a narrow ICP and a “this hurts now” pain point. Add a proof placeholder if you have one.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <label className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#666]">Lead magnet goal</span>
                  <select
                    value={form.leadMagnetGoal}
                    onChange={e => setForm(prev => ({ ...prev, leadMagnetGoal: e.target.value as LeadMagnetGoal }))}
                    className="w-full bg-black border border-[#1f1f1f] rounded py-3 px-4 focus:outline-none focus:border-[#333] text-sm font-medium"
                  >
                    <option>Capture leads</option>
                    <option>Webinar</option>
                    <option>Outbound</option>
                    <option>Product education</option>
                    <option>Newsletter growth</option>
                  </select>
                </label>

                <label className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#666]">Industry</span>
                  <input
                    value={form.industry}
                    onChange={e => setForm(prev => ({ ...prev, industry: e.target.value }))}
                    placeholder="e.g., B2B SaaS, Healthcare, Fintech"
                    className="w-full bg-black border border-[#1f1f1f] rounded py-3 px-4 focus:outline-none focus:border-[#333] text-sm font-medium"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#666]">ICP persona</span>
                  <input
                    value={form.icpPersona}
                    onChange={e => setForm(prev => ({ ...prev, icpPersona: e.target.value }))}
                    placeholder="e.g., VP Marketing at Series B B2B SaaS, RevOps lead at mid-market"
                    className="w-full bg-black border border-[#1f1f1f] rounded py-3 px-4 focus:outline-none focus:border-[#333] text-sm font-medium"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#666]">Topic / pain point focus</span>
                  <input
                    value={form.topicOrPainPoint}
                    onChange={e => setForm(prev => ({ ...prev, topicOrPainPoint: e.target.value }))}
                    placeholder="e.g., low-quality pipeline, webinar attendance, outbound reply rate, churn risk"
                    className="w-full bg-black border border-[#1f1f1f] rounded py-3 px-4 focus:outline-none focus:border-[#333] text-sm font-medium"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#666]">Tone</span>
                  <select
                    value={form.tone}
                    onChange={e => setForm(prev => ({ ...prev, tone: e.target.value as Tone }))}
                    className="w-full bg-black border border-[#1f1f1f] rounded py-3 px-4 focus:outline-none focus:border-[#333] text-sm font-medium"
                  >
                    <option>Professional</option>
                    <option>Direct</option>
                    <option>Friendly</option>
                    <option>Founder-style</option>
                  </select>
                </label>

                <label className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#666]">Company description (optional)</span>
                  <textarea
                    value={form.companyDescription}
                    onChange={e => setForm(prev => ({ ...prev, companyDescription: e.target.value }))}
                    placeholder="What do you sell? Who is it for? One differentiator + one proof point."
                    rows={4}
                    className="w-full bg-black border border-[#1f1f1f] rounded py-3 px-4 focus:outline-none focus:border-[#333] text-sm font-medium"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#666]">Tone / brand style notes (optional)</span>
                  <textarea
                    value={form.brandStyleNotes}
                    onChange={e => setForm(prev => ({ ...prev, brandStyleNotes: e.target.value }))}
                    placeholder="e.g., crisp, no fluff, mild humor, use short sentences, avoid buzzwords"
                    rows={3}
                    className="w-full bg-black border border-[#1f1f1f] rounded py-3 px-4 focus:outline-none focus:border-[#333] text-sm font-medium"
                  />
                </label>

                {error && (
                  <div className="p-4 rounded border border-pink-500/30 bg-pink-500/5 text-pink-200 text-xs font-medium">
                    {error}
                  </div>
                )}

                <button
                  onClick={handleGenerate}
                  disabled={isLoading}
                  className="w-full bg-white text-black py-4 rounded font-black text-xs flex items-center justify-center gap-3 hover:bg-[#eee] transition-all uppercase tracking-widest disabled:opacity-60"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Bot size={16} />
                      Generate Lead Magnet
                    </>
                  )}
                </button>

                {!user && !canRun && (
                  <p className="text-[11px] text-[#666] text-center">You’ve used your free run. Sign up to generate more.</p>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4">
            <div className="p-6 rounded-lg border border-[#1f1f1f] bg-[#0a0a0a] space-y-5">
              <div className="flex items-start justify-between gap-4 flex-col sm:flex-row">
                <div className="space-y-1">
                  <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#444]">Output</h2>
                  <p className="text-xs text-[#666] font-medium">Includes titles, format variants, a full draft, landing page copy, CTAs, and a nurture email.</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      safeCopy(fullCopyText);
                      trackAgentEvent({ eventType: 'copy', agentId: 'lead-magnet-generator', userId: user?.id || null, payload: { scope: 'all' } });
                    }}
                    disabled={!output}
                    className="px-4 py-3 rounded bg-black border border-[#1f1f1f] text-[10px] font-black uppercase tracking-[0.2em] text-[#888] hover:text-white hover:border-[#333] transition-all disabled:opacity-50"
                  >
                    <Copy size={14} className="inline-block mr-2" />
                    Copy All
                  </button>
                  <button
                    onClick={() => {
                      if (!fullCopyText) return;
                      const blob = new Blob([fullCopyText], { type: 'text/plain;charset=utf-8' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'lead-magnet.txt';
                      document.body.appendChild(a);
                      a.click();
                      a.remove();
                      URL.revokeObjectURL(url);
                      trackAgentEvent({ eventType: 'download', agentId: 'lead-magnet-generator', userId: user?.id || null, payload: { scope: 'all' } });
                    }}
                    disabled={!output}
                    className="px-4 py-3 rounded bg-black border border-[#1f1f1f] text-[10px] font-black uppercase tracking-[0.2em] text-[#888] hover:text-white hover:border-[#333] transition-all disabled:opacity-50"
                  >
                    Download
                  </button>
                </div>
              </div>

              {!output && (
                <div className="p-10 rounded border border-dashed border-[#1f1f1f] bg-black text-center space-y-3">
                  <div className="w-14 h-14 rounded-full bg-electric-blue/5 border border-electric-blue/20 mx-auto flex items-center justify-center text-electric-blue">
                    <Sparkles size={22} />
                  </div>
                  <p className="text-sm text-[#888] font-medium">Fill the inputs and click Generate to get a full lead magnet draft and conversion assets.</p>
                  <p className="text-[11px] text-[#666]">Optimized for persona relevance, hooks, and conversion copywriting.</p>
                </div>
              )}

              {output && (
                <div className="space-y-6">
                  <section className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#666]">Title options</h3>
                      <button
                        onClick={() => {
                          safeCopy(output.titleOptions.join('\n'));
                          trackAgentEvent({ eventType: 'copy', agentId: 'lead-magnet-generator', userId: user?.id || null, payload: { scope: 'titleOptions' } });
                        }}
                        className="text-[10px] font-black uppercase tracking-[0.2em] text-electric-blue hover:underline"
                      >
                        Copy
                      </button>
                    </div>
                    <ul className="space-y-2">
                      {output.titleOptions.map((t, idx) => (
                        <li key={idx} className="p-3 rounded border border-[#1f1f1f] bg-black text-sm text-[#ddd]">
                          {t}
                        </li>
                      ))}
                    </ul>
                    <p className="text-[11px] text-[#666]">
                      Recommended format:{' '}
                      <span className="text-[#ddd] font-bold">{output.recommendedFormat}</span>
                    </p>
                  </section>

                  <section className="space-y-3">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#666]">Format variants (multiple angles)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {output.formatVariants.map((v, idx) => (
                        <div key={idx} className="p-5 rounded border border-[#1f1f1f] bg-black space-y-3">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-electric-blue">{v.format}</p>
                            <button
                              onClick={() => {
                                safeCopy([`${v.format}: ${v.hook}`, ...v.outline.map(o => `- ${o}`)].join('\n'));
                                trackAgentEvent({ eventType: 'copy', agentId: 'lead-magnet-generator', userId: user?.id || null, payload: { scope: `formatVariant:${v.format}` } });
                              }}
                              className="text-[10px] font-black uppercase tracking-[0.2em] text-electric-blue hover:underline"
                            >
                              Copy
                            </button>
                          </div>
                          <p className="text-sm text-[#ddd] leading-relaxed">{v.hook}</p>
                          <ul className="text-sm text-[#666] space-y-1">
                            {v.outline.map((o, j) => (
                              <li key={j}>• {o}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#666]">Lead magnet draft</h3>
                      <button
                        onClick={() => {
                          safeCopy(output.leadMagnetDraft);
                          trackAgentEvent({ eventType: 'copy', agentId: 'lead-magnet-generator', userId: user?.id || null, payload: { scope: 'leadMagnetDraft' } });
                        }}
                        className="text-[10px] font-black uppercase tracking-[0.2em] text-electric-blue hover:underline"
                      >
                        Copy
                      </button>
                    </div>
                    <pre className="whitespace-pre-wrap p-4 rounded border border-[#1f1f1f] bg-black text-sm text-[#ddd] leading-relaxed font-sans">
                      {output.leadMagnetDraft}
                    </pre>
                  </section>

                  <section className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#666]">Landing page copy snippet</h3>
                      <button
                        onClick={() => {
                          safeCopy(output.landingPageCopySnippet);
                          trackAgentEvent({ eventType: 'copy', agentId: 'lead-magnet-generator', userId: user?.id || null, payload: { scope: 'landingPageCopySnippet' } });
                        }}
                        className="text-[10px] font-black uppercase tracking-[0.2em] text-electric-blue hover:underline"
                      >
                        Copy
                      </button>
                    </div>
                    <pre className="whitespace-pre-wrap p-4 rounded border border-[#1f1f1f] bg-black text-sm text-[#ddd] leading-relaxed font-sans">
                      {output.landingPageCopySnippet}
                    </pre>
                  </section>

                  <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-5 rounded border border-[#1f1f1f] bg-black space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#666]">CTA suggestions</h3>
                        <button
                          onClick={() => {
                            safeCopy(output.ctaSuggestions.join('\n'));
                            trackAgentEvent({ eventType: 'copy', agentId: 'lead-magnet-generator', userId: user?.id || null, payload: { scope: 'ctaSuggestions' } });
                          }}
                          className="text-[10px] font-black uppercase tracking-[0.2em] text-electric-blue hover:underline"
                        >
                          Copy
                        </button>
                      </div>
                      <ul className="space-y-2">
                        {output.ctaSuggestions.map((c, idx) => (
                          <li key={idx} className="text-sm text-[#ddd]">
                            • {c}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-5 rounded border border-[#1f1f1f] bg-black space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#666]">Form prompt suggestions</h3>
                        <button
                          onClick={() => {
                            safeCopy(output.formPromptSuggestions.join('\n'));
                            trackAgentEvent({ eventType: 'copy', agentId: 'lead-magnet-generator', userId: user?.id || null, payload: { scope: 'formPromptSuggestions' } });
                          }}
                          className="text-[10px] font-black uppercase tracking-[0.2em] text-electric-blue hover:underline"
                        >
                          Copy
                        </button>
                      </div>
                      <ul className="space-y-2">
                        {output.formPromptSuggestions.map((p, idx) => (
                          <li key={idx} className="text-sm text-[#ddd]">
                            • {p}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </section>

                  <section className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#666]">Follow-up nurture email</h3>
                      <button
                        onClick={() => {
                          safeCopy(`Subject: ${output.nurtureEmailDraft.subject}\n\n${output.nurtureEmailDraft.body}`);
                          trackAgentEvent({ eventType: 'copy', agentId: 'lead-magnet-generator', userId: user?.id || null, payload: { scope: 'nurtureEmailDraft' } });
                        }}
                        className="text-[10px] font-black uppercase tracking-[0.2em] text-electric-blue hover:underline"
                      >
                        Copy
                      </button>
                    </div>
                    <div className="p-5 rounded border border-[#1f1f1f] bg-black space-y-3">
                      <p className="text-sm text-[#888] font-bold">Subject: {output.nurtureEmailDraft.subject}</p>
                      <pre className="whitespace-pre-wrap text-sm text-[#ddd] leading-relaxed font-sans">{output.nurtureEmailDraft.body}</pre>
                    </div>
                  </section>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/95" onClick={() => setShowAuthModal(false)}></div>
          <div className="relative bg-[#0a0a0a] w-full max-w-sm p-10 rounded-lg border border-[#1f1f1f] space-y-10 shadow-2xl">
            <div className="text-center space-y-3">
              <h3 className="text-3xl font-black">Unlock Unlimited.</h3>
              <p className="text-[#666] text-xs font-medium leading-relaxed">
                You’ve used the free run. Sign up to generate unlimited lead magnets and save outputs.
              </p>
            </div>
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => {
                  trackAgentEvent({
                    eventType: 'signup_intent_google',
                    agentId: 'lead-magnet-generator',
                    userId: user?.id || null,
                  });
                  alert('Google sign-in is coming soon. Use the email signup below for now.');
                }}
                className="w-full bg-white text-black py-4 rounded font-bold text-xs flex items-center justify-center gap-3 hover:bg-[#eee] transition-all uppercase tracking-widest"
              >
                <Globe size={18} /> Continue with Google
              </button>
              <div className="flex items-center gap-4 py-2 opacity-20">
                <div className="h-px bg-white flex-1"></div>
                <span className="text-[10px] text-white font-black">OR</span>
                <div className="h-px bg-white flex-1"></div>
              </div>
              <form onSubmit={handleSignup} className="space-y-4">
                <input
                  required
                  type="text"
                  name="name"
                  placeholder="Name"
                  className="w-full bg-black border border-[#1f1f1f] rounded py-3.5 px-4 focus:outline-none focus:border-[#333] text-sm font-medium"
                />
                <input
                  required
                  type="email"
                  name="email"
                  placeholder="Email address"
                  className="w-full bg-black border border-[#1f1f1f] rounded py-3.5 px-4 focus:outline-none focus:border-[#333] text-sm font-medium"
                />
                <button
                  type="submit"
                  className="w-full bg-[#111] border border-[#1f1f1f] text-white py-4 rounded font-bold text-xs hover:bg-[#1a1a1a] transition-all uppercase tracking-widest"
                >
                  Sign Up
                </button>
              </form>
            </div>
            <p className="text-[9px] text-center text-[#333] uppercase tracking-[0.2em] font-black">
              Secure protocol enabled • powered by 10ex
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

