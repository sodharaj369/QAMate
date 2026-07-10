import { ILLMProvider, LLMRequestOptions } from '../interfaces/index.js';
import { EfficiencyEngine } from '../platform/efficiency.js';
import { TokenAnalytics } from '../analytics/tokenAnalytics.js';
import { TrustFramework } from '../platform/trust.js';
import { CostMode, ConfigurationManager } from '../platform/config.js';
import { LLMProviderFactory } from './providerFactory.js';

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

interface AvailableProviderEntry {
  provider: ILLMProvider;
  priority: number;
  reason: string;
  isAvailable: boolean;
}

export class AIOrchestrator implements ILLMProvider {
  public readonly id = 'orchestrator';
  public readonly name = 'AI Orchestrator Gateway';

  public lastSelectedProviderId = 'mock';
  public lastSelectedProviderName = 'Offline Analysis';
  public lastSelectedReason = 'Default mock fallback';

  private customProviders: ILLMProvider[] = [];
  private availableProviders: AvailableProviderEntry[] = [];

  constructor(
    private readonly efficiency: EfficiencyEngine,
    private readonly telemetry: TokenAnalytics,
    private readonly trust: TrustFramework,
    private readonly configManager?: ConfigurationManager,
  ) {}

  /**
   * Registers a custom runtime provider (such as VS Code LM API)
   */
  public registerCustomProvider(provider: ILLMProvider): void {
    if (!this.customProviders.some((p) => p.id === provider.id)) {
      this.customProviders.push(provider);
    }
  }

  /**
   * Clears custom registered providers
   */
  public clearCustomProviders(): void {
    this.customProviders = [];
  }

  /**
   * Refreshes the status and availability of all potential providers dynamically
   */
  public async refreshProviders(): Promise<void> {
    const settings = this.configManager?.getSettings() || { apiKeys: {} as Record<string, string>, costMode: 'balanced' };
    const apiKeys: Record<string, string> = settings.apiKeys || {};
    const preferredProvider = apiKeys['preferred_provider'] || 'mock';

    const list: AvailableProviderEntry[] = [];

    // 1. OpenAI
    const openAIKey = apiKeys['openai'] || process.env.OPENAI_API_KEY;
    if (openAIKey) {
      const preferred = preferredProvider === 'openai';
      try {
        const prov = LLMProviderFactory.createProvider({
          providerId: 'openai',
          apiKey: openAIKey,
          modelName: apiKeys['preferred_model'] || 'gpt-4o',
        });
        list.push({
          provider: prov,
          priority: preferred ? 100 : 9,
          reason: preferred ? 'User preferred configured provider' : 'Configured via API Key',
          isAvailable: true,
        });
      } catch {
        // ignore
      }
    }

    // 2. Claude
    const claudeKey = apiKeys['claude'] || process.env.ANTHROPIC_API_KEY;
    if (claudeKey) {
      const preferred = preferredProvider === 'claude';
      try {
        const prov = LLMProviderFactory.createProvider({
          providerId: 'claude',
          apiKey: claudeKey,
          modelName: apiKeys['preferred_model'] || 'claude-3-5-sonnet-20240620',
        });
        list.push({
          provider: prov,
          priority: preferred ? 100 : 10,
          reason: preferred ? 'User preferred configured provider' : 'Configured via API Key',
          isAvailable: true,
        });
      } catch {
        // ignore
      }
    }

    // 3. Gemini
    const geminiKey = apiKeys['gemini'] || process.env.GEMINI_API_KEY;
    if (geminiKey) {
      const preferred = preferredProvider === 'gemini';
      try {
        const prov = LLMProviderFactory.createProvider({
          providerId: 'gemini',
          apiKey: geminiKey,
          modelName: apiKeys['preferred_model'] || 'gemini-1.5-pro',
        });
        list.push({
          provider: prov,
          priority: preferred ? 100 : 8,
          reason: preferred ? 'User preferred configured provider' : 'Configured via API Key',
          isAvailable: true,
        });
      } catch {
        // ignore
      }
    }

    // 4. Ollama (Local Server)
    const ollamaEndpoint = apiKeys['ollama'] || apiKeys['ollama_endpoint'] || process.env.OLLAMA_ENDPOINT || 'http://localhost:11434';
    let isOllamaOnline = false;
    try {
      const pingUrl = `${ollamaEndpoint}/api/tags`;
      const res = await Promise.race([
        fetch(pingUrl).then((r) => r.ok),
        new Promise<boolean>((_, reject) => setTimeout(() => reject(new Error('timeout')), 400)),
      ]);
      isOllamaOnline = !!res;
    } catch {
      isOllamaOnline = false;
    }

    if (isOllamaOnline) {
      const preferred = preferredProvider === 'ollama';
      try {
        const prov = LLMProviderFactory.createProvider({
          providerId: 'ollama',
          apiEndpoint: ollamaEndpoint,
          modelName: apiKeys['preferred_model'] || 'llama3',
        });
        list.push({
          provider: prov,
          priority: preferred ? 100 : 7,
          reason: preferred ? 'User preferred local provider' : 'Local Ollama server is online',
          isAvailable: true,
        });
      } catch {
        // ignore
      }
    }

    // 5. Custom registered providers (VS Code LM API, etc.)
    for (const cp of this.customProviders) {
      const preferred =
        preferredProvider === cp.id ||
        (preferredProvider === 'mock' && cp.id.startsWith('vscode-lm'));
      list.push({
        provider: cp,
        priority: preferred ? 100 : 6,
        reason: preferred ? 'User preferred IDE provider' : 'IDE custom chat models active',
        isAvailable: true,
      });
    }

    // 6. Mock Provider (Always available fallback)
    const preferredMock =
      preferredProvider === 'mock' && !this.customProviders.some((p) => p.id.startsWith('vscode-lm'));
    try {
      const prov = LLMProviderFactory.createProvider({ providerId: 'mock', modelName: 'mock' });
      list.push({
        provider: prov,
        priority: preferredMock ? 100 : -1,
        reason: preferredMock ? 'User preferred offline simulation' : 'Default offline mock engine fallback',
        isAvailable: true,
      });
    } catch {
      // ignore
    }

    this.availableProviders = list;
  }

  /**
   * Implements ILLMProvider generate method to route requests dynamically
   */
  public async generate(prompt: string, options?: LLMRequestOptions): Promise<string> {
    const taskType =
      prompt.toLowerCase().includes('review') || prompt.toLowerCase().includes('quality gate')
        ? 'review'
        : prompt.toLowerCase().includes('plan')
          ? 'question-planning'
          : prompt.toLowerCase().includes('test cases') || prompt.toLowerCase().includes('AAA')
            ? 'test-generation'
            : 'requirement-analysis';

    const orchestrateRes = await this.orchestrate({
      taskType,
      prompt,
      costMode: this.configManager?.getCostMode() || 'balanced',
    });

    return orchestrateRes.content;
  }

  /**
   * Central orchestrate implementation
   */
  public async orchestrate(
    request: AIRequest,
    options: OrchestratorOptions = {},
  ): Promise<AIResponse> {
    const costMode = request.costMode || this.configManager?.getCostMode() || 'balanced';

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
        warnings: [budgetCheck.warning || 'Budget limit reached'],
      };
    }

    const warnings: string[] = [];
    if (budgetCheck.warning) {
      warnings.push(budgetCheck.warning);
    }

    // Check cheapest mode rule bypass!
    if (costMode === 'cheapest') {
      this.telemetry.logSkippedRequest(this.efficiency.estimateTokens(request.prompt));
      this.trust.addTrace(`Orchestrator: Bypassing AI entirely on rule-based cheapest mode.`);
      this.lastSelectedProviderId = 'offline-rules';
      this.lastSelectedProviderName = 'Rules Engine Offline Analysis';
      this.lastSelectedReason = 'Bypassed AI on rule-based cheapest mode request';
      return {
        content: 'Rule Engine Mock Output',
        providerId: 'offline-rules',
        modelName: 'rule-engine',
        latencyMS: 1,
        tokensUsed: 0,
        estimatedCost: 0,
        cacheHit: false,
        warnings,
      };
    }

    // Lookup Prompt Replay Cache
    const cached = this.efficiency.getCachedResponse(request.prompt);
    if (cached) {
      const estimatedSaved = this.efficiency.estimateTokens(request.prompt);
      this.telemetry.logCacheHit(estimatedSaved);
      this.trust.addTrace(`Orchestrator: Cache hit resolved.`);
      this.lastSelectedProviderId = 'cache';
      this.lastSelectedProviderName = 'Prompt Replay Cache';
      this.lastSelectedReason = 'Resolved via local memory cache hit';
      return {
        content: cached,
        providerId: 'cache',
        modelName: 'cache',
        latencyMS: 1,
        tokensUsed: 0,
        estimatedCost: 0,
        cacheHit: true,
        warnings,
      };
    }

    // Refresh dynamic runtime status
    await this.refreshProviders();

    // Compile list of providers to try
    const providersToTry: Array<{ provider: ILLMProvider; priority: number; reason: string }> = [];

    // If options contains explicit custom providers (from tests/explicit orchestrate calls), prioritize them!
    if (options.localProvider) {
      providersToTry.push({ provider: options.localProvider, priority: 200, reason: 'Explicit local provider option' });
    }
    if (options.cloudProviderCheap) {
      providersToTry.push({ provider: options.cloudProviderCheap, priority: 190, reason: 'Explicit cheap cloud provider option' });
    }
    if (options.cloudProviderPremium) {
      providersToTry.push({ provider: options.cloudProviderPremium, priority: 195, reason: 'Explicit premium cloud provider option' });
    }

    // Add dynamically discovered available providers (avoid duplicates)
    for (const entry of this.availableProviders) {
      if (!providersToTry.some((p) => p.provider.id === entry.provider.id)) {
        providersToTry.push({ provider: entry.provider, priority: entry.priority, reason: entry.reason });
      }
    }

    // Sort providers by priority descending
    const sortedProviders = providersToTry.sort((a, b) => b.priority - a.priority);

    if (sortedProviders.length === 0) {
      throw new Error(`Orchestrator: No valid AI providers detected at runtime.`);
    }

    let lastError: Error | null = null;

    // Failover execution loop
    for (const item of sortedProviders) {
      const provider = item.provider;
      const start = performance.now();
      try {
        this.trust.addTrace(`Orchestrator: Attempting completion using provider: ${provider.name}`);
        this.lastSelectedProviderId = provider.id;
        this.lastSelectedProviderName = provider.name;
        this.lastSelectedReason = item.reason;

        // Apply a strict 30 second timeout per provider attempt
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`Provider request timed out after 30000ms`)), 30000),
        );

        const response = await Promise.race([
          provider.generate(request.prompt),
          timeoutPromise,
        ]);

        const duration = performance.now() - start;
        const inputTokens = this.efficiency.estimateTokens(request.prompt);
        const outputTokens = this.efficiency.estimateTokens(response);

        this.efficiency.setCachedResponse(request.prompt, response);
        this.telemetry.logRequest(
          provider.id || 'mock',
          provider.name || 'default',
          inputTokens,
          outputTokens,
          duration,
        );
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
          warnings,
        };
      } catch (err: any) {
        lastError = err;
        this.telemetry.logFallback();
        this.trust.addTrace(
          `Orchestrator: Provider ${provider.name} failed: ${err.message}. Failover to next...`,
        );
      }
    }

    // If every single provider fails, default to Offline Mode using mock response
    this.lastSelectedProviderId = 'mock';
    this.lastSelectedProviderName = 'Offline Analysis';
    this.lastSelectedReason = `Offline Mode: All configured AI providers failed. Last error: ${lastError?.message}`;

    this.trust.addTrace(
      `Orchestrator: Entered Offline Mode. Reason: All providers failed. Last error: ${lastError?.message}`,
    );

    const mockProv = LLMProviderFactory.createProvider({ providerId: 'mock', modelName: 'mock' });
    const fallbackResponse = await mockProv.generate(request.prompt);

    return {
      content: fallbackResponse,
      providerId: 'mock',
      modelName: 'offline-fallback',
      latencyMS: 10,
      tokensUsed: 0,
      estimatedCost: 0,
      cacheHit: false,
      warnings: [...warnings, `All AI providers failed. Entered Offline Mode. Last error: ${lastError?.message}`],
    };
  }
}
