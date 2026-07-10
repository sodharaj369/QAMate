import * as fs from 'fs';
import * as path from 'path';
import { IScanner, ScanResult } from './IScanner.js';
import { TechnologyProfile } from '../../domain.js';

export class NodeScanner implements IScanner {
  public readonly name = 'Node.js Package Scanner';

  public async scan(projectRoot: string): Promise<ScanResult<Partial<TechnologyProfile>>> {
    const packageJsonPath = path.join(projectRoot, 'package.json');
    
    if (!fs.existsSync(packageJsonPath)) {
      return {
        source: 'package.json',
        confidence: 0,
        evidence: [],
        warnings: ['No package.json found at project root.'],
        data: {}
      };
    }

    try {
      const content = fs.readFileSync(packageJsonPath, 'utf-8');
      const parsed = JSON.parse(content);
      
      const dependencies = [
        ...Object.keys(parsed.dependencies || {}),
        ...Object.keys(parsed.devDependencies || {})
      ];

      return {
        source: 'package.json',
        confidence: 100,
        evidence: [packageJsonPath],
        warnings: dependencies.length === 0 ? ['package.json found but contains zero dependencies.'] : [],
        data: {
          primaryLanguage: 'typescript', // default node project language assumption
          runtimeEnvironment: `NodeJS ${parsed.engines?.node || ''}`.trim(),
          dependencies
        }
      };
    } catch (err: any) {
      return {
        source: 'package.json',
        confidence: 20,
        evidence: [packageJsonPath],
        warnings: [`Failed to parse package.json: ${err.message}`],
        data: {}
      };
    }
  }
}
