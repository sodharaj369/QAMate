import { IHumanFeedbackStore } from '../interfaces/index.js';
import { HumanFeedback } from '../domain.js';

export class HumanFeedbackStore implements IHumanFeedbackStore {
  private readonly items: HumanFeedback[] = [];

  public async addFeedback(
    feedback: Omit<HumanFeedback, 'id' | 'timestamp'>
  ): Promise<HumanFeedback> {
    const item: HumanFeedback = {
      id: `FEEDBACK-${Date.now().toString().slice(-4)}-${Math.random().toString().slice(-3)}`,
      timestamp: new Date(),
      ...feedback
    };
    this.items.push(item);
    return item;
  }

  public async getFeedbackForTarget(targetId: string): Promise<HumanFeedback[]> {
    return this.items.filter(f => f.targetId === targetId);
  }

  public async getAllFeedback(): Promise<HumanFeedback[]> {
    return [...this.items];
  }
}
