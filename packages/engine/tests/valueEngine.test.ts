import { describe, it, expect } from 'vitest';
import { QAValueEngine } from '../src/value/QAValueEngine.js';
import { QualityAttributeAudit } from '../src/review/QualityAttributeAudit.js';
import { ChangeIntelligence } from '../src/review/ChangeIntelligence.js';
import { DeliverableCompiler } from '../src/value/DeliverableCompiler.js';
import { SystemModel, QAMentalModel } from '../src/platform/reasoningModel.js';
import { ProjectDNA, TestStrategy, DeliverableManifest, TestCase } from '../src/domain.js';
import { WorkspaceHealth } from '../src/deliverable/WorkspaceHealth.js';
import { MarkdownExporterPlugin } from '../src/export/MarkdownExporter.js';
import { JiraExporterPlugin } from '../src/export/JiraExporter.js';

describe('Phase 5: QA Value & Review Engines & Synthesis tests', () => {

  it('Test 1: QAValueEngine performs semantic deduplication and parameterizes user role test cases', () => {
    const valueEngine = new QAValueEngine();

    const rawScenarios = [
      {
        id: 'tc-1',
        title: 'Verify successful login',
        intent: 'Validate user authentication workflow.',
        steps: ['Enter credentials', 'Click submit']
      },
      {
        id: 'tc-2',
        title: 'Verify login button', // Semantic duplicate of login flow
        intent: 'Validate login submission triggers.',
        steps: ['Click login element']
      },
      {
        id: 'tc-3',
        title: 'Login as valid user', // Parameterizable role variant
        intent: 'Role check.',
        steps: ['Input user details']
      },
      {
        id: 'tc-4',
        title: 'Login as admin user', // Parameterizable role variant
        intent: 'Role check.',
        steps: ['Input admin details']
      }
    ];

    const { optimized, report } = valueEngine.optimizeScenarios(rawScenarios);

    // Optimized list: 1 merged login case + 1 parameterized login roles case = 2 total cases
    expect(optimized).toHaveLength(2);
    expect(report.casesMerged).toBe(1);
    expect(report.casesParameterized).toBe(1);

    const paramCase = optimized.find(c => c.title.includes('roles:'));
    expect(paramCase).toBeDefined();
    expect(paramCase?.title).toContain('valid user');
    expect(paramCase?.title).toContain('admin user');
  });

  it('Test 2: ChangeIntelligence detects real impact on component changes but ignores wording-only shifts', () => {
    const checker = new ChangeIntelligence();

    const oldSystem: SystemModel = {
      schemaVersion: 2,
      name: 'OrderFlow',
      components: [{ name: 'AuthRouter', type: 'Router' }],
      flows: [],
      users: [],
      qualityAttributes: [],
      risks: [],
      unknowns: []
    };

    const newSystemWordingOnly: SystemModel = {
      schemaVersion: 2,
      name: 'OrderFlow',
      components: [{ name: 'AuthRouter', type: 'Router' }], // no changes
      flows: [],
      users: [],
      qualityAttributes: [],
      risks: [],
      unknowns: []
    };

    const mentalOld: QAMentalModel = {
      schemaVersion: 2,
      mentalModelVersion: 2,
      revision: 1,
      generatedAt: new Date(),
      facts: [],
      assumptions: [],
      inferences: [],
      risks: [],
      unknowns: [],
      confidence: 100,
      recommendedTesting: [],
      excludedTesting: [],
      reasoningTrace: []
    };

    const stratOld: TestStrategy = {
      id: 'STRAT-1',
      schemaVersion: 2,
      revision: 1,
      lastUpdated: new Date(),
      requirementId: 'req-1',
      businessImpact: 'medium',
      riskLevel: 'medium',
      objectives: ['Verify login'],
      scope: ['General'],
      primaryFocus: ['General'],
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

    // Case A: Wording-only change
    const resWording = checker.detectChangeImpact(oldSystem, newSystemWordingOnly, mentalOld, mentalOld, stratOld, stratOld);
    expect(resWording.affectedSuites).toHaveLength(0);
    expect(resWording.breakingChange).toBe(false);

    // Case B: Component change adding Stripe payment processor
    const newSystemStripe: SystemModel = {
      schemaVersion: 2,
      name: 'OrderFlow',
      components: [
        { name: 'AuthRouter', type: 'Router' },
        { name: 'StripePaymentProcessor', type: 'Processor' } // added Stripe
      ],
      flows: [],
      users: [],
      qualityAttributes: [],
      risks: [],
      unknowns: []
    };

    const resStripe = checker.detectChangeImpact(oldSystem, newSystemStripe, mentalOld, mentalOld, stratOld, stratOld);
    expect(resStripe.affectedSuites).toContain('API');
    expect(resStripe.affectedSuites).toContain('Security');
    expect(resStripe.breakingChange).toBe(true);
    expect(resStripe.strategyDiff).toContain('+++ Added components: StripePaymentProcessor');
  });

  it('Test 3: QualityAttributeAudit identifies mandatory DNA guidelines that are absent', async () => {
    const auditor = new QualityAttributeAudit();

    const dna: ProjectDNA = {
      schemaVersion: 1,
      projectType: 'web',
      technologies: ['node'],
      testingStandards: ['Performance / JMeter', 'Security / ZAP'], // mandates perf & security
      apis: { endpoints: [] },
      existingTestSuites: [],
      ciCdPipeline: { provider: 'github' }
    };

    const strategy: TestStrategy = {
      id: 'STRAT-A',
      schemaVersion: 2,
      revision: 1,
      lastUpdated: new Date(),
      requirementId: 'req-1',
      businessImpact: 'medium',
      riskLevel: 'medium',
      objectives: ['Verify UI layout'],
      scope: ['UI'],
      primaryFocus: ['UI'],
      risks: [],
      approach: 'Testing baseline',
      recommendedSuites: [{ suite: 'Smoke', priority: 1, reason: 'Basic validation' }], // no security / performance suites
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

    const issues = auditor.auditStrategy(strategy, dna);
    expect(issues).toHaveLength(2);
    expect(issues[0].rule).toBe('Performance Testing standard compliance');
    expect(issues[1].rule).toBe('Security Testing standard compliance');
    expect(issues[0].severity).toBe('High');

    // DeliverableCompiler output validation
    const healthEngine = new WorkspaceHealth();
    const metrics = healthEngine.calculateWorkspaceHealth(strategy, [], 0, 0, 'Claude', 0, 0, 0, 0);

    const manifest: DeliverableManifest = {
      id: 'MANIFEST-1',
      version: '1.0',
      generatedBy: 'Auditor',
      generatedAt: new Date(),
      provider: 'Claude',
      strategyRevision: 1,
      mentalModelRevision: 1,
      artifacts: []
    };

    const compiler = new DeliverableCompiler();
    const bundle = compiler.compile(strategy, [], manifest, metrics);

    const mdExporter = new MarkdownExporterPlugin();
    const markdown = await mdExporter.export(bundle);
    expect(markdown).toContain('QA Test Strategy & Artifacts Report');

    const jiraExporter = new JiraExporterPlugin();
    const jira = await jiraExporter.export(bundle);
    expect(jira.fields.project.key).toBe('QA');
  });
});
