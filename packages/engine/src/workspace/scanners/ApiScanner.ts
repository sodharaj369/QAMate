import * as fs from 'fs';
import * as path from 'path';
import { IScanner, ScanResult } from './IScanner.js';
import { APIProfile } from '../../domain.js';

export class ApiScanner implements IScanner {
  public readonly name = 'Contract Discovery Scanner';

  private readonly ignoreDirs = new Set([
    'node_modules', 'dist', 'build', 'coverage', '.git',
    '.next', 'bin', 'obj', 'target', 'out', 'vendor', '.gemini'
  ]);

  public async scan(projectRoot: string): Promise<ScanResult<APIProfile>> {
    const apiFiles: string[] = [];
    const parsedEndpoints: Array<{ method: string; path: string; description?: string }> = [];

    this.crawl(projectRoot, projectRoot, apiFiles);

    // Simple parser for OpenAPI/Swagger contracts if found
    for (const file of apiFiles) {
      try {
        const fullPath = path.join(projectRoot, file);
        const content = fs.readFileSync(fullPath, 'utf-8');
        
        if (file.endsWith('.json')) {
          const parsed = JSON.parse(content);
          if (parsed.paths) {
            for (const apiPath of Object.keys(parsed.paths)) {
              for (const method of Object.keys(parsed.paths[apiPath])) {
                parsedEndpoints.push({
                  method: method.toUpperCase(),
                  path: apiPath,
                  description: parsed.paths[apiPath][method].summary || parsed.paths[apiPath][method].description
                });
              }
            }
          }
        } else if (file.endsWith('.yaml') || file.endsWith('.yml')) {
          // Simple regex route finder for YAML OpenAPI specs
          const pathsRegex = /paths:\s*([^]*?)(?:components:|security:|$)/i;
          const pathsMatch = pathsRegex.exec(content);
          if (pathsMatch && pathsMatch[1]) {
            const routesContent = pathsMatch[1];
            const routePattern = /^\s+['"]?(\/[^\s'":]+)['"]?:\s*$/gm;
            let routeMatch;
            while ((routeMatch = routePattern.exec(routesContent)) !== null) {
              parsedEndpoints.push({
                method: 'GET', // placeholder method
                path: routeMatch[1]
              });
            }
          }
        }
      } catch {
        // ignore parsing errors
      }
    }

    const warnings: string[] = [];
    if (apiFiles.length === 0) {
      warnings.push('No API contract specs (OpenAPI, GraphQL, gRPC) found.');
    }

    return {
      source: 'Workspace APIs',
      confidence: apiFiles.length > 0 ? 100 : 30,
      evidence: apiFiles,
      warnings,
      data: {
        hasContracts: apiFiles.length > 0,
        apiFiles,
        parsedEndpoints
      }
    };
  }

  private crawl(dir: string, root: string, apiFiles: string[]): void {
    if (!fs.existsSync(dir)) return;

    try {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          if (this.ignoreDirs.has(file.toLowerCase())) {
            continue;
          }
          this.crawl(fullPath, root, apiFiles);
        } else if (stat.isFile()) {
          const nameLower = file.toLowerCase();
          const isApiFile =
            nameLower === 'openapi.json' ||
            nameLower === 'openapi.yaml' ||
            nameLower === 'openapi.yml' ||
            nameLower === 'swagger.json' ||
            nameLower === 'swagger.yaml' ||
            nameLower === 'swagger.yml' ||
            nameLower === 'schema.graphql' ||
            nameLower.endsWith('.proto');

          if (isApiFile) {
            apiFiles.push(path.relative(root, fullPath).replace(/\\/g, '/'));
          }
        }
      }
    } catch {
      // ignore unreadable files/folders
    }
  }
}
