import {
  Requirement,
  RequirementIntelligenceReport,
  QuestionCandidate,
  Question,
  Answer,
  TestCase,
  Conversation,
  ProjectConfig,
  TestStrategy,
} from '../domain.js';
import {
  GeneratorContext,
  GenerationPreferences,
  ContextReadinessReport,
  ExportConfig,
  ExportResult,
} from '../types.js';

/**
 * Options for fine-tuning LLM generation parameters.
 */
export interface LLMRequestOptions {
  temperature?: number;
  maxTokens?: number;
  stopSequences?: string[];
  systemInstruction?: string;
  responseFormat?: 'text' | 'json';
}

/**
 * AI Provider agnostic interface for LLM completions.
 * Allows switching providers (Gemini, OpenAI, Anthropic, Llama, etc.) seamlessly.
 */
export interface ILLMProvider {
  readonly id: string;
  readonly name: string;
  generate(prompt: string, options?: LLMRequestOptions): Promise<string>;
}

/**
 * Question Candidate Generator Module
 * Formulates potential questions from requirement ambiguities and gaps.
 */
export interface IQuestionCandidateGenerator {
  generateCandidates(
    requirement: Requirement,
    intelligence: RequirementIntelligenceReport,
  ): Promise<QuestionCandidate[]>;
}

/**
 * Question Prioritizer Module
 * Analyzes questions to score priority, impact levels, and skip risk warnings.
 */
export interface IQuestionPrioritizer {
  prioritize(candidates: QuestionCandidate[]): Promise<QuestionCandidate[]>;
}

/**
 * Question Deduplicator Module
 * Semantically groups and merges redundant questions.
 */
export interface IQuestionDeduplicator {
  deduplicate(candidates: QuestionCandidate[]): Promise<QuestionCandidate[]>;
}

/**
 * Question Planner Module
 * Groups candidate questions by category and selects which ones to activate.
 */
export interface IQuestionPlanner {
  plan(
    candidates: QuestionCandidate[],
    options?: { askOnlyBlocking?: boolean },
  ): Promise<Question[]>;
}

/**
 * Clarification Engine Module
 * Orchestrates candidate generation, prioritization, deduplication, and planning.
 */
export interface IClarificationEngine {
  readonly candidateGenerator: IQuestionCandidateGenerator;
  readonly prioritizer: IQuestionPrioritizer;
  readonly deduplicator: IQuestionDeduplicator;
  readonly planner: IQuestionPlanner;

  planClarifications(
    requirement: Requirement,
    intelligence: RequirementIntelligenceReport,
    options?: { askOnlyBlocking?: boolean },
  ): Promise<{
    candidates: QuestionCandidate[];
    activeQuestions: Question[];
  }>;
}

/**
 * Context Compiler Module
 * Compiles requirement inputs, answers, project configuration, and preferences.
 */
export interface IContextCompiler {
  compile(
    requirement: Requirement,
    intelligence: RequirementIntelligenceReport,
    answers: Answer[],
    projectConfig: ProjectConfig,
    generationPreferences: GenerationPreferences,
  ): Promise<GeneratorContext>;
}

/**
 * Context Validator Module
 * Evaluates the compiled context and yields a Readiness check report.
 */
export interface IContextValidator {
  validate(context: GeneratorContext): Promise<ContextReadinessReport>;
}

/**
 * Context Renderer Module
 * Bundles loading of template files and replaces placeholder variables.
 */
export interface IContextRenderer {
  renderToMarkdown(context: GeneratorContext, templatePath: string): Promise<string>;
  renderToJSON(context: GeneratorContext): Promise<string>;
}

/**
 * Test Strategy Engine Module
 * Analyzes GeneratorContext to construct the executable TestStrategy.
 */
export interface ITestStrategyEngine {
  developStrategy(context: GeneratorContext): Promise<TestStrategy>;
}

/**
 * Test Generator Module
 * Generates the initial suite of test cases utilizing the gathered context.
 */
export interface ITestGenerator {
  generate(context: GeneratorContext, provider: ILLMProvider): Promise<TestCase[]>;
}

/**
 * Review Engine Module
 * Post-processes test cases to remove duplicates and ensure strict compliance with standards.
 */
export interface IReviewEngine {
  deduplicate(testCases: TestCase[]): TestCase[];
  verifyStandardCompliance(testCases: TestCase[]): Promise<{
    passed: boolean;
    feedback: string[];
  }>;
}

/**
 * Prioritization Engine Module
 * Ranks test cases by business criticality and engineering risk mapping (P0 - P3).
 */
export interface IPrioritizationEngine {
  prioritize(
    testCases: TestCase[],
    context: GeneratorContext,
    provider: ILLMProvider,
  ): Promise<TestCase[]>;
}

/**
 * Export Engine Module
 * Translates test cases into various target formats (Gherkin, CSV, Markdown, JSON).
 */
export interface IExportEngine {
  export(testCases: TestCase[], config: ExportConfig): Promise<ExportResult>;
}

/**
 * Conversation Manager Module
 * Orchestrates the full lifecycle state machine of a single QAMate analysis run.
 */
export interface IConversationManager {
  createSession(projectId: string, requirementId: string): Promise<Conversation>;
  getSession(conversationId: string): Promise<Conversation | undefined>;
  saveSession(conversation: Conversation): Promise<void>;
  advanceSession(
    conversationId: string,
    action: {
      type:
        'ADD_ANSWERS' | 'SET_INTELLIGENCE' | 'SET_CANDIDATES' | 'SET_QUESTIONS' | 'SET_TEST_CASES';
      payload: unknown;
    },
  ): Promise<Conversation>;
}
