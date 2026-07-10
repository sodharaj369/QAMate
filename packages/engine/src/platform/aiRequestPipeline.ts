import { IMultiLevelCache, IProviderAdapter } from '../interfaces/index.js';
import { MultiLevelCache } from './multiLevelCache.js';
import { getAdapterForProvider } from '../provider-hub/adapters/index.js';

export interface PipelineContextItem {
  readonly id: string;
  readonly type: 'requirement' | 'dna' | 'story' | 'architecture' | 'knowledge' | 'history';
  readonly content: string;
}

export class ContextBuilder {
  private readonly weights: Record<string, number> = {
    requirement: 100,
    dna: 95,
    story: 90,
    architecture: 85,
    knowledge: 70,
    history: 40
  };

  /**
   * Sorts context items by architectural weight descending and cuts off
   * elements that exceed the token budget.
   */
  public buildAndPrioritize(items: PipelineContextItem[], maxTokens: number): PipelineContextItem[] {
    const sorted = [...items].sort((a, b) => {
      const weightA = this.weights[a.type] || 0;
      const weightB = this.weights[b.type] || 0;
      return weightB - weightA;
    });

    const accepted: PipelineContextItem[] = [];
    let currentTokens = 0;

    for (const item of sorted) {
      const approxTokens = Math.ceil(item.content.length / 4);
      if (currentTokens + approxTokens <= maxTokens) {
        accepted.push(item);
        currentTokens += approxTokens;
      }
    }

    return accepted;
  }
}

export class AIRequestPipeline {
  private readonly cache = new MultiLevelCache();
  private readonly builder = new ContextBuilder();

  public getCache(): IMultiLevelCache {
    return this.cache;
  }

  /**
   * Executes prompt preparation by compiling prioritized contexts,
   * checking multi-level cache hits, and tailoring prompts using the provider adapter.
   */
  public prepareRequest(
    items: PipelineContextItem[],
    providerId: string,
    template: string,
    variables: Record<string, string> = {}
  ): { prompt: string; adapter: IProviderAdapter; cacheHit?: string } {
    const adapter = getAdapterForProvider(providerId);
    
    // Prioritize contexts based on adapter max context token limit
    const maxContextTokens = adapter.capabilities.maxContext;
    const prioritizedItems = this.builder.buildAndPrioritize(items, maxContextTokens);

    // Context items compilation (never strips comments or mutilates text content)
    const assembledContext = prioritizedItems.map(item => item.content).join('\n');
    
    // Inject DNA and context parameters into formatting variables
    const finalVariables = {
      ...variables,
      DNA: variables.DNA || assembledContext,
    };

    const formattedPrompt = adapter.formatPrompt(template, finalVariables);

    // Cache lookup: Static or Conversation depending on template variables
    const cacheKey = formattedPrompt;
    let cachedResponse = this.cache.lookupStatic(cacheKey);
    if (!cachedResponse) {
      cachedResponse = this.cache.lookupConversation(cacheKey);
    }
    if (!cachedResponse) {
      cachedResponse = this.cache.lookupProvider(cacheKey);
    }

    return {
      prompt: formattedPrompt,
      adapter,
      cacheHit: cachedResponse
    };
  }

  public saveToCache(prompt: string, response: string, category: 'static' | 'conversation' | 'provider' = 'provider'): void {
    if (category === 'static') {
      this.cache.saveStatic(prompt, response);
    } else if (category === 'conversation') {
      this.cache.saveConversation(prompt, response);
    } else {
      this.cache.saveProvider(prompt, response);
    }
  }
}
