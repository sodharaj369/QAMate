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
  UserPersona,
  ProjectProfile,
  ArtifactPlan,
  QAArtifact,
  ReviewReport,
  KnowledgeEntry,
  KnowledgeQuery,
  KnowledgeResult,
  CoverageReport,
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
 * Artifact Planner Module
 * Maps engineering personas and stack profiles to selective artifact plans.
 */
export interface IArtifactPlanner {
  planArtifacts(
    strategy: TestStrategy,
    persona: UserPersona,
    profile: ProjectProfile,
  ): Promise<ArtifactPlan>;
}

/**
 * Artifact Generator Module
 * Assembles templates and executes provider calls to construct files.
 */
export interface IArtifactGenerator {
  generateArtifacts(
    context: GeneratorContext,
    plan: ArtifactPlan,
    provider: ILLMProvider,
  ): Promise<QAArtifact[]>;
}

/**
 * Review Engine Module
 * Analyzes generated artifacts against context standards to evaluate Quality Gates.
 */
export interface IReviewEngine {
  reviewArtifacts(
    artifacts: QAArtifact[],
    context: GeneratorContext,
    strategy: TestStrategy,
  ): Promise<ReviewReport>;
}

/**
 * Knowledge Engine Module
 * Persistent QA memory layer for bug patterns, templates, and similar requirement matching.
 */
export interface IKnowledgeEngine {
  extractKnowledge(
    artifacts: QAArtifact[],
    intelligence: RequirementIntelligenceReport,
    review: ReviewReport,
  ): Promise<KnowledgeEntry[]>;

  queryKnowledge(query: KnowledgeQuery): Promise<KnowledgeResult>;

  findSimilarRequirements(requirement: Requirement): Promise<KnowledgeResult>;

  getStore(): KnowledgeEntry[];
}

/**
 * Coverage Engine Module
 * Analyzes rule coverage metrics across strategies and outputs.
 */
export interface ICoverageEngine {
  calculateCoverage(
    strategy: TestStrategy,
    artifacts: QAArtifact[],
    intelligence: RequirementIntelligenceReport,
  ): Promise<CoverageReport>;
}

/**
 * Test Generator Module
 * Generates the initial suite of test cases utilizing the gathered context.
 */
export interface ITestGenerator {
  generate(context: GeneratorContext, provider: ILLMProvider): Promise<TestCase[]>;
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

/**
 * Conversation Storage Module
 * Persistence adapter interface for managing saved conversation states.
 */
export interface IConversationStorage {
  saveConversation(conversation: Conversation): Promise<void>;
  loadConversation(conversationId: string): Promise<Conversation | undefined>;
  listConversations(): Promise<string[]>;
}

/**
 * Knowledge Storage Module
 * Persistence adapter interface for managing accumulated memory units.
 */
export interface IKnowledgeStorage {
  saveKnowledge(entries: KnowledgeEntry[]): Promise<void>;
  loadKnowledge(): Promise<KnowledgeEntry[]>;
}

/**
 * Azure DevOps Persistence Adapter
 * Provides integration contracts to fetch specs from ADO Work Items and publish tests.
 */
export interface IADOPersistenceAdapter {
  importWorkItem(
    workItemId: string,
    org: string,
    project: string,
    pat: string,
  ): Promise<Requirement>;

  exportTestCases(
    testCases: TestCase[],
    workItemId: string,
    org: string,
    project: string,
    pat: string,
  ): Promise<void>;
}

/**
 * Platform Integration Interfaces
 */
export interface IWorkItemProvider {
  fetchWorkItem(id: string): Promise<Requirement>;
}

export interface IStorageProvider {
  save(key: string, data: unknown): Promise<void>;
  load(key: string): Promise<unknown>;
}
