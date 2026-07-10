import * as fs from 'fs';
import * as path from 'path';
import { createRequire } from 'module';
import { Conversation, TestCase, KnowledgeEntry } from '../domain.js';
import { KnowledgeItem } from '../knowledge/knowledgeRepository.js';
import { IConversationStorage, IKnowledgeStorage } from '../interfaces/index.js';

const require = createRequire(import.meta.url);
const { DatabaseSync } = require('node:sqlite');

export class StorageManager {
  private db: any;

  constructor(dbPath: string) {
    if (dbPath !== ':memory:') {
      const dir = path.dirname(dbPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
    this.db = new DatabaseSync(dbPath);
    this.runMigrations();
  }

  private runMigrations(): void {
    const res = this.db.prepare('PRAGMA user_version').get() as any;
    const currentVersion = res ? (res.user_version ?? 0) : 0;

    const migrations = [
      // Version 1 Migration Script
      `
      CREATE TABLE IF NOT EXISTS Conversations (
        id TEXT PRIMARY KEY,
        requirementId TEXT,
        status TEXT,
        createdAt TEXT,
        updatedAt TEXT,
        analyticsJson TEXT
      );
      CREATE TABLE IF NOT EXISTS Requirements (
        id TEXT PRIMARY KEY,
        projectId TEXT,
        title TEXT,
        content TEXT,
        contentType TEXT,
        version INTEGER,
        status TEXT,
        metadataJson TEXT,
        createdAt TEXT
      );
      CREATE TABLE IF NOT EXISTS TestCases (
        id TEXT PRIMARY KEY,
        requirementId TEXT,
        conversationId TEXT,
        title TEXT,
        description TEXT,
        preconditionsJson TEXT,
        stepsJson TEXT,
        priority TEXT,
        tagsJson TEXT,
        createdAt TEXT,
        updatedAt TEXT,
        FOREIGN KEY(conversationId) REFERENCES Conversations(id) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS Knowledge (
        id TEXT PRIMARY KEY,
        title TEXT,
        type TEXT,
        scope TEXT,
        content TEXT,
        tagsJson TEXT,
        domain TEXT,
        createdBy TEXT,
        approvedBy TEXT,
        approvedOn TEXT,
        version INTEGER,
        confidence REAL,
        status TEXT,
        usageCount INTEGER
      );
      CREATE TABLE IF NOT EXISTS Playbooks (
        id TEXT PRIMARY KEY,
        name TEXT,
        content TEXT,
        version INTEGER,
        active INTEGER
      );
      CREATE TABLE IF NOT EXISTS Analytics (
        id TEXT PRIMARY KEY,
        conversationId TEXT,
        originalLength INTEGER,
        optimizedLength INTEGER,
        savedTokens INTEGER,
        savedPercent REAL,
        cacheHits INTEGER,
        estimatedSavingsUSD REAL,
        provider TEXT,
        timestamp TEXT
      );
      CREATE TABLE IF NOT EXISTS Settings (
        key TEXT PRIMARY KEY,
        value TEXT
      );
      `
    ];

    for (let i = currentVersion; i < migrations.length; i++) {
      this.db.exec(migrations[i]);
      this.db.exec(`PRAGMA user_version = ${i + 1}`);
    }
  }

  public getDatabase(): any {
    return this.db;
  }

  public close(): void {
    if (this.db) {
      try {
        this.db.close();
      } catch {
        // DB might already be closed
      }
    }
  }
}

// ── ConversationRepository ──────────────────────────────────────────
export class ConversationRepository {
  constructor(private manager: StorageManager) {}

  public saveConversation(conv: Conversation): void {
    const db = this.manager.getDatabase();

    // 1. Insert or update Conversation
    const insertConv = db.prepare(`
      INSERT OR REPLACE INTO Conversations (id, requirementId, status, createdAt, updatedAt, analyticsJson)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    insertConv.run(
      conv.id as any,
      conv.requirementId as any,
      conv.status as any,
      conv.createdAt.toISOString() as any,
      conv.updatedAt.toISOString() as any,
      JSON.stringify((conv as any).analytics || {}) as any
    );

    // 2. Clear previous TestCases for this conversation to prevent duplicates
    const deleteCases = db.prepare('DELETE FROM TestCases WHERE conversationId = ?');
    deleteCases.run(conv.id as any);

    // 3. Insert normalized TestCases
    if (conv.testCases && conv.testCases.length > 0) {
      const insertCase = db.prepare(`
        INSERT INTO TestCases (id, requirementId, conversationId, title, description, preconditionsJson, stepsJson, priority, tagsJson, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const tc of conv.testCases) {
        insertCase.run(
          tc.id as any,
          (tc.requirementId || conv.requirementId || '') as any,
          conv.id as any,
          (tc.title || '') as any,
          (tc.description || '') as any,
          JSON.stringify(Array.isArray(tc.preconditions) ? tc.preconditions : [tc.preconditions].filter(Boolean)) as any,
          JSON.stringify(tc.steps || []) as any,
          (tc.priority || 'P1') as any,
          JSON.stringify(tc.tags || []) as any,
          (tc.createdAt ? tc.createdAt.toISOString() : conv.createdAt.toISOString()) as any,
          (tc.updatedAt ? tc.updatedAt.toISOString() : conv.updatedAt.toISOString()) as any
        );
      }
    }
  }

  public loadConversation(id: string): Conversation | undefined {
    const db = this.manager.getDatabase();

    const stmt = db.prepare('SELECT * FROM Conversations WHERE id = ?');
    const convRow = stmt.get(id) as any;
    if (!convRow) return undefined;

    // Load normalized TestCases
    const casesStmt = db.prepare('SELECT * FROM TestCases WHERE conversationId = ?');
    const casesRows = casesStmt.all(id) as any[];

    const testCases: TestCase[] = casesRows.map((row) => ({
      id: row.id,
      requirementId: row.requirementId,
      conversationId: row.conversationId,
      title: row.title,
      description: row.description || '',
      preconditions: JSON.parse(row.preconditionsJson || '[]'),
      steps: JSON.parse(row.stepsJson || '[]'),
      priority: row.priority as any,
      tags: JSON.parse(row.tagsJson || '[]'),
      createdAt: row.createdAt ? new Date(row.createdAt) : new Date(),
      updatedAt: row.updatedAt ? new Date(row.updatedAt) : new Date()
    }));

    return {
      id: convRow.id,
      projectId: 'sqlite-project',
      requirementId: convRow.requirementId,
      status: convRow.status as any,
      createdAt: new Date(convRow.createdAt),
      updatedAt: new Date(convRow.updatedAt),
      testCases,
      candidates: [],
      questions: [],
      answers: [],
      analytics: JSON.parse(convRow.analyticsJson || '{}')
    } as any;
  }

  public listConversations(): string[] {
    const db = this.manager.getDatabase();
    const rows = db.prepare('SELECT id FROM Conversations').all() as any[];
    return rows.map((r) => r.id);
  }
}

// ── SQLKnowledgeRepository ──────────────────────────────────────────
export class SQLKnowledgeRepository {
  constructor(private manager: StorageManager) {}

  public saveKnowledge(items: KnowledgeItem[]): void {
    const db = this.manager.getDatabase();
    const insert = db.prepare(`
      INSERT OR REPLACE INTO Knowledge (
        id, title, type, scope, content, tagsJson, domain,
        createdBy, approvedBy, approvedOn, version, confidence, status, usageCount
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const item of items) {
      insert.run(
        item.id,
        item.title,
        item.type,
        item.scope,
        item.content,
        JSON.stringify(item.tags || []),
        item.domain || '',
        item.createdBy,
        item.approvedBy || '',
        item.approvedOn ? item.approvedOn.toISOString() : '',
        item.version,
        item.confidence,
        item.status,
        item.usageCount
      );
    }
  }

  public loadKnowledge(): KnowledgeItem[] {
    const db = this.manager.getDatabase();
    const rows = db.prepare('SELECT * FROM Knowledge').all() as any[];

    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      type: row.type as any,
      scope: row.scope as any,
      content: row.content,
      tags: JSON.parse(row.tagsJson || '[]'),
      domain: row.domain || undefined,
      createdBy: row.createdBy,
      approvedBy: row.approvedBy || undefined,
      approvedOn: row.approvedOn ? new Date(row.approvedOn) : undefined,
      version: row.version,
      confidence: row.confidence,
      status: row.status as any,
      usageCount: row.usageCount
    }));
  }
}

// ── AnalyticsRepository ─────────────────────────────────────────────
export class AnalyticsRepository {
  constructor(private manager: StorageManager) {}

  public saveAnalytics(id: string, conversationId: string, analytics: any): void {
    const db = this.manager.getDatabase();
    const insert = db.prepare(`
      INSERT OR REPLACE INTO Analytics (
        id, conversationId, originalLength, optimizedLength, savedTokens,
        savedPercent, cacheHits, estimatedSavingsUSD, provider, timestamp
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insert.run(
      id,
      conversationId,
      analytics.originalLength || 0,
      analytics.optimizedLength || 0,
      analytics.savedTokens || 0,
      analytics.savedPercent || 0,
      analytics.cacheHits || 0,
      analytics.estimatedSavingsUSD || 0,
      analytics.provider || '',
      new Date().toISOString()
    );
  }

  public getAnalytics(conversationId: string): any[] {
    const db = this.manager.getDatabase();
    return db.prepare('SELECT * FROM Analytics WHERE conversationId = ?').all(conversationId);
  }
}

// ── SettingsRepository ──────────────────────────────────────────────
export class SettingsRepository {
  constructor(private manager: StorageManager) {}

  public setSetting(key: string, value: string): void {
    const db = this.manager.getDatabase();
    const insert = db.prepare('INSERT OR REPLACE INTO Settings (key, value) VALUES (?, ?)');
    insert.run(key, value);
  }

  public getSetting(key: string): string | undefined {
    const db = this.manager.getDatabase();
    const row = db.prepare('SELECT value FROM Settings WHERE key = ?').get(key) as any;
    return row ? row.value : undefined;
  }
}

export class SQLiteDatabaseStorage implements IConversationStorage, IKnowledgeStorage {
  private manager: StorageManager;
  private convRepo: ConversationRepository;
  private knowledgeRepo: SQLKnowledgeRepository;

  constructor(dbPath: string) {
    this.manager = new StorageManager(dbPath);
    this.convRepo = new ConversationRepository(this.manager);
    this.knowledgeRepo = new SQLKnowledgeRepository(this.manager);
  }

  public async saveConversation(conversation: Conversation): Promise<void> {
    this.convRepo.saveConversation(conversation);
  }

  public async loadConversation(conversationId: string): Promise<Conversation | undefined> {
    return this.convRepo.loadConversation(conversationId);
  }

  public async listConversations(): Promise<string[]> {
    return this.convRepo.listConversations();
  }

  public async saveKnowledge(entries: KnowledgeEntry[]): Promise<void> {
    const items: KnowledgeItem[] = entries.map((entry) => ({
      id: entry.id,
      title: entry.title,
      type: entry.category === 'lesson-learned' ? 'lessons-learned' : 'org-standards',
      scope: 'project',
      content: entry.description,
      tags: entry.keywords,
      createdBy: 'System',
      version: 1,
      confidence: entry.confidence,
      status: 'active',
      usageCount: 0
    }));
    this.knowledgeRepo.saveKnowledge(items);
  }

  public async loadKnowledge(): Promise<KnowledgeEntry[]> {
    const items = this.knowledgeRepo.loadKnowledge();
    return items.map((item) => ({
      id: item.id,
      category: item.type === 'lessons-learned' ? 'lesson-learned' : 'bug-pattern',
      title: item.title,
      description: item.content,
      keywords: item.tags,
      confidence: item.confidence,
      createdAt: item.approvedOn || new Date()
    }));
  }

  public getManager(): StorageManager {
    return this.manager;
  }

  public close(): void {
    this.manager.close();
  }
}
