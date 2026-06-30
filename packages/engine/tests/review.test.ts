import { describe, it, expect } from 'vitest';
import { Requirement, RequirementIntelligenceReport, QAArtifact, TestStrategy } from '../src/domain.js';
import { GeneratorContext, ProjectConfig, GenerationPreferences } from '../src/types.js';
import { DefaultContextCompiler } from '../src/context/index.js';
import { DefaultReviewEngine } from '../src/review/index.js';

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

const mockStrategy: TestStrategy = {
  id: 'strat-1',
  requirementId: 'req-1',
  businessImpact: 'medium',
  riskLevel: 'low',
  objectives: ['verify storage is disabled'],
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

describe('Review Engine tests', () => {
  const compiler = new DefaultContextCompiler();
  const reviewEngine = new DefaultReviewEngine();

  it('should approve fully compliant and complete artifacts', async () => {
    const requirement: Requirement = {
      id: 'req-1',
      projectId: 'proj-1',
      title: 'Simple feature',
      content: 'Public access secure check.',
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

    const artifacts: QAArtifact[] = [
      {
        id: 'art-1',
        planId: 'plan-1',
        type: 'Manual Test Cases',
        content: `
#### TC-001: Anonymous request
Given public access is disabled
When request is received
Then verify HTTP 403.
        `,
        createdAt: new Date(),
      },
    ];

    const report = await reviewEngine.reviewArtifacts(artifacts, context, mockStrategy);

    expect(report.scores.overallScore).toBeGreaterThanOrEqual(80);
    expect(report.status).toBe('approved');
    expect(report.issues.length).toBe(0);
  });

  it('should flag artifacts violating naming convention or containing duplicates', async () => {
    const requirement: Requirement = {
      id: 'req-1',
      projectId: 'proj-1',
      title: 'Simple feature',
      content: 'Public access secure check.',
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

    const artifacts: QAArtifact[] = [
      {
        id: 'art-1',
        planId: 'plan-1',
        type: 'Manual Test Cases',
        // Violates Given/When/Then and contains duplicate scenario titles
        content: `
#### TC-001: Anonymous request
Actions: fetch anonymous
Expected: fail.

#### TC-001: Anonymous request
Actions: fetch anonymous
Expected: fail.
        `,
        createdAt: new Date(),
      },
    ];

    const report = await reviewEngine.reviewArtifacts(artifacts, context, mockStrategy);

    expect(report.scores.overallScore).toBeLessThan(80);
    expect(report.status).toBe('flagged');
    expect(report.issues.some((i) => i.category === 'compliance')).toBe(true);
    expect(report.issues.some((i) => i.category === 'duplication')).toBe(true);
    expect(report.suggestions.length).toBeGreaterThan(0);
  });
});
