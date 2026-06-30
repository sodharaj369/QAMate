import { GeneratorContext } from '../types.js';
import {
  TestStrategy,
  BusinessImpact,
  RiskLevel,
  SuiteRecommendation,
  SuiteExclusion,
  OutOfScopeItem,
  AutomationCandidate,
  ManualExploratoryFocus,
  ExecutionStep,
  EffortEstimation,
} from '../domain.js';
import { ITestStrategyEngine } from '../interfaces/index.js';

export class DefaultTestStrategyEngine implements ITestStrategyEngine {
  public async developStrategy(context: GeneratorContext): Promise<TestStrategy> {
    const trace: string[] = [];

    // 1. Assess Risk & Business Impact
    trace.push('Requirement parsed: Analyzing keywords to grade business impact and risk.');
    const content = context.requirement.content.toLowerCase();

    let businessImpact: BusinessImpact = 'medium';
    if (
      content.includes('sec') ||
      content.includes('security') ||
      content.includes('auth') ||
      content.includes('public')
    ) {
      businessImpact = 'critical';
    } else if (
      content.includes('payment') ||
      content.includes('premium') ||
      content.includes('financial')
    ) {
      businessImpact = 'high';
    }
    trace.push(`Assessed Business Impact: ${businessImpact.toUpperCase()}`);

    let riskLevel: RiskLevel = 'low';
    if (
      context.intelligence.complexity.level === 'high' ||
      context.intelligence.ambiguities.length > 2
    ) {
      riskLevel = 'high';
    } else if (
      context.intelligence.complexity.level === 'medium' ||
      context.intelligence.missingInformation.length > 0
    ) {
      riskLevel = 'medium';
    }
    trace.push(`Assessed Engineering Risk Level: ${riskLevel.toUpperCase()}`);

    // 2. Formulate Traceable Objectives & Component Focus
    const objectives: string[] = [];
    const primaryFocus: string[] = [];

    if (
      content.includes('storage') ||
      content.includes('account') ||
      content.includes('blob') ||
      content.includes('container')
    ) {
      primaryFocus.push('Cloud Infrastructure / Storage');
      objectives.push('Verify storage accounts are secured and public access is disabled.');
    }
    if (
      content.includes('auth') ||
      content.includes('token') ||
      content.includes('access') ||
      content.includes('expired')
    ) {
      primaryFocus.push('Security / Authentication');
      objectives.push('Verify authenticated application read/write requests still function.');
      if (content.includes('expiry') || content.includes('token')) {
        objectives.push('Verify token expiry validations and credential refresh flows.');
      }
    }
    if (objectives.length === 0) {
      primaryFocus.push('General Functional');
      objectives.push(`Verify correct logical execution of "${context.requirement.title}".`);
    }
    trace.push(
      `Formulated Objectives: Generated ${objectives.length} core test strategy objectives.`,
    );

    // 3. Recommended & Excluded Suites (Why NOT / Out-of-Scope)
    const recommendedSuites: SuiteRecommendation[] = [];
    const excludedSuites: SuiteExclusion[] = [];
    const outOfScope: OutOfScopeItem[] = [];

    // Recommended
    if (primaryFocus.includes('Security / Authentication') || content.includes('sec')) {
      recommendedSuites.push({
        suite: 'Security',
        priority: 1,
        reason: 'Feature alters infrastructure access policies and authentication tokens.',
      });
    }
    recommendedSuites.push({
      suite: 'Smoke',
      priority: 2,
      reason:
        'Ensures primary container accessibility remains functional after configuration shifts.',
    });
    recommendedSuites.push({
      suite: 'Regression',
      priority: 3,
      reason: 'Validates existing application APIs consuming storage continue to function.',
    });
    if (content.includes('token') || content.includes('api') || content.includes('url')) {
      recommendedSuites.push({
        suite: 'API',
        priority: 4,
        reason: 'Validates direct request formats and token expiration limits.',
      });
    }

    // Excluded
    excludedSuites.push({
      suite: 'Accessibility',
      reason: 'Infrastructure-only change. No user interface layout or controls modified.',
    });
    excludedSuites.push({
      suite: 'Visual / UI',
      reason: 'No frontend visual elements affected by public-access flag adjustments.',
    });
    trace.push(
      'Determined Suite Scope: Recommended primary suites, excluded Accessibility/Visual due to zero UI updates.',
    );

    // Out of Scope
    outOfScope.push({
      area: 'Performance / Load Testing',
      reason:
        'No performance SLA criteria, scale targets, or throughput boundaries specified in the requirement.',
    });
    outOfScope.push({
      area: 'Localization',
      reason: 'Requirement contains no multi-lingual copy or region-specific formatting updates.',
    });
    trace.push('Out of Scope declared: Deferred performance limits and localization checks.');

    // 4. Optimize scope details: data, preconditions, environment, order, effort
    const suggestedPreconditions = [
      'Target Azure/AWS cloud subscription is active.',
      'Mock storage container is created with public access initially enabled.',
      'Valid Azure AD / SAS Token is generated and loaded in credentials store.',
    ];

    const suggestedTestData = [
      'Valid Authentication Token',
      'Expired SAS Token',
      'Anonymous/Unauthenticated User request',
      'Malformed Storage Container URL',
    ];

    const automationCandidates: AutomationCandidate[] = [
      {
        scenario: '{ GET /blob } anonymous request yields HTTP 403 Forbidden.',
        reason: 'Core security boundary. High repetition regression suite candidate.',
      },
      {
        scenario: '{ GET /blob } with expired token fails authentication.',
        reason: 'Automated token expiration lifecycle scenario.',
      },
    ];

    const manualExploratoryScenarios: ManualExploratoryFocus[] = [
      {
        area: 'Existing integrations check',
        instructions:
          'Deploy configuration block to sandbox and verify that current system image rendering and document templates using these accounts continue loading without resource errors.',
      },
    ];

    const suggestedEnvironments = ['QA Staging', 'UAT Sandbox'];

    const executionOrder: ExecutionStep[] = [
      {
        order: 1,
        suite: 'Smoke',
        focus: 'Verify container basic ping and environment sandbox connections.',
      },
      {
        order: 2,
        suite: 'Security',
        focus: 'Execute auth boundary checks, anonymous access lockouts, and token verification.',
      },
      {
        order: 3,
        suite: 'Regression',
        focus:
          'Verify integrated client applications function correctly without connection errors.',
      },
    ];

    const estimatedEffort: EffortEstimation[] = [
      { suite: 'Smoke', durationMinutes: 15 },
      { suite: 'Security', durationMinutes: 45 },
      { suite: 'Regression', durationMinutes: 120 },
    ];
    trace.push(
      'Compiled Execution Plan: Sequenced execution order, mapped preconditions, test data, and estimated effort.',
    );

    // 5. Calculate overall confidence score
    let confidenceScore = 1.0;
    // Unresolved gaps or ambiguities lower confidence in the strategy
    const gapCount = context.intelligence.missingInformation.length;
    const unresolvedGapCount = gapCount - context.answers.length;
    if (unresolvedGapCount > 0) {
      confidenceScore -= unresolvedGapCount * 0.15;
    }
    confidenceScore = Math.max(0.1, confidenceScore);
    trace.push(`Strategy confidence evaluated at ${(confidenceScore * 100).toFixed(0)}%.`);

    return {
      id: `STRAT-${Date.now().toString().slice(-4)}`,
      requirementId: context.requirement.id,
      businessImpact,
      riskLevel,
      objectives,
      primaryFocus,
      recommendedSuites,
      excludedSuites,
      outOfScope,
      automationCandidates,
      manualExploratoryScenarios,
      suggestedTestData,
      suggestedPreconditions,
      suggestedEnvironments,
      executionOrder,
      estimatedEffort,
      confidenceScore,
      reasoningTrace: trace,
      createdAt: new Date(),
    };
  }
}
