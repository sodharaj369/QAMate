import { describe, it, expect, afterAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { Conversation, KnowledgeEntry } from '../src/domain.js';
import { JsonFileStorage, SQLiteSimulatedStorage, SQLServerSimulatedStorage } from '../src/storage/index.js';

const tempDir = path.resolve('packages/engine/tests/temp/storage_test');

const cleanTempDir = () => {
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
};

const makeMockConversation = (): Conversation => ({
  id: 'conv-test-123',
  projectId: 'proj-1',
  requirementId: 'req-1',
  status: 'ready-for-generation',
  currentIntelligence: {
    requirementId: 'req-1',
    analyzedAt: new Date(),
    actors: [],
    entities: [],
    businessRules: [],
    ambiguities: [],
    missingInformation: [],
    riskAreas: [],
    complexity: { level: 'low', factors: [], rationale: 'simple' },
    confidenceScore: 1.0,
  },
  candidates: [],
  questions: [],
  answers: [
    {
      questionId: 'q-1',
      textValue: 'Mock answer',
      answeredAt: new Date(),
      answeredBy: 'Tester',
    }
  ],
  createdAt: new Date(),
  updatedAt: new Date(),
});

describe('Storage Layer tests', () => {
  afterAll(() => {
    cleanTempDir();
  });

  it('should save and load conversation correctly using JsonFileStorage', async () => {
    cleanTempDir();
    const storage = new JsonFileStorage(tempDir);
    const mockConv = makeMockConversation();

    await storage.saveConversation(mockConv);

    const loaded = await storage.loadConversation(mockConv.id);
    expect(loaded).toBeDefined();
    expect(loaded!.id).toBe(mockConv.id);
    expect(loaded!.createdAt).toBeInstanceOf(Date);
    expect(loaded!.answers[0].answeredAt).toBeInstanceOf(Date);

    const list = await storage.listConversations();
    expect(list).toContain(mockConv.id);
  });

  it('should write simulated SQL queries using SQLiteSimulatedStorage', async () => {
    cleanTempDir();
    const storage = new SQLiteSimulatedStorage(tempDir);
    const mockConv = makeMockConversation();

    await storage.saveConversation(mockConv);

    const sqlFile = path.join(tempDir, 'qamate_sqlite_sim.sql');
    expect(fs.existsSync(sqlFile)).toBe(true);

    const content = fs.readFileSync(sqlFile, 'utf-8');
    expect(content).toContain('INSERT OR REPLACE INTO Conversations');
    expect(content).toContain(mockConv.id);
  });

  it('should write simulated T-SQL statements using SQLServerSimulatedStorage', async () => {
    cleanTempDir();
    const storage = new SQLServerSimulatedStorage(tempDir);
    const mockConv = makeMockConversation();

    await storage.saveConversation(mockConv);

    const sqlFile = path.join(tempDir, 'qamate_sqlserver_sim.sql');
    expect(fs.existsSync(sqlFile)).toBe(true);

    const content = fs.readFileSync(sqlFile, 'utf-8');
    expect(content).toContain('UPDATE [dbo].[Conversations]');
    expect(content).toContain('INSERT INTO [dbo].[Conversations]');
    expect(content).toContain(mockConv.id);
  });
});
