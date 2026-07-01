import { Conversation } from '@qamate/engine';

export class RequirementViewModel {
  public readonly title: string;
  public readonly actors: string;
  public readonly entities: string;
  public readonly rulesCount: number;
  public readonly hasQuestions: boolean;
  public readonly detectedDomains: string;
  public readonly confidencePercent: number;

  constructor(conversation: Conversation) {
    const intel = conversation.currentIntelligence;
    this.title = (conversation as any).requirementTitle || conversation.id.replace('conv-', '');
    this.actors = intel?.actors.map(a => a.name).join(', ') || 'None';
    this.entities = intel?.entities.map(e => e.name).join(', ') || 'None';
    this.rulesCount = intel?.businessRules.length || 0;
    this.hasQuestions = conversation.questions.length > 0;
    this.detectedDomains = (conversation as any).detectedDomains?.join(', ') || 'General Scope';
    this.confidencePercent = (conversation as any).confidencePercent || 80;
  }
}
