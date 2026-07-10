import { DecisionRecord } from '../domain.js';

export class RecommendationHistory {
  private readonly records: DecisionRecord[] = [];

  public logDecision(record: DecisionRecord): void {
    this.records.push(record);
  }

  public getHistory(): DecisionRecord[] {
    return [...this.records];
  }
}
