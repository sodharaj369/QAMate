import { Requirement, Conversation, Answer, TestStrategy, QAArtifact, UserPersona } from '../domain.js';
import { IConversationStorage, ILLMProvider } from '../interfaces/index.js';
import { DefaultRequirementValidator, DefaultConfidenceScorer, RuleBasedAnalysisStrategy, DefaultRequirementAnalyzer, RuleBasedDomainDetector } from '../analyzer/index.js';
import { DefaultQuestionCandidateGenerator, DefaultQuestionPrioritizer, DefaultQuestionDeduplicator, DefaultQuestionPlanner, DefaultClarificationEngine } from '../clarification/index.js';
import { DefaultContextCompiler } from '../context/index.js';
import { DefaultTestStrategyEngine } from '../strategy/index.js';
import { DefaultArtifactPlanner, DefaultArtifactGenerator, MockLLMProvider } from '../artifacts/index.js';
import { DefaultReviewEngine } from '../review/index.js';
import { DefaultCoverageEngine } from '../coverage/index.js';

export class QAMateEngine {
  constructor(private readonly storage: IConversationStorage) {}

  public async getSession(sessionId: string): Promise<Conversation | undefined> {
    return this.storage.loadConversation(sessionId);
  }

  public async listSessions(): Promise<string[]> {
    return this.storage.listConversations();
  }

  public async createSession(requirement: Requirement): Promise<Conversation> {
    // 1. Validate
    const validator = new DefaultRequirementValidator();
    const validation = await validator.validate(requirement);
    if (!validation.isValid) {
      throw new Error(`Validation Error: ${validation.issues[0]?.message}`);
    }

    // 2. Analyze
    const scorer = new DefaultConfidenceScorer();
    const strategy = new RuleBasedAnalysisStrategy();
    const analyzer = new DefaultRequirementAnalyzer(validator, scorer, [strategy]);
    const analysisResult = await analyzer.analyze(requirement);

    // 3. Plan Clarifications
    const generator = new DefaultQuestionCandidateGenerator();
    const prioritizer = new DefaultQuestionPrioritizer();
    const deduplicator = new DefaultQuestionDeduplicator();
    const planner = new DefaultQuestionPlanner();
    const clarifier = new DefaultClarificationEngine(generator, prioritizer, deduplicator, planner);
    const { candidates, activeQuestions } = await clarifier.planClarifications(requirement, analysisResult.intelligence);

    // 4. Construct Conversation
    const conversation: Conversation = {
      id: `conv-${requirement.title}`,
      projectId: requirement.projectId,
      requirementId: requirement.id,
      status: activeQuestions.length > 0 ? 'planning-questions' : 'ready-for-generation',
      currentIntelligence: analysisResult.intelligence,
      candidates,
      questions: activeQuestions,
      answers: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    (conversation as any).requirementTitle = requirement.title;
    (conversation as any).requirementContent = requirement.content;
    (conversation as any).validationReport = analysisResult.validation;

    // Deterministic Domain Detection
    const domainDetector = new RuleBasedDomainDetector();
    const { domains, confidencePercent } = domainDetector.detect(requirement.content);

    (conversation as any).detectedDomains = domains;
    (conversation as any).confidencePercent = confidencePercent;

    await this.storage.saveConversation(conversation);
    return conversation;
  }

  public async submitAnswers(sessionId: string, answers: Answer[]): Promise<Conversation> {
    const conv = await this.storage.loadConversation(sessionId);
    if (!conv) {
      throw new Error(`Session ${sessionId} not found.`);
    }

    conv.answers = answers;
    conv.questions.forEach((q) => {
      const matching = answers.find((a) => a.questionId === q.id);
      if (matching) {
        q.answer = matching;
      }
    });

    // Pattern Memory Learning: Storing manual corrections
    try {
      const { DefaultKnowledgeEngine } = await import('../knowledge/knowledgeEngine.js');
      const knowledgeEngine = new DefaultKnowledgeEngine();

      for (const ans of answers) {
        const question = conv.questions.find((q) => q.id === ans.questionId);
        if (question) {
          const ansText = ans.textValue || (ans.selectedOptions ? ans.selectedOptions.join(', ') : '');
          await knowledgeEngine.learnFromCorrection(
            conv.requirementId,
            question.text,
            ansText,
          );
        }
      }

      const entries = knowledgeEngine.getStore();
      const storageAsKnowledge = this.storage as any;
      if (typeof storageAsKnowledge.saveKnowledge === 'function' && entries.length > 0) {
        await storageAsKnowledge.saveKnowledge(entries);
      }
    } catch {
      // Safe fallback
    }

    conv.status = 'ready-for-generation';
    conv.updatedAt = new Date();

    await this.storage.saveConversation(conv);
    return conv;
  }

  public async generateStrategy(sessionId: string): Promise<TestStrategy> {
    const conv = await this.storage.loadConversation(sessionId);
    if (!conv) {
      throw new Error(`Session ${sessionId} not found.`);
    }

    const requirement: Requirement = {
      id: conv.requirementId,
      projectId: conv.projectId,
      title: (conv as any).requirementTitle || conv.id.replace('conv-', ''),
      content: (conv as any).requirementContent || 'Requirement specification content.',
      contentType: 'markdown',
      version: 1,
      status: 'draft',
      metadata: {},
    };

    const compiler = new DefaultContextCompiler();
    const context = await compiler.compile(
      requirement,
      conv.currentIntelligence!,
      conv.answers,
      {
        targetLanguage: 'typescript',
        targetFramework: 'playwright',
        namingConvention: 'Given/When/Then',
        companyRules: [],
        qaGuidelines: [],
      },
      {
        maxCases: 5,
        focusAreas: ['security', 'boundaries', 'regression'],
        includeAutomationCandidate: true,
      }
    );

    const strategyEngine = new DefaultTestStrategyEngine();
    const strategy = await strategyEngine.developStrategy(context);

    (conv as any).generatedStrategy = strategy;
    conv.status = 'generating';
    conv.updatedAt = new Date();

    await this.storage.saveConversation(conv);
    return strategy;
  }

  public async generateArtifacts(sessionId: string, customProvider?: ILLMProvider): Promise<QAArtifact[]> {
    const conv = await this.storage.loadConversation(sessionId);
    if (!conv) {
      throw new Error(`Session ${sessionId} not found.`);
    }

    const requirement: Requirement = {
      id: conv.requirementId,
      projectId: conv.projectId,
      title: (conv as any).requirementTitle || conv.id.replace('conv-', ''),
      content: (conv as any).requirementContent || 'Requirement specification content.',
      contentType: 'markdown',
      version: 1,
      status: 'draft',
      metadata: {},
    };

    const compiler = new DefaultContextCompiler();
    const context = await compiler.compile(
      requirement,
      conv.currentIntelligence!,
      conv.answers,
      {
        targetLanguage: 'typescript',
        targetFramework: 'playwright',
        namingConvention: 'Given/When/Then',
        companyRules: [],
        qaGuidelines: [],
      },
      {
        maxCases: 5,
        focusAreas: ['security', 'boundaries', 'regression'],
        includeAutomationCandidate: true,
      }
    );

    const strategy: TestStrategy = (conv as any).generatedStrategy || {
      id: `strat-${conv.id}`,
      requirementId: conv.requirementId,
      businessImpact: 'medium',
      riskLevel: 'medium',
      objectives: [],
      primaryFocus: [],
      recommendedSuites: [],
      excludedSuites: [],
      outOfScope: [],
      automationCandidates: [],
      manualExploratoryScenarios: [],
      suggestedTestData: [],
      suggestedPreconditions: [],
      suggestedEnvironments: [],
      executionOrder: [],
      estimatedEffort: [],
      confidenceScore: 0.8,
      reasoningTrace: [],
      createdAt: new Date(),
    };

    const planner = new DefaultArtifactPlanner();
    const persona: UserPersona = (conv as any).persona || 'automation-qa';
    const plan = await planner.planArtifacts(
      strategy,
      persona,
      {
        language: 'typescript',
        framework: 'playwright',
        testingStyle: 'AAA',
      }
    );

    const generator = new DefaultArtifactGenerator();
    const provider = customProvider || new MockLLMProvider();
    const artifacts = await generator.generateArtifacts(context, plan, provider);

    (conv as any).generatedArtifacts = artifacts;
    conv.status = 'reviewing';
    conv.updatedAt = new Date();

    await this.storage.saveConversation(conv);
    return artifacts;
  }

  public async runReview(sessionId: string): Promise<{ status: string; score: number; suggestions: string[] }> {
    const conv = await this.storage.loadConversation(sessionId);
    if (!conv) {
      throw new Error(`Session ${sessionId} not found.`);
    }

    const requirement: Requirement = {
      id: conv.requirementId,
      projectId: conv.projectId,
      title: (conv as any).requirementTitle || conv.id.replace('conv-', ''),
      content: (conv as any).requirementContent || 'Requirement specification content.',
      contentType: 'markdown',
      version: 1,
      status: 'draft',
      metadata: {},
    };

    const compiler = new DefaultContextCompiler();
    const context = await compiler.compile(
      requirement,
      conv.currentIntelligence!,
      conv.answers,
      {
        targetLanguage: 'typescript',
        targetFramework: 'playwright',
        namingConvention: 'Given/When/Then',
        companyRules: [],
        qaGuidelines: [],
      },
      {
        maxCases: 5,
        focusAreas: ['security', 'boundaries', 'regression'],
        includeAutomationCandidate: true,
      }
    );

    const strategy: TestStrategy = (conv as any).generatedStrategy || {
      id: `strat-${conv.id}`,
      requirementId: conv.requirementId,
      businessImpact: 'medium',
      riskLevel: 'medium',
      objectives: [],
      primaryFocus: [],
      recommendedSuites: [],
      excludedSuites: [],
      outOfScope: [],
      automationCandidates: [],
      manualExploratoryScenarios: [],
      suggestedTestData: [],
      suggestedPreconditions: [],
      suggestedEnvironments: [],
      executionOrder: [],
      estimatedEffort: [],
      confidenceScore: 0.8,
      reasoningTrace: [],
      createdAt: new Date(),
    };

    const artifacts: QAArtifact[] = (conv as any).generatedArtifacts || [];

    const reviewEngine = new DefaultReviewEngine();
    const reviewResult = await reviewEngine.reviewArtifacts(artifacts, context, strategy);

    (conv as any).reviewResult = {
      status: reviewResult.status,
      score: reviewResult.scores.overallScore,
      suggestions: reviewResult.suggestions,
    };
    conv.status = 'reviewing';
    conv.updatedAt = new Date();

    await this.storage.saveConversation(conv);

    return {
      status: reviewResult.status.toUpperCase(),
      score: reviewResult.scores.overallScore,
      suggestions: reviewResult.suggestions,
    };
  }

  public async runCoverage(sessionId: string): Promise<{ ratio: number; trace: string }> {
    const conv = await this.storage.loadConversation(sessionId);
    if (!conv) {
      throw new Error(`Session ${sessionId} not found.`);
    }

    const strategy: TestStrategy = (conv as any).generatedStrategy || {
      id: `strat-${conv.id}`,
      requirementId: conv.requirementId,
      businessImpact: 'medium',
      riskLevel: 'medium',
      objectives: [],
      primaryFocus: [],
      recommendedSuites: [],
      excludedSuites: [],
      outOfScope: [],
      automationCandidates: [],
      manualExploratoryScenarios: [],
      suggestedTestData: [],
      suggestedPreconditions: [],
      suggestedEnvironments: [],
      executionOrder: [],
      estimatedEffort: [],
      confidenceScore: 0.8,
      reasoningTrace: [],
      createdAt: new Date(),
    };

    const artifacts: QAArtifact[] = (conv as any).generatedArtifacts || [];
    const coverageEngine = new DefaultCoverageEngine();
    const coverageResult = await coverageEngine.calculateCoverage(strategy, artifacts, conv.currentIntelligence!);

    return {
      ratio: coverageResult.overallCoveragePercent,
      trace: coverageResult.traceLogs.join('\n'),
    };
  }
}
