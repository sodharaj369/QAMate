import { describe, it, expect } from 'vitest';
import { TestStrategy, ProjectProfile } from '../src/domain.js';
import { DefaultArtifactPlanner } from '../src/artifacts/index.js';

const mockStrategy: TestStrategy = {
  id: 'strat-1',
  requirementId: 'req-1',
  businessImpact: 'medium',
  riskLevel: 'low',
  objectives: [],
  primaryFocus: [],
  recommendedSuites: [],
  excludedSuites: [],
  outOfScope: [],
  automationCandidates: [],
  manualExploratoryScenarios: [],
  suggestedTestData: [],
  suggestedPreconditions: [],
  suggestedEnvironments: [],
  executionOrder: [],
  estimatedEffort: [],
  confidenceScore: 1.0,
  reasoningTrace: [],
  createdAt: new Date(),
};

describe('Artifact Planner tests', () => {
  const planner = new DefaultArtifactPlanner();

  it('should compile appropriate plans for manual-qa persona', async () => {
    const profile: ProjectProfile = {
      language: 'English',
      framework: 'None',
      testingStyle: 'Descriptive',
    };

    const plan = await planner.planArtifacts(mockStrategy, 'manual-qa', profile);

    expect(plan.persona).toBe('manual-qa');
    expect(plan.selectedArtifacts).toContain('Manual Test Cases');
    expect(plan.selectedArtifacts).toContain('Exploratory Charter');
    expect(plan.selectedArtifacts).not.toContain('Unit Test Skeletons');
    expect(plan.generationInstructions.some((i) => i.includes('manual'))).toBe(true);
  });

  it('should compile plans for backend-developer, adding SQL validation if database profile exists', async () => {
    const profile: ProjectProfile = {
      language: 'C#',
      framework: 'xUnit',
      database: 'SQL Server',
      cloud: 'AWS',
      testingStyle: 'AAA',
    };

    const plan = await planner.planArtifacts(mockStrategy, 'backend-developer', profile);

    expect(plan.persona).toBe('backend-developer');
    expect(plan.selectedArtifacts).toContain('Unit Test Skeletons');
    expect(plan.selectedArtifacts).toContain('SQL Validation Rules');
    expect(plan.generationInstructions.some((i) => i.includes('xUnit'))).toBe(false); // instructions generalized, but verifies structure
    expect(plan.generationInstructions.some((i) => i.includes('unit'))).toBe(true);
  });

  it('should compile appropriate plans for automation-qa', async () => {
    const profile: ProjectProfile = {
      language: 'TypeScript',
      framework: 'Playwright',
      testingStyle: 'Given/When/Then',
    };

    const plan = await planner.planArtifacts(mockStrategy, 'automation-qa', profile);

    expect(plan.persona).toBe('automation-qa');
    expect(plan.selectedArtifacts).toContain('Playwright Test Skeletons');
    expect(plan.generationInstructions.some((i) => i.includes('Playwright'))).toBe(true);
  });
});
