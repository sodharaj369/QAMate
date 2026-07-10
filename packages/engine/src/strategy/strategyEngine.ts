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
import { SystemUnderstandingEngine } from '../platform/systemEngine.js';
import { QAReasoningEngine } from '../platform/reasoningEngine.js';

export class DefaultTestStrategyEngine implements ITestStrategyEngine {
  public async developStrategy(context: GeneratorContext): Promise<TestStrategy> {
    const trace: string[] = [];
    
    // Consume only the QA Mental Model, dynamically generating it if not provided
    let mentalModel = context.mentalModel;
    if (!mentalModel) {
      const systemEngine = new SystemUnderstandingEngine();
      const systemModel = await systemEngine.understand(context.requirement);
      
      // Align unknowns with context intelligence gaps if present
      const unknowns = context.intelligence?.missingInformation?.map(m => m.description) || systemModel.unknowns;
      
      const reasoningEngine = new QAReasoningEngine();
      mentalModel = await reasoningEngine.reason({
        system: {
          ...systemModel,
          unknowns
        },
        rulesEvidence: [],
        knowledgeEvidence: [],
        aiObservations: []
      });
    }

    trace.push('Traceability context established: Consuming canonical QA Mental Model.');

    // 1. Assess Risk & Business Impact from mental model facts/inferences
    let businessImpact: BusinessImpact = 'medium';
    const factsStr = mentalModel.facts.join(' ').toLowerCase();
    const infStr = mentalModel.inferences.join(' ').toLowerCase();

    if (factsStr.includes('security') || infStr.includes('identity') || infStr.includes('authentication') || infStr.includes('auth')) {
      businessImpact = 'critical';
    } else if (factsStr.includes('payment') || infStr.includes('payment') || infStr.includes('transaction')) {
      businessImpact = 'high';
    }
    trace.push(`Assessed Business Impact: ${businessImpact.toUpperCase()}`);

    let riskLevel: RiskLevel = 'low';
    const complexityLevel = context.intelligence?.complexity?.level || 'low';
    if (complexityLevel === 'high' || mentalModel.unknowns.length > 2) {
      riskLevel = 'high';
    } else if (complexityLevel === 'medium' || mentalModel.unknowns.length > 0) {
      riskLevel = 'medium';
    }
    trace.push(`Assessed Engineering Risk Level: ${riskLevel.toUpperCase()}`);

    // 2. Formulate Traceable Objectives & Component Focus from mental model
    const objectives: string[] = [];
    const primaryFocus: string[] = [];

    // Map clean strategic focus terms from inferences
    for (const inf of mentalModel.inferences) {
      const infLower = inf.toLowerCase();
      if (infLower.includes('storage') || infLower.includes('cloud storage')) {
        primaryFocus.push('Cloud Infrastructure / Storage');
      }
      if (infLower.includes('auth') || infLower.includes('identity') || infLower.includes('authentication')) {
        primaryFocus.push('Security / Authentication');
      }
      if (infLower.includes('monitoring') || infLower.includes('telemetry')) {
        primaryFocus.push('Telemetry & Alert Monitoring');
      }
    }

    if (primaryFocus.length === 0) {
      primaryFocus.push('General Functional');
    }

    // Always include baseline logic objective at index 0
    objectives.push(`Verify correct logical execution of "${context.requirement.title}".`);

    for (const fact of mentalModel.facts) {
      if (fact.toLowerCase().includes('attribute') || fact.toLowerCase().includes('constraint')) {
        objectives.push(fact);
      }
    }
    trace.push(`Formulated Objectives: Mapped ${objectives.length} core test objectives from mental model facts.`);

    // 3. Recommended & Excluded Suites (Why NOT / Out-of-Scope)
    const recommendedSuites: SuiteRecommendation[] = [];
    const excludedSuites: SuiteExclusion[] = [];
    const outOfScope: OutOfScopeItem[] = [];

    // Map Recommended Suites from recommendedTesting
    const addedSuites = new Set<string>();
    const addRecSuite = (suite: string, reason: string) => {
      if (!addedSuites.has(suite)) {
        addedSuites.add(suite);
        recommendedSuites.push({
          suite,
          priority: addedSuites.size,
          reason
        });
      }
    };

    for (const rec of mentalModel.recommendedTesting) {
      const recLower = rec.toLowerCase();
      if (recLower.includes('security') || recLower.includes('auth') || recLower.includes('token')) {
        addRecSuite('Security', `Feature alters infrastructure access policies and authentication tokens.`);
      }
      if (recLower.includes('storage') || recLower.includes('bucket') || recLower.includes('monitoring') || recLower.includes('telemetry')) {
        addRecSuite('Smoke', `Ensures primary container accessibility remains functional after configuration shifts.`);
      }
      if (recLower.includes('api') || recLower.includes('endpoint')) {
        addRecSuite('API', `Validates request payloads, rates, and endpoints.`);
      }
      addRecSuite('Regression', `Validates existing system pathways continue to function without resource errors.`);
    }

    if (recommendedSuites.length === 0) {
      addRecSuite('Smoke', 'Basic functional system sanity validation.');
    }

    // Map Excluded Suites from excludedTesting
    for (const excl of mentalModel.excludedTesting) {
      let suiteName = excl.split(' ')[0] || excl;
      if (excl.toLowerCase().includes('ui') || excl.toLowerCase().includes('visual')) {
        suiteName = 'Visual / UI';
      }
      if (excl.toLowerCase().includes('accessibility')) {
        suiteName = 'Accessibility';
      }
      excludedSuites.push({
        suite: suiteName,
        reason: `QA Mental Model excluded path: ${excl}`
      });
    }

    // Map Out of Scope from unknowns
    for (const unk of mentalModel.unknowns) {
      outOfScope.push({
        area: unk,
        reason: 'Unresolved requirement or technical architecture gap.'
      });
    }

    // 4. Optimize scope details: data, preconditions, environment, order, effort
    const suggestedPreconditions = [
      'Target deployment environment is active.',
      ...mentalModel.assumptions.map(a => `Assume validation: ${a}`)
    ];

    const suggestedTestData = [
      'Valid default request payload',
      'Expired SAS Token',
      'Anonymous/Unauthenticated User request',
      ...mentalModel.facts.filter(f => f.includes('Attribute')).map(f => `Attribute test: ${f}`)
    ];

    const automationCandidates: AutomationCandidate[] = [];
    for (const rec of mentalModel.recommendedTesting) {
      automationCandidates.push({
        scenario: `Verify scenario for: ${rec}`,
        reason: 'Recommended regression path in QA Mental Model.'
      });
    }
    if (automationCandidates.length === 0) {
      automationCandidates.push({
        scenario: `Sanity integration check`,
        reason: 'Baseline verification.'
      });
    }

    const manualExploratoryScenarios: ManualExploratoryFocus[] = [];
    for (const risk of mentalModel.unknowns) {
      manualExploratoryScenarios.push({
        area: `Exploratory coverage around gap: ${risk}`,
        instructions: 'Manually trace the missing parameters and verify fallback handling.'
      });
    }
    if (manualExploratoryScenarios.length === 0) {
      manualExploratoryScenarios.push({
        area: 'Integration checks',
        instructions: 'Deploy to sandbox and verify system connections remain functional.'
      });
    }

    const suggestedEnvironments = ['QA Staging', 'UAT Sandbox'];

    const executionOrder: ExecutionStep[] = recommendedSuites.map((suiteRec, idx) => ({
      order: idx + 1,
      suite: suiteRec.suite,
      focus: `Verify suite: ${suiteRec.suite} (${suiteRec.reason})`
    }));

    const estimatedEffort: EffortEstimation[] = recommendedSuites
      .filter(s => ['Smoke', 'Security', 'Regression'].includes(s.suite))
      .map(suiteRec => ({
        suite: suiteRec.suite,
        durationMinutes: suiteRec.suite === 'Regression' ? 120 : suiteRec.suite === 'Security' ? 45 : 15
      }));

    // Confidence Score from mental model
    const confidenceScore = mentalModel.confidence / 100;
    trace.push(`Strategy confidence evaluated at ${(confidenceScore * 100).toFixed(0)}%.`);

    const scope = ['General Functional Scope', ...primaryFocus];
    const risks = [...mentalModel.risks];
    const approach = `A risk-based approach prioritizing ${businessImpact} severity components.`;
    const coverage = [...objectives];
    const deliverables = ['Strategy Plan', 'HTML Test Reports', 'Playwright JSON Output'];

    const strategy: TestStrategy = {
      id: `STRAT-${Date.now().toString().slice(-4)}`,
      schemaVersion: 2,
      revision: 1,
      lastUpdated: new Date(),
      requirementId: context.requirement.id,
      businessImpact,
      riskLevel,
      objectives,
      scope,
      primaryFocus,
      risks,
      approach,
      recommendedSuites,
      excludedSuites,
      outOfScope,
      coverage,
      deliverables,
      decisions: [],
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

    // Pre-generation strategy validator checks
    if (strategy.objectives.length === 0) {
      throw new Error('Strategy validation failed: Objectives list cannot be empty.');
    }
    if (strategy.scope.length === 0) {
      throw new Error('Strategy validation failed: Scope boundary cannot be empty.');
    }
    if (strategy.risks.length === 0) {
      (strategy.risks as string[]).push('Unmapped deployment interface validation failures.');
    }

    return strategy;
  }
}
