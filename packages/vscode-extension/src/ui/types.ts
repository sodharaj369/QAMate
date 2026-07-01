export type WorkspaceStep = 
  | 'NoSession'
  | 'RequirementDetected'
  | 'Requirement'
  | 'Validation'
  | 'Intelligence'
  | 'Clarifications'
  | 'Strategy'
  | 'Artifacts'
  | 'Review'
  | 'Coverage'
  | 'Complete';

export interface WorkspaceState {
  currentStep: WorkspaceStep;
  activeSessionId?: string;
  timelineEvents: string[];
  devModeEnabled: boolean;
}
