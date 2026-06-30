import * as fs from 'fs';
import * as path from 'path';
import { Conversation, KnowledgeEntry } from '../domain.js';
import { IConversationStorage, IKnowledgeStorage } from '../interfaces/index.js';

export class SQLServerSimulatedStorage implements IConversationStorage, IKnowledgeStorage {
  private readonly dbFile: string;

  constructor(baseDir: string = './data') {
    this.dbFile = path.resolve(baseDir, 'qamate_sqlserver_sim.sql');
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
-- Microsoft SQL Server T-SQL simulated MERGE / INSERT query
IF EXISTS (SELECT 1 FROM [dbo].[Conversations] WHERE [id] = '${conversation.id}')
  UPDATE [dbo].[Conversations]
  SET [status] = '${conversation.status}', [updated_at] = '${conversation.updatedAt.toISOString()}'
  WHERE [id] = '${conversation.id}';
ELSE
  INSERT INTO [dbo].[Conversations] ([id], [requirement_id], [status], [created_at], [updated_at])
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
-- Microsoft SQL Server T-SQL simulated INSERT query
IF NOT EXISTS (SELECT 1 FROM [dbo].[KnowledgeStore] WHERE [id] = '${entry.id}')
  INSERT INTO [dbo].[KnowledgeStore] ([id], [category], [title], [description], [confidence], [created_at])
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
