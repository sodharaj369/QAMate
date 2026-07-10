export class WorkspaceSecurity {
  /**
   * Masks sensitive credentials like passwords, API keys, and authorization secrets
   * before exporting reports or writing to logs.
   */
  public maskSecrets(content: string): string {
    const secretPatterns = [
      /(api[_-]?key|secret[_-]?key|private[_-]?key|auth[_-]?token|bearer\s+token|password|pwd)\s*[:=]\s*['"]([a-zA-Z0-9_\-.~]{10,})['"]/gi,
    ];
    let sanitized = content;
    for (const pattern of secretPatterns) {
      sanitized = sanitized.replace(pattern, (match, prefix) => {
        return `${prefix}: "[REDACTED]"`;
      });
    }
    return sanitized;
  }

  /**
   * Asserts workspace privacy rules (e.g. confirming that files don't leak environment details).
   */
  public checkPrivacyViolation(filePath: string): boolean {
    const baseName = filePath.toLowerCase();
    return baseName.includes('.env') || baseName.includes('key.pem') || baseName.includes('id_rsa');
  }

  /**
   * Sanitizes workspace paths to prevent directory traversal.
   */
  public sanitizePath(filePath: string): string {
    return filePath.replace(/\.\./g, '').replace(/[\\/]+/g, '/').replace(/^\//, '').trim();
  }
}

/**
 * @deprecated Use WorkspaceSecurity instead.
 */
export class SecurityFoundation extends WorkspaceSecurity {
  private readonly injectionIndicators = [
    /ignore\s+(previous|system|rule|instruction)/i,
    /override\s+(previous|system|rule|instruction)/i,
    /jailbreak/i,
    /forget\s+all\s+(rules|instructions)/i,
    /new\s+(instruction|persona|identity)/i,
    /you\s+are\s+now\s+a/i,
  ];

  public redactSecrets(content: string): string {
    return this.maskSecrets(content);
  }

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

  public sanitizeInput(input: string): string {
    return this.sanitizePath(input);
  }
}
