import { Requirement, RequirementIntelligenceReport, QuestionCandidate } from '../domain.js';
import { ConfidenceEngine } from './confidenceEngine.js';
import { MaterialClarification } from './materialClarification.js';
import { StrategySelector } from './strategySelector.js';

export interface DecisionReport {
  requirementQuality: number;
  complexity: 'low' | 'medium' | 'high';
  riskLevel: 'low' | 'medium' | 'high';
  questionsAskedCount: number;
  questionsSkippedCount: number;
  playbookName: string;
  knowledgeMatched: boolean;
  strategy: string;
  isReady: boolean;
  explainability: {
    complexityReason: string;
    riskReason: string;
    questionReason: string;
  };
}

export class QADecisionEngine {
  private confidenceEngine = new ConfidenceEngine();
  private clarificationFilter = new MaterialClarification();
  private strategySelector = new StrategySelector();

  public analyze(
    requirement: Requirement,
    intelligence: RequirementIntelligenceReport,
    candidates: QuestionCandidate[],
    knowledgeMatched = false
  ): DecisionReport {
    const clarification = this.clarificationFilter.filter(candidates);

    const strategyReport = this.strategySelector.select(requirement, intelligence, candidates.length);

    const playbookMatched = strategyReport.playbookName !== 'General';
    const requirementQuality = this.confidenceEngine.calculate(
      requirement,
      intelligence,
      clarification.materialQuestions.length,
      knowledgeMatched,
      playbookMatched
    );

    const isReady = requirementQuality >= 80 && clarification.materialQuestions.length === 0;

    const complexityReason = `Complexity evaluated as ${strategyReport.complexity.toUpperCase()} based on: ${strategyReport.factors.filter(f => f.includes('size') || f.includes('rule') || f.includes('actor')).join(', ') || 'Low requirements footprint'}.`;
    const riskReason = `Risk Level scored ${strategyReport.riskLevel.toUpperCase()} based on: ${strategyReport.factors.filter(f => f.includes('ambiguities') || f.includes('Security') || f.includes('Performance') || f.includes('preconditions')).join(', ') || 'No compliance boundaries triggered'}.`;
    const questionReason = `Intake parsed ${candidates.length} candidates. Retained ${clarification.materialQuestions.length} material questions affecting output strategy, skipped ${clarification.skippedQuestions.length} non-material ones.`;

    return {
      requirementQuality,
      complexity: strategyReport.complexity,
      riskLevel: strategyReport.riskLevel,
      questionsAskedCount: clarification.materialQuestions.length,
      questionsSkippedCount: clarification.skippedQuestions.length,
      playbookName: strategyReport.playbookName,
      knowledgeMatched,
      strategy: strategyReport.recommendedStrategy === 'comprehensive-qa' ? 'Comprehensive QA' : strategyReport.recommendedStrategy === 'balanced-qa' ? 'Balanced QA' : 'Sanity & Smoke QA',
      isReady,
      explainability: {
        complexityReason,
        riskReason,
        questionReason
      }
    };
  }
}
