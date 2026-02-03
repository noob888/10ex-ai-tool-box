export type AgentId = string;

export type AgentRunContext = {
  requestId?: string;
  userId?: string | null;
  ip?: string | null;
  userAgent?: string | null;
};

export type Skill = {
  id: string;
  name: string;
  /**
   * A concise skill prompt fragment. Keep it imperative.
   */
  prompt: string;
};

export type AgentRunResult<Output> = {
  output: Output;
  rawText?: string;
  model?: string;
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
  };
};

