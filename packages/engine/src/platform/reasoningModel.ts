import { AIObservation, CommunicationConfidence } from '../domain.js';

export interface SystemComponent {
  name: string;
  type: string;
  description?: string;
}

export interface SystemFlow {
  from: string;
  to: string;
  description: string;
  trigger?: string;
}

export interface SystemModel {
  readonly schemaVersion: number;
  name: string;
  components: SystemComponent[];
  flows: SystemFlow[];
  users: string[];
  qualityAttributes: string[];
  risks: string[];
  unknowns: string[];
}

export interface EvidenceGraph {
  system: SystemModel;
  rulesEvidence: string[];
  knowledgeEvidence: string[];
  aiObservations: AIObservation[];
}

export interface ReasoningTraceItem {
  decision: string;
  evidence: string[];
  confidence: number;
  reason: string;
}

export interface QAMentalModel {
  readonly schemaVersion: number;
  readonly mentalModelVersion: number;
  readonly revision: number;
  readonly generatedAt: Date;
  readonly confidenceMetadata?: CommunicationConfidence;
  facts: string[];
  assumptions: string[];
  inferences: string[];
  risks: string[];
  unknowns: string[];
  confidence: number; // overall percentage (0-100)
  recommendedTesting: string[];
  excludedTesting: string[];
  reasoningTrace: ReasoningTraceItem[];
}
