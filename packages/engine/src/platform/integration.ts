import { Requirement } from '../domain.js';
import { IWorkItemProvider } from '../interfaces/index.js';
import * as fs from 'fs';
import * as path from 'path';

export class LocalMarkdownProvider implements IWorkItemProvider {
  public async fetchWorkItem(filePath: string): Promise<Requirement> {
    const absolutePath = path.resolve(filePath);
    if (!fs.existsSync(absolutePath)) {
      throw new Error(`LocalMarkdownProvider: File not found at path: ${filePath}`);
    }

    const raw = fs.readFileSync(absolutePath, 'utf-8');
    const title = path.basename(filePath, path.extname(filePath));

    return {
      id: `local-${title}`,
      projectId: 'local-project',
      title,
      content: raw,
      contentType: 'markdown',
      version: 1,
      status: 'draft',
      metadata: {
        externalId: filePath,
        author: 'Local User',
      },
    };
  }
}
