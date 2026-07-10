import { SystemModel, EvidenceGraph, QAMentalModel } from './platform/reasoningModel.js';

/**
 * ============================================================================
 * QAMATE DOMAIN MODEL (Domain-Driven Design)
 * ============================================================================
 *
 * This file defines the core Domain Model for QAMate.
 * Follows DDD tactical patterns:
 * - Aggregates & Aggregate Roots (Project, Conversation, TestCase)
 * - Entities (Requirement, Question)
 * - Value Objects (RequirementAnalysis, Answer, ReviewResult, TestStep)
 *
 * This domain model is completely independent of:
 * 1. AI Providers (LLMs are treated as external services/gateways).
 * 2. Frontends/Clients (VS Code extension, Web, CLI are consumers of this model).
 */

/**
 * ----------------------------------------------------------------------------
 * 1. Project Aggregate (Aggregate Root)
 * ----------------------------------------------------------------------------
 * Rationale:
 * A Project acts as the boundary context for a software workspace being tested.
 * It stores target test runner configuration, global guidelines (e.g., Gherkin
 * vs. Playwright), and maps requirements to conversations.
 */
export interface Project {
  readonly id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  /**
   * Domain Configuration (Value Object)
   * Governs how AI engines and generators behave specifically for this project.
   */
  config: ProjectConfig;
}

export interface ProjectConfig {
  targetLanguage: string;
  targetFramework: string;
  namingConvention: string;
  companyRules: string[];
  qaGuidelines: string[];
  playbook?: {
    rules: {
      ruleId: string;
      enabled: boolean;
      severity: 'error' | 'warning';
      customMessage?: string;
      keywordTriggers?: string[];
    }[];
    customCriteriaTemplate?: string;
  };
}

/**
 * ----------------------------------------------------------------------------
 * 2. Requirement Entity
 * ----------------------------------------------------------------------------
 * Rationale:
 * Represents the input software spec (e.g., user story, ticket, feature document).
 * It has a lifecycle (draft, updated, analyzed) and can change over time.
 * Separating it from Conversation ensures a requirement can be re-analyzed or
 * referenced across different QA sessions.
 */
export interface Requirement {
  readonly id: string;
  readonly projectId: string; // Belongs to Project
  title: string;
  content: string; // The raw requirements document/text
  contentType: 'markdown' | 'plain-text' | 'jira-json';
  version: number;
  status: 'draft' | 'analyzed' | 'obsolete';
  metadata: {
    externalId?: string; // e.g., JIRA ticket ID "QA-101"
    author?: string;
    lastSyncedAt?: Date;
  };
}

/**
 * ----------------------------------------------------------------------------
 * 3. RequirementIntelligenceReport (Value Object)
 * ----------------------------------------------------------------------------
 * Rationale:
 * A rich, structured representation of the requirement knowledge base. Instead
 * of text paragraphs, this value object aggregates extracted structured metadata:
 * actors, domain models, business constraints, ambiguities, gaps, and complexity.
 * All subsequent modules (Clarification, Generation, Review) build on top of this.
 */
export interface RequirementIntelligenceReport {
  readonly requirementId: string;
  readonly analyzedAt: Date;
  readonly actors: Actor[];
  readonly entities: DomainEntity[];
  readonly businessRules: BusinessRule[];
  readonly ambiguities: Ambiguity[];
  readonly missingInformation: MissingInformationGap[];
  readonly riskAreas: RiskArea[];
  readonly complexity: RequirementComplexity;
  readonly confidenceScore: number; // Value between 0.0 (unusable) and 1.0 (perfect spec)
}

export interface Actor {
  readonly name: string;
  readonly description: string;
}

export interface DomainEntity {
  readonly name: string;
  readonly properties: string[];
  readonly relationships: string[]; // Reference to other domain entity names
}

export interface BusinessRule {
  readonly id: string;
  readonly description: string;
  readonly condition: string;
  readonly expectedOutcome: string;
}

export interface Ambiguity {
  readonly id: string;
  readonly description: string;
  readonly locationSnippet?: string;
  readonly severity: 'low' | 'medium' | 'high';
}

export interface MissingInformationGap {
  readonly description: string;
  readonly category:
    | 'error-handling'
    | 'boundary-conditions'
    | 'permissions-auth'
    | 'data-formats'
    | 'non-functional-sla'
    | 'database-models'
    | 'other';
  readonly impactSeverity: 'low' | 'medium' | 'high';
}

export interface RiskArea {
  readonly area: string;
  readonly description: string;
  readonly severity: 'low' | 'medium' | 'high';
}

export interface RequirementComplexity {
  readonly level: 'low' | 'medium' | 'high';
  readonly factors: string[];
  readonly rationale: string;
}

export type QuestionImpact = 'blocking-test-strategy' | 'blocking-understanding' | 'optional';

/**
 * ----------------------------------------------------------------------------
 * 4. QuestionCandidate (Value Object)
 * ----------------------------------------------------------------------------
 * Rationale:
 * A potential clarification question identified during analysis. It contains
 * metadata detailing its QA impact, why it matters, what the risk of skipping is,
 * and logical dependencies. It is NOT active until selected by the Planner.
 */
export interface QuestionCandidate {
  readonly id: string;
  readonly conversationId: string;
  readonly text: string;
  readonly type: 'single-choice' | 'multi-choice' | 'open-text';
  readonly options?: string[];
  readonly category: string;
  readonly impact: QuestionImpact;
  readonly rationale: string;
  readonly skipRisk: string;
  readonly priority: 'high' | 'medium' | 'low';
  readonly dependencies?: string[];
}

/**
 * ----------------------------------------------------------------------------
 * 5. Question Entity
 * ----------------------------------------------------------------------------
 * Rationale:
 * An active clarification question presented to the QA engineer.
 * Formulated from a QuestionCandidate, it tracks answers and skip states.
 */
export interface Question {
  readonly id: string;
  readonly conversationId: string;
  readonly text: string;
  readonly type: 'single-choice' | 'multi-choice' | 'open-text';
  readonly options?: string[];
  readonly category: string;
  readonly impact: QuestionImpact;
  readonly rationale: string;
  readonly skipRisk: string;
  readonly priority: 'high' | 'medium' | 'low';
  readonly dependencies?: string[];
  status: 'pending' | 'answered' | 'skipped';
  answer?: Answer;
}

/**
 * ----------------------------------------------------------------------------
 * 5. Answer (Value Object)
 * ----------------------------------------------------------------------------
 * Rationale:
 * Immutable value object capturing the QA engineer's feedback to a Question.
 * Feeding this back into the conversation allows the context to build iteratively.
 */
export interface Answer {
  readonly questionId: string;
  readonly selectedOptions?: string[]; // Selected answers for choice-based questions
  readonly textValue?: string; // Text response for open questions
  readonly answeredAt: Date;
  readonly answeredBy: string; // Identifier of the QA engineer
}

/**
 * ----------------------------------------------------------------------------
 * 6. Conversation Aggregate (Aggregate Root)
 * ----------------------------------------------------------------------------
 * Rationale:
 * The stateful controller that guides the QA engineer through the workflow:
 * Requirements Analysis -> Gaps Clarification -> Test Generation -> Review.
 * It holds the list of questions, answers, and references the active analysis.
 *
 * For the VS Code extension, the extension will query and command this aggregate,
 * keeping the extension logic completely thin and presentation-focused.
 */
export interface Conversation {
  readonly id: string;
  readonly projectId: string;
  readonly requirementId: string;
  status:
    | 'analyzing'
    | 'planning-questions'
    | 'waiting-for-answers'
    | 'ready-for-generation'
    | 'generating'
    | 'reviewing';

  /**
   * The active intelligence report associated with this conversation.
   * Updates when a new revision of the requirement is processed.
   */
  currentIntelligence?: RequirementIntelligenceReport;

  /**
   * Extracted potential questions mapped during analysis.
   */
  candidates: QuestionCandidate[];

  /**
   * Collection of active, planned clarifications presented to the user
   */
  questions: Question[];
  answers: Answer[];
  testCases?: TestCase[];

  systemModel?: SystemModel;
  evidenceGraph?: EvidenceGraph;
  mentalModel?: QAMentalModel;

  createdAt: Date;
  updatedAt: Date;
}

/**
 * ----------------------------------------------------------------------------
 * 7. TestCase Aggregate (Aggregate Root)
 * ----------------------------------------------------------------------------
 * Rationale:
 * The generated test case output. It stands as its own aggregate root because once
 * created, test cases have a lifecycle independent of the conversation (e.g.
 * exported, updated manually, run, or imported back into external systems).
 */
export interface TestCase {
  readonly id: string;
  readonly requirementId: string;
  readonly conversationId: string;
  title: string;
  description: string;
  preconditions: string[];
  steps: TestStep[];
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  tags: string[];

  /**
   * The validation review associated with this TestCase.
   */
  review?: ReviewResult;

  createdAt: Date;
  updatedAt: Date;
}

/**
 * TestStep (Value Object)
 * Part of the TestCase aggregate, capturing the discrete instructions.
 */
export interface TestStep {
  readonly stepNumber: number;
  readonly action: string;
  readonly expectedResult: string;
}

/**
 * ----------------------------------------------------------------------------
 * 8. ReviewResult (Value Object)
 * ----------------------------------------------------------------------------
 * Rationale:
 * Represents the AI-powered validation checks run against a generated Test Case.
 * It verifies compliance against the Project's standards and checks for duplicates.
 * It is immutable; if a TestCase changes, a new ReviewResult is generated.
 */
export interface ReviewResult {
  readonly checkedAt: Date;
  readonly status: 'approved' | 'flagged' | 'rejected';
  readonly complianceIssues: string[]; // List of styling or standard violations
  readonly coverageScore: number; // Percent estimation of requirement coverage (0.0 to 1.0)
  readonly suggestions: string[]; // Quality enhancement recommendations
}

export type BusinessImpact = 'low' | 'medium' | 'high' | 'critical';
export type RiskLevel = 'low' | 'medium' | 'high';

export interface SuiteRecommendation {
  readonly suite: string;
  readonly priority: number;
  readonly reason: string;
}

export interface SuiteExclusion {
  readonly suite: string;
  readonly reason: string;
}

export interface OutOfScopeItem {
  readonly area: string;
  readonly reason: string;
}

export interface AutomationCandidate {
  readonly scenario: string;
  readonly reason: string;
}

export interface ManualExploratoryFocus {
  readonly area: string;
  readonly instructions: string;
}

export interface ExecutionStep {
  readonly order: number;
  readonly suite: string;
  readonly focus: string;
}

export interface EffortEstimation {
  readonly suite: string;
  readonly durationMinutes: number;
}

/**
 * ----------------------------------------------------------------------------
 * 9. TestStrategy Aggregate (Aggregate Root)
 * ----------------------------------------------------------------------------
 * Rationale:
 * An executable QA strategy mapped by evaluating the GeneratorContext.
 * It contains risk analysis, objective traceability matrices, suite priorities,
 * exclusions, test data, effort metrics, and a reasoning audit trail.
 */
export interface TestStrategy {
  readonly id: string;
  readonly schemaVersion: number;
  readonly revision: number;
  readonly lastUpdated: Date;
  readonly requirementId: string;
  readonly businessImpact: BusinessImpact;
  readonly riskLevel: RiskLevel;
  readonly objectives: string[];
  readonly scope: string[];
  readonly primaryFocus: string[];
  readonly risks: string[];
  readonly approach: string;
  readonly recommendedSuites: SuiteRecommendation[];
  readonly excludedSuites: SuiteExclusion[];
  readonly outOfScope: OutOfScopeItem[];
  readonly coverage: string[];
  readonly deliverables: string[];
  readonly decisions: DecisionRecord[];
  readonly automationCandidates: AutomationCandidate[];
  readonly manualExploratoryScenarios: ManualExploratoryFocus[];
  readonly suggestedTestData: string[];
  readonly suggestedPreconditions: string[];
  readonly suggestedEnvironments: string[];
  readonly executionOrder: ExecutionStep[];
  readonly estimatedEffort: EffortEstimation[];
  readonly confidenceScore: number;
  readonly reasoningTrace: string[];
  readonly createdAt: Date;
}

export type UserPersona =
  | 'manual-qa'
  | 'automation-qa'
  | 'backend-developer'
  | 'frontend-developer'
  | 'tech-lead'
  | 'security-tester'
  | 'performance-tester';

export interface ProjectProfile {
  readonly language: string;
  readonly framework: string;
  readonly database?: string;
  readonly cloud?: string;
  readonly testingStyle: string;
}

/**
 * ----------------------------------------------------------------------------
 * 10. ArtifactPlan Aggregate (Aggregate Root)
 * ----------------------------------------------------------------------------
 * Rationale:
 * Maps target artifacts and specific prompt hints based on UserPersona
 * and the repository's technology stack Profile. It allows the generation
 * engine to format outputs specifically for developers, QAs, or leads.
 */
export interface ArtifactPlan {
  readonly id: string;
  readonly strategyId: string;
  readonly persona: UserPersona;
  readonly profile: ProjectProfile;
  readonly selectedArtifacts: string[];
  readonly generationInstructions: string[];
  readonly reasoning: string[];
  readonly createdAt: Date;
}

/**
 * ----------------------------------------------------------------------------
 * 11. QAArtifact Aggregate (Aggregate Root)
 * ----------------------------------------------------------------------------
 * Rationale:
 * Represents the generated engineering verification files (manual tests,
 * unit code skeletons, API requests) parsed from the LLM provider execution.
 */
export interface QAArtifact {
  readonly id: string;
  readonly planId: string;
  readonly type: string;
  readonly content: string;
  readonly createdAt: Date;
}

export interface ReviewIssue {
  readonly id: string;
  readonly category: string;
  readonly description: string;
  readonly severity: 'low' | 'medium' | 'high';
  readonly fileArtifactId?: string;
}

export interface QualityScores {
  readonly deduplicationScore: number;
  readonly businessValueScore: number;
  readonly codeQualityScore: number;
  readonly overallScore: number;
}

/**
 * ----------------------------------------------------------------------------
 * 12. ReviewReport Aggregate (Aggregate Root)
 * ----------------------------------------------------------------------------
 * Rationale:
 * A comprehensive gate checking generated artifacts against tech standards,
 * missing requirements coverage, duplicate checks, and low-value scripts.
 */
export interface ReviewReport {
  readonly id: string;
  readonly strategyId: string;
  readonly checkedAt: Date;
  readonly status: 'approved' | 'flagged' | 'rejected';
  readonly issues: ReviewIssue[];
  readonly scores: QualityScores;
  readonly suggestions: string[];
  readonly traceLogs: string[];
}

/**
 * ----------------------------------------------------------------------------
 * 13. KnowledgeEntry (Entity)
 * ----------------------------------------------------------------------------
 * Rationale:
 * A single unit of QA memory — a bug pattern, a reusable test template,
 * or a lesson learned from a previous analysis run. Entries accumulate
 * over time, making QAMate progressively smarter.
 */
export type KnowledgeCategory =
  | 'bug-pattern'
  | 'test-template'
  | 'lesson-learned'
  | 'common-defect'
  | 'reusable-assertion'
  | 'user-correction';

export interface KnowledgeEntry {
  readonly id: string;
  readonly schemaVersion?: number;
  readonly category: KnowledgeCategory;
  readonly title: string;
  readonly description: string;
  readonly keywords: string[];
  readonly sourceRequirementId?: string;
  readonly sourceArtifactId?: string;
  readonly confidence: number;
  readonly createdAt: Date;
}

/**
 * ----------------------------------------------------------------------------
 * 14. KnowledgeQuery (Value Object)
 * ----------------------------------------------------------------------------
 * Rationale:
 * Represents a lookup request against the knowledge store — used to find
 * similar past requirements, reusable templates, or known bug patterns.
 */
export interface KnowledgeQuery {
  readonly keywords: string[];
  readonly category?: KnowledgeCategory;
  readonly minConfidence?: number;
  readonly maxResults?: number;
}

/**
 * ----------------------------------------------------------------------------
 * 15. KnowledgeResult (Value Object)
 * ----------------------------------------------------------------------------
 * Rationale:
 * The response from a knowledge query, containing matched entries
 * ranked by relevance score.
 */
export interface KnowledgeResult {
  readonly query: KnowledgeQuery;
  readonly matches: Array<{
    entry: KnowledgeEntry;
    relevanceScore: number;
  }>;
  readonly searchedAt: Date;
}

export type CoverageStatus = 'full' | 'partial' | 'uncovered';

export interface CoverageItem {
  readonly id: string;
  readonly targetId: string;
  readonly targetType: 'business-rule' | 'risk-area' | 'actor';
  readonly description: string;
  readonly status: CoverageStatus;
  readonly matchedScenarios: string[];
  readonly gapExplanation?: string;
}

/**
 * ----------------------------------------------------------------------------
 * 16. CoverageReport Aggregate (Aggregate Root)
 * ----------------------------------------------------------------------------
 * Rationale:
 * A compiled traceability summary detailing rules coverage and gap diagnostics.
 */
export interface CoverageReport {
  readonly id: string;
  readonly strategyId: string;
  readonly checkedAt: Date;
  readonly overallCoveragePercent: number;
  readonly items: CoverageItem[];
  readonly traceLogs: string[];
}

/**
 * ----------------------------------------------------------------------------
 * 17. ProviderConfig (Value Object)
 * ----------------------------------------------------------------------------
 * Rationale:
 * Configuration parameters for AI completions engines, allowing dynamic
 * targeting of Google, OpenAI, Anthropic, or local Ollama servers.
 */
export interface ProviderConfig {
  readonly providerId: 'openai' | 'gemini' | 'claude' | 'ollama' | 'mock';
  readonly apiKey?: string;
  readonly apiEndpoint?: string;
  readonly modelName: string;
  readonly temperature?: number;
}

/**
 * ----------------------------------------------------------------------------
 * 18. Workspace Intelligence & Project DNA Interfaces (Phase 0)
 * ----------------------------------------------------------------------------
 */

export interface WorkspaceWarning {
  readonly category: string;
  readonly message: string;
}

export interface WorkspaceProfile {
  readonly projectId: string;
  readonly repo: RepositoryProfile;
  readonly tech: TechnologyProfile;
  readonly testing: TestingProfile;
  readonly api: APIProfile;
  readonly docs: DocumentationProfile;
  readonly warnings: WorkspaceWarning[];
  readonly summary: string;
  readonly analyzedAt: Date;
}

export interface RepositoryProfile {
  readonly isGitRepo: boolean;
  readonly branchName?: string;
  readonly remoteUrl?: string;
}

export interface TechnologyProfile {
  readonly primaryLanguage?: string;
  readonly runtimeEnvironment?: string;
  readonly isContainerized: boolean;
  readonly dependencies: string[];
}

export interface TestingProfile {
  readonly framework?: string;
  readonly testFilesCount: number;
  readonly testFiles: string[];
  readonly testDirectories: string[];
}

export interface APIProfile {
  readonly hasContracts: boolean;
  readonly apiFiles: string[];
  readonly parsedEndpoints: Array<{
    readonly method: string;
    readonly path: string;
    readonly description?: string;
  }>;
}

export interface DocumentationProfile {
  readonly hasReadme: boolean;
  readonly readmePath?: string;
  readonly hasADR: boolean;
  readonly adrFiles: string[];
}

export interface ProjectDNA {
  readonly schemaVersion?: number;
  techStack: string;
  codingStandards: string[];
  businessVocabulary: string[];
  domainGlossary: string[];
  systemArchitecture: string;
  testingStandards: string[];
  teamPreferences: string[];
  knownLimitations: string[];
  existingSuites: string[];
  integrationLandscape: string[];
  reusableComponents: string[];
}

export interface ValidationResult<T> {
  readonly isValid: boolean;
  readonly errors: string[];
  readonly warnings: string[];
  readonly data?: T;
}

export interface ProviderResponse<T> {
  readonly providerId: string;
  readonly modelName: string;
  readonly latencyMS: number;
  readonly tokensUsed: number;
  readonly content: T;
  readonly confidence?: number;
  readonly warnings?: string[];
}

export interface SystemModelDTO {
  readonly schemaVersion: number;
  readonly name?: string;
  readonly components?: Array<{ name?: string; type?: string; description?: string }>;
  readonly flows?: Array<{ from?: string; to?: string; description?: string; trigger?: string }>;
  readonly users?: string[];
  readonly qualityAttributes?: string[];
  readonly risks?: string[];
  readonly unknowns?: string[];
}

export interface TestStrategyDTO {
  readonly schemaVersion: number;
  readonly id?: string;
  readonly requirementId?: string;
  readonly businessImpact?: string;
  readonly riskLevel?: string;
  readonly objectives?: string[];
  readonly primaryFocus?: string[];
  readonly recommendedSuites?: Array<{ suite?: string; reason?: string }>;
  readonly excludedSuites?: Array<{ suite?: string; reason?: string }>;
  readonly outOfScope?: Array<{ area?: string; reason?: string }>;
  readonly confidenceScore?: number;
  readonly reasoningTrace?: string[];
}

export interface AIObservation {
  readonly id: string;
  readonly type: 'Component' | 'Actor' | 'Flow' | 'Risk' | 'Unknown';
  readonly value: string;
  readonly confidence: number;
  readonly evidence: string[];
  readonly reason: string;
}

export interface ProviderCapabilities {
  readonly supportsJson: boolean;
  readonly supportsVision: boolean;
  readonly supportsStreaming: boolean;
  readonly supportsToolCalling: boolean;
  readonly supportsReasoning: boolean;
  readonly supportsThinkingBudget: boolean;
  readonly maxTokens: number;
  readonly maxContext: number;
  readonly preferredFormat: 'json' | 'xml' | 'text';
}

export interface AssumptionDecision {
  readonly decision: 'confirm' | 'reject' | 'edit';
  readonly timestamp: Date;
  readonly user: string;
  readonly comment?: string;
}

export interface Assumption {
  readonly id: string;
  readonly statement: string;
  readonly source: 'ai' | 'user' | 'rule';
  readonly confidence: number;
  readonly reason: string;
  readonly evidence: string[];
  status: 'pending' | 'confirmed' | 'rejected';
  userComment?: string;
  readonly decisions: AssumptionDecision[];
}

export interface HumanFeedback {
  readonly id: string;
  readonly targetId: string;
  readonly targetType: 'assumption' | 'observation';
  readonly action: 'confirm' | 'reject' | 'edit';
  readonly comment?: string;
  readonly timestamp: Date;
}

export interface CommunicationConfidence {
  readonly score: number;
  readonly level: 'VeryHigh' | 'High' | 'Medium' | 'Low';
}

export interface ReasoningSession {
  readonly id: string;
  readonly systemModel: any;
  readonly rulesEvidence: string[];
  readonly knowledgeEvidence: string[];
  readonly aiObservations: AIObservation[];
  readonly history: string[];
}

export interface OperationContract {
  readonly purpose: string;
  readonly allowedChanges: string[];
  readonly forbiddenChanges: string[];
  readonly guarantees: string[];
}

export const OperationContracts: Record<string, OperationContract> = {
  rephrase: {
    purpose: 'Clarify requirement specifications without modifying meaning.',
    allowedChanges: ['grammar corrections', 'ordering of points', 'formatting'],
    forbiddenChanges: ['adding new scope', 'removing features', 'changing metrics'],
    guarantees: ['semantic integrity preserves original intent', 'no details lost']
  },
  understand: {
    purpose: 'Analyze system boundaries and observations.',
    allowedChanges: ['finding actors', 'mapping component types'],
    forbiddenChanges: ['modifying existing DNA files', 'silent saving without checks'],
    guarantees: ['sorted alphabetical consistent model output']
  }
};

export interface DecisionRecord {
  readonly id: string;
  readonly type: 'assumption' | 'recommendation' | 'strategy';
  readonly action: 'accepted' | 'rejected' | 'modified';
  readonly reason?: string;
  readonly source: string;
  readonly timestamp: Date;
}

export interface QARecommendation {
  readonly id: string;
  readonly recommendation: string;
  readonly reason: string;
  readonly industryPractice: string;
  readonly priority: 'High' | 'Medium' | 'Low';
  readonly impact: 'High' | 'Medium' | 'Low';
  status: 'Pending' | 'Accepted' | 'Ignored' | 'Modified';
  readonly trigger: string;
  readonly source: 'Project DNA' | 'AI Observation' | 'Knowledge' | 'Playbook' | 'Rule' | 'User';
  readonly canAutoApply: boolean;
  userComment?: string;
}

export interface ComplianceIssue {
  readonly rule: string;
  readonly severity: 'High' | 'Medium' | 'Low';
  readonly location: string;
  readonly reason: string;
  readonly recommendation: string;
  readonly autoFix: boolean;
}

export interface ChangeImpactReport {
  readonly affectedObjectives: string[];
  readonly affectedSuites: string[];
  readonly affectedRecommendations: string[];
  readonly affectedRisks: string[];
  readonly affectedAssumptions: string[];
  readonly breakingChange: boolean;
  readonly strategyDiff: string;
}

export interface QAValueReport {
  readonly originalCount: number;
  readonly optimizedCount: number;
  readonly duplicatesRemoved: number;
  readonly casesMerged: number;
  readonly casesSplit: number;
  readonly casesParameterized: number;
  readonly coveragePercentBefore: number;
  readonly coveragePercentAfter: number;
}

export interface TraceLink {
  readonly requirementId: string;
  readonly componentNames: string[];
  readonly objectives: string[];
  readonly recommendations: string[];
  readonly testCases: string[];
}

export interface ExportReadiness {
  readonly ready: boolean;
  readonly blockingIssues: string[];
  readonly warnings: string[];
}

export interface WorkspaceHealthMetrics {
  readonly requirementQualityScore: number;
  readonly requirementQualityGrade: string;
  readonly rulesCoveragePercent: number;
  readonly confidenceScore: number;
  readonly confidenceLevel: string;
  readonly risksMappedCount: number;
  readonly questionsAskedCount: number;
  readonly questionsAvoidedCount: number;
  readonly promptCount: number;
  readonly tokenUsage: number;
  readonly providerUsed: string;
  readonly cacheHitPercent: number;
  readonly manualOverridesCount: number;
  readonly readiness: ExportReadiness;
}

export interface DeliverableBundle {
  readonly summary: string;
  readonly strategy: TestStrategy;
  readonly testCases: TestCase[];
  readonly risks: any[];
  readonly traceability: TraceLink;
  readonly metrics: WorkspaceHealthMetrics;
  readonly metadata: Record<string, any>;
}

export interface DeliverableManifest {
  readonly id: string;
  readonly version: string;
  readonly generatedBy: string;
  readonly generatedAt: Date;
  readonly provider: string;
  readonly strategyRevision: number;
  readonly mentalModelRevision: number;
  readonly artifacts: string[];
}

export type ExportProfileType = 'manual-qa' | 'developer' | 'manager' | 'auditor';


