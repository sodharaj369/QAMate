import { Requirement, Actor, DomainEntity, BusinessRule } from '../domain.js';
import { ILLMProvider } from '../interfaces/index.js';
import {
  AnalysisValidationResult,
  RequirementAnalyzerResult,
  AmbiguityReport,
  MissingInfoReport,
  RequirementConfidence,
} from './models.js';

/**
 * Validator responsible for verifying requirement input preconditions.
 * Usually implemented as a fast, static, rule-based checker.
 */
export interface IRequirementValidator {
  readonly id: string;
  readonly description: string;
  validate(requirement: Requirement): AnalysisValidationResult;
}

/**
 * Strategy pattern representing analysis implementations.
 * Can be implemented as rule-based (Regex, syntactic) or AI-assisted (LLM semantic parsing).
 */
export interface IAnalysisStrategy {
  readonly name: string;
  readonly type: 'static-rule' | 'ai-assisted';

  analyze(
    requirement: Requirement,
    provider?: ILLMProvider,
  ): Promise<{
    ambiguities: AmbiguityReport[];
    missingInfo: MissingInfoReport[];
    businessRules: BusinessRule[];
    actors: Actor[];
    entities: DomainEntity[];
    complexity?: {
      level: 'low' | 'medium' | 'high';
      factors: string[];
      rationale: string;
    };
  }>;
}

/**
 * Scorer responsible for computing final testing confidence and readiness recommendation.
 */
export interface IConfidenceScorer {
  score(
    requirement: Requirement,
    ambiguities: AmbiguityReport[],
    missingInfo: MissingInfoReport[],
  ): RequirementConfidence;
}

/**
 * Main Orchestrator interface for the Requirement Analyzer module.
 * Executes validation, fires active strategies, runs confidence scoring, and aggregates the results.
 */
export interface IRequirementAnalyzer {
  readonly validator: IRequirementValidator;
  readonly scorer: IConfidenceScorer;
  readonly strategies: IAnalysisStrategy[];

  analyze(
    requirement: Requirement,
    provider?: ILLMProvider,
    options?: {
      activeStrategyNames?: string[]; // Allows targeting specific rules or checkers
    },
  ): Promise<RequirementAnalyzerResult>;
}

/**
 * Detector responsible for categorizing the software domain scope and computing confidence ratings.
 */
export interface IDomainDetector {
  detect(content: string): { domains: string[]; confidencePercent: number };
}
