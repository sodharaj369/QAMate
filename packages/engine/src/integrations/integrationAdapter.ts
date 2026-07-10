export interface IntegrationHealth {
  status: 'healthy' | 'warning' | 'error';
  message: string;
}

export interface SyncResult {
  remoteId: string;
  url?: string;
  status: 'completed' | 'failed' | 'retry';
  error?: string;
}

export interface IIntegrationAdapter {
  readonly id: string;
  readonly name: string;
  checkHealth(credentials: any): Promise<IntegrationHealth>;
  exportTestCases(testCases: any[], parentId: string, credentials: any): Promise<SyncResult>;
}
