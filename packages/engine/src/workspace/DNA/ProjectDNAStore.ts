import * as fs from 'fs';
import * as path from 'path';
import { IProjectDNAStore } from '../../interfaces/index.js';
import { ProjectDNA, WorkspaceProfile } from '../../domain.js';

export class ProjectDNAStore implements IProjectDNAStore {
  public async load(projectRoot: string): Promise<ProjectDNA> {
    const dnaPath = path.join(projectRoot, '.qamate', 'dna.json');

    if (!fs.existsSync(dnaPath)) {
      throw new Error('Project DNA has not been initialized. Execute workspace bootstrap first.');
    }

    try {
      const content = fs.readFileSync(dnaPath, 'utf-8');
      return JSON.parse(content) as ProjectDNA;
    } catch (err: any) {
      throw new Error(`Failed to load Project DNA: ${err.message}`);
    }
  }

  public async save(projectRoot: string, dna: ProjectDNA): Promise<void> {
    const qamateDir = path.join(projectRoot, '.qamate');
    if (!fs.existsSync(qamateDir)) {
      fs.mkdirSync(qamateDir, { recursive: true });
    }

    const dnaPath = path.join(qamateDir, 'dna.json');
    try {
      fs.writeFileSync(dnaPath, JSON.stringify(dna, null, 2), 'utf-8');
    } catch (err: any) {
      throw new Error(`Failed to save Project DNA: ${err.message}`);
    }
  }

  public generateDefaultDNA(profile: WorkspaceProfile): ProjectDNA {
    // Dynamically compile default configuration values based on scanned workspace intelligence
    const techStackList = [
      profile.tech.primaryLanguage || 'TypeScript/JavaScript',
      profile.tech.runtimeEnvironment || 'NodeJS',
      profile.testing.framework || 'Vitest',
      profile.tech.isContainerized ? 'Docker' : ''
    ].filter(Boolean);

    const codingStandards = [
      'Use ESLint and Prettier for syntax styling.',
      profile.tech.primaryLanguage === 'typescript' ? 'Strict type checks enabled.' : 'Standard style checks.'
    ];

    const testingStandards = [
      `Write unit tests using ${profile.testing.framework || 'Vitest'}.`,
      'Maintain at least 80% test coverage for critical paths.'
    ];

    const businessVocabulary = ['Workspace', 'Context', 'User', 'Session'];
    const domainGlossary = ['QA Reasoning', 'Deliverable Compilation', 'DNA Gating'];

    return {
      techStack: techStackList.join(', '),
      codingStandards,
      businessVocabulary,
      domainGlossary,
      systemArchitecture: profile.tech.isContainerized ? 'Containerized Microservice' : 'Monolithic/Library structure',
      testingStandards,
      teamPreferences: ['Prefer functional style, clean architecture, minimal dependencies.'],
      knownLimitations: ['Requires active network config for cloud providers.'],
      existingSuites: profile.testing.testFiles.slice(0, 10),
      integrationLandscape: ['Jira ticketing synchronization'],
      reusableComponents: ['WorkspaceIntelligenceEngine', 'ProjectDNAStore', 'QAValueEngine']
    };
  }
}
