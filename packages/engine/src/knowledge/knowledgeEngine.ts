import {
  Requirement,
  RequirementIntelligenceReport,
  QAArtifact,
  ReviewReport,
  KnowledgeEntry,
  KnowledgeCategory,
  KnowledgeQuery,
  KnowledgeResult,
} from '../domain.js';
import { IKnowledgeEngine } from '../interfaces/index.js';
import { KnowledgeRepository } from './knowledgeRepository.js';

/**
 * DefaultKnowledgeEngine
 *
 * In-memory knowledge store that:
 * 1. Extracts bug patterns, test templates, and lessons from completed analysis runs.
 * 2. Answers keyword-based queries against accumulated entries.
 * 3. Finds similar past requirements using keyword overlap scoring.
 *
 * In v1 this is an in-memory store. Sprint 10 (Storage Layer) will add
 * persistence adapters (JSON, SQLite, SQL Server) behind this same interface.
 */
export class DefaultKnowledgeEngine implements IKnowledgeEngine {
  private readonly repo: KnowledgeRepository;
  private readonly store: KnowledgeEntry[] = [];

  constructor(customStorePath?: string) {
    this.repo = new KnowledgeRepository(customStorePath);
  }

  // ── Extract Knowledge ─────────────────────────────────────────────

  public async extractKnowledge(
    artifacts: QAArtifact[],
    intelligence: RequirementIntelligenceReport,
    review: ReviewReport,
  ): Promise<KnowledgeEntry[]> {
    const extracted: KnowledgeEntry[] = [];

    // 1. Bug patterns — derive from review issues
    for (const issue of review.issues) {
      if (issue.category === 'duplication' || issue.category === 'low-value') {
        extracted.push(
          this.createEntry(
            'bug-pattern',
            `Bug Pattern: ${issue.category}`,
            issue.description,
            [issue.category, 'review-issue', issue.severity],
            intelligence.requirementId,
            issue.fileArtifactId,
            0.85,
          ),
        );
      }
    }

    // 2. Common defects — derive from risk areas in intelligence report
    for (const risk of intelligence.riskAreas) {
      extracted.push(
        this.createEntry(
          'common-defect',
          `Risk Area: ${risk.area}`,
          `${risk.description} (Severity: ${risk.severity})`,
          [risk.area.toLowerCase(), 'risk', risk.severity],
          intelligence.requirementId,
          undefined,
          0.8,
        ),
      );
    }

    // 3. Test templates — extract from generated artifacts
    for (const art of artifacts) {
      const keywords = this.extractKeywords(art.content);
      if (keywords.length > 0) {
        extracted.push(
          this.createEntry(
            'test-template',
            `Template: ${art.type}`,
            `Reusable ${art.type} template from requirement ${intelligence.requirementId}.`,
            keywords,
            intelligence.requirementId,
            art.id,
            0.75,
          ),
        );
      }
    }

    // 4. Lessons learned — derive from review suggestions
    for (const suggestion of review.suggestions) {
      extracted.push(
        this.createEntry(
          'lesson-learned',
          'Lesson Learned',
          suggestion,
          this.extractKeywords(suggestion),
          intelligence.requirementId,
          undefined,
          0.7,
        ),
      );
    }

    // 5. Reusable assertions — extract from business rules
    for (const rule of intelligence.businessRules) {
      extracted.push(
        this.createEntry(
          'reusable-assertion',
          `Assertion: ${rule.id}`,
          rule.description,
          this.extractKeywords(rule.description),
          intelligence.requirementId,
          undefined,
          0.8,
        ),
      );
    }

    // Persist all extracted entries into the in-memory store
    this.store.push(...extracted);

    // Also persist inside the KnowledgeRepository project memory scope
    for (const entry of extracted) {
      this.repo.getStore('project').push({
        id: entry.id,
        title: entry.title,
        type: entry.category === 'lesson-learned' ? 'lessons-learned' : 'org-standards',
        scope: 'project',
        content: entry.description,
        tags: entry.keywords,
        createdBy: 'AI Orchestrator',
        version: 1,
        confidence: entry.confidence,
        status: 'active',
        usageCount: 0
      });
    }
    this.repo.savePersistence();

    return extracted;
  }

  // ── Query Knowledge ───────────────────────────────────────────────

  public async queryKnowledge(query: KnowledgeQuery): Promise<KnowledgeResult> {
    const minConfidence = query.minConfidence ?? 0;
    const maxResults = query.maxResults ?? 10;

    let candidates = this.store.filter((e) => e.confidence >= minConfidence);

    if (query.category) {
      candidates = candidates.filter((e) => e.category === query.category);
    }

    // Score each candidate by keyword overlap
    const scored = candidates.map((entry) => ({
      entry,
      relevanceScore: this.computeRelevance(query.keywords, entry.keywords),
    }));

    // Filter out zero-relevance and sort descending
    const matches = scored
      .filter((s) => s.relevanceScore > 0)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, maxResults);

    return {
      query,
      matches,
      searchedAt: new Date(),
    };
  }

  // ── Find Similar Requirements ─────────────────────────────────────

  public async findSimilarRequirements(requirement: Requirement): Promise<KnowledgeResult> {
    const queryText = requirement.title + ' ' + requirement.content;
    const matches = this.repo.search(queryText);
    
    return {
      query: { keywords: this.extractKeywords(requirement.title) },
      matches: matches.map((m) => ({
        entry: {
          id: m.item.id,
          category: 'user-correction',
          title: m.item.title,
          description: m.item.content,
          keywords: m.item.tags,
          confidence: m.item.confidence,
          createdAt: m.item.approvedOn || new Date()
        },
        relevanceScore: m.relevance
      })),
      searchedAt: new Date()
    };
  }

  public getRepository(): KnowledgeRepository {
    return this.repo;
  }

  public async learnFromCorrection(
    requirementId: string,
    questionText: string,
    correctedAnswer: string,
  ): Promise<KnowledgeEntry> {
    const entry = this.createEntry(
      'user-correction',
      `Manual Correction: ${questionText.slice(0, 40)}...`,
      `For requirement question "${questionText}", user correction/clarification is: "${correctedAnswer}"`,
      this.extractKeywords(questionText + ' ' + correctedAnswer),
      requirementId,
      undefined,
      0.95,
    );
    this.store.push(entry);

    // Sync to KnowledgeRepository suggestion list
    this.repo.addSuggestion(
      `Correction: ${questionText.slice(0, 30)}`,
      'lessons-learned',
      correctedAnswer,
      undefined,
      ['correction', 'user-added']
    );

    return entry;
  }

  // ── Store accessor ────────────────────────────────────────────────

  public getStore(): KnowledgeEntry[] {
    return [...this.store];
  }

  // ── Private helpers ───────────────────────────────────────────────

  private createEntry(
    category: KnowledgeCategory,
    title: string,
    description: string,
    keywords: string[],
    sourceRequirementId: string | undefined,
    sourceArtifactId: string | undefined,
    confidence: number,
  ): KnowledgeEntry {
    return {
      id: `KE-${Date.now().toString().slice(-4)}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`,
      category,
      title,
      description,
      keywords: [...new Set(keywords.map((k) => k.toLowerCase()))],
      sourceRequirementId,
      sourceArtifactId,
      confidence,
      createdAt: new Date(),
    };
  }

  private extractKeywords(text: string): string[] {
    const stopWords = new Set([
      'the',
      'and',
      'for',
      'are',
      'but',
      'not',
      'you',
      'all',
      'can',
      'has',
      'her',
      'was',
      'one',
      'our',
      'out',
      'with',
      'that',
      'this',
      'from',
      'they',
      'been',
      'have',
      'will',
      'each',
      'make',
      'like',
      'into',
      'them',
      'then',
      'than',
      'should',
      'would',
      'could',
      'their',
      'there',
      'about',
    ]);

    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 3 && !stopWords.has(w));
  }

  private computeRelevance(queryKeywords: string[], entryKeywords: string[]): number {
    if (queryKeywords.length === 0 || entryKeywords.length === 0) return 0;

    const querySet = new Set(queryKeywords.map((k) => k.toLowerCase()));
    const entrySet = new Set(entryKeywords.map((k) => k.toLowerCase()));

    let overlap = 0;
    for (const word of querySet) {
      if (entrySet.has(word)) overlap++;
    }

    // Jaccard similarity: intersection / union
    const union = new Set([...querySet, ...entrySet]).size;
    return union > 0 ? Math.round((overlap / union) * 100) / 100 : 0;
  }
}
