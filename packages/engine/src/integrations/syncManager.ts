import { IIntegrationAdapter, IntegrationHealth } from './integrationAdapter.js';

export interface SyncQueueItem {
  id: string;
  conversationId: string;
  testCases: any[];
  adapterId: string;
  parentId: string;
  credentials: any;
  retries: number;
  status: 'pending' | 'uploading' | 'completed' | 'failed' | 'retry';
  history: { status: string; timestamp: Date; detail?: string }[];
  error?: string;
}

export interface TelemetryStats {
  totalRuns: number;
  successes: number;
  failures: number;
  retriesCount: number;
  averageLatencyMs: number;
}

// ── IntegrationHub ──────────────────────────────────────────────────
export class IntegrationHub {
  private static adapters = new Map<string, IIntegrationAdapter>();

  public static register(adapter: IIntegrationAdapter): void {
    this.adapters.set(adapter.id, adapter);
  }

  public static get(id: string): IIntegrationAdapter | undefined {
    return this.adapters.get(id);
  }

  public static list(): IIntegrationAdapter[] {
    return Array.from(this.adapters.values());
  }

  public static clear(): void {
    this.adapters.clear();
  }
}

// ── SyncManager ─────────────────────────────────────────────────────
export class SyncManager {
  private queue: SyncQueueItem[] = [];
  private isOnline = true;
  private isProcessing = false;

  // Telemetry metrics
  private totalRuns = 0;
  private successes = 0;
  private failures = 0;
  private retriesCount = 0;
  private totalLatencyMs = 0;

  constructor(private settingsRepo?: { setSetting(k: string, v: string): void; getSetting(k: string): string | undefined }) {
    this.loadQueueFromSettings();
  }

  // ── Connection Status ─────────────────────────────────────────────
  public setOnlineStatus(online: boolean): void {
    this.isOnline = online;
    if (online) {
      this.processQueue();
    }
  }

  public getOnlineStatus(): boolean {
    return this.isOnline;
  }

  // ── Queue Operations ──────────────────────────────────────────────
  public enqueue(
    conversationId: string,
    testCases: any[],
    adapterId: string,
    parentId: string,
    credentials: any
  ): SyncQueueItem {
    const item: SyncQueueItem = {
      id: `SYNC-${Date.now()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`,
      conversationId,
      testCases,
      adapterId,
      parentId,
      credentials,
      retries: 0,
      status: 'pending',
      history: [
        { status: 'Generated', timestamp: new Date(), detail: 'Artifact queued for synchronization.' }
      ]
    };

    this.queue.push(item);
    this.saveQueueToSettings();

    // Trigger process cycle
    this.processQueue();
    return item;
  }

  public async processQueue(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      while (this.queue.some((item) => item.status === 'pending' || item.status === 'retry')) {
        const item = this.queue.find((i) => i.status === 'pending' || i.status === 'retry');
        if (!item) break;

        // If offline, lock items as retry and break loop
        if (!this.isOnline) {
          item.status = 'retry';
          item.history.push({ status: 'Offline', timestamp: new Date(), detail: 'Network offline. Upload queued for reconnection.' });
          this.saveQueueToSettings();
          break;
        }

        await this.processItem(item);
      }
    } finally {
      this.isProcessing = false;
    }
  }

  private async processItem(item: SyncQueueItem): Promise<void> {
    item.status = 'uploading';
    item.history.push({ status: 'Uploading', timestamp: new Date(), detail: `Uploading cases to ${item.adapterId}...` });
    this.saveQueueToSettings();

    const adapter = IntegrationHub.get(item.adapterId);
    if (!adapter) {
      item.status = 'failed';
      item.error = `Adapter ${item.adapterId} not found.`;
      item.history.push({ status: 'Failed', timestamp: new Date(), detail: item.error });
      this.failures++;
      this.saveQueueToSettings();
      return;
    }

    this.totalRuns++;
    const startTime = Date.now();

    try {
      const res = await adapter.exportTestCases(item.testCases, item.parentId, item.credentials);
      const latency = Date.now() - startTime;
      this.totalLatencyMs += latency;

      if (res.status === 'completed') {
        item.status = 'completed';
        item.error = undefined;
        item.history.push({
          status: 'Synced',
          timestamp: new Date(),
          detail: `Upload success. Remote ID: ${res.remoteId}. URL: ${res.url || 'N/A'}`
        });
        item.history.push({ status: 'Closed', timestamp: new Date(), detail: 'Integration job finalized.' });
        this.successes++;
      } else if (res.status === 'retry' && item.retries < 3) {
        item.status = 'retry';
        item.retries++;
        this.retriesCount++;
        item.history.push({
          status: 'Retry',
          timestamp: new Date(),
          detail: `Temporary warning: ${res.error || 'Unknown error'}. Retry attempt ${item.retries}/3 scheduled.`
        });
      } else {
        item.status = 'failed';
        item.error = res.error || 'Failed validation check.';
        item.history.push({ status: 'Failed', timestamp: new Date(), detail: item.error });
        this.failures++;
      }
    } catch (err: any) {
      const latency = Date.now() - startTime;
      this.totalLatencyMs += latency;

      if (item.retries < 3) {
        item.status = 'retry';
        item.retries++;
        this.retriesCount++;
        item.history.push({
          status: 'Retry',
          timestamp: new Date(),
          detail: `Network error: ${err.message}. Retry attempt ${item.retries}/3 scheduled.`
        });
      } else {
        item.status = 'failed';
        item.error = err.message;
        item.history.push({ status: 'Failed', timestamp: new Date(), detail: item.error });
        this.failures++;
      }
    }

    this.saveQueueToSettings();
  }

  // ── Integration Health Metrics ───────────────────────────────────
  public async getHealthDashboard(credentials: Record<string, any>): Promise<Record<string, IntegrationHealth>> {
    const list = IntegrationHub.list();
    const dashboard: Record<string, IntegrationHealth> = {
      'sqlite': { status: 'healthy', message: 'Local storage repository connection online.' }
    };

    for (const adapter of list) {
      try {
        const creds = credentials[adapter.id] || {};
        const health = await adapter.checkHealth(creds);
        dashboard[adapter.id] = health;
      } catch (err: any) {
        dashboard[adapter.id] = { status: 'error', message: err.message };
      }
    }

    return dashboard;
  }

  // ── Telemetry accessors ───────────────────────────────────────────
  public getTelemetry(): TelemetryStats {
    const avgLatency = this.totalRuns > 0 ? Math.round(this.totalLatencyMs / this.totalRuns) : 0;
    return {
      totalRuns: this.totalRuns,
      successes: this.successes,
      failures: this.failures,
      retriesCount: this.retriesCount,
      averageLatencyMs: avgLatency
    };
  }

  public getQueue(): SyncQueueItem[] {
    return [...this.queue];
  }

  public clearQueue(): void {
    this.queue = [];
    this.saveQueueToSettings();
  }

  // ── Settings sync persistence ─────────────────────────────────────
  private saveQueueToSettings(): void {
    if (this.settingsRepo) {
      try {
        this.settingsRepo.setSetting('offline_sync_queue', JSON.stringify(this.queue));
      } catch {
        // Fallback
      }
    }
  }

  private loadQueueFromSettings(): void {
    if (this.settingsRepo) {
      try {
        const raw = this.settingsRepo.getSetting('offline_sync_queue');
        if (raw) {
          const parsed = JSON.parse(raw);
          this.queue = parsed.map((item: any) => ({
            ...item,
            history: item.history.map((h: any) => ({ ...h, timestamp: new Date(h.timestamp) }))
          }));
        }
      } catch {
        // Fallback
      }
    }
  }
}
