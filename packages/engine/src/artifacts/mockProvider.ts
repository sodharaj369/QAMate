import { ILLMProvider, LLMRequestOptions } from '../interfaces/index.js';

export class MockLLMProvider implements ILLMProvider {
  public readonly id = 'mock-llm-provider';
  public readonly name = 'Mock Offline Provider';

  public async generate(prompt: string, _options?: LLMRequestOptions): Promise<string> {
    return `### MOCK_COMPLETION\n\nMock completion for prompt:\n${prompt}`;
  }
}
