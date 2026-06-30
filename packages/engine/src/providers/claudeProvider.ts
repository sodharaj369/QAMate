import { ILLMProvider, LLMRequestOptions } from '../interfaces/index.js';

export class ClaudeProvider implements ILLMProvider {
  public readonly id = 'claude';
  public readonly name = 'Anthropic Claude Messages';

  constructor(
    private readonly apiKey: string,
    private readonly modelName: string = 'claude-3-5-sonnet-20240620',
    private readonly temperature: number = 0.7,
  ) {}

  public async generate(prompt: string, options?: LLMRequestOptions): Promise<string> {
    const url = 'https://api.anthropic.com/v1/messages';
    const system = options?.systemInstruction || 'You are QAMate, a Senior QA Thinking Assistant.';

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.modelName,
        messages: [{ role: 'user', content: prompt }],
        system,
        temperature: this.temperature,
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Claude Provider error (${response.status}): ${errorText}`);
    }

    const data = (await response.json()) as {
      content?: Array<{
        type: string;
        text?: string;
      }>;
    };

    const text = data.content?.[0]?.text;
    if (!text) {
      throw new Error('Claude Provider returned empty response.');
    }

    return text;
  }
}
