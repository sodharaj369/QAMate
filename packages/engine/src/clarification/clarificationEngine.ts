import {
  Requirement,
  RequirementIntelligenceReport,
  QuestionCandidate,
  Question,
} from '../domain.js';
import {
  IClarificationEngine,
  IQuestionCandidateGenerator,
  IQuestionPrioritizer,
  IQuestionDeduplicator,
  IQuestionPlanner,
} from '../interfaces/index.js';
import { PlaybookDecisionEngine } from './domainIntelligence.js';
import { QAMentalModel } from '../platform/reasoningModel.js';

export class DefaultClarificationEngine implements IClarificationEngine {
  constructor(
    public readonly candidateGenerator: IQuestionCandidateGenerator,
    public readonly prioritizer: IQuestionPrioritizer,
    public readonly deduplicator: IQuestionDeduplicator,
    public readonly planner: IQuestionPlanner,
  ) {}

  public async planClarifications(
    requirement: Requirement,
    intelligence: RequirementIntelligenceReport,
    options?: { askOnlyBlocking?: boolean; provider?: any; skipDecisionEngine?: boolean; mentalModel?: QAMentalModel },
  ): Promise<{
    candidates: QuestionCandidate[];
    activeQuestions: Question[];
    telemetry?: any;
  }> {
    // 1. Generate Raw Candidates
    const rawCandidates = await this.candidateGenerator.generateCandidates(
      requirement,
      intelligence,
    );

    // 2. Prioritize candidates (set impact metrics & skip risks)
    const prioritizedCandidates = await this.prioritizer.prioritize(rawCandidates);

    // 3. Deduplicate candidates
    const deduplicatedCandidates = await this.deduplicator.deduplicate(prioritizedCandidates);

    if (options?.skipDecisionEngine) {
      const activeQuestions = await this.planner.plan(deduplicatedCandidates, options);
      return {
        candidates: deduplicatedCandidates,
        activeQuestions
      };
    }

    // 4. Run through Domain Playbook Decision Engine
    const decisionEngine = new PlaybookDecisionEngine();

    const mentalModel = options?.mentalModel || {
      schemaVersion: 2,
      mentalModelVersion: 2,
      revision: 1,
      generatedAt: new Date(),
      facts: [],
      assumptions: [],
      inferences: [],
      risks: [],
      unknowns: [],
      confidence: 80,
      recommendedTesting: [],
      excludedTesting: [],
      reasoningTrace: []
    };

    const { activeQuestions, telemetry } = await decisionEngine.evaluateQuestions(
      mentalModel,
      deduplicatedCandidates,
      options?.provider
    );

    return {
      candidates: deduplicatedCandidates,
      activeQuestions,
      telemetry
    };
  }
}
