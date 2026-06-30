export interface TrustScoreReport {
  readonly score: number; // between 0.0 and 1.0
  readonly confidence: number;
  readonly evidenceCount: number;
  readonly reasoningTrace: string[];
  readonly status: 'trusted' | 'uncertain' | 'untrusted';
}

export class TrustFramework {
  private readonly traceLogs: string[] = [];
  private readonly evidences: string[] = [];

  public addTrace(log: string): void {
    this.traceLogs.push(`[${new Date().toISOString()}] ${log}`);
  }

  public addEvidence(evidence: string): void {
    this.evidences.push(evidence);
  }

  /**
   * Calculates overall trust score by combining base confidence with evidence size
   * and subtracting gaps penalties.
   */
  public calculateTrust(
    baseConfidence: number,
    gapsCount: number,
    ambiguitiesCount: number,
  ): TrustScoreReport {
    this.addTrace(`Computing Trust Score. Base Confidence: ${baseConfidence}`);
    this.addTrace(`Gaps: ${gapsCount}, Ambiguities: ${ambiguitiesCount}`);

    // Penalize gaps and ambiguities
    const penalty = gapsCount * 0.08 + ambiguitiesCount * 0.05;
    let score = baseConfidence - penalty;

    // Bonus for collected evidence
    const evidenceBonus = Math.min(this.evidences.length * 0.02, 0.1);
    score += evidenceBonus;

    // Boundary cap
    score = Math.max(0, Math.min(1, score));
    score = Math.round(score * 100) / 100;

    let status: 'trusted' | 'uncertain' | 'untrusted' = 'trusted';
    if (score < 0.5) {
      status = 'untrusted';
    } else if (score < 0.8) {
      status = 'uncertain';
    }

    this.addTrace(`Calculated final Trust Score: ${score} (${status})`);

    return {
      score,
      confidence: baseConfidence,
      evidenceCount: this.evidences.length,
      reasoningTrace: [...this.traceLogs],
      status,
    };
  }

  /**
   * Checks if a prompt context is completely out-of-bounds or empty.
   */
  public detectUnknown(text: string): boolean {
    const trimmed = text.trim().toLowerCase();
    if (trimmed.length < 10) return true;

    const unknownKeywords = [
      'i dont know',
      "i don't know",
      'unknown content',
      'empty requirement',
      'not applicable',
      'unspecified',
    ];

    return unknownKeywords.some((keyword) => trimmed.includes(keyword));
  }

  public getTraceLogs(): string[] {
    return [...this.traceLogs];
  }

  public clear(): void {
    this.traceLogs.length = 0;
    this.evidences.length = 0;
  }
}
