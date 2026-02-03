import { ClaudeAgentBase } from './baseAgent';
import type { AgentRunContext, Skill } from './types';
import { extractFirstJsonObject, safeJsonParse, uniqueStrings, asTrimmedString, nonEmptyString } from './utils';
import { offerPositioningSkill } from './skills/offerPositioning';
import { personaUnderstandingSkill } from './skills/personaUnderstanding';
import { leadMagnetStructuringSkill } from './skills/leadMagnetStructuring';
import { conversionCopywritingSkill } from './skills/conversionCopywriting';
import { toneControlSkill } from './skills/toneControl';
import { variantGenerationSkill } from './skills/variantGeneration';
import { complianceSpamAvoidanceSkill } from './skills/complianceSpamAvoidance';

export type LeadMagnetGoal = 'Capture leads' | 'Webinar' | 'Outbound' | 'Product education' | 'Newsletter growth';
export type LeadMagnetTone = 'Professional' | 'Direct' | 'Friendly' | 'Founder-style';
export type LeadMagnetFormat = 'Checklist' | 'Playbook' | 'Report' | 'Template';

export type LeadMagnetGeneratorInput = {
  industry: string;
  icpPersona: string;
  leadMagnetGoal: LeadMagnetGoal;
  topicOrPainPoint: string;
  tone: LeadMagnetTone;
  companyDescription?: string;
  brandStyleNotes?: string;
};

export type LeadMagnetGeneratorOutput = {
  titleOptions: string[]; // 3–5
  recommendedFormat: LeadMagnetFormat;
  formatVariants: Array<{
    format: LeadMagnetFormat;
    hook: string;
    outline: string[]; // 5–10 bullets
  }>;
  leadMagnetDraft: string; // full structured draft
  landingPageCopySnippet: string;
  ctaSuggestions: string[]; // 3–5
  formPromptSuggestions: string[]; // 3–6
  nurtureEmailDraft: {
    subject: string;
    body: string;
  };
};

export function validateLeadMagnetGeneratorInput(
  body: any
): { ok: true; value: LeadMagnetGeneratorInput } | { ok: false; error: string } {
  const industry = asTrimmedString(body?.industry);
  const icpPersona = asTrimmedString(body?.icpPersona);
  const leadMagnetGoal = asTrimmedString(body?.leadMagnetGoal);
  const topicOrPainPoint = asTrimmedString(body?.topicOrPainPoint);
  const tone = asTrimmedString(body?.tone);

  const validGoals: LeadMagnetGoal[] = ['Capture leads', 'Webinar', 'Outbound', 'Product education', 'Newsletter growth'];
  const validTones: LeadMagnetTone[] = ['Professional', 'Direct', 'Friendly', 'Founder-style'];

  if (!industry) return { ok: false, error: 'industry is required' };
  if (!icpPersona) return { ok: false, error: 'icpPersona is required' };
  if (!topicOrPainPoint) return { ok: false, error: 'topicOrPainPoint is required' };
  if (!validGoals.includes(leadMagnetGoal as LeadMagnetGoal)) return { ok: false, error: 'Invalid leadMagnetGoal' };
  if (!validTones.includes(tone as LeadMagnetTone)) return { ok: false, error: 'Invalid tone' };

  return {
    ok: true,
    value: {
      industry,
      icpPersona,
      leadMagnetGoal: leadMagnetGoal as LeadMagnetGoal,
      topicOrPainPoint,
      tone: tone as LeadMagnetTone,
      companyDescription: asTrimmedString(body?.companyDescription),
      brandStyleNotes: asTrimmedString(body?.brandStyleNotes),
    },
  };
}

function pickRecommendedFormat(goal: LeadMagnetGoal): LeadMagnetFormat {
  switch (goal) {
    case 'Outbound':
      return 'Template';
    case 'Webinar':
      return 'Playbook';
    case 'Newsletter growth':
      return 'Checklist';
    case 'Product education':
      return 'Playbook';
    case 'Capture leads':
    default:
      return 'Checklist';
  }
}

export function generateLeadMagnetFallback(input: LeadMagnetGeneratorInput): LeadMagnetGeneratorOutput {
  const format = pickRecommendedFormat(input.leadMagnetGoal);
  const persona = input.icpPersona.trim();
  const industry = input.industry.trim();
  const topic = input.topicOrPainPoint.trim();

  const titles = uniqueStrings(
    [
      `${topic}: The ${format} for ${persona} in ${industry}`,
      `The ${industry} ${persona} ${format} to Fix ${topic}`,
      `${topic} in 30 Minutes: A ${format} for Busy ${persona}`,
      `Stop Guessing: A Practical ${format} for ${persona} on ${topic}`,
      `From “Stuck” to “Shipped”: The ${topic} ${format} for ${industry} Teams`,
    ],
    5
  );

  const variants: LeadMagnetGeneratorOutput['formatVariants'] = [
    {
      format: 'Checklist',
      hook: `A fast, decision-ready checklist to assess and fix ${topic} without boiling the ocean.`,
      outline: [
        '1-page overview + who it’s for',
        'Readiness checklist (10 items)',
        'Top 5 failure modes + fixes',
        'Quick-start plan (7 days)',
        'Metrics to track + targets',
        'Tooling/ops template (copy/paste)',
      ],
    },
    {
      format: 'Playbook',
      hook: `A step-by-step playbook to implement improvements for ${topic} with minimal risk.`,
      outline: [
        'Executive summary + success criteria',
        'Persona lens: what matters to this role',
        'Phase 1: Diagnose (questions + data sources)',
        'Phase 2: Design (options + tradeoffs)',
        'Phase 3: Implement (sprints + responsibilities)',
        'Phase 4: Prove impact (metrics + narrative)',
      ],
    },
    {
      format: 'Template',
      hook: `A fill-in-the-blank template to turn ${topic} into an action plan you can share internally.`,
      outline: [
        'Problem statement (copy/paste)',
        'Impact + cost of delay calculator',
        'Hypothesis + assumptions list',
        'Plan of record (30/60/90)',
        'Stakeholder update email',
        'Post-mortem / learnings section',
      ],
    },
  ];

  const draft = [
    `TITLE: ${titles[0]}`,
    `FORMAT: ${format}`,
    '',
    'WHO THIS IS FOR',
    `- ${persona} in ${industry}`,
    '',
    'THE PROMISE (1–2 lines)',
    `- If you’re dealing with ${topic}, this gives you a clear, low-risk path to improve it in days—not months.`,
    '',
    'QUICK START (15 minutes)',
    '- Circle the 3 biggest constraints you have right now: time / budget / data / approvals / tooling / team capacity',
    '- Choose one metric to move first (pick one): cycle time, conversion rate, response rate, cost per lead, meeting rate',
    '- Run the readiness checklist below and score each item 0–2',
    '',
    'READINESS CHECKLIST (score 0–2 each)',
    `1) We can define "${topic}" in one sentence everyone agrees on.`,
    '2) We have one source of truth for the core metric.',
    '3) We can name the top 3 root causes (not symptoms).',
    '4) We have one “golden path” workflow documented.',
    '5) We have a feedback loop (weekly) to review results.',
    '',
    'TOP 5 FAILURE MODES (AND FIXES)',
    '1) Vague goal → Fix: write a single success statement + metric target.',
    '2) Too many stakeholders → Fix: one owner + weekly decision slot.',
    '3) No proof → Fix: add one baseline + one test.',
    '4) Over-engineering → Fix: ship the smallest version in 7 days.',
    '5) No follow-through → Fix: assign owners + dates for each step.',
    '',
    '7-DAY ACTION PLAN',
    'Day 1: baseline the metric + define success',
    'Day 2: map the workflow + identify the biggest bottleneck',
    'Day 3: pick 1 experiment + define what “win” looks like',
    'Day 4: implement the change',
    'Day 5: quality check + rollout',
    'Day 6: measure results + capture learnings',
    'Day 7: decide next iteration + document the new standard',
    '',
    'COPY/PASTE TEMPLATE: INTERNAL UPDATE',
    'Subject: [Update] Fixing {{topic}} — baseline + 7-day plan',
    '',
    'Team,',
    'We’re addressing {{topic}}. Baseline: {{metric}} is currently {{baseline}}.',
    'This week we’ll run one focused change: {{experiment}}. Success = {{target}}.',
    'Owner: {{owner}}. Next update: {{date}}.',
    '',
    'NEXT STEP',
    '- Want the tailored version for your situation? Answer the form prompts below and generate a custom draft.',
  ].join('\n');

  const landingCopy = [
    `Headline: Fix ${topic} with a practical ${format} for ${persona}`,
    `Subhead: Built for ${industry} teams. Get a clear plan, templates, and a 7-day quick start.`,
    'Bullets:',
    `- Diagnose the root causes of ${topic} in 15 minutes`,
    '- Use ready-to-copy templates to align stakeholders',
    '- Run a 7-day plan and prove impact with one metric',
    'CTA: Generate your free lead magnet',
  ].join('\n');

  const ctas = uniqueStrings(
    [
      'Generate my free lead magnet',
      'Get the checklist + templates',
      'Build my custom playbook',
      'Send me the lead magnet',
      'Create the landing page copy',
    ],
    5
  );

  const formPrompts = uniqueStrings(
    [
      `What’s your #1 objective related to "${topic}" in the next 30 days?`,
      `What is your current baseline metric (if known)?`,
      'What is the biggest constraint (time, budget, data, approvals, tooling, team capacity)?',
      'What is the most common failure mode you see today?',
      'What proof point can you include (case study, stat, customer quote, metric placeholder)?',
      'What should the reader do next (book a call, start a trial, join a webinar, reply to an email)?',
    ],
    6
  );

  const nurtureEmail = {
    subject: `Your ${format}: ${topic} for ${persona}`,
    body: [
      `Hi {{first_name}},`,
      '',
      `Here’s the ${format} we put together on ${topic} for ${persona} teams in ${industry}.`,
      '',
      'What you’ll get inside:',
      `- A quick-start checklist to diagnose ${topic}`,
      '- A 7-day action plan',
      '- Copy/paste templates to align the team',
      '',
      'If you want, reply with 2 details and I’ll tailor a version to your situation:',
      '1) Your baseline metric (if you know it)',
      '2) Your biggest constraint right now (time/budget/data/etc.)',
      '',
      '— {{sender_name}}',
    ].join('\n'),
  };

  return {
    titleOptions: titles,
    recommendedFormat: format,
    formatVariants: variants,
    leadMagnetDraft: draft,
    landingPageCopySnippet: landingCopy,
    ctaSuggestions: ctas,
    formPromptSuggestions: formPrompts,
    nurtureEmailDraft: nurtureEmail,
  };
}

export class LeadMagnetGeneratorAgent extends ClaudeAgentBase<LeadMagnetGeneratorInput, LeadMagnetGeneratorOutput> {
  readonly id = 'lead-magnet-generator';
  readonly name = 'Lead Magnet Generator';
  readonly skills: Skill[] = [
    offerPositioningSkill,
    personaUnderstandingSkill,
    leadMagnetStructuringSkill,
    conversionCopywritingSkill,
    toneControlSkill,
    variantGenerationSkill,
    complianceSpamAvoidanceSkill,
  ];

  protected maxTokens(): number {
    // Needs more space than emails (PDF-style asset + variants)
    return 2600;
  }

  protected temperature(): number {
    return 0.6;
  }

  protected buildSystemPrompt(input: LeadMagnetGeneratorInput, _ctx: AgentRunContext): string {
    const skillPrompts = this.skills.map(s => `- ${s.name}: ${s.prompt}`).join('\n');

    return [
      'You are a world-class demand gen strategist and conversion copywriter.',
      'Your job: generate a high-converting lead magnet draft (PDF-style content) plus conversion assets.',
      '',
      'Skills:',
      skillPrompts,
      '',
      'Output requirements:',
      '- Return ONLY valid JSON (no markdown, no commentary).',
      '- Be specific to the persona and industry; avoid generic advice.',
      '- Use clean plain-text formatting inside strings (headings, bullets, numbered steps).',
      '- Keep it practical: templates, checklists, step-by-step.',
      '- Use placeholders where helpful (e.g., {{metric}}, {{baseline}}, {{proof_point}}).',
      '',
      `Requested tone: ${input.tone}`,
      input.brandStyleNotes ? `Brand style notes: ${input.brandStyleNotes}` : null,
    ]
      .filter(nonEmptyString)
      .join('\n');
  }

  protected buildUserPrompt(input: LeadMagnetGeneratorInput, _ctx: AgentRunContext): string {
    return [
      'Create a lead magnet package using these inputs:',
      '',
      `Industry: ${input.industry}`,
      `ICP persona: ${input.icpPersona}`,
      `Goal: ${input.leadMagnetGoal}`,
      `Topic / pain point: ${input.topicOrPainPoint}`,
      input.companyDescription ? `Company description (optional): ${input.companyDescription}` : null,
      '',
      'Return JSON with this exact shape:',
      '{',
      '  "titleOptions": ["..."], // 3-5 distinct options',
      '  "recommendedFormat": "Checklist" | "Playbook" | "Report" | "Template",',
      '  "formatVariants": [',
      '    { "format": "Checklist" | "Playbook" | "Report" | "Template", "hook": "string", "outline": ["..."] }',
      '  ], // 3-4 items, distinct formats/angles',
      '  "leadMagnetDraft": "string", // full PDF-style content with headings + bullets',
      '  "landingPageCopySnippet": "string", // headline, subhead, bullets, CTA (plain text)',
      '  "ctaSuggestions": ["..."], // 3-5',
      '  "formPromptSuggestions": ["..."], // 3-6',
      '  "nurtureEmailDraft": { "subject": "string", "body": "string" }',
      '}',
      '',
      'Constraints:',
      '- The draft must be immediately usable (not an outline only).',
      '- Include a "Quick Start" section, a checklist/template section, and a "Next step" CTA.',
      '- Landing page snippet should sound like a real high-converting page (no fluff).',
      '- CTA suggestions must be low-friction and specific.',
      '- Nurture email should be 120–180 words and include a simple reply prompt or next step.',
    ]
      .filter(nonEmptyString)
      .join('\n');
  }

  protected parseOutput(rawText: string): LeadMagnetGeneratorOutput {
    const json = extractFirstJsonObject(rawText);
    if (!json) throw new Error('Model did not return JSON');

    const parsed = safeJsonParse<any>(json);
    if (!parsed.ok) throw new Error(`Failed to parse model JSON: ${parsed.error}`);

    const o = parsed.value || {};

    const titleOptions = uniqueStrings(Array.isArray(o.titleOptions) ? o.titleOptions : [], 5);
    const ctaSuggestions = uniqueStrings(Array.isArray(o.ctaSuggestions) ? o.ctaSuggestions : [], 5);
    const formPromptSuggestions = uniqueStrings(
      Array.isArray(o.formPromptSuggestions) ? o.formPromptSuggestions : [],
      6
    );

    const recommendedFormatRaw = asTrimmedString(o.recommendedFormat);
    const validFormats: LeadMagnetFormat[] = ['Checklist', 'Playbook', 'Report', 'Template'];
    const recommendedFormat = (validFormats.includes(recommendedFormatRaw as LeadMagnetFormat)
      ? (recommendedFormatRaw as LeadMagnetFormat)
      : pickRecommendedFormat('Capture leads')) as LeadMagnetFormat;

    const formatVariantsRaw = Array.isArray(o.formatVariants) ? o.formatVariants : [];
    const formatVariants = formatVariantsRaw
      .map((v: any) => {
        const formatRaw = asTrimmedString(v?.format);
        const format = validFormats.includes(formatRaw as LeadMagnetFormat)
          ? (formatRaw as LeadMagnetFormat)
          : null;
        const hook = asTrimmedString(v?.hook);
        const outline = uniqueStrings(Array.isArray(v?.outline) ? v.outline : [], 10);
        if (!format || !hook || outline.length < 5) return null;
        return { format, hook, outline };
      })
      .filter(Boolean)
      .slice(0, 4) as LeadMagnetGeneratorOutput['formatVariants'];

    const leadMagnetDraft = asTrimmedString(o.leadMagnetDraft);
    const landingPageCopySnippet = asTrimmedString(o.landingPageCopySnippet);

    const nurtureEmailDraft = {
      subject: asTrimmedString(o?.nurtureEmailDraft?.subject),
      body: asTrimmedString(o?.nurtureEmailDraft?.body),
    };

    if (titleOptions.length < 3 || !leadMagnetDraft || !landingPageCopySnippet || ctaSuggestions.length < 3) {
      throw new Error('Model output missing required fields');
    }

    const safeFormatVariants: LeadMagnetGeneratorOutput['formatVariants'] = formatVariants.length
      ? formatVariants
      : [
          {
            format: recommendedFormat,
            hook: 'A practical asset tailored to the persona, focused on outcomes and quick wins.',
            outline: [
              'Who it’s for + what you’ll get',
              'Quick start',
              'Checklist / steps',
              'Templates + examples',
              'Common pitfalls + fixes',
              'Next step CTA',
            ],
          },
        ];

    return {
      titleOptions,
      recommendedFormat,
      formatVariants: safeFormatVariants,
      leadMagnetDraft,
      landingPageCopySnippet,
      ctaSuggestions,
      formPromptSuggestions,
      nurtureEmailDraft,
    };
  }
}

