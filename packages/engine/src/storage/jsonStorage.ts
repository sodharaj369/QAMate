import * as fs from 'fs';
import * as path from 'path';
import { Conversation, KnowledgeEntry } from '../domain.js';
import { IConversationStorage, IKnowledgeStorage } from '../interfaces/index.js';

export class JsonFileStorage implements IConversationStorage, IKnowledgeStorage {
  private readonly convDir: string;
  private readonly knowledgeFile: string;

  constructor(baseDir: string = './data') {
    this.convDir = path.resolve(baseDir, 'conversations');
    this.knowledgeFile = path.resolve(baseDir, 'knowledge', 'store.json');
    this.ensureDirs();
  }

  private ensureDirs(): void {
    if (!fs.existsSync(this.convDir)) {
      fs.mkdirSync(this.convDir, { recursive: true });
    }
    const knowledgeDir = path.dirname(this.knowledgeFile);
    if (!fs.existsSync(knowledgeDir)) {
      fs.mkdirSync(knowledgeDir, { recursive: true });
    }
  }

  // Conversation storage methods
  public async saveConversation(conversation: Conversation): Promise<void> {
    this.ensureDirs();
    const filePath = path.join(this.convDir, `${conversation.id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(conversation, null, 2), 'utf-8');
  }

  public async loadConversation(conversationId: string): Promise<Conversation | undefined> {
    const filePath = path.join(this.convDir, `${conversationId}.json`);
    if (!fs.existsSync(filePath)) {
      return undefined;
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(content);

    // Revive date objects
    return this.reviveConversation(parsed);
  }

  public async listConversations(): Promise<string[]> {
    if (!fs.existsSync(this.convDir)) {
      return [];
    }
    const files = fs.readdirSync(this.convDir);
    return files
      .filter((file) => file.endsWith('.json'))
      .map((file) => path.basename(file, '.json'));
  }

  // Knowledge storage methods
  public async saveKnowledge(entries: KnowledgeEntry[]): Promise<void> {
    this.ensureDirs();
    const existing = await this.loadKnowledge();
    const merged = [...existing];

    for (const entry of entries) {
      if (!merged.some((e) => e.id === entry.id)) {
        merged.push(entry);
      }
    }
    fs.writeFileSync(this.knowledgeFile, JSON.stringify(merged, null, 2), 'utf-8');
  }

  public async loadKnowledge(): Promise<KnowledgeEntry[]> {
    if (!fs.existsSync(this.knowledgeFile)) {
      return [];
    }
    const content = fs.readFileSync(this.knowledgeFile, 'utf-8');
    const parsed = JSON.parse(content) as any[];
    return parsed.map((e) => ({
      ...e,
      createdAt: new Date(e.createdAt),
    }));
  }

  private reviveConversation(raw: any): Conversation {
    return {
      ...raw,
      createdAt: new Date(raw.createdAt),
      updatedAt: new Date(raw.updatedAt),
      answers: raw.answers.map((a: any) => ({
        ...a,
        answeredAt: new Date(a.answeredAt),
      })),
      questions: raw.questions.map((q: any) => ({
        ...q,
        answer: q.answer
          ? {
              ...q.answer,
              answeredAt: new Date(q.answer.answeredAt),
            }
          : undefined,
      })),
    };
  }
}
