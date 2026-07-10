import * as fs from 'fs';
import * as path from 'path';
import { IScanner, ScanResult } from './IScanner.js';
import { DocumentationProfile } from '../../domain.js';

export class DocumentationScanner implements IScanner {
  public readonly name = 'Documentation Analyzer';

  public async scan(projectRoot: string): Promise<ScanResult<DocumentationProfile>> {
    const readmeCandidates = ['README.md', 'README.txt', 'README', 'readme.md'];
    let readmePath: string | undefined = undefined;
    const evidence: string[] = [];

    for (const cand of readmeCandidates) {
      const fullPath = path.join(projectRoot, cand);
      if (fs.existsSync(fullPath)) {
        readmePath = fullPath;
        evidence.push(fullPath);
        break;
      }
    }

    const adrDirs = ['adr', 'docs/adr', 'doc/adr', '.github/adr'];
    let hasADR = false;
    const adrFiles: string[] = [];

    for (const dir of adrDirs) {
      const fullDir = path.join(projectRoot, dir);
      if (fs.existsSync(fullDir) && fs.statSync(fullDir).isDirectory()) {
        evidence.push(fullDir);
        hasADR = true;
        try {
          const files = fs.readdirSync(fullDir);
          for (const f of files) {
            if (f.endsWith('.md')) {
              adrFiles.push(path.join(dir, f));
            }
          }
        } catch {
          // ignore read failures
        }
      }
    }

    const warnings: string[] = [];
    if (!readmePath) {
      warnings.push('No README file found. System documentation is missing.');
    }
    if (!hasADR || adrFiles.length === 0) {
      warnings.push('No Architecture Decision Records (ADR) found.');
    }

    return {
      source: 'Workspace Docs',
      confidence: readmePath ? 100 : 30,
      evidence,
      warnings,
      data: {
        hasReadme: !!readmePath,
        readmePath,
        hasADR,
        adrFiles
      }
    };
  }
}
