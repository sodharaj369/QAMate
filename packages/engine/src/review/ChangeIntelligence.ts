import { IChangeIntelligence } from '../interfaces/index.js';
import { SystemModel, QAMentalModel } from '../platform/reasoningModel.js';
import { TestStrategy, ChangeImpactReport } from '../domain.js';

export class ChangeIntelligence implements IChangeIntelligence {
  public detectChangeImpact(
    oldSystem: SystemModel,
    newSystem: SystemModel,
    oldMental: QAMentalModel,
    newMental: QAMentalModel,
    oldStrategy: TestStrategy,
    newStrategy: TestStrategy
  ): ChangeImpactReport {
    const affectedObjectives: string[] = [];
    const affectedSuites: string[] = [];
    const affectedRecommendations: string[] = [];
    const affectedRisks: string[] = [];
    const affectedAssumptions: string[] = [];
    let breakingChange = false;
    const diffLines: string[] = [];

    // 1. Compare System Model components
    const oldComps = oldSystem.components.map(c => c.name.toLowerCase());
    const newComps = newSystem.components.map(c => c.name.toLowerCase());

    const addedComps = newSystem.components.filter(c => !oldComps.includes(c.name.toLowerCase()));
    const removedComps = oldSystem.components.filter(c => !newComps.includes(c.name.toLowerCase()));

    if (addedComps.length > 0) {
      diffLines.push(`+++ Added components: ${addedComps.map(c => c.name).join(', ')}`);
      for (const comp of addedComps) {
        if (comp.name.toLowerCase().includes('payment') || comp.name.toLowerCase().includes('stripe')) {
          affectedSuites.push('API', 'Security');
          affectedObjectives.push('Verify API request and response schemas match OpenAPI spec.');
          breakingChange = true; // payment addition is high severity
        }
      }
    }

    if (removedComps.length > 0) {
      diffLines.push(`--- Removed components: ${removedComps.map(c => c.name).join(', ')}`);
      breakingChange = true;
    }

    // 2. Compare risks
    const oldRisks = oldMental.risks.map(r => r.toLowerCase());
    const newRisks = newMental.risks.map(r => r.toLowerCase());
    const addedRisks = newMental.risks.filter(r => !oldRisks.includes(r.toLowerCase()));
    if (addedRisks.length > 0) {
      affectedRisks.push(...addedRisks);
      diffLines.push(`+++ Added risks: ${addedRisks.join(', ')}`);
    }

    // 3. Compare strategy objectives
    const oldObjs = oldStrategy.objectives.map(o => o.toLowerCase());
    const newObjs = newStrategy.objectives.map(o => o.toLowerCase());
    const addedObjs = newStrategy.objectives.filter(o => !oldObjs.includes(o.toLowerCase()));
    if (addedObjs.length > 0) {
      diffLines.push(`+++ Added objectives: ${addedObjs.join(', ')}`);
    }

    return {
      affectedObjectives: [...new Set(affectedObjectives)],
      affectedSuites: [...new Set(affectedSuites)],
      affectedRecommendations,
      affectedRisks,
      affectedAssumptions,
      breakingChange,
      strategyDiff: diffLines.join('\n') || 'No structural strategy change detected.'
    };
  }
}
