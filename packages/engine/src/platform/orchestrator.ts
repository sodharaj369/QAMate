import { ILLMProvider } from '../interfaces/index.js';
import { EfficiencyEngine } from './efficiency.js';
import { TelemetryTracker } from './telemetry.js';
import { TrustFramework } from './trust.js';
import { CostMode } from './config.js';

export interface OrchestratorOptions {
  costMode?: CostMode;
  allowCloud?: boolean;
  localProvider?: ILLMProvider;
  cloudProviderCheap?: ILLMProvider;
  cloudProviderPremium?: ILLMProvider;
}

export class AIOrchestrator {
  constructor(
    private readonly efficiency: EfficiencyEngine,
    private readonly telemetry: TelemetryTracker,
    private readonly trust: TrustFramework,
  ) {}

  /**
   * Orchestrates prompt request execution across rule engines, caches, local engines, or cloud backends.
   */
  public async orchestrate(
    taskType:
      | 'requirement-analysis'
      | 'question-planning'
      | 'test-generation'
      | 'grammar-formatting'
      | 'review',
    prompt: string,
    options: OrchestratorOptions = {},
  ): Promise<string> {
    const costMode = options.costMode || 'balanced';
    const allowCloud = options.allowCloud !== false;

    this.trust.addTrace(`Orchestrating task [${taskType}] with costMode: ${costMode}`);

    // Rule 1: Skip LLM entirely for pure rule-based tasks if CostMode is Cheapest
    if (
      costMode === 'cheapest' &&
      (taskType === 'requirement-analysis' || taskType === 'question-planning')
    ) {
      this.telemetry.logSkippedRequest(this.efficiency.estimateTokens(prompt));
      this.trust.addTrace(`Orchestrator: Bypassed AI. Route directly to rule engine mock.`);
      return `Rule Engine Mock Output for task: ${taskType}`;
    }

    // Rule 2: Check Response Cache
    const cached = this.efficiency.getCachedResponse(prompt);
    if (cached) {
      this.telemetry.logCacheHit(this.efficiency.estimateTokens(prompt));
      this.trust.addTrace(`Orchestrator: Cache hit resolved.`);
      return cached;
    }

    // Determine target provider stack
    const providersToTry: ILLMProvider[] = [];

    if (costMode === 'cheapest') {
      if (options.localProvider) providersToTry.push(options.localProvider);
    } else if (costMode === 'balanced') {
      if (taskType === 'test-generation') {
        if (allowCloud && options.cloudProviderPremium)
          providersToTry.push(options.cloudProviderPremium);
        if (allowCloud && options.cloudProviderCheap)
          providersToTry.push(options.cloudProviderCheap);
        if (options.localProvider) providersToTry.push(options.localProvider);
      } else {
        if (options.localProvider) providersToTry.push(options.localProvider);
        if (allowCloud && options.cloudProviderCheap)
          providersToTry.push(options.cloudProviderCheap);
        if (allowCloud && options.cloudProviderPremium)
          providersToTry.push(options.cloudProviderPremium);
      }
    } else {
      // Highest Quality: Premium first
      if (allowCloud && options.cloudProviderPremium)
        providersToTry.push(options.cloudProviderPremium);
      if (allowCloud && options.cloudProviderCheap) providersToTry.push(options.cloudProviderCheap);
      if (options.localProvider) providersToTry.push(options.localProvider);
    }

    if (providersToTry.length === 0) {
      throw new Error(`Orchestrator: No valid AI providers configured for task type: ${taskType}`);
    }

    // Execution with Fallback Escalation
    let lastError: Error | null = null;
    for (let i = 0; i < providersToTry.length; i++) {
      const provider = providersToTry[i];
      const start = performance.now();
      try {
        this.trust.addTrace(`Orchestrator: Attempting completion using provider: ${provider.name}`);
        const response = await provider.generate(prompt);
        const duration = performance.now() - start;

        // Cache result
        this.efficiency.setCachedResponse(prompt, response);
        this.telemetry.logRequest(this.efficiency.estimateTokens(prompt + response), duration);
        this.trust.addTrace(`Orchestrator: Request resolved successfully using ${provider.name}.`);

        return response;
      } catch (err: any) {
        lastError = err;
        this.trust.addTrace(
          `Orchestrator: Provider ${provider.name} failed with error: ${err.message}. Escalating...`,
        );
      }
    }

    throw new Error(
      `Orchestrator: All configured models failed. Last error: ${lastError?.message}`,
    );
  }
}
