export interface TelemetryReport {
  readonly totalRequests: number;
  readonly skippedRequests: number;
  readonly cacheHits: number;
  readonly tokensUsed: number;
  readonly tokensSaved: number;
  readonly estimatedSavingsPercent: number;
  readonly avgExecutionTimeMS: number;
}

export class TelemetryTracker {
  private requestsCount = 0;
  private skippedCount = 0;
  private hitsCount = 0;
  private tokensUsedCount = 0;
  private tokensSavedCount = 0;
  private executionTimes: number[] = [];

  public logRequest(tokensUsed: number, executionTimeMS: number): void {
    this.requestsCount++;
    this.tokensUsedCount += tokensUsed;
    this.executionTimes.push(executionTimeMS);
  }

  public logSkippedRequest(tokensSaved: number): void {
    this.skippedCount++;
    this.tokensSavedCount += tokensSaved;
  }

  public logCacheHit(tokensSaved: number): void {
    this.hitsCount++;
    this.tokensSavedCount += tokensSaved;
  }

  public getReport(): TelemetryReport {
    const totalCalls = this.requestsCount + this.skippedCount + this.hitsCount;
    const avoidedCount = this.skippedCount + this.hitsCount;
    const savingsPercent = totalCalls > 0 ? Math.round((avoidedCount / totalCalls) * 100) : 0;

    const avgExecutionTimeMS =
      this.executionTimes.length > 0
        ? Math.round(this.executionTimes.reduce((a, b) => a + b, 0) / this.executionTimes.length)
        : 0;

    return {
      totalRequests: this.requestsCount,
      skippedRequests: this.skippedCount,
      cacheHits: this.hitsCount,
      tokensUsed: this.tokensUsedCount,
      tokensSaved: this.tokensSavedCount,
      estimatedSavingsPercent: savingsPercent,
      avgExecutionTimeMS,
    };
  }

  public clear(): void {
    this.requestsCount = 0;
    this.skippedCount = 0;
    this.hitsCount = 0;
    this.tokensUsedCount = 0;
    this.tokensSavedCount = 0;
    this.executionTimes = [];
  }
}
