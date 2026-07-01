export type WorkspaceStep =
  'NoSession' | 'Understand' | 'Prepare' | 'Plan' | 'Generate' | 'Review' | 'Deliver';

export interface WorkspaceState {
  currentStep: WorkspaceStep;
  activeSessionId?: string;
  timelineEvents: string[];
  devModeEnabled: boolean;
  activeTab?: 'home' | 'sessions' | 'settings' | 'help';
}
