import type { Skill } from '../types';

export const complianceSpamAvoidanceSkill: Skill = {
  id: 'compliance_spam_avoidance',
  name: 'Compliance + Spam Avoidance',
  prompt:
    'Avoid spam-trigger language and formatting: no ALL CAPS subject lines, no excessive exclamation marks, no manipulative urgency, no misleading claims. Keep it respectful and compliant.',
};

