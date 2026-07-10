import * as fs from 'fs';
import * as path from 'path';
import { IScanner, ScanResult } from './IScanner.js';
import { TechnologyProfile } from '../../domain.js';

export class JavaScanner implements IScanner {
  public readonly name = 'Java Maven Scanner';

  public async scan(projectRoot: string): Promise<ScanResult<Partial<TechnologyProfile>>> {
    const pomPath = path.join(projectRoot, 'pom.xml');
    
    if (!fs.existsSync(pomPath)) {
      return {
        source: 'pom.xml',
        confidence: 0,
        evidence: [],
        warnings: ['No pom.xml found at project root.'],
        data: {}
      };
    }

    try {
      const content = fs.readFileSync(pomPath, 'utf-8');
      
      // Simple regex-based extraction of dependencies from pom.xml
      const dependencies: string[] = [];
      const artifactRegex = /<artifactId>([^<]+)<\/artifactId>/g;
      let match;
      while ((match = artifactRegex.exec(content)) !== null) {
        if (match[1] && !dependencies.includes(match[1])) {
          dependencies.push(match[1]);
        }
      }

      return {
        source: 'pom.xml',
        confidence: 100,
        evidence: [pomPath],
        warnings: [],
        data: {
          primaryLanguage: 'java',
          runtimeEnvironment: 'JVM',
          dependencies
        }
      };
    } catch (err: any) {
      return {
        source: 'pom.xml',
        confidence: 20,
        evidence: [pomPath],
        warnings: [`Failed to read pom.xml: ${err.message}`],
        data: {}
      };
    }
  }
}
