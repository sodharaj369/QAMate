import { TokenOptimizer } from '../token-optimizer/tokenOptimizer.js';
import { AIRequestPipeline } from './aiRequestPipeline.js';

export interface TokenCostEstimate {
  readonly tokens: number;
  readonly costUSD: number;
}

/**
 * @deprecated Use AIRequestPipeline instead.
 */
export class EfficiencyEngine {
  private readonly pipeline = new AIRequestPipeline();
  private readonly optimizer = new TokenOptimizer();
  private cacheHits = 0;

  public minimizeContext(text: string): string {
    // Preserves code comments and formatting as per Phase 2 requirements
    return text.trim();
  }

  public estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  public estimateCost(
    inputText: string,
    outputText: string,
    tier: 'cheap' | 'balanced' | 'quality'
  ): TokenCostEstimate {
    const totalTokens = this.estimateTokens(inputText) + this.estimateTokens(outputText);
    return {
      tokens: totalTokens,
      costUSD: totalTokens * 0.00002,
    };
  }

  public getCachedResponse(prompt: string): string | undefined {
    const res = this.pipeline.getCache().lookupProvider(prompt) || this.pipeline.getCache().lookupStatic(prompt);
    if (res) {
      this.cacheHits++;
    }
    return res;
  }

  public setCachedResponse(prompt: string, response: string): void {
    this.pipeline.saveToCache(prompt, response, 'provider');
  }

  public getCacheMetrics() {
    return {
      hits: this.cacheHits,
      misses: 0,
      size: 0,
    };
  }

  public getOptimizer(): TokenOptimizer {
    return this.optimizer;
  }

  public clearCache(): void {
    this.pipeline.getCache().clearAll();
  }
}
