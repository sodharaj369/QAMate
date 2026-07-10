import { TestStrategy, TestCase, WorkspaceHealthMetrics, ExportReadiness } from '../domain.js';

export class WorkspaceHealth {
  public calculateWorkspaceHealth(
    strategy: TestStrategy,
    testCases: TestCase[],
    promptCount: number,
    tokenUsage: number,
    providerUsed: string,
    cacheHitPercent: number,
    manualOverridesCount: number,
    questionsAskedCount: number,
    questionsAvoidedCount: number
  ): WorkspaceHealthMetrics {
    // 1. Calculate requirement quality based on strategy completeness
    let qualityScore = 100;
    if ((strategy.objectives || []).length === 0) qualityScore -= 25;
    if ((strategy.scope || []).length === 0) qualityScore -= 20;
    if ((strategy.risks || []).length === 0) qualityScore -= 15;
    qualityScore = Math.max(10, qualityScore);

    let qualityGrade = 'C';
    if (qualityScore >= 95) qualityGrade = 'A+';
    else if (qualityScore >= 90) qualityGrade = 'A';
    else if (qualityScore >= 80) qualityGrade = 'B';

    // 2. Rules Coverage percentage
    const rulesCoveragePercent = Math.min(100, 75 + ((strategy.recommendedSuites || []).length * 5));

    // 3. Readiness check
    const blockingIssues: string[] = [];
    const warnings: string[] = [];

    if ((strategy.objectives || []).length === 0) {
      blockingIssues.push('Test strategy requires at least one objective.');
    }
    if ((strategy.scope || []).length === 0) {
      blockingIssues.push('Scope boundaries cannot be completely empty.');
    }

    if (manualOverridesCount > 0) {
      warnings.push(`Workspace has ${manualOverridesCount} user-approved manual updates.`);
    }
    if ((strategy.risks || []).length > 3) {
      warnings.push('High volume of system risks mapped.');
    }

    const readiness: ExportReadiness = {
      ready: blockingIssues.length === 0,
      blockingIssues,
      warnings
    };

    return {
      requirementQualityScore: qualityScore,
      requirementQualityGrade: qualityGrade,
      rulesCoveragePercent,
      confidenceScore: strategy.confidenceScore * 100,
      confidenceLevel: strategy.confidenceScore >= 0.9 ? 'VeryHigh' : strategy.confidenceScore >= 0.75 ? 'High' : 'Medium',
      risksMappedCount: (strategy.risks || []).length,
      questionsAskedCount,
      questionsAvoidedCount,
      promptCount,
      tokenUsage,
      providerUsed,
      cacheHitPercent,
      manualOverridesCount,
      readiness
    };
  }
}
