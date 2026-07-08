import { ILLMProvider } from '../interfaces/index.js';
import { EfficiencyEngine } from '../platform/efficiency.js';
import { TokenAnalytics } from '../analytics/tokenAnalytics.js';
import { TrustFramework } from '../platform/trust.js';
import { CostMode } from '../platform/config.js';

export interface AIRequest {
  taskType:
    | 'requirement-analysis'
    | 'question-planning'
    | 'test-generation'
    | 'grammar-formatting'
    | 'review';
  prompt: string;
  tokenBudget?: number;
  persona?: string;
  requirementId?: string;
  costMode?: CostMode;
}

export interface AIResponse {
  content: string;
  providerId: string;
  modelName: string;
  latencyMS: number;
  tokensUsed: number;
  estimatedCost: number;
  cacheHit: boolean;
  warnings?: string[];
}

export interface OrchestratorOptions {
  allowCloud?: boolean;
  localProvider?: ILLMProvider;
  cloudProviderCheap?: ILLMProvider;
  cloudProviderPremium?: ILLMProvider;
}

export class AIOrchestrator {
  constructor(
    private readonly efficiency: EfficiencyEngine,
    private readonly telemetry: TokenAnalytics,
    private readonly trust: TrustFramework,
  ) {}

  public async orchestrate(
    request: AIRequest,
    options: OrchestratorOptions = {},
  ): Promise<AIResponse> {
    const costMode = request.costMode || 'balanced';
    const allowCloud = options.allowCloud !== false;

    this.trust.addTrace(`Orchestrating task [${request.taskType}] with costMode: ${costMode}`);

    // Check budget limit
    const currentTokensUsed = this.telemetry.getReport().tokensUsed;
    const budgetCheck = this.telemetry.checkBudget(currentTokensUsed);
    if (!budgetCheck.allowed) {
      this.trust.addTrace(`Orchestrator: Blocked AI execution. Token budget exceeded.`);
      return {
        content: `Blocked: Token budget limit reached. Cannot query model.`,
        providerId: 'none',
        modelName: 'blocked',
        latencyMS: 0,
        tokensUsed: 0,
        estimatedCost: 0,
        cacheHit: false,
        warnings: [budgetCheck.warning || 'Budget limit reached']
      };
    }

    const warnings: string[] = [];
    if (budgetCheck.warning) {
      warnings.push(budgetCheck.warning);
    }

    if (
      costMode === 'cheapest' &&
      (request.taskType === 'requirement-analysis' || request.taskType === 'question-planning')
    ) {
      const estimatedSaved = this.efficiency.estimateTokens(request.prompt);
      this.telemetry.logSkippedRequest(estimatedSaved);
      this.trust.addTrace(`Orchestrator: Bypassed AI. Route directly to rule engine mock.`);
      return {
        content: `Rule Engine Mock Output for task: ${request.taskType}`,
        providerId: 'mock',
        modelName: 'default',
        latencyMS: 1,
        tokensUsed: 0,
        estimatedCost: 0,
        cacheHit: false,
        warnings
      };
    }

    const cached = this.efficiency.getCachedResponse(request.prompt);
    if (cached) {
      const estimatedSaved = this.efficiency.estimateTokens(request.prompt);
      this.telemetry.logCacheHit(estimatedSaved);
      this.trust.addTrace(`Orchestrator: Cache hit resolved.`);
      return {
        content: cached,
        providerId: 'cache',
        modelName: 'cache',
        latencyMS: 1,
        tokensUsed: 0,
        estimatedCost: 0,
        cacheHit: true,
        warnings
      };
    }

    const providersToTry: ILLMProvider[] = [];

    if (costMode === 'cheapest') {
      if (options.localProvider) providersToTry.push(options.localProvider);
    } else if (costMode === 'balanced') {
      if (request.taskType === 'test-generation') {
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
      if (allowCloud && options.cloudProviderPremium)
        providersToTry.push(options.cloudProviderPremium);
      if (allowCloud && options.cloudProviderCheap) providersToTry.push(options.cloudProviderCheap);
      if (options.localProvider) providersToTry.push(options.localProvider);
    }

    if (providersToTry.length === 0) {
      throw new Error(`Orchestrator: No valid AI providers configured for task type: ${request.taskType}`);
    }

    let lastError: Error | null = null;
    for (let i = 0; i < providersToTry.length; i++) {
      const provider = providersToTry[i];
      const start = performance.now();
      try {
        this.trust.addTrace(`Orchestrator: Attempting completion using provider: ${provider.name}`);
        
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`Provider request timed out after 30000ms`)), 30000)
        );
        
        const response = await Promise.race([
          provider.generate(request.prompt),
          timeoutPromise
        ]);
        
        const duration = performance.now() - start;

        const inputTokens = this.efficiency.estimateTokens(request.prompt);
        const outputTokens = this.efficiency.estimateTokens(response);

        this.efficiency.setCachedResponse(request.prompt, response);
        this.telemetry.logRequest(provider.id || 'mock', provider.name || 'default', inputTokens, outputTokens, duration);
        this.trust.addTrace(`Orchestrator: Request resolved successfully using ${provider.name}.`);

        const pricingReport = this.telemetry.getReport();

        return {
          content: response,
          providerId: provider.id || 'mock',
          modelName: provider.name || 'default',
          latencyMS: Math.round(duration),
          tokensUsed: inputTokens + outputTokens,
          estimatedCost: pricingReport.estimatedCost,
          cacheHit: false,
          warnings
        };
      } catch (err: any) {
        lastError = err;
        this.telemetry.logFallback();
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
