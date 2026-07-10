import { describe, it, expect } from 'vitest';
import { RecommendationEngine } from '../src/recommendation/RecommendationEngine.js';
import { RecommendationValidator } from '../src/recommendation/RecommendationValidator.js';
import { RecommendationApplier } from '../src/recommendation/RecommendationApplier.js';
import { StrategyExporter } from '../src/strategy/strategyExporter.js';
import { SystemModel, QAMentalModel } from '../src/platform/reasoningModel.js';
import { ProjectDNA, TestStrategy, QARecommendation } from '../src/domain.js';

describe('Phase 4: Strategy Blueprint & Recommendation Engine tests', () => {

  const dummyDNA: ProjectDNA = {
    schemaVersion: 1,
    projectType: 'web',
    technologies: ['node', 'typescript', 'express'],
    testingStandards: ['vitest', 'playwright'],
    apis: { endpoints: [] },
    existingTestSuites: [],
    ciCdPipeline: { provider: 'github' }
  };

  const dummySystem: SystemModel = {
    schemaVersion: 2,
    name: 'OrderProcessor',
    components: [
      { name: 'OrderAPI', type: 'Router' }
    ],
    flows: [],
    users: [],
    qualityAttributes: [],
    risks: [],
    unknowns: []
  };

  const dummyMental: QAMentalModel = {
    schemaVersion: 2,
    mentalModelVersion: 2,
    revision: 1,
    generatedAt: new Date(),
    facts: [],
    assumptions: [],
    inferences: [],
    risks: ['Authentication session timeouts'],
    unknowns: [],
    confidence: 90,
    recommendedTesting: [],
    excludedTesting: [],
    reasoningTrace: []
  };

  it('Test 1: RecommendationEngine generates correct rules based on tech stack and component rules', async () => {
    const engine = new RecommendationEngine();
    const recs = await engine.generateRecommendations(dummySystem, dummyMental, dummyDNA);

    // Mapped API component -> API Schema Testing
    const apiRec = recs.find(r => r.recommendation.includes('API Contract'));
    expect(apiRec).toBeDefined();
    expect(apiRec?.trigger).toContain('REST API controllers detected');
    expect(apiRec?.priority).toBe('High');

    // Mapped Playwright standards -> Playwright automated UI checks
    const uiRec = recs.find(r => r.recommendation.includes('Playwright UI E2E'));
    expect(uiRec).toBeDefined();
    expect(uiRec?.source).toBe('Project DNA');
  });

  it('Test 2: RecommendationValidator ignores visual browser checks if no UI component is found', () => {
    const validator = new RecommendationValidator();

    const recs: QARecommendation[] = [
      {
        id: 'rec-playwright',
        recommendation: 'Playwright Browser testing execution',
        reason: 'Automate browser validation tasks.',
        industryPractice: 'Setup browser runners.',
        priority: 'Medium',
        impact: 'Medium',
        status: 'Pending',
        trigger: 'UI standard found',
        source: 'Project DNA',
        canAutoApply: true
      }
    ];

    // System has zero UI components or flows
    const backendOnlySystem: SystemModel = {
      schemaVersion: 2,
      name: 'DaemonApp',
      components: [{ name: 'QueueWorker', type: 'Service' }],
      flows: [],
      users: [],
      qualityAttributes: [],
      risks: [],
      unknowns: []
    };

    const validated = validator.validate(recs, backendOnlySystem);
    expect(validated[0].status).toBe('Ignored');
    expect(validated[0].userComment).toBe('No browser or UI component exists in system model.');
  });

  it('Test 3: Rejecting/accepting recommendations appends a DecisionRecord and increments strategy revisions without total resets', () => {
    const applier = new RecommendationApplier();

    const initialStrategy: TestStrategy = {
      id: 'STRAT-1',
      schemaVersion: 2,
      revision: 1,
      lastUpdated: new Date(),
      requirementId: 'req-1',
      businessImpact: 'medium',
      riskLevel: 'medium',
      objectives: ['Sanity check execution'],
      scope: ['General scope'],
      risks: [],
      approach: 'Testing baseline',
      recommendedSuites: [],
      excludedSuites: [],
      outOfScope: [],
      coverage: [],
      deliverables: [],
      decisions: [],
      automationCandidates: [],
      manualExploratoryScenarios: [],
      suggestedTestData: [],
      suggestedPreconditions: [],
      suggestedEnvironments: [],
      executionOrder: [],
      estimatedEffort: [],
      confidenceScore: 0.9,
      reasoningTrace: [],
      createdAt: new Date()
    };

    const apiRec: QARecommendation = {
      id: 'rec-api-schema',
      recommendation: 'API Contract Schema Testing',
      reason: 'REST routes require contract schema validation.',
      industryPractice: 'Pact contract runs.',
      priority: 'High',
      impact: 'High',
      status: 'Accepted',
      trigger: 'API controllers detected',
      source: 'Rule',
      canAutoApply: true
    };

    const updated = applier.applyRecommendation(initialStrategy, apiRec, 'Lead-QA', 'Targeting Stripe webhooks');

    // Strategy revision count goes from 1 to 2
    expect(updated.revision).toBe(2);

    // Objective is incrementally added
    expect(updated.objectives).toContain('Verify API request and response schemas match OpenAPI spec.');

    // API suite is added to recommendedSuites
    expect(updated.recommendedSuites.some(s => s.suite === 'API')).toBe(true);

    // DecisionRecord tracks this action
    expect(updated.decisions).toHaveLength(1);
    expect(updated.decisions[0].action).toBe('accepted');
    expect(updated.decisions[0].source).toBe('Rule');
  });

  it('Test 4: Modifying a recommendation details correctly saves state as Modified', () => {
    const applier = new RecommendationApplier();

    const initialStrategy: TestStrategy = {
      id: 'STRAT-2',
      schemaVersion: 2,
      revision: 1,
      lastUpdated: new Date(),
      requirementId: 'req-1',
      businessImpact: 'medium',
      riskLevel: 'medium',
      objectives: ['Verify layout'],
      scope: ['General'],
      risks: [],
      approach: 'Direct run',
      recommendedSuites: [],
      excludedSuites: [],
      outOfScope: [],
      coverage: [],
      deliverables: [],
      decisions: [],
      automationCandidates: [],
      manualExploratoryScenarios: [],
      suggestedTestData: [],
      suggestedPreconditions: [],
      suggestedEnvironments: [],
      executionOrder: [],
      estimatedEffort: [],
      confidenceScore: 0.8,
      reasoningTrace: [],
      createdAt: new Date()
    };

    const playwrightRec: QARecommendation = {
      id: 'rec-pw-ui',
      recommendation: 'Playwright UI E2E Automated Tests',
      reason: 'DNA suggests playwright integration.',
      industryPractice: 'POM pattern.',
      priority: 'Medium',
      impact: 'Medium',
      status: 'Modified', // User modified
      trigger: 'Playwright standard',
      source: 'Project DNA',
      canAutoApply: true,
      userComment: 'Only execute login smoke flow tests.'
    };

    const updated = applier.applyRecommendation(initialStrategy, playwrightRec, 'Developer-Jack', 'Only smoke login');

    expect(updated.revision).toBe(2);
    expect(updated.decisions).toHaveLength(1);
    expect(updated.decisions[0].action).toBe('modified');
    expect(updated.decisions[0].reason).toBe('Only smoke login');

    // Section update with user comment mapping
    expect(updated.objectives).toContain('Verify: Only smoke login');

    // Strategy markdown exporter works cleanly
    const exporter = new StrategyExporter();
    const md = exporter.exportToMarkdown(updated);
    expect(md).toContain('QAMate Test Strategy Blueprint');
    expect(md).toContain('Revision:** `v2`');
    expect(md).toContain('Action `MODIFIED`');
  });
});
