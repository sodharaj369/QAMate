import { Requirement, RequirementIntelligenceReport, Answer, ProjectConfig } from './domain.js';
import { QAMentalModel } from './platform/reasoningModel.js';

/**
 * User-defined preferences controlling the scope and detail of test generation.
 */
export interface GenerationPreferences {
  readonly maxCases: number;
  readonly focusAreas: ('security' | 'boundaries' | 'regression' | 'smoke' | 'performance')[];
  readonly includeAutomationCandidate: boolean;
}

/**
 * Consolidated context containing all instructions needed for AI reasoning.
 */
export interface GeneratorContext {
  readonly version: string; // Schema tracking version (e.g., '1.0')
  readonly requirement: Requirement;
  readonly intelligence: RequirementIntelligenceReport;
  readonly answers: Answer[];
  readonly projectConfig: ProjectConfig;
  readonly generationPreferences: GenerationPreferences;
  readonly compiledAt: Date;
  readonly historicalCorrections?: string[];
  readonly mentalModel?: QAMentalModel;
}


/**
 * Integrity report checking context quality and blocked states before generation.
 */
export interface ContextReadinessReport {
  readonly ready: boolean;
  readonly confidence: number; // Quality percentage rating (0.0 to 1.0)
  readonly blockingIssues: string[];
  readonly warnings: string[];
  readonly recommendation: string;
}

/**
 * Export options for test cases.
 */
export type ExportFormat = 'gherkin' | 'csv' | 'markdown' | 'json';

export interface ExportConfig {
  format: ExportFormat;
  outputPath?: string;
  options?: Record<string, unknown>;
}

/**
 * Serialized output representing the exported test cases.
 */
export interface ExportResult {
  format: ExportFormat;
  content: string;
  fileName: string;
}
