export class SecurityFoundation {
  private readonly secretRegexes = [
    // API keys & Secret tokens
    /(api[_-]?key|secret[_-]?key|private[_-]?key|auth[_-]?token|bearer\s+token)\s*[:=]\s*['"]([a-zA-Z0-9_\-.~]{10,})['"]/gi,
    // Password constants
    /(password|passphrase|pwd)\s*[:=]\s*['"]([^'"]{4,})['"]/gi,
  ];

  private readonly injectionIndicators = [
    /ignore\s+(previous|system|rule|instruction)/i,
    /override\s+(previous|system|rule|instruction)/i,
    /jailbreak/i,
    /forget\s+all\s+(rules|instructions)/i,
    /new\s+(instruction|persona|identity)/i,
    /you\s+are\s+now\s+a/i,
  ];

  /**
   * Redacts passwords, API keys, and authorization secrets from text prompts.
   */
  public redactSecrets(content: string): string {
    let sanitized = content;
    for (const regex of this.secretRegexes) {
      sanitized = sanitized.replace(regex, (match, prefix) => {
        return `${prefix}: "[REDACTED]"`;
      });
    }
    return sanitized;
  }

  /**
   * Scans a prompt to detect adversarial prompt injection attempts.
   */
  public detectPromptInjection(prompt: string): { isUnsafe: boolean; indicators: string[] } {
    const indicators: string[] = [];

    for (const indicator of this.injectionIndicators) {
      const match = prompt.match(indicator);
      if (match) {
        indicators.push(match[0]);
      }
    }

    return {
      isUnsafe: indicators.length > 0,
      indicators,
    };
  }

  /**
   * Sanitizes basic input elements.
   */
  public sanitizeInput(input: string): string {
    // eslint-disable-next-line no-control-regex
    return input.trim().replace(/[\0\x08\x09\x1a\n\r]/g, ' ');
  }
}
