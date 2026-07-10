import * as path from 'path';
import { IWorkspaceIntelligenceEngine } from '../interfaces/index.js';
import { WorkspaceProfile, WorkspaceWarning } from '../domain.js';
import { GitScanner } from './scanners/GitScanner.js';
import { NodeScanner } from './scanners/NodeScanner.js';
import { JavaScanner } from './scanners/JavaScanner.js';
import { DockerScanner } from './scanners/DockerScanner.js';
import { TestingScanner } from './scanners/TestingScanner.js';
import { ApiScanner } from './scanners/ApiScanner.js';
import { DocumentationScanner } from './scanners/DocumentationScanner.js';

export class WorkspaceIntelligenceEngine implements IWorkspaceIntelligenceEngine {
  private readonly scanners = [
    new GitScanner(),
    new NodeScanner(),
    new JavaScanner(),
    new DockerScanner(),
    new TestingScanner(),
    new ApiScanner(),
    new DocumentationScanner()
  ];

  public async analyze(projectRoot: string): Promise<WorkspaceProfile> {
    const results = await Promise.all(
      this.scanners.map(async scanner => {
        try {
          const res = await scanner.scan(projectRoot);
          return { scannerName: scanner.name, result: res };
        } catch (err: any) {
          return {
            scannerName: scanner.name,
            result: {
              source: 'unknown',
              confidence: 0,
              evidence: [],
              warnings: [`Scanner ${scanner.name} failed: ${err.message}`],
              data: {}
            }
          };
        }
      })
    );

    // Profile variables
    let repoData: any = { isGitRepo: false };
    let techData: any = { isContainerized: false, dependencies: [] };
    let testingData: any = { testFilesCount: 0, testFiles: [], testDirectories: [] };
    let apiData: any = { hasContracts: false, apiFiles: [], parsedEndpoints: [] };
    let docData: any = { hasReadme: false, hasADR: false, adrFiles: [] };
    const warnings: WorkspaceWarning[] = [];

    for (const r of results) {
      const { scannerName, result } = r;
      
      // Append warnings
      for (const w of result.warnings) {
        warnings.push({ category: scannerName, message: w });
      }

      // Map profiles
      if (scannerName === 'Git Repository Scanner') {
        repoData = { ...repoData, ...result.data };
      } else if (scannerName === 'Node.js Package Scanner' && result.confidence > 0) {
        techData = {
          ...techData,
          primaryLanguage: (result.data as any).primaryLanguage,
          runtimeEnvironment: (result.data as any).runtimeEnvironment,
          dependencies: [...techData.dependencies, ...((result.data as any).dependencies || [])]
        };
      } else if (scannerName === 'Java Maven Scanner' && result.confidence > 0) {
        techData = {
          ...techData,
          primaryLanguage: (result.data as any).primaryLanguage || techData.primaryLanguage,
          runtimeEnvironment: (result.data as any).runtimeEnvironment || techData.runtimeEnvironment,
          dependencies: [...techData.dependencies, ...((result.data as any).dependencies || [])]
        };
      } else if (scannerName === 'Docker Container Scanner') {
        techData.isContainerized = (result.data as any).isContainerized;
      } else if (scannerName === 'Testing Framework Detector') {
        testingData = result.data as any;
      } else if (scannerName === 'Contract Discovery Scanner') {
        apiData = result.data as any;
      } else if (scannerName === 'Documentation Analyzer') {
        docData = result.data as any;
      }
    }

    // Build Workspace Summary
    const baseName = path.basename(projectRoot) || 'Workspace';
    const langSummary = techData.primaryLanguage ? `Primary Language: ${techData.primaryLanguage}` : 'Unknown language';
    const testSummary = testingData.framework
      ? `Testing Framework: ${testingData.framework} with ${testingData.testFilesCount} tests`
      : 'No test framework detected';
    const apiSummary = apiData.hasContracts
      ? `API contracts discovered (${apiData.apiFiles.length} files, ${apiData.parsedEndpoints.length} endpoints)`
      : 'No API contracts discovered';
    const dockerSummary = techData.isContainerized ? 'Docker configured' : 'No Docker configs';

    const summary = `${baseName} Profile: ${langSummary}. ${testSummary}. ${apiSummary}. ${dockerSummary}.`;

    return {
      projectId: baseName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      repo: repoData,
      tech: techData,
      testing: testingData,
      api: apiData,
      docs: docData,
      warnings,
      summary,
      analyzedAt: new Date()
    };
  }
}
