import type { AgentId, AgentRunContext, AgentRunResult, Skill } from './types';
import { getAnthropicClient, getAnthropicModel } from './client';

export abstract class ClaudeAgentBase<Input, Output> {
  abstract readonly id: AgentId;
  abstract readonly name: string;
  abstract readonly skills: Skill[];

  protected abstract buildSystemPrompt(input: Input, ctx: AgentRunContext): string;
  protected abstract buildUserPrompt(input: Input, ctx: AgentRunContext): string;
  protected abstract parseOutput(rawText: string): Output;

  protected maxTokens(): number {
    return 1400;
  }

  protected temperature(): number {
    return 0.5;
  }

  async run(input: Input, ctx: AgentRunContext = {}): Promise<AgentRunResult<Output>> {
    const model = getAnthropicModel();
    const system = this.buildSystemPrompt(input, ctx);
    const user = this.buildUserPrompt(input, ctx);

    const client = getAnthropicClient();
    const startedAt = Date.now();

    const response = await client.messages.create({
      model,
      max_tokens: this.maxTokens(),
      temperature: this.temperature(),
      system,
      messages: [
        {
          role: 'user',
          content: user,
        },
      ],
    });

    const rawText =
      response.content
        .map(part => (part.type === 'text' ? part.text : ''))
        .join('\n')
        .trim() || '';

    const output = this.parseOutput(rawText);

    const elapsedMs = Date.now() - startedAt;
    // Minimal structured log (safe for server logs)
    console.log('[claude-agent]', {
      agentId: this.id,
      model,
      elapsedMs,
      requestId: ctx.requestId,
      userId: ctx.userId || null,
      ip: ctx.ip || null,
    });

    return {
      output,
      rawText,
      model,
      usage: {
        // Anthropic SDK exposes tokens differently across versions; keep optional.
        inputTokens: (response as any).usage?.input_tokens,
        outputTokens: (response as any).usage?.output_tokens,
      },
    };
  }
}

