import { RequirementIntelligenceReport } from '../domain.js';

/**
 * Validation check failure severity.
 */
export type ValidationSeverity = 'warning' | 'error';

/**
 * Detailed report of a single validation failure.
 */
export interface ValidationIssue {
  readonly ruleId: string;
  readonly severity: ValidationSeverity;
  readonly message: string;
  readonly path?: string; // Pointer to source line/field
}

/**
 * Result of validating the input requirement before analysis.
 */
export interface AnalysisValidationResult {
  readonly isValid: boolean;
  readonly issues: ValidationIssue[];
}

/**
 * Categorized ambiguity types found in software specs.
 */
export type AmbiguityType =
  | 'contradiction' // e.g., "Must be admin" vs "Guests can trigger X"
  | 'vague-terminology' // e.g., "System should respond fast", "User should see normal page"
  | 'unspecified-actor' // e.g., "The transaction is finalized" (by who?)
  | 'incomplete-condition' // e.g., "If user is premium X occurs" (what if they are not?)
  | 'implied-behavior'; // e.g., Heuristics not explicitly written down

/**
 * Detailed report of an ambiguity.
 */
export interface AmbiguityReport {
  readonly id: string;
  readonly type: AmbiguityType;
  readonly description: string;
  readonly snippet?: string; // Text fragment containing the ambiguity
  readonly severity: 'low' | 'medium' | 'high';
}

/**
 * Categories of missing information critical for test case formulation.
 */
export type MissingInfoCategory =
  | 'error-handling' // e.g., Network failure, invalid input paths
  | 'boundary-conditions' // e.g., limits, range constraints, off-by-one triggers
  | 'permissions-auth' // e.g., Access lists, session expiry behaviors
  | 'data-formats' // e.g., String lengths, date formats, payload shapes
  | 'non-functional-sla'; // e.g., performance response thresholds, timeout periods

/**
 * Detailed report of missing information.
 */
export interface MissingInfoReport {
  readonly category: MissingInfoCategory;
  readonly description: string;
  readonly whyCriticalForQA: string; // Explanation of what tests cannot be generated due to this gap
}

/**
 * Dimensions evaluated to compute the final analysis confidence.
 */
export type ConfidenceDimension =
  | 'spec-clarity' // Inverse of ambiguity density
  | 'spec-completeness' // Coverage of standard QA checklists (boundary, errors, etc.)
  | 'spec-consistency'; // Contradiction checks

/**
 * Single evaluation breakdown for a confidence dimension.
 */
export interface DimensionEvaluation {
  readonly dimension: ConfidenceDimension;
  readonly score: number; // Value between 0.0 (very poor) and 1.0 (perfect)
  readonly weight: number; // Importance coefficient (e.g., completeness is weighted heavily)
  readonly reasons: string[];
}

/**
 * Summary confidence report of the analyzer.
 */
export interface RequirementConfidence {
  /**
   * Weighted aggregate confidence score between 0.0 (blocked) and 1.0 (ready).
   * Recommendation guidelines:
   * - < 0.5: Generation Blocked. Clarification questions mandatory.
   * - 0.5 to 0.8: Generation Possible, but questions recommended.
   * - > 0.8: Ready for direct Generation.
   */
  readonly score: number;
  readonly evaluations: DimensionEvaluation[];
  readonly recommendation: 'generate-direct' | 'clarify-recommended' | 'clarify-mandatory';
}

/**
 * Comprehensive outcome of the Requirement Analyzer Module.
 * Extends the core domain model with debugging reports, validation records, and confidence metadata.
 */
export interface RequirementAnalyzerResult {
  readonly intelligence: RequirementIntelligenceReport;
  readonly validation: AnalysisValidationResult;
  readonly confidence: RequirementConfidence;
  readonly ambiguitiesReport: AmbiguityReport[];
  readonly missingInfoReport: MissingInfoReport[];
}
