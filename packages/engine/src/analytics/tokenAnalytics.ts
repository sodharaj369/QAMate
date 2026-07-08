export interface ModelPricing {
  providerId: string;
  modelName: string;
  inputPerMillion: number;
  outputPerMillion: number;
  cachedInputPerMillion?: number;
  currency: string;
}

export interface SessionAnalytics {
  aiCallsCount: number;
  providersUsed: string[];
  fallbacksCount: number;
  tokensUsed: number;
  tokensSaved: number;
  cacheHitsCount: number;
  totalDurationMS: number;
  estimatedCost: number;
  questionsCount: number;
  questionsAvoidedCount: number;
}

export interface ITokenAnalytics {
  registerPricing(pricing: ModelPricing): void;
  logRequest(providerId: string, modelName: string, promptTokens: number, completionTokens: number, executionTimeMS: number): void;
  logCacheHit(tokensSaved: number): void;
  logSkippedRequest(tokensSaved: number): void;
  logFallback(): void;
  logQuestion(avoided: boolean): void;
  checkBudget(sessionTokensUsed: number): { allowed: boolean; warning?: string };
  getReport(): {
    totalRequests: number;
    skippedRequests: number;
    cacheHits: number;
    tokensUsed: number;
    tokensSaved: number;
    estimatedCost: number;
    avgExecutionTimeMS: number;
    session: SessionAnalytics;
  };
  clear(): void;
}

export class TokenAnalytics implements ITokenAnalytics {
  private requestsCount = 0;
  private skippedCount = 0;
  private hitsCount = 0;
  private tokensUsedCount = 0;
  private tokensSavedCount = 0;
  private totalCost = 0;
  private executionTimes: number[] = [];
  
  // Session Analytics
  private fallbacksCount = 0;
  private questionsCount = 0;
  private questionsAvoidedCount = 0;
  private providersUsedSet = new Set<string>();

  // Token Budget Configs
  private tokenBudgetLimit = 40000;

  private pricingRegistry: Map<string, ModelPricing> = new Map([
    ['claude-sonnet', { providerId: 'claude', modelName: 'claude-3-5-sonnet-20240620', inputPerMillion: 3.0, outputPerMillion: 15.0, currency: 'USD' }],
    ['openai-gpt4o', { providerId: 'openai', modelName: 'gpt-4o', inputPerMillion: 2.5, outputPerMillion: 10.0, currency: 'USD' }],
    ['gemini-pro', { providerId: 'gemini', modelName: 'gemini-1.5-pro', inputPerMillion: 1.25, outputPerMillion: 5.0, currency: 'USD' }],
    ['ollama-default', { providerId: 'ollama', modelName: 'default', inputPerMillion: 0.0, outputPerMillion: 0.0, currency: 'USD' }],
    ['mock-default', { providerId: 'mock', modelName: 'default', inputPerMillion: 0.0, outputPerMillion: 0.0, currency: 'USD' }]
  ]);

  public setTokenBudgetLimit(limit: number): void {
    this.tokenBudgetLimit = limit;
  }

  public registerPricing(pricing: ModelPricing): void {
    const key = `${pricing.providerId.toLowerCase()}-${pricing.modelName.toLowerCase()}`;
    this.pricingRegistry.set(key, pricing);
  }

  public logRequest(
    providerId: string,
    modelName: string,
    promptTokens: number,
    completionTokens: number,
    executionTimeMS: number
  ): void {
    this.requestsCount++;
    const totalTokens = promptTokens + completionTokens;
    this.tokensUsedCount += totalTokens;
    this.executionTimes.push(executionTimeMS);
    this.providersUsedSet.add(providerId);

    const registryKey = `${providerId.toLowerCase()}-${modelName.toLowerCase()}`;
    let pricing = this.pricingRegistry.get(registryKey);
    if (!pricing) {
      pricing = Array.from(this.pricingRegistry.values()).find(
        (p) => p.providerId.toLowerCase() === providerId.toLowerCase()
      ) || {
        providerId,
        modelName,
        inputPerMillion: 0.0,
        outputPerMillion: 0.0,
        currency: 'USD',
      };
    }

    const cost = (promptTokens / 1000000) * pricing.inputPerMillion + (completionTokens / 1000000) * pricing.outputPerMillion;
    this.totalCost += cost;
  }

  public logCacheHit(tokensSaved: number): void {
    this.hitsCount++;
    this.tokensSavedCount += tokensSaved;
  }

  public logSkippedRequest(tokensSaved: number): void {
    this.skippedCount++;
    this.tokensSavedCount += tokensSaved;
  }

  public logFallback(): void {
    this.fallbacksCount++;
  }

  public logQuestion(avoided: boolean): void {
    if (avoided) {
      this.questionsAvoidedCount++;
    } else {
      this.questionsCount++;
    }
  }

  public checkBudget(sessionTokensUsed: number): { allowed: boolean; warning?: string } {
    const remaining = this.tokenBudgetLimit - sessionTokensUsed;
    if (remaining <= 0) {
      return { allowed: false, warning: 'Token budget exceeded!' };
    }
    
    const threshold = this.tokenBudgetLimit * 0.15;
    if (remaining < threshold) {
      return { allowed: true, warning: `Warning: Token budget remaining is low (${Math.round((remaining / this.tokenBudgetLimit) * 100)}% remaining)` };
    }
    
    return { allowed: true };
  }

  public getReport() {
    const avgExecutionTimeMS =
      this.executionTimes.length > 0
        ? Math.round(this.executionTimes.reduce((a, b) => a + b, 0) / this.executionTimes.length)
        : 0;

    const totalDurationMS = this.executionTimes.reduce((a, b) => a + b, 0);

    const session: SessionAnalytics = {
      aiCallsCount: this.requestsCount,
      providersUsed: Array.from(this.providersUsedSet),
      fallbacksCount: this.fallbacksCount,
      tokensUsed: this.tokensUsedCount,
      tokensSaved: this.tokensSavedCount,
      cacheHitsCount: this.hitsCount,
      totalDurationMS,
      estimatedCost: Number(this.totalCost.toFixed(5)),
      questionsCount: this.questionsCount,
      questionsAvoidedCount: this.questionsAvoidedCount
    };

    return {
      totalRequests: this.requestsCount,
      skippedRequests: this.skippedCount,
      cacheHits: this.hitsCount,
      tokensUsed: this.tokensUsedCount,
      tokensSaved: this.tokensSavedCount,
      estimatedCost: Number(this.totalCost.toFixed(5)),
      avgExecutionTimeMS,
      session
    };
  }

  public clear(): void {
    this.requestsCount = 0;
    this.skippedCount = 0;
    this.hitsCount = 0;
    this.tokensUsedCount = 0;
    this.tokensSavedCount = 0;
    this.totalCost = 0;
    this.executionTimes = [];
    this.fallbacksCount = 0;
    this.questionsCount = 0;
    this.questionsAvoidedCount = 0;
    this.providersUsedSet.clear();
  }
}
