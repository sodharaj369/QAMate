import { ILLMProvider, LLMRequestOptions } from '../interfaces/index.js';

export class GeminiProvider implements ILLMProvider {
  public readonly id = 'gemini';
  public readonly name = 'Google Gemini Content Generation';

  constructor(
    private readonly apiKey: string,
    private readonly modelName: string = 'gemini-1.5-pro',
    private readonly temperature: number = 0.7,
  ) {}

  public async generate(prompt: string, options?: LLMRequestOptions): Promise<string> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.modelName}:generateContent?key=${this.apiKey}`;
    const system = options?.systemInstruction || 'You are QAMate, a Senior QA Thinking Assistant.';

    const payload = {
      systemInstruction: {
        parts: [{ text: system }],
      },
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: this.temperature,
        responseMimeType: options?.responseFormat === 'json' ? 'application/json' : 'text/plain',
      },
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini Provider error (${response.status}): ${errorText}`);
    }

    const data = (await response.json()) as {
      candidates?: Array<{
        content?: {
          parts?: Array<{
            text?: string;
          }>;
        };
      }>;
    };

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error('Gemini Provider returned empty response.');
    }

    return text;
  }
}
