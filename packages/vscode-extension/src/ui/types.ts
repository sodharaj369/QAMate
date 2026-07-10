export type WorkspaceStep =
  'NoSession' | 'Understand' | 'Prepare' | 'Plan' | 'Generate' | 'Review' | 'Deliver';

export type WorkspaceTab = 
  | 'dashboard'
  | 'requirement'
  | 'system'
  | 'mental'
  | 'strategy'
  | 'artifacts'
  | 'review'
  | 'deliver'
  | 'recommendations'
  | 'sessions'
  | 'settings'
  | 'hub';

export interface WorkspaceState {
  currentStep: WorkspaceStep;
  activeSessionId?: string;
  timelineEvents: string[];
  devModeEnabled: boolean;
  activeTab?: WorkspaceTab;
}
