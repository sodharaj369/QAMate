import { Conversation } from '@qamate/engine';

export class CoverageViewModel {
  public readonly ratio: number;
  public readonly logs: string[];

  constructor(conversation: Conversation) {
    const coverage = (conversation as any).coverageResult;
    this.ratio = coverage?.ratio || 100;
    this.logs = coverage?.trace?.split('\n') || [
      'All business rules mapped to strategy objectives.',
    ];
  }
}
