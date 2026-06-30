import { TestStrategy, UserPersona, ProjectProfile, ArtifactPlan } from '../domain.js';
import { IArtifactPlanner } from '../interfaces/index.js';

export class DefaultArtifactPlanner implements IArtifactPlanner {
  public async planArtifacts(
    strategy: TestStrategy,
    persona: UserPersona,
    profile: ProjectProfile,
  ): Promise<ArtifactPlan> {
    const selectedArtifacts: string[] = [];
    const generationInstructions: string[] = [];
    const reasoning: string[] = [];

    reasoning.push(`Persona target set to: ${persona}`);
    reasoning.push(
      `Repository profile configured with language: ${profile.language}, framework: ${profile.framework}, testing style: ${profile.testingStyle}.`,
    );

    switch (persona) {
      case 'manual-qa':
        selectedArtifacts.push('Manual Test Cases', 'Regression Checklist', 'Exploratory Charter');
        reasoning.push(
          'Manual QA persona requires descriptive steps, exploratory Charters, and check charts.',
        );
        generationInstructions.push(
          'Format manual test cases with detailed Preconditions, step-by-step Actions, and Expected Outcomes.',
          'Build an exploratory charter highlighting key user interactions and visual layout boundaries.',
          'Create a checklist of critical regression scenarios to verify manually before release.',
        );
        break;

      case 'automation-qa':
        selectedArtifacts.push(
          `${profile.framework} Test Skeletons`,
          'Selectors & Assertions Checklist',
        );
        reasoning.push(
          'Automation QA persona focuses on browser automation locators, configurations, and scripts.',
        );
        generationInstructions.push(
          `Generate automated test code skeletons using ${profile.language} and the ${profile.framework} framework.`,
          'Provide suggested component/page locators (selectors) and assert statements.',
          `Follow the repository testing style guidelines: ${profile.testingStyle}.`,
        );
        break;

      case 'backend-developer':
        selectedArtifacts.push(
          'Unit Test Skeletons',
          'Integration Test Skeletons',
          'API Test Collection',
        );
        if (profile.database) {
          selectedArtifacts.push('SQL Validation Rules');
        }
        reasoning.push(
          'Backend Developer persona targets system stability, mock strategies, unit edge cases, and API contract validations.',
        );
        generationInstructions.push(
          `Draft unit test code skeletons using the ${profile.testingStyle || 'Arrange/Act/Assert (AAA)'} pattern.`,
          'Do NOT write full logic implementations. Provide method signatures, mock configuration suggestions, and assert assertions placeholders.',
          `Generate HTTP API request templates and parameter validations for target ${profile.cloud || 'cloud'} endpoints.`,
        );
        if (profile.database) {
          generationInstructions.push(
            `Provide SQL constraint validations and assertions for data layer: ${profile.database}.`,
          );
        }
        break;

      case 'frontend-developer':
        selectedArtifacts.push('Component Test Skeletons', 'UI Interaction Checklist');
        reasoning.push(
          'Frontend Developer persona selects UI visual component skeletons and interaction states validation.',
        );
        generationInstructions.push(
          `Generate component test templates in ${profile.language} for the visual layout library.`,
          'List critical user events to verify (e.g. double clicks, focus lost, validation rules modal triggers).',
        );
        break;

      case 'security-tester':
        selectedArtifacts.push('Security Checklist', 'Penetration Scenarios');
        reasoning.push(
          'Security Tester persona focuses on access policy boundaries, input validation bypasses, and token expiry limits.',
        );
        generationInstructions.push(
          'Formulate testing checklists for authentication penetration vectors (e.g. expired tokens, malformed SAS, parameter tampering).',
          'Verify storage account access restrictions deny anonymous public queries.',
        );
        break;

      case 'performance-tester':
        selectedArtifacts.push('Performance Checklist', 'Throughput Benchmark Targets');
        reasoning.push(
          'Performance Tester persona maps out transaction speeds, load factors, and concurrency thresholds.',
        );
        generationInstructions.push(
          'Define latency guidelines and scale thresholds for cloud endpoint requests.',
          'Verify resource download limits under mock concurrency loads.',
        );
        break;

      case 'tech-lead':
        selectedArtifacts.push('Executive Strategy Summary', 'System Coverage Matrix');
        reasoning.push(
          'Tech Lead persona selects aggregate reports, traceability metrics, and risk summaries.',
        );
        generationInstructions.push(
          'Generate a high-level summary of strategy objectives, dependencies, and business rules validation.',
          'Construct a traceability matrix mapping requirement acceptance criteria to testing suites.',
        );
        break;
    }

    return {
      id: `PLAN-${Date.now().toString().slice(-4)}`,
      strategyId: strategy.id,
      persona,
      profile,
      selectedArtifacts,
      generationInstructions,
      reasoning,
      createdAt: new Date(),
    };
  }
}
