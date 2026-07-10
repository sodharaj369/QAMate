export class SemanticValidator {
  /**
   * Asserts semantic integrity for a rephrase operation, checking that
   * core business verbs and nouns are preserved between original and rephrased texts.
   */
  public verifyRephrase(original: string, rephrased: string): { isValid: boolean; warnings: string[] } {
    const warnings: string[] = [];
    const origLower = original.toLowerCase();
    const rephLower = rephrased.toLowerCase();

    // 1. Core keywords check (words with length > 5 that are likely key domain components)
    const keywords = origLower
      .split(/[^a-zA-Z0-9]/)
      .map(w => w.trim())
      .filter(w => w.length > 5);

    const missingKeywords = keywords.filter(w => !rephLower.includes(w));
    
    // Allow up to 30% of long words to be altered or mapped to synonyms, but warn/fail if major ones vanish
    if (missingKeywords.length > 0) {
      warnings.push(`The rephrased text omitted or mapped away these core keywords: ${missingKeywords.join(', ')}`);
    }

    // 2. Length Integrity limit
    if (rephLower.length < origLower.length * 0.4) {
      return {
        isValid: false,
        warnings: [...warnings, 'Critical failure: Rephrased output is too short (under 40% of original), suggesting massive context truncation.']
      };
    }

    // If critical business key indicators like "stripe", "alert", or "jwt" vanish entirely, fail
    const criticalNouns = ['stripe', 'paypal', 'insights', 'kql', 'jwt', 'mfa'];
    for (const noun of criticalNouns) {
      if (origLower.includes(noun) && !rephLower.includes(noun)) {
        return {
          isValid: false,
          warnings: [...warnings, `Critical failure: Semantic integrity violated. Core domain noun "${noun}" was dropped during rephrasing.`]
        };
      }
    }

    return {
      isValid: true,
      warnings
    };
  }
}
