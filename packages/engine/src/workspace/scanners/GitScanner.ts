import * as fs from 'fs';
import * as path from 'path';
import { IScanner, ScanResult } from './IScanner.js';
import { RepositoryProfile } from '../../domain.js';

export class GitScanner implements IScanner {
  public readonly name = 'Git Repository Scanner';

  public async scan(projectRoot: string): Promise<ScanResult<Partial<RepositoryProfile>>> {
    const gitDir = path.join(projectRoot, '.git');
    
    if (!fs.existsSync(gitDir) || !fs.statSync(gitDir).isDirectory()) {
      return {
        source: '.git',
        confidence: 0,
        evidence: [],
        warnings: ['Workspace is not a Git repository.'],
        data: { isGitRepo: false }
      };
    }

    const evidence: string[] = [gitDir];
    let branchName: string | undefined = undefined;
    let remoteUrl: string | undefined = undefined;

    // 1. Resolve branch name from .git/HEAD
    const headPath = path.join(gitDir, 'HEAD');
    if (fs.existsSync(headPath)) {
      evidence.push(headPath);
      try {
        const headContent = fs.readFileSync(headPath, 'utf-8').trim();
        if (headContent.startsWith('ref:')) {
          branchName = headContent.replace('ref: refs/heads/', '');
        } else {
          branchName = headContent.substring(0, 7); // detached head SHA
        }
      } catch {
        // ignore
      }
    }

    // 2. Resolve remote URL from .git/config
    const configPath = path.join(gitDir, 'config');
    if (fs.existsSync(configPath)) {
      evidence.push(configPath);
      try {
        const configContent = fs.readFileSync(configPath, 'utf-8');
        const match = /url\s*=\s*([^\s]+)/.exec(configContent);
        if (match && match[1]) {
          remoteUrl = match[1];
        }
      } catch {
        // ignore
      }
    }

    return {
      source: '.git',
      confidence: 100,
      evidence,
      warnings: [],
      data: {
        isGitRepo: true,
        branchName,
        remoteUrl
      }
    };
  }
}
