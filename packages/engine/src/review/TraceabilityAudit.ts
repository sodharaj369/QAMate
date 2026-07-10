import { ITraceabilityEngine } from '../interfaces/index.js';
import { TestStrategy, QARecommendation, TraceLink } from '../domain.js';
import { SystemModel } from '../platform/reasoningModel.js';

export class TraceabilityAudit implements ITraceabilityEngine {
  public buildTraceability(
    requirementId: string,
    systemModel: SystemModel,
    strategy: TestStrategy,
    recs: QARecommendation[]
  ): TraceLink {
    return {
      requirementId,
      componentNames: systemModel.components.map(c => c.name),
      objectives: strategy.objectives,
      recommendations: recs.map(r => r.recommendation),
      testCases: strategy.objectives.map((obj, i) => `TC-${requirementId}-${(i + 1).toString().padStart(3, '0')}: Validate ${obj}`)
    };
  }
}
