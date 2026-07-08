import {
  Requirement,
  Conversation,
  Answer,
  TestStrategy,
  QAArtifact,
  UserPersona,
  QuestionCandidate,
  Question,
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

export class QAMateEngine {
  constructor(private readonly storage: IConversationStorage) {}

  public async getSession(sessionId: string): Promise<Conversation | undefined> {
    return this.storage.loadConversation(sessionId);
  }

  public async listSessions(): Promise<string[]> {
    return this.storage.listConversations();
  }

  public async createSession(requirement: Requirement, provider?: ILLMProvider): Promise<Conversation> {
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

    let candidates: QuestionCandidate[] = [];
    let activeQuestions: Question[] = [];

    // Decision Ladder: skip AI clarification if static score recommendation is 'generate-direct'
    if (provider && analysisResult.confidence.recommendation !== 'generate-direct') {
      const prompt = `You are a Senior Principal QA Engineer. Review the following software requirement specification and the static rule-based analysis findings to assess QA readiness.

Requirement:
"""
${requirement.content}
"""

Static Findings:
- Business Rules:
${analysisResult.intelligence.businessRules.map((r: any) => `- [${r.id}] ${r.description} (Condition: ${r.condition}, Outcome: ${r.expectedOutcome})`).join('\n')}
- Actors: ${analysisResult.intelligence.actors.map((a: any) => a.name).join(', ')}

Review this requirement and decide if it is ready to write complete, high-quality test cases.
Only ask questions if the answer materially changes the test strategy, risks, generated test cases, or coverage. 
Do NOT ask boilerplate questions. Ask a maximum of 3 blocking questions. If no critical blocking decisions are needed, mark the requirement as ready with no questions.

You must respond with a raw JSON object matching this TypeScript interface (do not return any markdown format, code ticks, or extra text):
{
  "ready": boolean,
  "blockingQuestions": {
    "topic": string;
    "question": string;
    "whyAsking": string;
    "options"?: string[];
  }[],
  "additionalBusinessRules"?: {
    "description": string;
    "condition": string;
    "expectedOutcome": string;
  }[],
  "additionalActors"?: {
    "name": string;
    "description": string;
  }[]
}
`;

      const responseText = await provider.generate(prompt);
      let parsed: any;
      try {
        const cleanedText = responseText.replace(/```json|```/gi, '').trim();
        parsed = JSON.parse(cleanedText);
      } catch (err) {
        console.error('Failed to parse AI readiness response:', responseText, err);
        throw new Error('AI returned an invalid JSON response.');
      }

      if (parsed) {
        if (parsed.additionalBusinessRules && Array.isArray(parsed.additionalBusinessRules)) {
          let ruleCounter = analysisResult.intelligence.businessRules.length + 1;
          for (const rule of parsed.additionalBusinessRules) {
            analysisResult.intelligence.businessRules.push({
              id: `BR-${String(ruleCounter++).padStart(3, '0')}`,
              description: rule.description,
              condition: rule.condition || 'Always active',
              expectedOutcome: rule.expectedOutcome,
            });
          }
        }

        if (parsed.additionalActors && Array.isArray(parsed.additionalActors)) {
          for (const actor of parsed.additionalActors) {
            if (!analysisResult.intelligence.actors.some(a => a.name.toLowerCase() === actor.name.toLowerCase())) {
              analysisResult.intelligence.actors.push({
                name: actor.name,
                description: actor.description,
              });
            }
          }
        }

        if (parsed.blockingQuestions && Array.isArray(parsed.blockingQuestions)) {
          const cappedQuestions = parsed.blockingQuestions.slice(0, 3);
          const conversationId = `conv-${requirement.id}`;
          let idCounter = 1;

          for (const q of cappedQuestions) {
            const cand: QuestionCandidate = {
              id: `CAND-${String(idCounter).padStart(3, '0')}`,
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
            candidates.push(cand);

            const activeQ: Question = {
              ...cand,
              id: `Q-${String(idCounter).padStart(3, '0')}`,
              status: 'pending',
            };
            activeQuestions.push(activeQ);
            idCounter++;
          }
        }
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
      );
      candidates = clarifResult.candidates;
      activeQuestions = clarifResult.activeQuestions;
    }

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
          const ansText =
            ans.textValue || (ans.selectedOptions ? ans.selectedOptions.join(', ') : '');
          await knowledgeEngine.learnFromCorrection(conv.requirementId, question.text, ansText);
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
      },
    );

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

    const planner = new DefaultArtifactPlanner();
    const persona: UserPersona = (conv as any).persona || 'automation-qa';
    const plan = await planner.planArtifacts(strategy, persona, {
      language: 'typescript',
      framework: 'playwright',
      testingStyle: 'AAA',
    });

    const generator = new DefaultArtifactGenerator();
    const provider = customProvider || new MockLLMProvider();
    const artifacts = await generator.generateArtifacts(context, plan, provider);

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
}
