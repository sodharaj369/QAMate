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
