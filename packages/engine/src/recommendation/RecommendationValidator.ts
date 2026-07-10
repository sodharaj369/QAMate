import { IRecommendationValidator } from '../interfaces/index.js';
import { QARecommendation } from '../domain.js';
import { SystemModel } from '../platform/reasoningModel.js';

export class RecommendationValidator implements IRecommendationValidator {
  public validate(recommendations: QARecommendation[], systemModel: SystemModel): QARecommendation[] {
    const hasUI = systemModel.components.some(
      c => c.type.toLowerCase().includes('ui') || c.type.toLowerCase().includes('interface') || c.name.toLowerCase().includes('interface') || c.name.toLowerCase().includes('ui')
    ) || systemModel.flows.some(
      f => f.from.toLowerCase().includes('ui') || f.from.toLowerCase().includes('interface') || f.to.toLowerCase().includes('ui')
    );

    return recommendations.map(rec => {
      const recTextLower = (rec.recommendation + ' ' + rec.reason).toLowerCase();
      
      // If the recommendation targets browser, visual, or UI tests but the system is purely backend:
      if (!hasUI && (recTextLower.includes('browser') || recTextLower.includes('ui e2e') || recTextLower.includes('visual'))) {
        return {
          ...rec,
          status: 'Ignored',
          userComment: 'No browser or UI component exists in system model.'
        };
      }

      return rec;
    });
  }
}
