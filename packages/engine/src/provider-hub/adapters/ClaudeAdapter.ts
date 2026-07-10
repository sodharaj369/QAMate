import { IProviderAdapter } from '../../interfaces/index.js';
import { ProviderCapabilities } from '../../domain.js';

export class ClaudeAdapter implements IProviderAdapter {
  public readonly capabilities: ProviderCapabilities = {
    supportsJson: true,
    supportsVision: true,
    supportsStreaming: true,
    supportsToolCalling: true,
    supportsReasoning: true,
    supportsThinkingBudget: true,
    maxTokens: 8192,
    maxContext: 200000,
    preferredFormat: 'xml'
  };

  public formatPrompt(template: string, variables: Record<string, string>): string {
    let prompt = template;
    for (const [key, val] of Object.entries(variables)) {
      prompt = prompt.replace(new RegExp(`{${key}}`, 'g'), val);
    }
    return `<context>\n${prompt}\n</context>`;
  }

  public parseResponse<T>(responseContent: string): T {
    let clean = responseContent.trim();
    if (clean.includes('```')) {
      const match = /```(?:json)?\s*([\s\S]*?)\s*```/.exec(clean);
      if (match && match[1]) {
        clean = match[1].trim();
      }
    }
    return JSON.parse(clean) as T;
  }
}
