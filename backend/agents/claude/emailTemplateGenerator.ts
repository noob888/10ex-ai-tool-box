import { ClaudeAgentBase } from './baseAgent';
import type { AgentRunContext, Skill } from './types';
import { extractFirstJsonObject, safeJsonParse, uniqueStrings, asTrimmedString, nonEmptyString } from './utils';
import { personaUnderstandingSkill } from './skills/personaUnderstanding';
import { conversionCopywritingSkill } from './skills/conversionCopywriting';
import { toneControlSkill } from './skills/toneControl';
import { variantGenerationSkill } from './skills/variantGeneration';
import { complianceSpamAvoidanceSkill } from './skills/complianceSpamAvoidance';

export type EmailGoal =
  | 'Cold outbound'
  | 'Follow-up'
  | 'Partnership'
  | 'Webinar invite'
  | 'Customer onboarding'
  | 'Re-engagement';

export type Tone = 'Professional' | 'Direct' | 'Friendly' | 'Founder-style';

export type EmailTemplateGeneratorInput = {
  emailGoal: EmailGoal;
  targetPersona: string;
  companyDescription: string;
  tone: Tone;
  optionalContext?: string;
  painPointFocus?: string;
  industry?: string;
};

export type EmailTemplateGeneratorOutput = {
  subjectLines: string[];
  shortVersion: string;
  longVersion: string;
  personalizationTokens: string[];
  ctaVariants: string[];
  followUpSuggestion: string;
};

export function validateEmailTemplateGeneratorInput(body: any): { ok: true; value: EmailTemplateGeneratorInput } | { ok: false; error: string } {
  const emailGoal = asTrimmedString(body?.emailGoal);
  const targetPersona = asTrimmedString(body?.targetPersona);
  const companyDescription = asTrimmedString(body?.companyDescription);
  const tone = asTrimmedString(body?.tone);

  const validGoals: EmailGoal[] = [
    'Cold outbound',
    'Follow-up',
    'Partnership',
    'Webinar invite',
    'Customer onboarding',
    'Re-engagement',
  ];
  const validTones: Tone[] = ['Professional', 'Direct', 'Friendly', 'Founder-style'];

  if (!validGoals.includes(emailGoal as EmailGoal)) {
    return { ok: false, error: 'Invalid emailGoal' };
  }
  if (!validTones.includes(tone as Tone)) {
    return { ok: false, error: 'Invalid tone' };
  }
  if (!targetPersona) {
    return { ok: false, error: 'targetPersona is required' };
  }
  if (!companyDescription) {
    return { ok: false, error: 'companyDescription is required' };
  }

  return {
    ok: true,
    value: {
      emailGoal: emailGoal as EmailGoal,
      targetPersona,
      companyDescription,
      tone: tone as Tone,
      optionalContext: asTrimmedString(body?.optionalContext),
      painPointFocus: asTrimmedString(body?.painPointFocus),
      industry: asTrimmedString(body?.industry),
    },
  };
}

export function generateEmailTemplateFallback(input: EmailTemplateGeneratorInput): EmailTemplateGeneratorOutput {
  const persona = input.targetPersona.trim();
  const industry = input.industry?.trim();
  const pain = input.painPointFocus?.trim();

  const tokenList = uniqueStrings(
    [
      '{{first_name}}',
      '{{company}}',
      '{{role}}',
      '{{industry}}',
      '{{pain_point}}',
      '{{proof_point}}',
      '{{cta_link}}',
      '{{calendar_link}}',
    ],
    12
  );

  const angle = pain || (industry ? `${industry} priorities` : 'your current workflow');
  const subjectLines = uniqueStrings(
    [
      `Quick question about {{company}}`,
      `{{first_name}}, idea for ${angle}`,
      `Reducing ${pain ? '{{pain_point}}' : 'cycle time'} without extra headcount`,
      `Worth a 10-min sanity check?`,
      `${persona.split(' ').slice(0, 3).join(' ')}: 1 thought`,
    ],
    5
  );

  const opener = input.emailGoal === 'Follow-up'
    ? `Hi {{first_name}} — circling back in case this got buried.`
    : `Hi {{first_name}} — quick note since you’re a ${persona}${industry ? ` in ${industry}` : ''}.`;

  const value = pain
    ? `Teams like yours usually care about improving ${pain} without creating extra process.`
    : `Teams like yours usually care about faster execution and fewer manual handoffs.`;

  const company = `We help ${industry ? `${industry} teams` : 'teams'} ${'{{primary_outcome}}'} (e.g., {{proof_point}}) with a simple workflow your team can adopt in days.`;

  const ctas = uniqueStrings(
    [
      'Open to a quick 10 minutes next week to see if it’s relevant?',
      'Worth a fast sanity check? If not a fit, I’ll close the loop.',
      'If it’s useful, I can share a 2-minute walkthrough + examples.',
      'Should I send over a short plan tailored to {{company}}?',
    ],
    5
  );

  const shortVersion = [
    opener,
    '',
    value,
    '',
    company,
    '',
    ctas[0],
    '',
    '— {{sender_name}}',
  ].join('\n');

  const longVersion = [
    opener,
    '',
    `I’m reaching out because ${pain ? `many teams hit ${pain} once they scale past {{threshold}}.` : 'this role often ends up owning both outcomes and execution.'}`,
    '',
    company,
    '',
    `If helpful, I can tailor a quick outline for {{company}} (what to change, what to measure, and where teams usually get stuck).`,
    '',
    `${ctas[1]}`,
    '',
    'Best,',
    '{{sender_name}}',
    '{{title}} • {{company_name}}',
  ].join('\n');

  const followUpSuggestion = `Follow-up (2–3 days later): Reply in the same thread, reference one concrete hook (a role change, a job post, or an initiative), restate the benefit in one line, and ask a yes/no question like: "Should I send the short version or is this not a priority right now?"`;

  return {
    subjectLines,
    shortVersion,
    longVersion,
    personalizationTokens: tokenList,
    ctaVariants: ctas,
    followUpSuggestion,
  };
}

export class EmailTemplateGeneratorAgent extends ClaudeAgentBase<EmailTemplateGeneratorInput, EmailTemplateGeneratorOutput> {
  readonly id = 'email-template-generator';
  readonly name = 'Email Template Generator';
  readonly skills: Skill[] = [
    personaUnderstandingSkill,
    conversionCopywritingSkill,
    toneControlSkill,
    variantGenerationSkill,
    complianceSpamAvoidanceSkill,
  ];

  protected buildSystemPrompt(input: EmailTemplateGeneratorInput, _ctx: AgentRunContext): string {
    const skillPrompts = this.skills.map(s => `- ${s.name}: ${s.prompt}`).join('\n');

    return [
      'You are a world-class conversion copywriter and outbound strategist.',
      'Your job: generate sales-ready email templates that get replies.',
      '',
      'Skills:',
      skillPrompts,
      '',
      'Output requirements:',
      '- Return ONLY valid JSON (no markdown, no commentary).',
      '- Be concise and human. Avoid hype, fluff, and spammy language.',
      '- Use placeholders/tokens like {{first_name}}, {{company}}, {{role}}, {{industry}}, {{pain_point}} when appropriate.',
      '- Keep formatting readable in plain text email clients.',
      '',
      `Requested tone: ${input.tone}`,
    ].join('\n');
  }

  protected buildUserPrompt(input: EmailTemplateGeneratorInput, _ctx: AgentRunContext): string {
    return [
      'Create an email template package with the following inputs.',
      '',
      `Email goal: ${input.emailGoal}`,
      `Target persona: ${input.targetPersona}`,
      `Company/product description: ${input.companyDescription}`,
      input.industry ? `Industry: ${input.industry}` : null,
      input.painPointFocus ? `Pain point focus: ${input.painPointFocus}` : null,
      input.optionalContext ? `Optional context (LinkedIn/about, triggers, extra details): ${input.optionalContext}` : null,
      '',
      'Return JSON with this exact shape:',
      '{',
      '  "subjectLines": ["..."], // 3-5 items',
      '  "shortVersion": "string",',
      '  "longVersion": "string",',
      '  "personalizationTokens": ["{{first_name}}", "{{company}}", "..."],',
      '  "ctaVariants": ["..."], // 3-5 items',
      '  "followUpSuggestion": "string"',
      '}',
      '',
      'Constraints:',
      '- Subject lines must be distinct angles (not minor rewrites).',
      '- Short version should fit on mobile (aim ~80-120 words).',
      '- Long version can be ~150-220 words with 1 proof point placeholder.',
      '- CTA variants must be low-friction and specific (avoid "Let me know your thoughts").',
      '- Follow-up suggestion should be a concrete follow-up email (not just advice).',
    ]
      .filter(nonEmptyString)
      .join('\n');
  }

  protected parseOutput(rawText: string): EmailTemplateGeneratorOutput {
    const json = extractFirstJsonObject(rawText);
    if (!json) {
      // If Claude didn't follow format, fall back to a safe generator.
      throw new Error('Model did not return JSON');
    }

    const parsed = safeJsonParse<any>(json);
    if (!parsed.ok) {
      throw new Error(`Failed to parse model JSON: ${parsed.error}`);
    }

    const o = parsed.value || {};
    const subjectLines = uniqueStrings(Array.isArray(o.subjectLines) ? o.subjectLines : [], 5);
    const ctaVariants = uniqueStrings(Array.isArray(o.ctaVariants) ? o.ctaVariants : [], 5);
    const personalizationTokens = uniqueStrings(Array.isArray(o.personalizationTokens) ? o.personalizationTokens : [], 12);

    const shortVersion = asTrimmedString(o.shortVersion);
    const longVersion = asTrimmedString(o.longVersion);
    const followUpSuggestion = asTrimmedString(o.followUpSuggestion);

    if (subjectLines.length < 3 || !shortVersion || !longVersion) {
      throw new Error('Model output missing required fields');
    }

    return {
      subjectLines,
      shortVersion,
      longVersion,
      personalizationTokens,
      ctaVariants,
      followUpSuggestion,
    };
  }
}

