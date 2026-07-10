import { describe, it, expect, beforeEach } from 'vitest';
import { AIOrchestrator } from '../src/provider-hub/orchestrator.js';
import { EfficiencyEngine } from '../src/platform/efficiency.js';
import { TokenAnalytics } from '../src/analytics/tokenAnalytics.js';
import { TrustFramework } from '../src/platform/trust.js';
import { ConfigurationManager } from '../src/platform/config.js';
import { ILLMProvider } from '../src/interfaces/index.js';

describe('AIOrchestrator Tests', () => {
  let orchestrator: AIOrchestrator;
  let configManager: ConfigurationManager;

  beforeEach(() => {
    const efficiency = new EfficiencyEngine();
    const telemetry = new TokenAnalytics();
    const trust = new TrustFramework();
    configManager = new ConfigurationManager();
    orchestrator = new AIOrchestrator(efficiency, telemetry, trust, configManager);
  });

  it('should register custom runtime providers', async () => {
    const mockProvider: ILLMProvider = {
      id: 'vscode-lm-mock',
      name: 'VS Code LM Mock',
      generate: async () => 'hello from vs code lm',
    };

    orchestrator.registerCustomProvider(mockProvider);
    await orchestrator.refreshProviders();

    // Verify it is resolved in the available providers list
    const activeProvider = await orchestrator.generate('test query');
    expect(orchestrator.lastSelectedProviderId).toBe('vscode-lm-mock');
    expect(activeProvider).toBe('hello from vs code lm');
  });

  it('should prioritize the user preferred provider', async () => {
    const providerA: ILLMProvider = {
      id: 'provider-a',
      name: 'Provider A',
      generate: async () => 'Response from A',
    };
    const providerB: ILLMProvider = {
      id: 'provider-b',
      name: 'Provider B',
      generate: async () => 'Response from B',
    };

    // Register both
    orchestrator.registerCustomProvider(providerA);
    orchestrator.registerCustomProvider(providerB);

    // Set provider-b as preferred
    configManager.updateSettings({
      apiKeys: {
        preferred_provider: 'provider-b',
      },
    });

    await orchestrator.refreshProviders();

    const response = await orchestrator.generate('test query');
    expect(response).toBe('Response from B');
    expect(orchestrator.lastSelectedProviderId).toBe('provider-b');
  });

  it('should automatically failover to next provider when a provider fails', async () => {
    let callCountA = 0;
    const failingProviderA: ILLMProvider = {
      id: 'failing-a',
      name: 'Failing Provider A',
      generate: async () => {
        callCountA++;
        throw new Error('Connection failed');
      },
    };

    let callCountB = 0;
    const succeedingProviderB: ILLMProvider = {
      id: 'succeeding-b',
      name: 'Succeeding Provider B',
      generate: async () => {
        callCountB++;
        return 'Response from B';
      },
    };

    // Register both
    orchestrator.registerCustomProvider(failingProviderA);
    orchestrator.registerCustomProvider(succeedingProviderB);

    // Make failing-a preferred (highest priority)
    configManager.updateSettings({
      apiKeys: {
        preferred_provider: 'failing-a',
      },
    });

    await orchestrator.refreshProviders();

    const response = await orchestrator.generate('run generation task');

    // Asserts
    expect(response).toBe('Response from B');
    expect(callCountA).toBe(1);
    expect(callCountB).toBe(1);
    expect(orchestrator.lastSelectedProviderId).toBe('succeeding-b');
    expect(orchestrator.lastSelectedProviderName).toBe('Succeeding Provider B');
  });

  it('should enter Offline Mode and use mock fallback when all providers fail', async () => {
    const failingProvider: ILLMProvider = {
      id: 'always-failing',
      name: 'Always Failing Provider',
      generate: async () => {
        throw new Error('Endpoint timeout');
      },
    };

    orchestrator.registerCustomProvider(failingProvider);

    configManager.updateSettings({
      apiKeys: {
        preferred_provider: 'always-failing',
      },
    });

    await orchestrator.refreshProviders();

    const response = await orchestrator.generate('quality gate review request');
    
    expect(response).toContain('Mock completion');
    expect(orchestrator.lastSelectedProviderId).toBe('mock-llm-provider');
    expect(orchestrator.lastSelectedProviderName).toBe('Mock Offline Provider');
    expect(orchestrator.lastSelectedReason).toContain('mock engine');
  });
});
