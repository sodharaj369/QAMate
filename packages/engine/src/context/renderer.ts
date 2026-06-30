import fs from 'node:fs';
import path from 'node:path';
import { GeneratorContext } from '../types.js';
import { IContextRenderer } from '../interfaces/index.js';
import {
  DefaultQuestionCandidateGenerator,
  DefaultQuestionPrioritizer,
  DefaultQuestionDeduplicator,
} from '../clarification/index.js';

export class DefaultContextRenderer implements IContextRenderer {
  private readonly candidateGenerator = new DefaultQuestionCandidateGenerator();
  private readonly prioritizer = new DefaultQuestionPrioritizer();
  private readonly deduplicator = new DefaultQuestionDeduplicator();

  public async renderToMarkdown(context: GeneratorContext, templatePath: string): Promise<string> {
    const resolvedPath = path.resolve(templatePath);
    if (!fs.existsSync(resolvedPath)) {
      throw new Error(`ContextRenderer: Template file not found at: ${resolvedPath}`);
    }

    const templateContent = fs.readFileSync(resolvedPath, 'utf8');

    // 1. Reconstruct candidates to fetch actual question text matching answers
    const rawCandidates = await this.candidateGenerator.generateCandidates(
      context.requirement,
      context.intelligence,
    );
    const prioritized = await this.prioritizer.prioritize(rawCandidates);
    const uniqueCandidates = await this.deduplicator.deduplicate(prioritized);

    // 2. Format lists
    const actorsStr =
      context.intelligence.actors.length > 0
        ? context.intelligence.actors.map((a) => `- **${a.name}**: ${a.description}`).join('\n')
        : 'None defined.';

    const rulesStr =
      context.intelligence.businessRules.length > 0
        ? context.intelligence.businessRules
            .map(
              (r) =>
                `- [${r.id}] ${r.description}\n  - Condition: ${r.condition}\n  - Expected Outcome: ${r.expectedOutcome}`,
            )
            .join('\n')
        : 'None defined.';

    const clarificationsStr =
      context.answers.length > 0
        ? context.answers
            .map((ans) => {
              const cand = uniqueCandidates.find(
                (c) => c.id.replace('CAND', 'Q') === ans.questionId,
              );
              const questionText = cand ? cand.text : `Question ID: ${ans.questionId}`;
              const answerValue = ans.selectedOptions
                ? ans.selectedOptions.join(', ')
                : ans.textValue;
              return `### Question: ${questionText}\n**Answer:** ${answerValue || 'Skipped'}`;
            })
            .join('\n\n')
        : 'No clarifications answered.';

    const companyRulesStr =
      context.projectConfig.companyRules.length > 0
        ? context.projectConfig.companyRules.map((r) => `- ${r}`).join('\n')
        : 'None configured.';

    const qaGuidelinesStr =
      context.projectConfig.qaGuidelines.length > 0
        ? context.projectConfig.qaGuidelines.map((r) => `- ${r}`).join('\n')
        : 'None configured.';

    // 3. Perform Substitutions
    let rendered = templateContent;
    rendered = rendered.replace(/\{\{VERSION\}\}/g, context.version);
    rendered = rendered.replace(/\{\{REQUIREMENT_TITLE\}\}/g, context.requirement.title);
    rendered = rendered.replace(/\{\{REQUIREMENT_CONTENT\}\}/g, context.requirement.content);
    rendered = rendered.replace(/\{\{ACTORS\}\}/g, actorsStr);
    rendered = rendered.replace(/\{\{BUSINESS_RULES\}\}/g, rulesStr);
    rendered = rendered.replace(/\{\{CLARIFICATIONS\}\}/g, clarificationsStr);
    rendered = rendered.replace(/\{\{TARGET_LANGUAGE\}\}/g, context.projectConfig.targetLanguage);
    rendered = rendered.replace(/\{\{TARGET_FRAMEWORK\}\}/g, context.projectConfig.targetFramework);
    rendered = rendered.replace(
      /\{\{NAMING_CONVENTION\}\}/g,
      context.projectConfig.namingConvention,
    );
    rendered = rendered.replace(/\{\{COMPANY_RULES\}\}/g, companyRulesStr);
    rendered = rendered.replace(/\{\{QA_GUIDELINES\}\}/g, qaGuidelinesStr);
    rendered = rendered.replace(
      /\{\{MAX_CASES\}\}/g,
      String(context.generationPreferences.maxCases),
    );
    rendered = rendered.replace(
      /\{\{FOCUS_AREAS\}\}/g,
      context.generationPreferences.focusAreas.join(', '),
    );
    rendered = rendered.replace(
      /\{\{INCLUDE_AUTOMATION\}\}/g,
      context.generationPreferences.includeAutomationCandidate ? 'Yes' : 'No',
    );

    return rendered;
  }

  public async renderToJSON(context: GeneratorContext): Promise<string> {
    return JSON.stringify(context, null, 2);
  }
}
