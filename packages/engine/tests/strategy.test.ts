import { describe, it, expect } from 'vitest';
import { Requirement, RequirementIntelligenceReport } from '../src/domain.js';
import { GeneratorContext, ProjectConfig, GenerationPreferences } from '../src/types.js';
import { DefaultContextCompiler } from '../src/context/index.js';
import { DefaultTestStrategyEngine } from '../src/strategy/index.js';

const mockProjectConfig: ProjectConfig = {
  targetLanguage: 'TypeScript',
  targetFramework: 'Playwright',
  namingConvention: 'Given/When/Then',
  companyRules: [],
  qaGuidelines: [],
};

const mockGenerationPreferences: GenerationPreferences = {
  maxCases: 5,
  focusAreas: ['security'],
  includeAutomationCandidate: true,
};

const mockIntelligence: RequirementIntelligenceReport = {
  requirementId: 'req-1',
  analyzedAt: new Date(),
  actors: [],
  entities: [],
  businessRules: [],
  ambiguities: [],
  missingInformation: [],
  riskAreas: [],
  complexity: { level: 'low', factors: [], rationale: 'low' },
  confidenceScore: 1.0,
};

describe('Test Strategy Engine tests', () => {
  const compiler = new DefaultContextCompiler();
  const strategyEngine = new DefaultTestStrategyEngine();

  it('should draft a security-focused strategy for credentials requirements', async () => {
    const requirement: Requirement = {
      id: 'req-1',
      projectId: 'proj-1',
      title: 'SAS Tokens feature',
      content: 'System must validate SAS token expiry on the storage buckets to guarantee secure authenticated access.',
      contentType: 'plain-text',
      version: 1,
      status: 'draft',
      metadata: {},
      createdAt: new Date(),
    };

    const context = await compiler.compile(
      requirement,
      mockIntelligence,
      [],
      mockProjectConfig,
      mockGenerationPreferences
    );

    const strategy = await strategyEngine.developStrategy(context);

    expect(strategy.businessImpact).toBe('critical');
    expect(strategy.riskLevel).toBe('low'); // complexity is low and 0 gaps
    expect(strategy.primaryFocus).toContain('Cloud Infrastructure / Storage');
    expect(strategy.primaryFocus).toContain('Security / Authentication');
    expect(strategy.recommendedSuites.some((s) => s.suite === 'Security')).toBe(true);
    expect(strategy.excludedSuites.some((s) => s.suite === 'Accessibility')).toBe(true);
    expect(strategy.suggestedTestData).toContain('Expired SAS Token');
    expect(strategy.estimatedEffort.reduce((sum, curr) => sum + curr.durationMinutes, 0)).toBe(180);
    expect(strategy.reasoningTrace.length).toBeGreaterThan(0);
  });

  it('should fallback to general testing objectives for standard specifications', async () => {
    const requirement: Requirement = {
      id: 'req-2',
      projectId: 'proj-1',
      title: 'Simple feature',
      content: 'Standard display list values description page.',
      contentType: 'plain-text',
      version: 1,
      status: 'draft',
      metadata: {},
      createdAt: new Date(),
    };

    const context = await compiler.compile(
      requirement,
      mockIntelligence,
      [],
      mockProjectConfig,
      mockGenerationPreferences
    );

    const strategy = await strategyEngine.developStrategy(context);

    expect(strategy.businessImpact).toBe('medium');
    expect(strategy.primaryFocus).toContain('General Functional');
    expect(strategy.objectives[0]).toContain('Verify correct logical execution');
  });
});
