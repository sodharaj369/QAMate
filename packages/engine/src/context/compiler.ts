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
    return {
      version: '1.0',
      requirement,
      intelligence,
      answers,
      projectConfig,
      generationPreferences,
      compiledAt: new Date(),
    };
  }
}
