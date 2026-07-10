import { WorkspaceState } from './types.js';

export interface AppStateData extends WorkspaceState {
  selectedPersona: string;
  selectedAIProvider: string;
  selectedAIModel: string;
  selectedAIEndpoint: string;
  adoOrg: string;
  adoProject: string;
  jiraDomain: string;
  jiraEmail: string;
  hasOpenAIKey: boolean;
  hasClaudeKey: boolean;
  hasGeminiKey: boolean;
  aiStatus: string;
  adoStatus: 'Connected' | 'Disconnected';
  jiraStatus: 'Connected' | 'Disconnected';
  adoConnected: boolean;
  jiraConnected: boolean;
  detectedFileName: string;
  sessionsCount: number;
  vsCodeLMAvailable: boolean;
  lmModelName: string;
}

export type AppStateListener = (state: AppStateData) => void;

export class AppState {
  private listeners: Set<AppStateListener> = new Set();
  private data: AppStateData;

  constructor(initialData: AppStateData) {
    this.data = { ...initialData };
  }

  public get(): AppStateData {
    return this.data;
  }

  public subscribe(listener: AppStateListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public update(changes: Partial<AppStateData>): void {
    this.data = { ...this.data, ...changes };
    this.notify();
  }

  private notify(): void {
    for (const listener of this.listeners) {
      try {
        listener(this.data);
      } catch (err) {
        console.error('QAMate AppState Listener Error:', err);
      }
    }
  }
}
