import { ILLMProvider, LLMRequestOptions } from '../interfaces/index.js';

export class OpenAIProvider implements ILLMProvider {
  public readonly id = 'openai';
  public readonly name = 'OpenAI Chat Completions';

  constructor(
    private readonly apiKey: string,
    private readonly modelName: string = 'gpt-4o',
    private readonly temperature: number = 0.7,
  ) {}

  public async generate(prompt: string, options?: LLMRequestOptions): Promise<string> {
    const url = 'https://api.openai.com/v1/chat/completions';
    const system = options?.systemInstruction || 'You are QAMate, a Senior QA Thinking Assistant.';

    const messages = [
      { role: 'system', content: system },
      { role: 'user', content: prompt },
    ];

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.modelName,
        messages,
        temperature: this.temperature,
        response_format: options?.responseFormat === 'json' ? { type: 'json_object' } : undefined,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI Provider error (${response.status}): ${errorText}`);
    }

    const data = (await response.json()) as {
      choices?: Array<{
        message?: {
          content?: string;
        };
      }>;
    };

    const text = data.choices?.[0]?.message?.content;
    if (!text) {
      throw new Error('OpenAI Provider returned empty response.');
    }

    return text;
  }
}
