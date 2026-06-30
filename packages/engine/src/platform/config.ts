export type CostMode = 'cheapest' | 'balanced' | 'highest-quality' | 'custom';

export interface Configuration {
  costMode: CostMode;
  allowLocalOnly: boolean;
  maxTokensLimit: number;
  apiKeys: Record<string, string>;
  qaStandards: {
    minConfidenceThreshold: number;
    requireReviewApproval: boolean;
    requireReasoningTrace: boolean;
  };
}

export class ConfigurationManager {
  private currentConfig: Configuration = {
    costMode: 'balanced',
    allowLocalOnly: false,
    maxTokensLimit: 4096,
    apiKeys: {},
    qaStandards: {
      minConfidenceThreshold: 0.7,
      requireReviewApproval: true,
      requireReasoningTrace: true,
    },
  };

  public getCostMode(): CostMode {
    return this.currentConfig.costMode;
  }

  public setCostMode(mode: CostMode): void {
    this.currentConfig.costMode = mode;
  }

  public getSettings(): Configuration {
    return { ...this.currentConfig };
  }

  public updateSettings(settings: Partial<Configuration>): void {
    this.currentConfig = {
      ...this.currentConfig,
      ...settings,
    };
  }

  public getApiKey(provider: string): string | undefined {
    return this.currentConfig.apiKeys[provider.toLowerCase()];
  }

  public setApiKey(provider: string, key: string): void {
    this.currentConfig.apiKeys[provider.toLowerCase()] = key;
  }
}
