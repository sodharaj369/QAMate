import { Requirement, RequirementIntelligenceReport } from '../domain.js';

export class ConfidenceEngine {
  public calculate(
    requirement: Requirement,
    intelligence: RequirementIntelligenceReport,
    ambiguitiesCount: number,
    knowledgeMatched: boolean,
    playbookMatched: boolean
  ): number {
    let score = 100;

    // 1. Requirement Quality (Word density check)
    const wordCount = requirement.content.split(/\s+/).filter(Boolean).length;
    if (wordCount < 100) {
      score -= 20; // Thin requirements receive a major penalty
    } else if (wordCount < 250) {
      score -= 10;
    }

    // 2. Ambiguities deductions
    const ambiguityPenalty = Math.min(ambiguitiesCount * 8, 40);
    score -= ambiguityPenalty;

    // 3. Completeness of key structures (Actors / Business Rules)
    if (intelligence.businessRules.length === 0) {
      score -= 15;
    } else if (intelligence.businessRules.length < 3) {
      score -= 5;
    }

    if (intelligence.actors.length === 0) {
      score -= 10;
    }

    // 4. Boosts from domain playbooks and active semantic memories
    if (knowledgeMatched) {
      score += 5;
    }
    if (playbookMatched) {
      score += 5;
    }

    // Bind boundary limit to 0 - 100 range
    return Math.max(0, Math.min(100, score));
  }
}
