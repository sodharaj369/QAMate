import * as fs from 'fs';
import * as path from 'path';
import { IScanner, ScanResult } from './IScanner.js';
import { TechnologyProfile } from '../../domain.js';

export class DockerScanner implements IScanner {
  public readonly name = 'Docker Container Scanner';

  public async scan(projectRoot: string): Promise<ScanResult<Partial<TechnologyProfile>>> {
    const dockerfile = path.join(projectRoot, 'Dockerfile');
    const dockerCompose = path.join(projectRoot, 'docker-compose.yml');
    const dockerComposeYaml = path.join(projectRoot, 'docker-compose.yaml');

    const evidence: string[] = [];
    if (fs.existsSync(dockerfile)) evidence.push(dockerfile);
    if (fs.existsSync(dockerCompose)) evidence.push(dockerCompose);
    if (fs.existsSync(dockerComposeYaml)) evidence.push(dockerComposeYaml);

    if (evidence.length === 0) {
      return {
        source: 'Docker Configs',
        confidence: 0,
        evidence: [],
        warnings: ['No Dockerfile or docker-compose.yml found.'],
        data: { isContainerized: false }
      };
    }

    return {
      source: 'Docker Configs',
      confidence: 100,
      evidence,
      warnings: [],
      data: { isContainerized: true }
    };
  }
}
