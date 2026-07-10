import { IAssumptionVerificationGate, IHumanFeedbackStore } from '../interfaces/index.js';
import { Assumption, AssumptionDecision } from '../domain.js';

export class AssumptionVerificationGate implements IAssumptionVerificationGate {
  private tracked: Assumption[] = [];

  constructor(private readonly feedbackStore: IHumanFeedbackStore) {}

  public loadAssumptions(newAssumptions: Assumption[]): void {
    const merged: Assumption[] = [];

    // 1. Always retain user-added manual assumptions
    const userAssumptions = this.tracked.filter(a => a.source === 'user');
    merged.push(...userAssumptions);

    // 2. Process incoming scan assumptions
    for (const incoming of newAssumptions) {
      // Find existing match by statement similarity (case-insensitive trim)
      const match = this.tracked.find(
        x => x.statement.toLowerCase().trim() === incoming.statement.toLowerCase().trim()
      );

      if (match) {
        // Preserve manual decisions, comment, and status!
        merged.push({
          ...incoming,
          id: match.id,
          status: match.status,
          userComment: match.userComment,
          decisions: [...match.decisions]
        });
      } else {
        // Brand new assumption
        merged.push({
          ...incoming,
          decisions: []
        });
      }
    }

    this.tracked = merged;
  }

  public confirmAssumption(id: string, user: string, comment?: string): void {
    const idx = this.tracked.findIndex(a => a.id === id);
    if (idx === -1) return;

    const current = this.tracked[idx];
    const decision: AssumptionDecision = {
      decision: 'confirm',
      timestamp: new Date(),
      user,
      comment
    };

    // Update status to confirmed and append decision log
    this.tracked[idx] = {
      ...current,
      status: 'confirmed',
      userComment: comment,
      decisions: [...current.decisions, decision]
    };
  }

  public rejectAssumption(id: string, user: string, comment?: string): void {
    const idx = this.tracked.findIndex(a => a.id === id);
    if (idx === -1) return;

    const current = this.tracked[idx];
    const decision: AssumptionDecision = {
      decision: 'reject',
      timestamp: new Date(),
      user,
      comment
    };

    this.tracked[idx] = {
      ...current,
      status: 'rejected',
      userComment: comment,
      decisions: [...current.decisions, decision]
    };

    // Dispatch Human Feedback correction separate from the knowledge database
    this.feedbackStore.addFeedback({
      targetId: id,
      targetType: 'assumption',
      action: 'reject',
      comment: comment || 'Rejected by user verification gate'
    });
  }

  public addManualAssumption(statement: string, user: string, reason?: string): void {
    const id = `ASSUMPTION-MANUAL-${Date.now().toString().slice(-4)}`;
    const decision: AssumptionDecision = {
      decision: 'confirm',
      timestamp: new Date(),
      user,
      comment: 'Manually added by user'
    };

    const newAssump: Assumption = {
      id,
      statement,
      source: 'user',
      confidence: 1.0,
      reason: reason || 'Manually asserted by user',
      evidence: ['User Workspace Edit'],
      status: 'confirmed',
      decisions: [decision]
    };

    this.tracked.push(newAssump);
  }

  public getAssumptions(): Assumption[] {
    return [...this.tracked];
  }
}
