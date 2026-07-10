import { TestStrategy, ProjectDNA, QARecommendation, ComplianceIssue, TraceLink } from '../domain.js';
import { SystemModel } from '../platform/reasoningModel.js';
import { QualityAttributeAudit } from './QualityAttributeAudit.js';
import { TraceabilityAudit } from './TraceabilityAudit.js';

export class QAReviewEngine {
  private readonly qaAudit = new QualityAttributeAudit();
  private readonly traceAudit = new TraceabilityAudit();

  public runFullReview(
    strategy: TestStrategy,
    systemModel: SystemModel,
    dna: ProjectDNA,
    recs: QARecommendation[]
  ): { complianceIssues: ComplianceIssue[]; traceability: TraceLink } {
    const complianceIssues = this.qaAudit.auditStrategy(strategy, dna);
    const traceability = this.traceAudit.buildTraceability(strategy.requirementId, systemModel, strategy, recs);

    return {
      complianceIssues,
      traceability
    };
  }
}
