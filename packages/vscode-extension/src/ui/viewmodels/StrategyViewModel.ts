import { Conversation } from '@qamate/engine';

export class StrategyViewModel {
  public readonly overallRisk: string;
  public readonly objectives: string[];
  public readonly businessImpact: string;
  public readonly riskLevel: string;
  public readonly primaryFocus: string[];
  public readonly recommendedSuites: any[];
  public readonly excludedSuites: any[];
  public readonly automationCandidates: any[];

  constructor(conversation: Conversation) {
    const strategy = (conversation as any).generatedStrategy;
    this.overallRisk = strategy?.riskAssessment?.overallLevel || strategy?.riskLevel || 'MEDIUM';
    this.objectives = strategy?.objectives?.map((o: any) => o.description || o) || strategy?.objectives || [];
    this.businessImpact = strategy?.businessImpact || 'MEDIUM';
    this.riskLevel = strategy?.riskLevel || 'MEDIUM';
    this.primaryFocus = strategy?.primaryFocus || [];
    this.recommendedSuites = strategy?.recommendedSuites || [];
    this.excludedSuites = strategy?.excludedSuites || [];
    this.automationCandidates = strategy?.automationCandidates || [];
  }
}
