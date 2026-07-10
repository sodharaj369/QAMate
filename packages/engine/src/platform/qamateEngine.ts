import {
  Requirement,
  Conversation,
  Answer,
  TestStrategy,
  QAArtifact,
  UserPersona,
  QuestionCandidate,
  Question,
  WorkspaceProfile,
  ProjectDNA,
} from '../domain.js';
import { TestCaseParser } from '../artifacts/testCaseParser.js';
import { IConversationStorage, ILLMProvider } from '../interfaces/index.js';
import {
  DefaultRequirementValidator,
  DefaultConfidenceScorer,
  RuleBasedAnalysisStrategy,
  DefaultRequirementAnalyzer,
  RuleBasedDomainDetector,
} from '../analyzer/index.js';
import {
  DefaultQuestionCandidateGenerator,
  DefaultQuestionPrioritizer,
  DefaultQuestionDeduplicator,
  DefaultQuestionPlanner,
  DefaultClarificationEngine,
  PlaybookDecisionEngine,
} from '../clarification/index.js';
import { DefaultContextCompiler } from '../context/index.js';
import { DefaultTestStrategyEngine } from '../strategy/index.js';
import {
  DefaultArtifactPlanner,
  DefaultArtifactGenerator,
  MockLLMProvider,
} from '../artifacts/index.js';
import { DefaultReviewEngine } from '../review/index.js';
import { DefaultCoverageEngine } from '../coverage-engine/index.js';
import { DefaultKnowledgeEngine } from '../knowledge/knowledgeEngine.js';
import { SystemUnderstandingEngine } from './systemEngine.js';
import { QAReasoningEngine } from './reasoningEngine.js';
import { ConfigurationManager } from './config.js';
import { EvidenceGraph } from './reasoningModel.js';
import { WorkspaceIntelligenceEngine } from '../workspace/WorkspaceIntelligenceEngine.js';
import { ProjectDNAStore } from '../workspace/DNA/ProjectDNAStore.js';
import { AIOrchestrator } from '../provider-hub/orchestrator.js';
import { TokenAnalytics } from '../analytics/tokenAnalytics.js';
import { EfficiencyEngine } from './efficiency.js';
import { TrustFramework } from './trust.js';

export class QAMateEngine {
  public readonly knowledgeEngine = new DefaultKnowledgeEngine();
  public readonly configManager = new ConfigurationManager();
  public readonly orchestrator: AIOrchestrator;

  constructor(private readonly storage: IConversationStorage) {
    const efficiency = new EfficiencyEngine();
    const telemetry = new TokenAnalytics();
    const trust = new TrustFramework();
    this.orchestrator = new AIOrchestrator(efficiency, telemetry, trust, this.configManager);
  }

  public async getSession(sessionId: string): Promise<Conversation | undefined> {
    return this.storage.loadConversation(sessionId);
  }

  public async listSessions(): Promise<string[]> {
    return this.storage.listConversations();
  }

  public async createSession(requirement: Requirement, provider?: ILLMProvider): Promise<Conversation> {
    if (provider) {
      this.orchestrator.registerCustomProvider(provider);
    }
    const hasAI = provider && provider.id !== 'mock' && provider.id !== 'mock-llm-provider';
    const activeProvider = hasAI ? this.orchestrator : undefined;

    // 1. Validate
    const validator = new DefaultRequirementValidator();
    const validation = await validator.validate(requirement);
    if (!validation.isValid) {
      throw new Error(`Validation Error: ${validation.issues[0]?.message}`);
    }

    // 2. Run System Understanding Engine
    const systemEngine = new SystemUnderstandingEngine();
    const systemModel = await systemEngine.understand(requirement, activeProvider);

    // 3. Formulate Evidence Graph & Retrieve relevant knowledge
    const knowledgeEntries = this.knowledgeEngine.getStore();
    const matchingKnowledge = knowledgeEntries
      .filter((k) => k.keywords.some((word) => requirement.content.toLowerCase().includes(word.toLowerCase())))
      .map((k) => `${k.title}: ${k.description}`);

    const evidenceGraph: EvidenceGraph = {
      system: systemModel,
      rulesEvidence: [],
      knowledgeEvidence: matchingKnowledge,
      aiObservations: [
        {
          id: 'initial-obs-1',
          type: 'Component',
          value: systemModel.name,
          confidence: 0.95,
          evidence: ['AI Architecture scan completed'],
          reason: 'Initial system model mapped by QAMate scan.'
        }
      ]
    };

    // 4. Run QA Reasoning Engine to build initial QA Mental Model
    const reasoningEngine = new QAReasoningEngine();
    const mentalModel = await reasoningEngine.reason(evidenceGraph);

    // 5. Analyze static aspects (keeps backward compatibility for analysisResult validation reports)
    const scorer = new DefaultConfidenceScorer();
    const strategy = new RuleBasedAnalysisStrategy();
    const analyzer = new DefaultRequirementAnalyzer(validator, scorer, [strategy]);
    const analysisResult = await analyzer.analyze(requirement);

    let candidates: QuestionCandidate[] = [];
    let activeQuestions: Question[] = [];
    let telemetryLog: any = null;

    if (activeProvider && analysisResult.confidence.recommendation !== 'generate-direct') {
      const prompt = `You are a Senior Principal QA Engineer. Review the structural System Model and QA Mental Model derived for the requirement:

System Model Name: ${systemModel.name}
Components: ${JSON.stringify(systemModel.components)}
Flows: ${JSON.stringify(systemModel.flows)}
Quality Attributes: ${systemModel.qualityAttributes.join(', ')}
Risks: ${systemModel.risks.join(', ')}
Gaps/Unknowns: ${systemModel.unknowns.join(', ')}

QA Mental Model Exclusions: ${mentalModel.excludedTesting.join(', ')}

Review this and suggest blocking clarification questions (maximum 2) to resolve the unknowns or gaps in the system model.
Only ask questions if the answer materially changes the testing strategy or output. Do NOT ask boilerplate questions. If the system has exclusions, do not ask questions about those excluded areas.

You must respond with a raw JSON object matching this TypeScript interface (do not return any markdown format, code ticks, or extra text):
{
  "ready": boolean,
  "blockingQuestions": {
    "topic": string;
    "question": string;
    "whyAsking": string;
    "options"?: string[];
  }[]
}
`;

      const responseText = await activeProvider.generate(prompt);
      let parsed: any;
      try {
        const cleanedText = responseText.replace(/```json|```/gi, '').trim();
        parsed = JSON.parse(cleanedText);
      } catch (err) {
        console.error('Failed to parse AI readiness response:', responseText, err);
        throw new Error('AI returned an invalid JSON response.');
      }

      if (parsed && parsed.blockingQuestions && Array.isArray(parsed.blockingQuestions)) {
        const conversationId = `conv-${requirement.id}`;
        let idCounter = 1;

        const rawCandidates: QuestionCandidate[] = [];
        for (const q of parsed.blockingQuestions) {
          const cand: QuestionCandidate = {
            id: `CAND-${String(idCounter++).padStart(3, '0')}`,
            conversationId,
            text: q.question,
            type: q.options && Array.isArray(q.options) && q.options.length > 0 ? 'single-choice' : 'open-text',
            options: q.options,
            category: q.topic || 'General Clarification',
            impact: 'blocking-understanding',
            rationale: q.whyAsking || 'Material decision affecting test cases.',
            skipRisk: 'Incomplete scenario coverage.',
            priority: 'high',
          };
          rawCandidates.push(cand);
        }

        const decisionEngine = new PlaybookDecisionEngine();
        const { activeQuestions: filteredQ, telemetry } = await decisionEngine.evaluateQuestions(
          mentalModel,
          rawCandidates,
          activeProvider
        );

        candidates = rawCandidates;
        activeQuestions = filteredQ;
        telemetryLog = telemetry;
      }
    } else {
      const generator = new DefaultQuestionCandidateGenerator();
      const prioritizer = new DefaultQuestionPrioritizer();
      const deduplicator = new DefaultQuestionDeduplicator();
      const planner = new DefaultQuestionPlanner();
      const clarifier = new DefaultClarificationEngine(generator, prioritizer, deduplicator, planner);
      const clarifResult = await clarifier.planClarifications(
        requirement,
        analysisResult.intelligence,
        { provider: activeProvider, mentalModel }
      );
      candidates = clarifResult.candidates;
      activeQuestions = clarifResult.activeQuestions;
      telemetryLog = clarifResult.telemetry;
    }

    // 6. Construct Conversation
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
      
      systemModel,
      evidenceGraph,
      mentalModel
    };

    (conversation as any).requirementTitle = requirement.title;
    (conversation as any).requirementContent = requirement.content;
    (conversation as any).validationReport = analysisResult.validation;

    // Deterministic Domain Detection (Backward compatibility helper)
    const domainDetector = new RuleBasedDomainDetector();
    const { domains, confidencePercent } = domainDetector.detect(requirement.content);

    (conversation as any).detectedDomains = domains;
    (conversation as any).confidencePercent = confidencePercent;
    (conversation as any).telemetry = telemetryLog;
    (conversation as any).analytics = {
      activeProvider: this.orchestrator.lastSelectedProviderName,
      providerId: this.orchestrator.lastSelectedProviderId,
      selectionReason: this.orchestrator.lastSelectedReason,
    };

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
      for (const ans of answers) {
        const question = conv.questions.find((q) => q.id === ans.questionId);
        if (question) {
          const ansText =
            ans.textValue || (ans.selectedOptions ? ans.selectedOptions.join(', ') : '');
          await this.knowledgeEngine.learnFromCorrection(conv.requirementId, question.text, ansText);
        }
      }

      const entries = this.knowledgeEngine.getStore();
      const storageAsKnowledge = this.storage as any;
      if (typeof storageAsKnowledge.saveKnowledge === 'function' && entries.length > 0) {
        await storageAsKnowledge.saveKnowledge(entries);
      }
    } catch {
      // Safe fallback
    }

    // Dynamic Iterative Refinement of System and QA Mental Models based on user answers
    try {
      const answersText = conv.questions
        .map((q) => `Q: ${q.text} -> A: ${q.answer?.textValue || q.answer?.selectedOptions?.join(', ') || 'N/A'}`)
        .join('\n');
      
      const refinedRequirement: Requirement = {
        id: conv.requirementId,
        projectId: conv.projectId,
        title: (conv as any).requirementTitle || '',
        content: `${(conv as any).requirementContent || ''}\n\n### Clarifications Answers\n${answersText}`,
        contentType: 'markdown',
        version: 1,
        status: 'draft',
        metadata: {},
      };

      const systemEngine = new SystemUnderstandingEngine();
      const updatedSystemModel = await systemEngine.understand(refinedRequirement, this.orchestrator);

      const reasoningEngine = new QAReasoningEngine();
      const updatedEvidenceGraph: EvidenceGraph = {
        system: updatedSystemModel,
        rulesEvidence: [],
        knowledgeEvidence: conv.evidenceGraph?.knowledgeEvidence || [],
        aiObservations: [
          {
            id: 'refinement-obs-1',
            type: 'Component',
            value: updatedSystemModel.name,
            confidence: 0.99,
            evidence: ['Human Clarification Answers'],
            reason: 'Refined System Model after user clarification answers.'
          }
        ]
      };
      
      const updatedMentalModel = await reasoningEngine.reason(updatedEvidenceGraph);

      conv.systemModel = updatedSystemModel;
      conv.evidenceGraph = updatedEvidenceGraph;
      conv.mentalModel = updatedMentalModel;
      
      (conv as any).analytics = {
        activeProvider: this.orchestrator.lastSelectedProviderName,
        providerId: this.orchestrator.lastSelectedProviderId,
        selectionReason: this.orchestrator.lastSelectedReason
      };
    } catch (err) {
      console.error('Failed iterative model refinement:', err);
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
      },
    );

    // Attach canonical mental model to context
    (context as any).mentalModel = conv.mentalModel;

    const strategyEngine = new DefaultTestStrategyEngine();
    const strategy = await strategyEngine.developStrategy(context);

    (conv as any).generatedStrategy = strategy;
    conv.status = 'generating';
    conv.updatedAt = new Date();

    await this.storage.saveConversation(conv);
    return strategy;
  }

  public async generateArtifacts(
    sessionId: string,
    customProvider?: ILLMProvider,
  ): Promise<QAArtifact[]> {
    if (customProvider) {
      this.orchestrator.registerCustomProvider(customProvider);
    }
    const hasAI = customProvider && customProvider.id !== 'mock' && customProvider.id !== 'mock-llm-provider';
    const activeProvider = hasAI ? this.orchestrator : (customProvider || new MockLLMProvider());

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
      },
    );

    // Attach canonical mental model to context
    (context as any).mentalModel = conv.mentalModel;


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
    const plan = await planner.planArtifacts(strategy, persona, {
      language: 'typescript',
      framework: 'playwright',
      testingStyle: 'AAA',
    });

    const generator = new DefaultArtifactGenerator();
    const artifacts = await generator.generateArtifacts(context, plan, activeProvider);

     (conv as any).generatedArtifacts = artifacts;

    // Parse structured test cases from artifacts
    const testCases: any[] = [];
    for (const art of artifacts) {
      if (art.type.includes('Test Cases') || art.type.includes('Test Skeletons')) {
        const parsed = TestCaseParser.parseMarkdown(art.content, conv.requirementId, conv.id);
        testCases.push(...parsed);
      }
    }
    conv.testCases = testCases;

    const report = DefaultArtifactGenerator.getOptimizer().getCumulativeReport();
    (conv as any).analytics = {
      originalLength: report.originalLength,
      optimizedLength: report.optimizedLength,
      savedTokens: report.savedTokens,
      savedPercent: report.savedPercent,
      cacheHits: report.cacheHits,
      estimatedSavingsUSD: report.estimatedSavingsUSD,
      activeProvider: this.orchestrator.lastSelectedProviderName,
      providerId: this.orchestrator.lastSelectedProviderId,
      selectionReason: this.orchestrator.lastSelectedReason,
    };

    conv.status = 'reviewing';
    conv.updatedAt = new Date();

    await this.storage.saveConversation(conv);
    return artifacts;
  }

  public async runReview(
    sessionId: string,
  ): Promise<{ status: string; score: number; suggestions: string[] }> {
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
      },
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
    const coverageResult = await coverageEngine.calculateCoverage(
      strategy,
      artifacts,
      conv.currentIntelligence!,
    );

    return {
      ratio: coverageResult.overallCoveragePercent,
      trace: coverageResult.traceLogs.join('\n'),
    };
  }

  public async bootstrapWorkspace(projectRoot: string): Promise<{ profile: WorkspaceProfile; pendingDNA: ProjectDNA }> {
    const workspaceEngine = new WorkspaceIntelligenceEngine();
    const profile = await workspaceEngine.analyze(projectRoot);

    const dnaStore = new ProjectDNAStore();
    const pendingDNA = dnaStore.generateDefaultDNA(profile);

    return {
      profile,
      pendingDNA
    };
  }
}

