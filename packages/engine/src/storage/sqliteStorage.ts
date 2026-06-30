import * as fs from 'fs';
import * as path from 'path';
import { Conversation, KnowledgeEntry } from '../domain.js';
import { IConversationStorage, IKnowledgeStorage } from '../interfaces/index.js';

export class SQLiteSimulatedStorage implements IConversationStorage, IKnowledgeStorage {
  private readonly dbFile: string;

  constructor(baseDir: string = './data') {
    this.dbFile = path.resolve(baseDir, 'qamate_sqlite_sim.sql');
    this.ensureDirs();
  }

  private ensureDirs(): void {
    const dir = path.dirname(this.dbFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  public async saveConversation(conversation: Conversation): Promise<void> {
    this.ensureDirs();
    const query = `
-- SQLite simulated INSERT query
INSERT OR REPLACE INTO Conversations (id, requirement_id, status, created_at, updated_at)
VALUES (
  '${conversation.id}',
  '${conversation.requirementId}',
  '${conversation.status}',
  '${conversation.createdAt.toISOString()}',
  '${conversation.updatedAt.toISOString()}'
);
`;
    fs.appendFileSync(this.dbFile, query, 'utf-8');
  }

  public async loadConversation(_conversationId: string): Promise<Conversation | undefined> {
    return undefined;
  }

  public async listConversations(): Promise<string[]> {
    return [];
  }

  public async saveKnowledge(entries: KnowledgeEntry[]): Promise<void> {
    this.ensureDirs();
    let query = '';
    for (const entry of entries) {
      query += `
INSERT OR IGNORE INTO KnowledgeStore (id, category, title, description, confidence, created_at)
VALUES (
  '${entry.id}',
  '${entry.category}',
  '${entry.title.replace(/'/g, "''")}',
  '${entry.description.replace(/'/g, "''")}',
  ${entry.confidence},
  '${entry.createdAt.toISOString()}'
);
`;
    }
    fs.appendFileSync(this.dbFile, query, 'utf-8');
  }

  public async loadKnowledge(): Promise<KnowledgeEntry[]> {
    return [];
  }
}
