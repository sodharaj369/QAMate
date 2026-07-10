import { describe, it, expect } from 'vitest';
import { IntegrationHub, SyncManager, IIntegrationAdapter, SyncResult, IntegrationHealth } from '../src/integrations/index.js';

class MockTestAdapter implements IIntegrationAdapter {
  public readonly id = 'test-adapter';
  public readonly name = 'Mock Test Adapter';
  public shouldFail = false;
  public failWithRetry = false;

  public async checkHealth(credentials: any): Promise<IntegrationHealth> {
    return { status: 'healthy', message: 'Online' };
  }

  public async exportTestCases(testCases: any[], parentId: string, credentials: any): Promise<SyncResult> {
    if (this.shouldFail) {
      if (this.failWithRetry) {
        return { remoteId: '', status: 'retry', error: 'Temporary timeout' };
      }
      return { remoteId: '', status: 'failed', error: 'Hard failure' };
    }
    return { remoteId: 'REMOTE-123', status: 'completed', url: 'https://mock.com/REMOTE-123' };
  }
}

describe('Integrations & Sync Manager Pipeline', () => {
  it('should register and retrieve adapters successfully via IntegrationHub', () => {
    IntegrationHub.clear();
    const adapter = new MockTestAdapter();
    IntegrationHub.register(adapter);

    expect(IntegrationHub.get('test-adapter')).toBe(adapter);
    expect(IntegrationHub.list()).toContain(adapter);
  });

  it('should enqueue batch scenarios, handle offline status, and auto-flush on online', async () => {
    IntegrationHub.clear();
    const adapter = new MockTestAdapter();
    IntegrationHub.register(adapter);

    const syncManager = new SyncManager();
    syncManager.setOnlineStatus(false);

    syncManager.enqueue('conv-1', [{ id: 'TC-1', title: 'Test 1' }], 'test-adapter', 'PARENT-1', {});
    
    expect(syncManager.getQueue().length).toBe(1);
    expect(syncManager.getQueue()[0].status).toBe('retry');

    syncManager.setOnlineStatus(true);
    await syncManager.processQueue();

    expect(syncManager.getQueue()[0].status).toBe('completed');
    expect(syncManager.getQueue()[0].history.some(h => h.status === 'Synced')).toBe(true);

    const telemetry = syncManager.getTelemetry();
    expect(telemetry.successes).toBe(1);
    expect(telemetry.totalRuns).toBe(1);
  });

  it('should trigger retry sequence for failed operations with retry flags', async () => {
    IntegrationHub.clear();
    const adapter = new MockTestAdapter();
    adapter.shouldFail = true;
    adapter.failWithRetry = true;
    IntegrationHub.register(adapter);

    const syncManager = new SyncManager();
    syncManager.setOnlineStatus(true);

    syncManager.enqueue('conv-2', [{ id: 'TC-2', title: 'Test 2' }], 'test-adapter', 'PARENT-2', {});
    await syncManager.processQueue();
    
    expect(syncManager.getQueue()[0].status).toBe('retry');
    expect(syncManager.getQueue()[0].retries).toBe(1);
  });
});
