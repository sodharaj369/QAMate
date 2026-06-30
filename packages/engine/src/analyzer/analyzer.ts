import { Requirement, RequirementIntelligenceReport } from '../domain.js';
import { ILLMProvider } from '../interfaces/index.js';
import {
  IRequirementAnalyzer,
  IRequirementValidator,
  IConfidenceScorer,
  IAnalysisStrategy,
} from './interfaces.js';
import { RequirementAnalyzerResult, AmbiguityReport, MissingInfoReport } from './models.js';

/**
 * Concrete implementation of IRequirementAnalyzer.
 * Coordinates input validation, strategy execution, scoring, and returns the unified result.
 */
export class DefaultRequirementAnalyzer implements IRequirementAnalyzer {
  constructor(
    public readonly validator: IRequirementValidator,
    public readonly scorer: IConfidenceScorer,
    public readonly strategies: IAnalysisStrategy[],
  ) {}

  public async analyze(
    requirement: Requirement,
    provider?: ILLMProvider,
    options?: { activeStrategyNames?: string[] },
  ): Promise<RequirementAnalyzerResult> {
    // 1. Run Input Validation
    const validation = this.validator.validate(requirement);

    // If critical validation errors exist, abort and return immediately
    const hasCriticalErrors = validation.issues.some((i) => i.severity === 'error');
    if (hasCriticalErrors) {
      const emptyIntelligence: RequirementIntelligenceReport = {
        requirementId: requirement.id,
        analyzedAt: new Date(),
        actors: [],
        entities: [],
        businessRules: [],
        ambiguities: [],
        missingInformation: [],
        riskAreas: [],
        complexity: { level: 'low', factors: [], rationale: 'Validation aborted.' },
        confidenceScore: 0.0,
      };

      return {
        intelligence: emptyIntelligence,
        validation,
        confidence: { score: 0.0, evaluations: [], recommendation: 'clarify-mandatory' },
        ambiguitiesReport: [],
        missingInfoReport: [],
      };
    }

    // 2. Resolve Active Strategies to execute
    const activeStrategies = options?.activeStrategyNames
      ? this.strategies.filter((s) => options.activeStrategyNames!.includes(s.name))
      : this.strategies;

    // Fallback if no strategy is active/registered
    if (activeStrategies.length === 0) {
      throw new Error('RequirementAnalyzer: No active strategies registered for execution.');
    }

    // 3. Fire strategies and accumulate findings
    const mergedActors = new Map<string, string>();
    const mergedEntities = new Map<string, Set<string>>();
    const mergedRules = new Map<string, { desc: string; cond: string; outcome: string }>();
    const allAmbiguities: AmbiguityReport[] = [];
    const allMissingInfo: MissingInfoReport[] = [];

    let highestComplexity: 'low' | 'medium' | 'high' = 'low';
    const complexityFactors: string[] = [];
    let complexityRationale = '';

    for (const strategy of activeStrategies) {
      try {
        const result = await strategy.analyze(requirement, provider);

        // Merge Actors
        for (const actor of result.actors) {
          mergedActors.set(actor.name, actor.description);
        }

        // Merge Entities
        for (const entity of result.entities) {
          if (!mergedEntities.has(entity.name)) {
            mergedEntities.set(entity.name, new Set(entity.properties));
          } else {
            const props = mergedEntities.get(entity.name)!;
            entity.properties.forEach((p) => props.add(p));
          }
        }

        // Merge Business Rules (by normalized description mapping)
        for (const rule of result.businessRules) {
          mergedRules.set(rule.description.toLowerCase(), {
            desc: rule.description,
            cond: rule.condition,
            outcome: rule.expectedOutcome,
          });
        }

        // Aggregate Ambiguities and Gaps
        allAmbiguities.push(...result.ambiguities);
        allMissingInfo.push(...result.missingInfo);

        // Grade Complexity upwards
        if (result.complexity) {
          complexityFactors.push(...result.complexity.factors);
          if (
            result.complexity.level === 'high' ||
            (result.complexity.level === 'medium' && highestComplexity === 'low')
          ) {
            highestComplexity = result.complexity.level;
            complexityRationale = result.complexity.rationale;
          }
        }
      } catch (err) {
        console.error(`RequirementAnalyzer: Strategy "${strategy.name}" execution failed.`, err);
      }
    }

    // 4. Calculate Risk Areas based on gaps and ambiguities
    const riskAreas = allMissingInfo.map((gap, index) => ({
      area: `Risk-${String(index + 1).padStart(3, '0')}: ${gap.category}`,
      description: `Testing blocked on: "${gap.description}" - ${gap.whyCriticalForQA}`,
      severity: 'high' as const,
    }));

    // 5. Calculate Confidence Score
    const confidence = this.scorer.score(requirement, allAmbiguities, allMissingInfo);

    // 6. Build the final Domain Report
    let idCounter = 1;
    const finalReport: RequirementIntelligenceReport = {
      requirementId: requirement.id,
      analyzedAt: new Date(),
      actors: Array.from(mergedActors.entries()).map(([name, description]) => ({
        name,
        description,
      })),
      entities: Array.from(mergedEntities.entries()).map(([name, props]) => ({
        name,
        properties: Array.from(props),
        relationships: [],
      })),
      businessRules: Array.from(mergedRules.values()).map((r) => ({
        id: `BR-${String(idCounter++).padStart(3, '0')}`,
        description: r.desc,
        condition: r.cond,
        expectedOutcome: r.outcome,
      })),
      ambiguities: allAmbiguities.map((a) => ({
        id: a.id,
        description: a.description,
        locationSnippet: a.snippet,
        severity: a.severity,
      })),
      missingInformation: allMissingInfo.map((m) => ({
        description: m.description,
        category: m.category,
        impactSeverity: 'high', // Missing critical details is prioritized high for QA
      })),
      riskAreas,
      complexity: {
        level: highestComplexity,
        factors: Array.from(new Set(complexityFactors)),
        rationale: complexityRationale || 'Standard specification complexity.',
      },
      confidenceScore: confidence.score,
    };

    return {
      intelligence: finalReport,
      validation,
      confidence,
      ambiguitiesReport: allAmbiguities,
      missingInfoReport: allMissingInfo,
    };
  }
}
