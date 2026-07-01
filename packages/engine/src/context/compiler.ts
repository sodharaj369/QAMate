import { Requirement, RequirementIntelligenceReport, Answer, ProjectConfig } from '../domain.js';
import { GeneratorContext, GenerationPreferences } from '../types.js';
import { IContextCompiler } from '../interfaces/index.js';

export class DefaultContextCompiler implements IContextCompiler {
  public async compile(
    requirement: Requirement,
    intelligence: RequirementIntelligenceReport,
    answers: Answer[],
    projectConfig: ProjectConfig,
    generationPreferences: GenerationPreferences,
  ): Promise<GeneratorContext> {
    const historicalCorrections: string[] = [];

    try {
      const { DefaultKnowledgeEngine } = await import('../knowledge/knowledgeEngine.js');
      const knowledgeEngine = new DefaultKnowledgeEngine();

      const result = await knowledgeEngine.findSimilarRequirements(requirement);
      if (result && result.matches) {
        result.matches.forEach((m) => {
          if (m.entry.category === 'user-correction') {
            historicalCorrections.push(`${m.entry.title}: ${m.entry.description}`);
          }
        });
      }
    } catch {
      // Safe fallback
    }

    return {
      version: '1.0',
      requirement,
      intelligence,
      answers,
      projectConfig,
      generationPreferences,
      compiledAt: new Date(),
      historicalCorrections,
    };
  }
}
