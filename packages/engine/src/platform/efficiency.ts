export interface TokenCostEstimate {
  readonly tokens: number;
  readonly costUSD: number;
}

export class EfficiencyEngine {
  private readonly cache = new Map<string, string>();
  private cacheHitsCount = 0;
  private cacheMissesCount = 0;

  /**
   * Minimizes prompt context by stripping comments, duplicate empty lines, and carriage returns.
   */
  public minimizeContext(text: string): string {
    return (
      text
        .split('\n')
        .map((line) => line.trim())
        // Filter out empty lines or pure code comments
        .filter((line) => line.length > 0 && !line.startsWith('//') && !line.startsWith('#'))
        .join('\n')
    );
  }

  /**
   * Estimates tokens based on character length (avg 4 characters per token).
   */
  public estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  /**
   * Calculates execution cost based on token sizes and cost tier.
   */
  public estimateCost(
    inputText: string,
    outputText: string,
    tier: 'cheap' | 'balanced' | 'quality',
  ): TokenCostEstimate {
    const inputTokens = this.estimateTokens(inputText);
    const outputTokens = this.estimateTokens(outputText);
    const totalTokens = inputTokens + outputTokens;

    let rateInput = 0.0015 / 1000;
    let rateOutput = 0.002 / 1000;

    if (tier === 'balanced') {
      rateInput = 0.003 / 1000;
      rateOutput = 0.004 / 1000;
    } else if (tier === 'quality') {
      rateInput = 0.01 / 1000;
      rateOutput = 0.03 / 1000;
    }

    const costUSD = inputTokens * rateInput + outputTokens * rateOutput;

    return {
      tokens: totalTokens,
      costUSD: Math.round(costUSD * 100000) / 100000,
    };
  }

  /**
   * Caches response for specific prompts.
   */
  public getCachedResponse(prompt: string): string | undefined {
    const key = prompt.trim();
    if (this.cache.has(key)) {
      this.cacheHitsCount++;
      return this.cache.get(key);
    }
    this.cacheMissesCount++;
    return undefined;
  }

  public setCachedResponse(prompt: string, response: string): void {
    this.cache.set(prompt.trim(), response);
  }

  public getCacheMetrics() {
    return {
      hits: this.cacheHitsCount,
      misses: this.cacheMissesCount,
      size: this.cache.size,
    };
  }

  public clearCache(): void {
    this.cache.clear();
    this.cacheHitsCount = 0;
    this.cacheMissesCount = 0;
  }
}
