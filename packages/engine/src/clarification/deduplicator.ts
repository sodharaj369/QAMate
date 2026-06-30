import { QuestionCandidate } from '../domain.js';
import { IQuestionDeduplicator } from '../interfaces/index.js';

export class DefaultQuestionDeduplicator implements IQuestionDeduplicator {
  public async deduplicate(candidates: QuestionCandidate[]): Promise<QuestionCandidate[]> {
    const uniqueCandidates: QuestionCandidate[] = [];
    const textSignatureSet = new Set<string>();

    for (const cand of candidates) {
      // Normalize question text to check for duplicate queries
      const normalizedText = cand.text
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .trim();

      if (!textSignatureSet.has(normalizedText)) {
        textSignatureSet.add(normalizedText);
        uniqueCandidates.push(cand);
      }
    }

    return uniqueCandidates;
  }
}
