import { ILLMProvider, LLMRequestOptions } from '../interfaces/index.js';

export class OllamaProvider implements ILLMProvider {
  public readonly id = 'ollama';
  public readonly name = 'Ollama Local Chat';

  constructor(
    private readonly apiEndpoint: string = 'http://localhost:11434',
    private readonly modelName: string = 'llama3',
    private readonly temperature: number = 0.7,
  ) {}

  public async generate(prompt: string, options?: LLMRequestOptions): Promise<string> {
    const url = `${this.apiEndpoint.replace(/\/$/, '')}/api/chat`;
    const system = options?.systemInstruction || 'You are QAMate, a Senior QA Thinking Assistant.';

    const messages = [
      { role: 'system', content: system },
      { role: 'user', content: prompt },
    ];

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.modelName,
        messages,
        options: {
          temperature: this.temperature,
        },
        stream: false,
        format: options?.responseFormat === 'json' ? 'json' : undefined,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ollama Provider error (${response.status}): ${errorText}`);
    }

    const data = (await response.json()) as {
      message?: {
        content?: string;
      };
    };

    const text = data.message?.content;
    if (!text) {
      throw new Error('Ollama Provider returned empty response.');
    }

    return text;
  }
}
