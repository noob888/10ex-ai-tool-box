'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Bot, Copy, Globe, Loader2, Mail, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';

type EmailGoal =
  | 'Cold outbound'
  | 'Follow-up'
  | 'Partnership'
  | 'Webinar invite'
  | 'Customer onboarding'
  | 'Re-engagement';

type Tone = 'Professional' | 'Direct' | 'Friendly' | 'Founder-style';

type EmailGeneratorInput = {
  emailGoal: EmailGoal;
  targetPersona: string;
  companyDescription: string;
  tone: Tone;
  optionalContext?: string;
  painPointFocus?: string;
  industry?: string;
};

type EmailGeneratorOutput = {
  subjectLines: string[];
  shortVersion: string;
  longVersion: string;
  personalizationTokens: string[];
  ctaVariants: string[];
  followUpSuggestion: string;
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

const FREE_RUNS_KEY = 'agents:email-template-generator:freeRunsUsed';
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

export default function EmailTemplateGeneratorPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [freeRunsUsed, setFreeRunsUsed] = useState(0);

  const [form, setForm] = useState<EmailGeneratorInput>({
    emailGoal: 'Cold outbound',
    targetPersona: '',
    companyDescription: '',
    tone: 'Professional',
    optionalContext: '',
    painPointFocus: '',
    industry: '',
  });

  const [output, setOutput] = useState<EmailGeneratorOutput | null>(null);
  const [outputMeta, setOutputMeta] = useState<{ isFallback: boolean; provider?: string } | null>(null);
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
      agentId: 'email-template-generator',
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
          agentId: 'email-template-generator',
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
    setOutputMeta(null);

    if (!canRun) {
      setShowAuthModal(true);
      return;
    }

    if (!form.targetPersona.trim() || !form.companyDescription.trim()) {
      setError('Please add a target persona and a short company/product description.');
      return;
    }

    setIsLoading(true);
    try {
      trackAgentEvent({
        eventType: 'run',
        agentId: 'email-template-generator',
        userId: user?.id || null,
        payload: {
          emailGoal: form.emailGoal,
          tone: form.tone,
          industry: form.industry || null,
          targetPersona: form.targetPersona,
        },
      });

      const resp = await fetch('/api/agents/email-template-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, userId: user?.id || null }),
      });
      const data = await resp.json();

      if (!resp.ok) {
        setError(data?.error || 'Failed to generate email. Please try again.');
        return;
      }

      setOutput(data.output as EmailGeneratorOutput);
      setOutputMeta(
        data.meta != null
          ? { isFallback: !!data.meta.isFallback, provider: data.meta.provider }
          : null
      );

      if (!user) {
        const nextRuns = Math.max(0, freeRunsUsed) + 1;
        localStorage.setItem(FREE_RUNS_KEY, String(nextRuns));
        setFreeRunsUsed(nextRuns);
      }

      trackAgentEvent({
        eventType: 'generated',
        agentId: 'email-template-generator',
        userId: user?.id || null,
        payload: {
          emailGoal: form.emailGoal,
          tone: form.tone,
          industry: form.industry || null,
        },
      });
    } catch (e: any) {
      setError(e?.message || 'Failed to generate email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const fullCopyText = useMemo(() => {
    if (!output) return '';
    const lines = [
      'SUBJECT LINES:',
      ...output.subjectLines.map(s => `- ${s}`),
      '',
      'SHORT VERSION:',
      output.shortVersion,
      '',
      'LONG VERSION:',
      output.longVersion,
      '',
      'CTA VARIANTS:',
      ...output.ctaVariants.map(c => `- ${c}`),
      '',
      'FOLLOW-UP SUGGESTION:',
      output.followUpSuggestion,
      '',
      'PERSONALIZATION TOKENS:',
      ...output.personalizationTokens.map(t => `- ${t}`),
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
                  <Mail size={22} />
                </div>
                <h1 className="text-3xl md:text-4xl font-black tracking-tight">
                  Email Template Generator
                </h1>
              </div>
              <p className="text-[#888] text-base max-w-2xl">
                Generate high-performing emails with multiple subject lines, short + long versions, CTA variants, and a follow-up suggestion.
              </p>

              {/* {!user && (
                <div className="inline-flex items-center gap-2 px-3 py-2 rounded border border-electric-blue/20 bg-electric-blue/5 text-electric-blue text-[10px] font-black uppercase tracking-[0.2em]">
                  <Sparkles size={14} /> Free first run, sign up for unlimited
                </div>
              )} */}
            </div>

            <div className="flex items-center gap-2">
              <a
                href="/ai-agents/email-template-generator"
                className="px-4 py-3 rounded border border-[#1f1f1f] bg-black text-[10px] font-black uppercase tracking-[0.2em] text-[#888] hover:text-white hover:border-[#333] transition-all"
              >
                View Details
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
                <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#444]">
                  Inputs
                </h2>
                <p className="text-xs text-[#666] font-medium leading-relaxed">
                  Tip: Include a specific pain point and one credible proof point (case study, metric, or result) for best performance.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <label className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#666]">Email goal</span>
                  <select
                    value={form.emailGoal}
                    onChange={e => setForm(prev => ({ ...prev, emailGoal: e.target.value as EmailGoal }))}
                    className="w-full bg-black border border-[#1f1f1f] rounded py-3 px-4 focus:outline-none focus:border-[#333] text-sm font-medium"
                  >
                    <option>Cold outbound</option>
                    <option>Follow-up</option>
                    <option>Partnership</option>
                    <option>Webinar invite</option>
                    <option>Customer onboarding</option>
                    <option>Re-engagement</option>
                  </select>
                </label>

                <label className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#666]">Target persona</span>
                  <input
                    value={form.targetPersona}
                    onChange={e => setForm(prev => ({ ...prev, targetPersona: e.target.value }))}
                    placeholder="e.g., CIO at mid-market healthcare, Head of Marketing at B2B SaaS"
                    className="w-full bg-black border border-[#1f1f1f] rounded py-3 px-4 focus:outline-none focus:border-[#333] text-sm font-medium"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#666]">Company / product description</span>
                  <textarea
                    value={form.companyDescription}
                    onChange={e => setForm(prev => ({ ...prev, companyDescription: e.target.value }))}
                    placeholder="What do you sell? Who is it for? One proof point. One differentiator."
                    rows={4}
                    className="w-full bg-black border border-[#1f1f1f] rounded py-3 px-4 focus:outline-none focus:border-[#333] text-sm font-medium"
                  />
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#666]">Industry (optional)</span>
                    <input
                      value={form.industry}
                      onChange={e => setForm(prev => ({ ...prev, industry: e.target.value }))}
                      placeholder="e.g., Fintech"
                      className="w-full bg-black border border-[#1f1f1f] rounded py-3 px-4 focus:outline-none focus:border-[#333] text-sm font-medium"
                    />
                  </label>
                </div>

                <label className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#666]">Pain point focus (optional)</span>
                  <input
                    value={form.painPointFocus}
                    onChange={e => setForm(prev => ({ ...prev, painPointFocus: e.target.value }))}
                    placeholder="e.g., pipeline quality, cycle time, churn, manual reporting"
                    className="w-full bg-black border border-[#1f1f1f] rounded py-3 px-4 focus:outline-none focus:border-[#333] text-sm font-medium"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#666]">Optional context</span>
                  <textarea
                    value={form.optionalContext}
                    onChange={e => setForm(prev => ({ ...prev, optionalContext: e.target.value }))}
                    placeholder="Prospect LinkedIn/about info, trigger events, mutual connection, your credibility, relevant integration..."
                    rows={4}
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
                      Generate Email
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
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#444]">
                      Output
                    </h2>
                    {output && outputMeta && (
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                          outputMeta.isFallback
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-electric-blue/10 text-electric-blue border border-electric-blue/20'
                        }`}
                        title={outputMeta.provider ?? undefined}
                      >
                        {outputMeta.isFallback ? (
                          <>Preview (fallback)</>
                        ) : (
                          <>Generated with Claude</>
                        )}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#666] font-medium">
                    Uses placeholders like <span className="font-mono text-[#888]">{'{{first_name}}'}</span> so you can personalize fast.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      safeCopy(fullCopyText);
                      trackAgentEvent({
                        eventType: 'copy',
                        agentId: 'email-template-generator',
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
                      a.download = 'email-templates.txt';
                      document.body.appendChild(a);
                      a.click();
                      a.remove();
                      URL.revokeObjectURL(url);
                      trackAgentEvent({
                        eventType: 'download',
                        agentId: 'email-template-generator',
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
                    Fill the inputs and click Generate to get subject lines, email drafts, CTA variants, and a follow-up.
                  </p>
                  <p className="text-[11px] text-[#666]">
                    Output is optimized for clarity, conversion frameworks, and spam avoidance.
                  </p>
                </div>
              )}

              {output && (
                <div className="space-y-6">
                  <section className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#666]">
                        Subject lines
                      </h3>
                      <button
                        onClick={() => {
                          safeCopy(output.subjectLines.join('\n'));
                          trackAgentEvent({ eventType: 'copy', agentId: 'email-template-generator', userId: user?.id || null, payload: { scope: 'subjectLines' } });
                        }}
                        className="text-[10px] font-black uppercase tracking-[0.2em] text-electric-blue hover:underline"
                      >
                        Copy
                      </button>
                    </div>
                    <ul className="space-y-2">
                      {output.subjectLines.map((s, idx) => (
                        <li key={idx} className="p-3 rounded border border-[#1f1f1f] bg-black text-sm text-[#ddd]">
                          {s}
                        </li>
                      ))}
                    </ul>
                  </section>

                  <section className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#666]">
                        Short version
                      </h3>
                      <button
                        onClick={() => {
                          safeCopy(output.shortVersion);
                          trackAgentEvent({ eventType: 'copy', agentId: 'email-template-generator', userId: user?.id || null, payload: { scope: 'shortVersion' } });
                        }}
                        className="text-[10px] font-black uppercase tracking-[0.2em] text-electric-blue hover:underline"
                      >
                        Copy
                      </button>
                    </div>
                    <pre className="whitespace-pre-wrap p-4 rounded border border-[#1f1f1f] bg-black text-sm text-[#ddd] leading-relaxed font-sans">
                      {output.shortVersion}
                    </pre>
                  </section>

                  <section className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#666]">
                        Long version
                      </h3>
                      <button
                        onClick={() => {
                          safeCopy(output.longVersion);
                          trackAgentEvent({ eventType: 'copy', agentId: 'email-template-generator', userId: user?.id || null, payload: { scope: 'longVersion' } });
                        }}
                        className="text-[10px] font-black uppercase tracking-[0.2em] text-electric-blue hover:underline"
                      >
                        Copy
                      </button>
                    </div>
                    <pre className="whitespace-pre-wrap p-4 rounded border border-[#1f1f1f] bg-black text-sm text-[#ddd] leading-relaxed font-sans">
                      {output.longVersion}
                    </pre>
                  </section>

                  <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-5 rounded border border-[#1f1f1f] bg-black space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#666]">
                          CTA variants
                        </h3>
                        <button
                          onClick={() => {
                            safeCopy(output.ctaVariants.join('\n'));
                            trackAgentEvent({ eventType: 'copy', agentId: 'email-template-generator', userId: user?.id || null, payload: { scope: 'ctaVariants' } });
                          }}
                          className="text-[10px] font-black uppercase tracking-[0.2em] text-electric-blue hover:underline"
                        >
                          Copy
                        </button>
                      </div>
                      <ul className="space-y-2">
                        {output.ctaVariants.map((c, idx) => (
                          <li key={idx} className="text-sm text-[#ddd]">
                            • {c}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-5 rounded border border-[#1f1f1f] bg-black space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#666]">
                          Follow-up suggestion
                        </h3>
                        <button
                          onClick={() => {
                            safeCopy(output.followUpSuggestion);
                            trackAgentEvent({ eventType: 'copy', agentId: 'email-template-generator', userId: user?.id || null, payload: { scope: 'followUpSuggestion' } });
                          }}
                          className="text-[10px] font-black uppercase tracking-[0.2em] text-electric-blue hover:underline"
                        >
                          Copy
                        </button>
                      </div>
                      <p className="text-sm text-[#ddd] leading-relaxed">
                        {output.followUpSuggestion}
                      </p>
                    </div>
                  </section>

                  <section className="p-5 rounded border border-[#1f1f1f] bg-black space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#666]">
                        Personalization tokens
                      </h3>
                      <button
                        onClick={() => {
                          safeCopy(output.personalizationTokens.join('\n'));
                          trackAgentEvent({ eventType: 'copy', agentId: 'email-template-generator', userId: user?.id || null, payload: { scope: 'personalizationTokens' } });
                        }}
                        className="text-[10px] font-black uppercase tracking-[0.2em] text-electric-blue hover:underline"
                      >
                        Copy
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {output.personalizationTokens.map((t, idx) => (
                        <span key={idx} className="px-3 py-2 rounded border border-[#1f1f1f] bg-[#0a0a0a] text-[11px] text-[#ddd] font-mono">
                          {t}
                        </span>
                      ))}
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
                You’ve used the free run. Sign up to generate unlimited templates and save outputs.
              </p>
            </div>
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => {
                  trackAgentEvent({
                    eventType: 'signup_intent_google',
                    agentId: 'email-template-generator',
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
                <input required type="text" name="name" placeholder="Name" className="w-full bg-black border border-[#1f1f1f] rounded py-3.5 px-4 focus:outline-none focus:border-[#333] text-sm font-medium" />
                <input required type="email" name="email" placeholder="Email address" className="w-full bg-black border border-[#1f1f1f] rounded py-3.5 px-4 focus:outline-none focus:border-[#333] text-sm font-medium" />
                <button type="submit" className="w-full bg-[#111] border border-[#1f1f1f] text-white py-4 rounded font-bold text-xs hover:bg-[#1a1a1a] transition-all uppercase tracking-widest">
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

