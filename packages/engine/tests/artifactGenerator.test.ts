import { describe, it, expect } from 'vitest';
import { Requirement, RequirementIntelligenceReport, ArtifactPlan, ProjectProfile, TestStrategy } from '../src/domain.js';
import { GeneratorContext, ProjectConfig, GenerationPreferences } from '../src/types.js';
import { DefaultContextCompiler } from '../src/context/index.js';
import { DefaultArtifactGenerator, MockLLMProvider } from '../src/artifacts/index.js';

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

describe('Artifact Generator tests', () => {
  const compiler = new DefaultContextCompiler();
  const generator = new DefaultArtifactGenerator();
  const provider = new MockLLMProvider();

  it('should compile fallback mock artifacts in offline mode', async () => {
    const requirement: Requirement = {
      id: 'req-1',
      projectId: 'proj-1',
      title: 'Simple feature',
      content: 'Storage account configs.',
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

    const plan: ArtifactPlan = {
      id: 'plan-1',
      strategyId: 'strat-1',
      persona: 'manual-qa',
      profile: { language: 'English', framework: 'None', testingStyle: 'Descriptive' },
      selectedArtifacts: ['Manual Test Cases', 'Regression Checklist'],
      generationInstructions: ['Format with details.'],
      reasoning: [],
      createdAt: new Date(),
    };

    const artifacts = await generator.generateArtifacts(context, plan, provider);

    expect(artifacts.length).toBe(2);
    expect(artifacts[0].type).toBe('Manual Test Cases');
    expect(artifacts[0].content).toContain('TC-001: Anonymous Access Blocked');
    expect(artifacts[1].type).toBe('Regression Checklist');
    expect(artifacts[1].content).toContain('Verify image rendering assets');
  });

  it('should parse and extract distinct artifact sections from LLM response headers', async () => {
    const requirement: Requirement = {
      id: 'req-1',
      projectId: 'proj-1',
      title: 'Simple feature',
      content: 'Storage account configs.',
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

    const plan: ArtifactPlan = {
      id: 'plan-1',
      strategyId: 'strat-1',
      persona: 'automation-qa',
      profile: { language: 'TypeScript', framework: 'Playwright', testingStyle: 'Given/When/Then' },
      selectedArtifacts: ['Playwright Test Skeletons', 'Selectors Checklist'],
      generationInstructions: ['Format with details.'],
      reasoning: [],
      createdAt: new Date(),
    };

    // Custom test provider returning marked markdown sections
    const testProvider = {
      id: 'test-llm',
      name: 'Test LLM',
      generate: async () => `
### Playwright Test Skeletons
import { test } from '@playwright/test';
test('should verify access', async () => {});

### Selectors Checklist
- button#save
- input#token
      `,
    };

    const artifacts = await generator.generateArtifacts(context, plan, testProvider);

    expect(artifacts.length).toBe(2);
    expect(artifacts[0].type).toBe('Playwright Test Skeletons');
    expect(artifacts[0].content).toContain("test('should verify access'");
    expect(artifacts[1].type).toBe('Selectors Checklist');
    expect(artifacts[1].content).toContain('- button#save');
  });
});
