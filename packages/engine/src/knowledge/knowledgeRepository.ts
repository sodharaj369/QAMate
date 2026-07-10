import * as fs from 'fs';
import * as path from 'path';

export interface KnowledgeItem {
  id: string;
  title: string;
  type:
    | 'lessons-learned'
    | 'domain-playbooks'
    | 'org-standards'
    | 'qa-personas'
    | 'prompt-templates'
    | 'testing-patterns'
    | 'common-risks'
    | 'requirement-patterns'
    | 'approved-suggestions'
    | 'team-preferences';
  scope: 'session' | 'project' | 'organization';
  content: string;
  tags: string[];
  domain?: string;
  createdBy: string;
  approvedBy?: string;
  approvedOn?: Date;
  version: number;
  confidence: number;
  status: 'suggestion' | 'review' | 'approved' | 'active' | 'deprecated' | 'archived';
  lastUsed?: Date;
  usageCount: number;
  explanation?: string;
}

export class KnowledgeRepository {
  private sessionStore: KnowledgeItem[] = [];
  private projectStore: KnowledgeItem[] = [];
  private orgStore: KnowledgeItem[] = [];

  // Version revision history manager
  private projectHistory: { version: number; items: KnowledgeItem[]; timestamp: Date }[] = [];

  private storePath = 'd:/QAMate/data/knowledge/store.json';

  constructor(customStorePath?: string) {
    if (customStorePath) {
      this.storePath = customStorePath;
    }
    this.loadPersistence();
  }

  private getDefaultOrgStore(): KnowledgeItem[] {
    return [
      {
        id: 'KNOW-ORG-1',
        title: 'Banking & Payments Standards',
        type: 'domain-playbooks',
        scope: 'organization',
        content: 'Always verify double-booking, race conditions, auth validations, response code SLAs, and database log encryption.',
        tags: ['banking', 'payments', 'pci-compliance'],
        domain: 'Banking & Payments',
        createdBy: 'QA Director',
        version: 1,
        confidence: 1.0,
        status: 'active',
        usageCount: 0,
        explanation: 'Standards policy rules guide for all transaction networks.'
      },
      {
        id: 'KNOW-ORG-2',
        title: 'Hospitality Playbook rules',
        type: 'domain-playbooks',
        scope: 'organization',
        content: 'Verify room availability lock race hazards, reservation state flows, checkout payment options, and tax code formulas.',
        tags: ['hospitality', 'booking', 'check-in'],
        domain: 'Hospitality',
        createdBy: 'Lead Architect',
        version: 1,
        confidence: 0.98,
        status: 'active',
        usageCount: 0,
        explanation: 'Operational playbook rules for hotel bookings systems.'
      }
    ];
  }

  // ── Persistence Layer ─────────────────────────────────────────────
  public loadPersistence(): void {
    try {
      const dir = path.dirname(this.storePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      if (fs.existsSync(this.storePath)) {
        const raw = fs.readFileSync(this.storePath, 'utf8');
        const data = JSON.parse(raw);
        this.projectStore = data.projectStore || [];
        this.orgStore = data.orgStore && data.orgStore.length > 0 ? data.orgStore : this.getDefaultOrgStore();
        this.projectHistory = data.projectHistory || [];
      } else {
        // Pre-populate with default playbooks (e.g. Hospitality, Banking)
        this.orgStore = this.getDefaultOrgStore();
        this.savePersistence();
      }
    } catch {
      // Safe fallback if filesystem access fails in sandbox environments
    }
  }

  public savePersistence(): void {
    try {
      const dir = path.dirname(this.storePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const data = {
        projectStore: this.projectStore,
        orgStore: this.orgStore,
        projectHistory: this.projectHistory,
      };
      fs.writeFileSync(this.storePath, JSON.stringify(data, null, 2), 'utf8');
    } catch {
      // Safe fallback
    }
  }

  // ── Relevance Search and Ranking ──────────────────────────────────
  public search(
    queryText: string,
    domain?: string,
    scope?: 'session' | 'project' | 'organization'
  ): { item: KnowledgeItem; relevance: number }[] {
    const queryWords = this.extractKeywords(queryText);
    let pool: KnowledgeItem[] = [];

    // Select tiered lookup pools
    if (!scope || scope === 'session') pool.push(...this.sessionStore);
    if (!scope || scope === 'project') pool.push(...this.projectStore);
    if (!scope || scope === 'organization') pool.push(...this.orgStore);

    // Filter active items only
    pool = pool.filter((item) => item.status === 'active' || item.status === 'approved');

    // Score relevance
    const scored = pool.map((item) => {
      let score = this.computeJaccard(queryWords, this.extractKeywords(item.content + ' ' + item.title));
      
      // Domain-Aware matching boost
      if (domain && item.domain?.toLowerCase() === domain.toLowerCase()) {
        score += 0.2; // 20% match relevance boost
      }

      return { item, relevance: Math.min(1.0, score) };
    });

    // Sort descending and return top 5
    return scored
      .filter((s) => s.relevance > 0)
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, 5);
  }

  // ── Suggestion Approval Gate (AI Safety Lock) ─────────────────────
  public addSuggestion(
    title: string,
    type: KnowledgeItem['type'],
    content: string,
    domain?: string,
    tags: string[] = []
  ): KnowledgeItem {
    const item: KnowledgeItem = {
      id: `SUG-${Date.now().toString().slice(-4)}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`,
      title,
      type,
      scope: 'project',
      content,
      tags,
      domain,
      createdBy: 'AI Orchestrator',
      version: 1,
      confidence: 0.85,
      status: 'suggestion',
      usageCount: 0,
      explanation: 'AI suggested optimization based on project requirement content patterns.'
    };

    this.projectStore.push(item);
    this.savePersistence();
    return item;
  }

  public approveSuggestion(id: string, approvedBy: string): KnowledgeItem {
    // Lock constraint: AI cannot approve its own suggestions
    if (approvedBy.toLowerCase().includes('ai') || approvedBy.toLowerCase().includes('orchestrator')) {
      throw new Error('AI Safety Lock: AI Orchestrator cannot bypass human QA approval gates.');
    }

    const item = this.projectStore.find((i) => i.id === id);
    if (!item) {
      throw new Error(`Suggestion ${id} not found in project store.`);
    }

    // Save previous state to project revision history before modification
    this.snapshotHistory();

    item.status = 'active';
    item.approvedBy = approvedBy;
    item.approvedOn = new Date();
    item.version += 1;

    this.savePersistence();
    return item;
  }

  // ── Version Rollbacks ─────────────────────────────────────────────
  private snapshotHistory(): void {
    const historyObj = {
      version: this.projectHistory.length + 1,
      items: JSON.parse(JSON.stringify(this.projectStore)),
      timestamp: new Date()
    };
    this.projectHistory.push(historyObj);
  }

  public rollback(version: number): void {
    const historyEntry = this.projectHistory.find((h) => h.version === version);
    if (!historyEntry) {
      throw new Error(`Revision history entry for version ${version} not found.`);
    }

    this.projectStore = JSON.parse(JSON.stringify(historyEntry.items));
    this.savePersistence();
  }

  // ── Helpers ───────────────────────────────────────────────────────
  public getStore(scope: 'session' | 'project' | 'organization'): KnowledgeItem[] {
    if (scope === 'session') return this.sessionStore;
    if (scope === 'project') return this.projectStore;
    return this.orgStore;
  }

  public getHistory() {
    return this.projectHistory;
  }

  public clearSessionStore(): void {
    this.sessionStore = [];
  }

  private extractKeywords(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 3);
  }

  private computeJaccard(a: string[], b: string[]): number {
    if (a.length === 0 || b.length === 0) return 0;
    const setA = new Set(a);
    const setB = new Set(b);
    let intersection = 0;
    for (const item of setA) {
      if (setB.has(item)) intersection++;
    }
    const union = new Set([...setA, ...setB]).size;
    return union > 0 ? intersection / union : 0;
  }
}
