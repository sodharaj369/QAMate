import { Conversation } from '@qamate/engine';

export class ReviewViewModel {
  public readonly status: string;
  public readonly score: number;
  public readonly suggestions: string[];

  constructor(conversation: Conversation) {
    const review = (conversation as any).reviewResult;
    this.status = review?.status || 'APPROVED';
    this.score = review?.score || 95;
    this.suggestions = review?.suggestions || [];
  }
}
