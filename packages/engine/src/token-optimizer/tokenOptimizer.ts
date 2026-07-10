import { createHash } from 'crypto';

export interface ContextItem {
  id: string;
  type: 'requirement' | 'playbook' | 'knowledge' | 'history' | 'examples';
  content: string;
  priority: number; // 0 to 100
}

export interface PromptBudget {
  maxTokens: number;
  approxCharsPerToken: number;
}

export interface OptimizationReport {
  originalLength: number;
  optimizedLength: number;
  savedTokens: number;
  savedPercent: number;
  cacheHits: number;
  estimatedSavingsUSD: number;
}

export class PromptPlanner {
  public plan(items: ContextItem[], budget: PromptBudget): ContextItem[] {
    // 1. Context Deduplication
    const seen = new Set<string>();
    const uniqueItems = items.filter((item) => {
      const normalized = item.content.trim().toLowerCase();
      if (seen.has(normalized)) return false;
      seen.add(normalized);
      return true;
    });

    // 2. Sort by Context Priority descending (Requirement = 100, Playbook = 95, etc.)
    uniqueItems.sort((a, b) => b.priority - a.priority);

    // 3. Prompt Budget Planning
    const accepted: ContextItem[] = [];
    let currentTokens = 0;

    for (const item of uniqueItems) {
      const tokens = Math.ceil(item.content.length / budget.approxCharsPerToken);
      if (currentTokens + tokens <= budget.maxTokens) {
        accepted.push(item);
        currentTokens += tokens;
      }
    }

    return accepted;
  }
}

export class ContextOptimizer {
  public pruneCommentsAndWhitespace(text: string): string {
    return text
      .replace(/\/\*[\s\S]*?\*\//g, '') // Strip block comments
      .replace(/\/\/.*$/gm, '') // Strip inline comments
      .replace(/<!--[\s\S]*?-->/g, '') // Strip HTML comments
      .replace(/[ \t]+/g, ' ') // Collapse horizontal whitespace
      .replace(/\n\s*\n/g, '\n') // Collapse consecutive empty lines
      .trim();
  }

  public compressSemanticPhrases(text: string): string {
    return text
      .replace(/The user has selected/gi, 'Selection:')
      .replace(/Please generate/gi, 'Generate')
      .replace(/expected outcome of this verification/gi, 'Expected Result')
      .replace(/Verify that the system/gi, 'Verify');
  }

  public optimize(text: string, providerId: string): string {
    let clean = this.pruneCommentsAndWhitespace(text);
    clean = this.compressSemanticPhrases(clean);

    // Provider-Aware Optimization tailoring
    if (providerId === 'ollama' || providerId === 'local') {
      return `### CRITICAL:\n${clean}`;
    }
    if (providerId.includes('claude')) {
      return `<context>\n${clean}\n</context>`;
    }

    return clean;
  }
}

export class PromptReplayCache {
  private cache = new Map<string, string>();
  private hits = 0;

  public lookup(prompt: string): string | undefined {
    const hash = this.getHash(prompt);
    if (this.cache.has(hash)) {
      this.hits++;
      return this.cache.get(hash);
    }
    return undefined;
  }

  public save(prompt: string, response: string): void {
    const hash = this.getHash(prompt);
    this.cache.set(hash, response);
  }

  public getHits(): number {
    return this.hits;
  }

  public clear(): void {
    this.cache.clear();
    this.hits = 0;
  }

  private getHash(text: string): string {
    return createHash('sha256').update(text).digest('hex');
  }
}

export class TokenOptimizer {
  private planner = new PromptPlanner();
  private contextOpt = new ContextOptimizer();
  private replayCache = new PromptReplayCache();

  private totalOriginalLength = 0;
  private totalOptimizedLength = 0;
  private totalSavingsUSD = 0;

  public planAndOptimize(
    items: ContextItem[],
    providerId: string,
    budget: PromptBudget = { maxTokens: 40000, approxCharsPerToken: 4 },
  ): { prompt: string; report: OptimizationReport } {
    // 1. Context prioritization and budget filtering
    const plannedItems = this.planner.plan(items, budget);

    // 2. Assemble content
    const assembledText = plannedItems.map((item) => item.content).join('\n');

    // 3. Compress and optimize text representation
    const optimized = this.contextOpt.optimize(assembledText, providerId);

    // 4. Track statistics
    const originalLen = assembledText.length;
    const optimizedLen = optimized.length;
    const diffChars = Math.max(0, originalLen - optimizedLen);
    const savedTokens = Math.ceil(diffChars / budget.approxCharsPerToken);
    const savedPercent = originalLen > 0 ? Math.round((diffChars / originalLen) * 100) : 0;
    
    // Assume $0.015 per 1K tokens saved rate estimation
    const estimatedCostSaved = (savedTokens / 1000) * 0.015;

    this.totalOriginalLength += originalLen;
    this.totalOptimizedLength += optimizedLen;
    this.totalSavingsUSD += estimatedCostSaved;

    return {
      prompt: optimized,
      report: {
        originalLength: originalLen,
        optimizedLength: optimizedLen,
        savedTokens,
        savedPercent,
        cacheHits: this.replayCache.getHits(),
        estimatedSavingsUSD: Math.round(estimatedCostSaved * 100000) / 100000,
      },
    };
  }

  public lookupCache(prompt: string): string | undefined {
    return this.replayCache.lookup(prompt);
  }

  public saveCache(prompt: string, response: string): void {
    this.replayCache.save(prompt, response);
  }

  public getCumulativeReport(): OptimizationReport {
    const diff = Math.max(0, this.totalOriginalLength - this.totalOptimizedLength);
    const savedPercent = this.totalOriginalLength > 0 ? Math.round((diff / this.totalOriginalLength) * 100) : 0;

    return {
      originalLength: this.totalOriginalLength,
      optimizedLength: this.totalOptimizedLength,
      savedTokens: Math.ceil(diff / 4),
      savedPercent,
      cacheHits: this.replayCache.getHits(),
      estimatedSavingsUSD: Math.round(this.totalSavingsUSD * 1000) / 1000,
    };
  }
}
