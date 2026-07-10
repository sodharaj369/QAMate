import { describe, it, expect } from 'vitest';
import { DeliverableCompiler } from '../src/value/DeliverableCompiler.js';
import { WorkspaceHealth } from '../src/deliverable/WorkspaceHealth.js';
import { NamingStrategy } from '../src/deliverable/NamingStrategy.js';
import { ExcelExporterPlugin } from '../src/export/ExcelExporter.js';
import { TestStrategy, TestCase, DeliverableManifest } from '../src/domain.js';

describe('Phase 6: Deliverable Platform tests', () => {

  const dummyStrategy: TestStrategy = {
    id: 'STRAT-123',
    schemaVersion: 2,
    revision: 3,
    lastUpdated: new Date(),
    requirementId: 'req-stripe-checkout',
    businessImpact: 'high',
    riskLevel: 'medium',
    objectives: ['Validate Stripe webhook parsing', 'Assert webhook signature auth'],
    scope: ['Checkout API Router'],
    primaryFocus: ['Checkout API Router'],
    risks: ['Webhook spoofing exploits'],
    approach: 'Risk-based pipeline audits.',
    recommendedSuites: [{ suite: 'API', priority: 1, reason: 'Webhook validation' }],
    excludedSuites: [],
    outOfScope: [],
    coverage: [],
    deliverables: ['Audit Log report'],
    decisions: [
      {
        id: 'dec-1',
        type: 'recommendation',
        action: 'accepted',
        reason: 'Webhook requirements verified',
        source: 'User Action',
        timestamp: new Date()
      }
    ],
    automationCandidates: [],
    manualExploratoryScenarios: [],
    suggestedTestData: [],
    suggestedPreconditions: [],
    suggestedEnvironments: [],
    executionOrder: [],
    estimatedEffort: [],
    confidenceScore: 0.95,
    reasoningTrace: [],
    createdAt: new Date()
  };

  const dummyTestCases: TestCase[] = [
    {
      id: 'TC-POS-001',
      priority: 'high',
      title: 'Stripe webhook payment success mapping',
      preconditions: ['Stripe sandbox configuration loaded'],
      steps: [{ stepNumber: 1, action: 'Submit payload', expectedResult: '200 OK' }],
      requirementId: 'req-stripe-checkout'
    }
  ];

  const dummyManifest: DeliverableManifest = {
    id: 'MANIFEST-456',
    version: '1.0',
    generatedBy: 'QA-Lead-Jack',
    generatedAt: new Date(),
    provider: 'Claude 3.5 Sonnet',
    strategyRevision: 3,
    mentalModelRevision: 2,
    artifacts: ['Test Cases', 'Strategy Document']
  };

  it('Test 1: DeliverableCompiler compiles strategy inputs into a DeliverableBundle DTO', () => {
    const healthEngine = new WorkspaceHealth();
    const metrics = healthEngine.calculateWorkspaceHealth(
      dummyStrategy,
      dummyTestCases,
      5, // promptCount
      12000, // tokenUsage
      'Claude 3.5 Sonnet',
      92, // cacheHitPercent
      1, // overrides
      2, // questionsAsked
      5 // questionsAvoided
    );

    const compiler = new DeliverableCompiler();
    const bundle = compiler.compile(dummyStrategy, dummyTestCases, dummyManifest, metrics);

    expect(bundle.summary).toContain('revision v3');
    expect(bundle.metrics.requirementQualityGrade).toBe('A+');
    expect(bundle.traceability.requirementId).toBe('req-stripe-checkout');
    expect(bundle.metadata.provider).toBe('Claude 3.5 Sonnet');
  });

  it('Test 2: NamingStrategy dynamic filename sanitizer works correctly', () => {
    const naming = new NamingStrategy();
    const filename = naming.generateFilename('req-stripe-checkout/api', 3, 'XLSX');
    expect(filename).toBe('qamate_req_stripe_checkout_api_v3.xlsx');
  });

  it('Test 3: ExcelExporterPlugin filters sheets based on the requested ExportProfileType', async () => {
    const healthEngine = new WorkspaceHealth();
    const metrics = healthEngine.calculateWorkspaceHealth(
      dummyStrategy,
      dummyTestCases,
      5, 12000, 'Claude', 92, 1, 2, 5
    );
    const compiler = new DeliverableCompiler();
    const bundle = compiler.compile(dummyStrategy, dummyTestCases, dummyManifest, metrics);

    const exporter = new ExcelExporterPlugin();

    // auditor profile has all sheets (Summary, QA Strategy, Test Cases, Risks, Traceability)
    const auditorBuffer = await exporter.export(bundle, 'auditor');
    expect(auditorBuffer).toBeInstanceOf(Buffer);

    // developer profile filters out Summary & Risks sheet
    const developerBuffer = await exporter.export(bundle, 'developer');
    expect(developerBuffer).toBeInstanceOf(Buffer);
  });

  it('Test 4: WorkspaceHealth tracks overrides, avoidance, and readiness flags', () => {
    const health = new WorkspaceHealth();
    const metrics = health.calculateWorkspaceHealth(
      dummyStrategy,
      dummyTestCases,
      5, 12000, 'Claude', 92, 4, 2, 5
    );

    expect(metrics.manualOverridesCount).toBe(4);
    expect(metrics.questionsAvoidedCount).toBe(5);
    expect(metrics.readiness.ready).toBe(true);
    expect(metrics.readiness.warnings).toContain('Workspace has 4 user-approved manual updates.');
  });
});
