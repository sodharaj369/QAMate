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
    options?: { askOnlyBlocking?: boolean },
  ): Promise<{
    candidates: QuestionCandidate[];
    activeQuestions: Question[];
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

    // 4. Plan active questions
    const activeQuestions = await this.planner.plan(deduplicatedCandidates, options);

    return {
      candidates: deduplicatedCandidates,
      activeQuestions,
    };
  }
}
