# QAMate Storage Layer

The **Storage Layer** provides persistence capabilities to load and save QAMate conversation session states (`Conversation`) and extracted memory base entries (`KnowledgeEntry`) across runs.

---

## 1. Modular Interface Design

To remain stateless and decoupled from specific storage backends, the `@qamate/engine` defines two contracts in **`interfaces/index.ts`**:

```typescript
export interface IConversationStorage {
  saveConversation(conversation: Conversation): Promise<void>;
  loadConversation(conversationId: string): Promise<Conversation | undefined>;
  listConversations(): Promise<string[]>;
}

export interface IKnowledgeStorage {
  saveKnowledge(entries: KnowledgeEntry[]): Promise<void>;
  loadKnowledge(): Promise<KnowledgeEntry[]>;
}
```

---

## 2. Implemented Adapters

### JSON File Storage (`JsonFileStorage`)
- **Location**: `./data/conversations/` and `./data/knowledge/`
- **Rationale**: Clean, lightweight, zero-dependency file-based storage. Reconstructs Date objects and parses complex arrays into domain models upon retrieval.

### SQLite Simulated SQL Logger (`SQLiteSimulatedStorage`)
- **Location**: Appends ANSI SQL statements to `./data/qamate_sqlite_sim.sql`
- **Rationale**: Writes structured `INSERT OR REPLACE` table entries matching SQLite syntax schemas without importing binary SQLite libraries (avoiding platform compilation conflicts).

### Microsoft SQL Server Simulated Storage (`SQLServerSimulatedStorage`)
- **Location**: Appends Transact-SQL statements to `./data/qamate_sqlserver_sim.sql`
- **Rationale**: Emits T-SQL operations (such as `IF EXISTS... UPDATE... ELSE... INSERT...`) matching SQL Server dialect.

---

## 3. Session Resumption Flow

Upon execution, the CLI checks for saved JSON files in `./data/conversations/`:

1. **Session Prompt**:
   - `Do you want to: 1. Start new analysis (Default) 2. Load existing session`
2. **Resumption**:
   - If choice is `2`, lists file ids, loads conversation state, revives dates, and directly advances to target context generation.
3. **Automatic Persistence**:
   - At CLI pipeline completion, prompts the user to save: `Choose save option: 1. Save to JSON File, 2. Save + SQLite query log, 3. Save + SQL Server query log, 4. Do not save`.
