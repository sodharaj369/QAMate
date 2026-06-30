import { Requirement } from '../domain.js';
import { IConfidenceScorer } from './interfaces.js';
import {
  AmbiguityReport,
  MissingInfoReport,
  RequirementConfidence,
  DimensionEvaluation,
} from './models.js';

/**
 * Concrete implementation of IConfidenceScorer.
 * Computes weighted completeness, clarity, and consistency dimensions to evaluate QA readiness.
 */
export class DefaultConfidenceScorer implements IConfidenceScorer {
  public score(
    requirement: Requirement,
    ambiguities: AmbiguityReport[],
    missingInfo: MissingInfoReport[],
  ): RequirementConfidence {
    const wordCount = requirement.content.split(/\s+/).filter(Boolean).length;
    const lengthFactor = Math.max(1, wordCount / 100);

    // 1. Clarity Score calculation (Penalized by ambiguity density)
    let ambiguityPenalty = 0;
    const clarityReasons: string[] = [];

    for (const amb of ambiguities) {
      if (amb.severity === 'high') ambiguityPenalty += 0.3;
      else if (amb.severity === 'medium') ambiguityPenalty += 0.15;
      else ambiguityPenalty += 0.05;
    }

    const clarityScore = Math.max(0, 1.0 - ambiguityPenalty / lengthFactor);
    if (ambiguities.length > 0) {
      clarityReasons.push(`Flagged ${ambiguities.length} ambiguities in specification text.`);
    } else {
      clarityReasons.push('No vague adjectives or incomplete conditions detected.');
    }

    const clarityEvaluation: DimensionEvaluation = {
      dimension: 'spec-clarity',
      score: Number(clarityScore.toFixed(2)),
      weight: 0.3,
      reasons: clarityReasons,
    };

    // 2. Completeness Score calculation (Penalized by missing QA categories)
    // We check against 4 standard QA checklist dimensions: error, boundary, permissions, data formats.
    const missingCount = missingInfo.length;
    const completenessScore = Math.max(0, 1.0 - missingCount / 4.0);
    const completenessReasons: string[] = [];

    if (missingCount > 0) {
      const categoriesList = missingInfo.map((m) => m.category).join(', ');
      completenessReasons.push(`Missing QA categories: ${categoriesList}.`);
    } else {
      completenessReasons.push(
        'All standard QA checklists (errors, boundaries, permissions) are described.',
      );
    }

    const completenessEvaluation: DimensionEvaluation = {
      dimension: 'spec-completeness',
      score: Number(completenessScore.toFixed(2)),
      weight: 0.5,
      reasons: completenessReasons,
    };

    // 3. Consistency Score (Penalized by logical contradictions)
    const contradictions = ambiguities.filter((a) => a.type === 'contradiction');
    const consistencyScore = Math.max(0, 1.0 - contradictions.length * 0.3);
    const consistencyReasons: string[] = [];

    if (contradictions.length > 0) {
      consistencyReasons.push(`Detected ${contradictions.length} logical contradictions.`);
    } else {
      consistencyReasons.push('No explicit logical contradictions identified.');
    }

    const consistencyEvaluation: DimensionEvaluation = {
      dimension: 'spec-consistency',
      score: Number(consistencyScore.toFixed(2)),
      weight: 0.2,
      reasons: consistencyReasons,
    };

    // 4. Aggregate Weighted Score
    const aggregateScore =
      clarityEvaluation.score * clarityEvaluation.weight +
      completenessEvaluation.score * completenessEvaluation.weight +
      consistencyEvaluation.score * consistencyEvaluation.weight;

    const finalScore = Number(aggregateScore.toFixed(2));

    // Determine Action Recommendation
    let recommendation: 'generate-direct' | 'clarify-recommended' | 'clarify-mandatory';
    if (finalScore >= 0.8) {
      recommendation = 'generate-direct';
    } else if (finalScore >= 0.5) {
      recommendation = 'clarify-recommended';
    } else {
      recommendation = 'clarify-mandatory';
    }

    return {
      score: finalScore,
      evaluations: [clarityEvaluation, completenessEvaluation, consistencyEvaluation],
      recommendation,
    };
  }
}
