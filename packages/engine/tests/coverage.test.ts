import { describe, it, expect } from 'vitest';
import { RequirementIntelligenceReport, QAArtifact, TestStrategy, Actor, BusinessRule, RiskArea } from '../src/domain.js';
import { DefaultCoverageEngine } from '../src/coverage/index.js';

const mockActor: Actor = {
  name: 'SysAdmin',
  description: 'System Administrator managing configuration profiles',
};

const mockRule: BusinessRule = {
  id: 'BR-SEC-1',
  description: 'Disable anonymous storage account access',
  condition: 'Always',
  expectedOutcome: 'HTTP 403 Forbidden',
};

const mockRisk: RiskArea = {
  area: 'AuthLockout',
  description: 'Expired token validation fails',
  severity: 'high',
};

const mockIntelligence: RequirementIntelligenceReport = {
  requirementId: 'req-1',
  analyzedAt: new Date(),
  actors: [mockActor],
  entities: [],
  businessRules: [mockRule],
  ambiguities: [],
  missingInformation: [],
  riskAreas: [mockRisk],
  complexity: { level: 'low', factors: [], rationale: 'simple' },
  confidenceScore: 1.0,
};

const mockStrategy: TestStrategy = {
  id: 'strat-1',
  requirementId: 'req-1',
  businessImpact: 'medium',
  riskLevel: 'low',
  objectives: ['Secure storage profile setups'],
  primaryFocus: [],
  recommendedSuites: [],
  excludedSuites: [],
  outOfScope: [],
  automationCandidates: [
    { scenario: 'SysAdmin disables anonymous profiles', reason: 'Verify configuration flags' }
  ],
  manualExploratoryScenarios: [
    { area: 'AuthLockout Check', instructions: 'Verify token expiration fails gracefully' }
  ],
  suggestedTestData: [],
  suggestedPreconditions: [],
  suggestedEnvironments: [],
  executionOrder: [],
  estimatedEffort: [],
  confidenceScore: 1.0,
  reasoningTrace: [],
  createdAt: new Date(),
};

describe('Coverage Engine tests', () => {
  const coverageEngine = new DefaultCoverageEngine();

  it('should calculate 100% coverage when all targets are matched by keywords', async () => {
    const artifacts: QAArtifact[] = [
      {
        id: 'art-1',
        planId: 'plan-1',
        type: 'Unit Skeletons',
        content: 'Disable anonymous storage account access. Verify expired token validation fails. System Administrator managing configuration profiles.',
        createdAt: new Date(),
      }
    ];

    const report = await coverageEngine.calculateCoverage(mockStrategy, artifacts, mockIntelligence);

    expect(report.overallCoveragePercent).toBe(100);
    expect(report.items.length).toBe(3); // 1 Rule, 1 Risk, 1 Actor
    expect(report.items.every((item) => item.status === 'full')).toBe(true);
  });

  it('should calculate partial or uncovered statuses when matches are missing', async () => {
    const artifacts: QAArtifact[] = [
      {
        id: 'art-1',
        planId: 'plan-1',
        type: 'Unit Skeletons',
        // Does not contain 'token validation fails' or SysAdmin keywords
        content: 'Disable anonymous storage accounts.',
        createdAt: new Date(),
      }
    ];

    // Modify strategy to remove candidates
    const strategyWithNoScenarios: TestStrategy = {
      ...mockStrategy,
      automationCandidates: [],
      manualExploratoryScenarios: [],
    };

    const report = await coverageEngine.calculateCoverage(strategyWithNoScenarios, artifacts, mockIntelligence);

    expect(report.overallCoveragePercent).toBeLessThan(100);
    expect(report.items.some((item) => item.status === 'uncovered')).toBe(true);
  });
});
