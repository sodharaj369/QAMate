import { Requirement, Actor, DomainEntity, BusinessRule } from '../domain.js';
import { IAnalysisStrategy } from './interfaces.js';
import { AmbiguityReport, MissingInfoReport } from './models.js';

/**
 * Concrete implementation of IAnalysisStrategy using static heuristics, Regex,
 * and text parsing dictionaries.
 */
export class RuleBasedAnalysisStrategy implements IAnalysisStrategy {
  public readonly name = 'rule-based-heuristics-analyzer';
  public readonly type = 'static-rule';

  public async analyze(requirement: Requirement): Promise<{
    ambiguities: AmbiguityReport[];
    missingInfo: MissingInfoReport[];
    businessRules: BusinessRule[];
    actors: Actor[];
    entities: DomainEntity[];
    complexity?: {
      level: 'low' | 'medium' | 'high';
      factors: string[];
      rationale: string;
    };
  }> {
    const text = requirement.content;
    const lines = text.split('\n').map((line) => line.trim());

    // 1. Extract Actors
    const actors = this.extractActors(lines);

    // 2. Extract Entities
    const entities = this.extractEntities(text, lines);

    // 3. Extract Business Rules
    const businessRules = this.extractBusinessRules(lines);

    // 4. Detect Ambiguities
    const ambiguities = this.detectAmbiguities(lines);

    // 5. Detect Missing Information Gaps
    const missingInfo = this.detectMissingInfo(text);

    // 6. Calculate Complexity
    const complexity = this.calculateComplexity(businessRules, text);

    return {
      actors,
      entities,
      businessRules,
      ambiguities,
      missingInfo,
      complexity,
    };
  }

  /**
   * Parses actors from standard Agile stories (As a <Role>...) or list elements.
   */
  private extractActors(lines: string[]): Actor[] {
    const actorsMap = new Map<string, string>();

    // Pattern 1: User story format "As a/an <Actor>"
    const storyRegex = /as a[n]?\s+([a-zA-Z\s-]+?)(?:,|\s+i\s+want)/i;

    for (const line of lines) {
      const match = storyRegex.exec(line);
      if (match && match[1]) {
        const actorName = match[1].trim();
        // Capitalize first letter
        const formattedName = actorName.charAt(0).toUpperCase() + actorName.slice(1);
        actorsMap.set(formattedName, `Extracted actor from user story template: "${line}"`);
      }

      // Pattern 2: Explicit definition keywords "Actor: Admin" or "User role: Admin"
      const explicitRegex = /(?:actor|user\s+role|role):\s*([a-zA-Z\s-]+)/i;
      const explicitMatch = explicitRegex.exec(line);
      if (explicitMatch && explicitMatch[1]) {
        const actorName = explicitMatch[1].trim();
        const formattedName = actorName.charAt(0).toUpperCase() + actorName.slice(1);
        actorsMap.set(formattedName, `Explicitly declared actor role.`);
      }
    }

    // Default actor if none identified
    if (actorsMap.size === 0) {
      actorsMap.set('User', 'Default system user acting on the system.');
    }

    return Array.from(actorsMap.entries()).map(([name, description]) => ({
      name,
      description,
    }));
  }

  /**
   * Extracts entities by locating code ticks (`Entity`) or capitalized phrases.
   */
  private extractEntities(text: string, lines: string[]): DomainEntity[] {
    const entityMap = new Map<string, Set<string>>();

    // Heuristic 1: Backtick words (e.g. `ShoppingCart`)
    const tickRegex = /`([a-zA-Z]+)`/g;
    let tickMatch;
    while ((tickMatch = tickRegex.exec(text)) !== null) {
      if (tickMatch[1]) {
        const name = tickMatch[1];
        if (!entityMap.has(name)) {
          entityMap.set(name, new Set());
        }
      }
    }

    // Heuristic 2: Capitalized singular nouns after bullet points or definitions
    const bulletRegex = /^\s*[-+*]\s+([A-Z][a-zA-Z]+)(?:\s|$|:)/;
    for (const line of lines) {
      const match = bulletRegex.exec(line);
      if (match && match[1]) {
        const name = match[1];
        // Filter out common workflow words
        const ignoreList = ['The', 'If', 'When', 'Then', 'As', 'User', 'Actor', 'Must', 'Should'];
        if (!ignoreList.includes(name)) {
          if (!entityMap.has(name)) {
            entityMap.set(name, new Set());
          }
        }
      }
    }

    // Attempt to map simple fields (properties) associated with entities
    // Search lines containing the entity name for property keywords
    for (const entityName of entityMap.keys()) {
      const properties = entityMap.get(entityName)!;
      const lowerEntity = entityName.toLowerCase();

      for (const line of lines) {
        if (line.toLowerCase().includes(lowerEntity)) {
          // Find potential attribute keywords (id, name, status, amount, date)
          const attrWords = [
            'id',
            'name',
            'status',
            'email',
            'date',
            'price',
            'quantity',
            'total',
            'type',
          ];
          for (const word of attrWords) {
            if (
              line.toLowerCase().includes(` ${word}`) ||
              line.toLowerCase().includes(`${lowerEntity}.${word}`)
            ) {
              properties.add(word);
            }
          }
        }
      }
    }

    // Fallback default entity
    if (entityMap.size === 0) {
      entityMap.set('SystemState', new Set(['id', 'status']));
    }

    return Array.from(entityMap.entries()).map(([name, props]) => ({
      name,
      properties: Array.from(props),
      relationships: [], // Static rule-based parser defaults to empty relationships
    }));
  }

  /**
   * Extracts business rule assertions using logical keyword detectors.
   */
  private extractBusinessRules(lines: string[]): BusinessRule[] {
    const rules: BusinessRule[] = [];
    const ruleKeywords = [
      /must\s+/i,
      /should\s+/i,
      /always\s+/i,
      /only\s+/i,
      /never\s+/i,
      /shall\s+/i,
      /requires\s+/i,
    ];
    let idCounter = 1;

    for (const line of lines) {
      const matchesKeyword = ruleKeywords.some((regex) => regex.test(line));
      if (matchesKeyword && line.length > 10 && !line.startsWith('#')) {
        // Attempt to split conditions (e.g. If ... then ...)
        let condition = 'Always active';
        let expectedOutcome = line;

        if (line.toLowerCase().includes('if ')) {
          const parts = line.split(/then|should|must/i);
          if (parts.length >= 2) {
            condition = parts[0].trim();
            expectedOutcome = parts.slice(1).join(' ').trim();
          }
        }

        rules.push({
          id: `BR-${String(idCounter++).padStart(3, '0')}`,
          description: line,
          condition,
          expectedOutcome,
        });
      }
    }

    return rules;
  }

  /**
   * Scans text for vague adjectives and incomplete conditional branches.
   */
  private detectAmbiguities(lines: string[]): AmbiguityReport[] {
    const reports: AmbiguityReport[] = [];
    const vagueWords = [
      { word: 'fast', suggestion: 'Define target execution time in ms (e.g., < 200ms).' },
      { word: 'instant', suggestion: 'Specify exact threshold SLA (e.g., response < 500ms).' },
      { word: 'secure', suggestion: 'Describe required cryptography, token types, or protocols.' },
      { word: 'normal', suggestion: 'Specify which path is considered normal and define steps.' },
      {
        word: 'usually',
        suggestion: 'Remove probabilistics. Define criteria determining execution paths.',
      },
      { word: 'appropriate', suggestion: 'Explain what makes an action or input appropriate.' },
      { word: 'sometimes', suggestion: 'Define conditional parameters.' },
      { word: 'easy', suggestion: 'Subjective term. Focus on step verification.' },
    ];

    let idCounter = 1;

    for (const line of lines) {
      // 1. Check vague dictionary words
      for (const item of vagueWords) {
        const regex = new RegExp(`\\b${item.word}\\b`, 'i');
        if (regex.test(line)) {
          reports.push({
            id: `AMB-${String(idCounter++).padStart(3, '0')}`,
            type: 'vague-terminology',
            description: `Vague term "${item.word}" detected. ${item.suggestion}`,
            snippet: line,
            severity: 'medium',
          });
        }
      }

      // 2. Check incomplete conditionals
      // If a conditional check exists but does not outline the else state
      const hasIf = /\bif\b/i.test(line) || /\bwhen\b/i.test(line);
      const hasElse =
        /\belse\b/i.test(line) || /\botherwise\b/i.test(line) || /\bfail\b/i.test(line);
      if (hasIf && !hasElse && line.length > 20) {
        reports.push({
          id: `AMB-${String(idCounter++).padStart(3, '0')}`,
          type: 'incomplete-condition',
          description: `Conditional statement lacks alternative branch (e.g. "else" or "failure path").`,
          snippet: line,
          severity: 'high',
        });
      }

      // 3. Passive voice check (Unspecified Actor)
      const passiveRegex = /\bis\s+([a-zA-Z]+ed)\b/i;
      if (passiveRegex.test(line) && !line.toLowerCase().includes('by')) {
        reports.push({
          id: `AMB-${String(idCounter++).padStart(3, '0')}`,
          type: 'unspecified-actor',
          description: `Passive voice indicates actions without declaring the triggering actor or system.`,
          snippet: line,
          severity: 'low',
        });
      }

      // 4. Check unverified assumptions
      const assumptionKeywords = ['assume', 'assuming', 'expected', 'presumed', 'probably', 'implicitly'];
      for (const word of assumptionKeywords) {
        const regex = new RegExp(`\\b${word}\\b`, 'i');
        if (regex.test(line)) {
          reports.push({
            id: `AMB-${String(idCounter++).padStart(3, '0')}`,
            type: 'implied-behavior',
            description: `Implicit assumption detected: using "${word}". This should be verified explicitly in the requirement spec.`,
            snippet: line,
            severity: 'medium',
          });
        }
      }

      // 5. Check contradictions
      const lowerLine = line.toLowerCase();
      if (lowerLine.includes('must ') && lowerLine.includes('must not')) {
        reports.push({
          id: `AMB-${String(idCounter++).padStart(3, '0')}`,
          type: 'contradiction',
          description: 'Line contains potentially contradictory statements: both "must" and "must not" rules are defined in the same rule.',
          snippet: line,
          severity: 'high',
        });
      }
      if (lowerLine.includes('enable') && lowerLine.includes('disable') && lowerLine.includes('anonymous')) {
        reports.push({
          id: `AMB-${String(idCounter++).padStart(3, '0')}`,
          type: 'contradiction',
          description: 'Line contains contradictory statements regarding anonymous access (both enable and disable keywords found).',
          snippet: line,
          severity: 'high',
        });
      }
    }

    const fullTextLower = lines.join('\n').toLowerCase();
    if (fullTextLower.includes('anonymous access is enabled') && fullTextLower.includes('anonymous access is disabled')) {
      reports.push({
        id: `AMB-${String(idCounter++).padStart(3, '0')}`,
        type: 'contradiction',
        description: 'Document contains contradictory anonymous access instructions ("anonymous access is enabled" vs "anonymous access is disabled").',
        snippet: 'Global context check',
        severity: 'high',
      });
    }

    return reports;
  }

  /**
   * Checks for missing QA checklist topics (error paths, boundaries, auth).
   */
  private detectMissingInfo(text: string): MissingInfoReport[] {
    const reports: MissingInfoReport[] = [];
    const lowerText = text.toLowerCase();

    // 1. Error Handling Check
    const errorKeywords = ['error', 'fail', 'exception', 'timeout', 'invalid', 'reject', 'block'];
    const hasErrorPaths = errorKeywords.some((word) => lowerText.includes(word));
    if (!hasErrorPaths) {
      reports.push({
        category: 'error-handling',
        description:
          'No error paths, input validation errors, or recovery strategies are described.',
        whyCriticalForQA:
          'Tests cannot cover validation error boundaries, leaving security and stability paths unverified.',
      });
    }

    // 2. Boundary Check
    const boundaryKeywords = [
      'limit',
      'max',
      'min',
      'range',
      'size',
      'length',
      'count',
      'threshold',
    ];
    const hasBoundaryInfo = boundaryKeywords.some((word) => lowerText.includes(word));
    if (!hasBoundaryInfo) {
      reports.push({
        category: 'boundary-conditions',
        description:
          'Input character sizes, numeric limits, or transaction limits are not defined.',
        whyCriticalForQA:
          'Without limit specs, boundary value analysis (BVA) test steps cannot be derived.',
      });
    }

    // 3. Auth Check
    const authKeywords = [
      'permission',
      'role',
      'admin',
      'guest',
      'access',
      'authorized',
      'logged-in',
    ];
    const hasAuthInfo = authKeywords.some((word) => lowerText.includes(word));
    if (!hasAuthInfo) {
      reports.push({
        category: 'permissions-auth',
        description: 'User access levels or operation permissions are not specified.',
        whyCriticalForQA:
          'Unauthorized request boundaries (e.g. attempting actions as a guest) cannot be verified.',
      });
    }

    // 4. Data formats
    const formatKeywords = ['format', 'email', 'date', 'regex', 'phone', 'schema', 'type'];
    const hasFormatInfo = formatKeywords.some((word) => lowerText.includes(word));
    if (!hasFormatInfo) {
      reports.push({
        category: 'data-formats',
        description:
          'Strict format guidelines (e.g. date shapes, telephone numbers, emails) are missing.',
        whyCriticalForQA: 'Valid vs invalid format test strings cannot be validated dynamically.',
      });
    }

    // 5. Database Models Check
    const dbKeywords = ['save', 'store', 'update', 'delete', 'create', 'database', 'db', 'table', 'persistence', 'persist'];
    const hasDbKeywords = dbKeywords.some((word) => lowerText.includes(word));
    const hasDbSchema = lowerText.includes('schema') || lowerText.includes('properties') || lowerText.includes('columns') || lowerText.includes('fields');
    if (hasDbKeywords && !hasDbSchema) {
      reports.push({
        category: 'database-models' as any,
        description: 'Requirement outlines persistence actions (saving/updating data) but does not define the schema or properties of the database models.',
        whyCriticalForQA: 'Verification of data models and schema changes cannot be determined without a defined persistent data structure.',
      });
    }

    return reports;
  }

  /**
   * Evaluates requirement complexity level based on logic density.
   */
  private calculateComplexity(
    businessRules: BusinessRule[],
    text: string,
  ): { level: 'low' | 'medium' | 'high'; factors: string[]; rationale: string } {
    const factors: string[] = [];
    const conditionMatches = (text.match(/\bif\b|\bwhen\b/gi) || []).length;
    const ruleCount = businessRules.length;

    if (conditionMatches > 4) {
      factors.push(`High density of logic conditionals (${conditionMatches} triggers found).`);
    }
    if (ruleCount > 5) {
      factors.push(`Multiple business rule statements extracted (${ruleCount} rules).`);
    }
    if (text.length > 1000) {
      factors.push('Large specification document size (> 1000 characters).');
    }

    let level: 'low' | 'medium' | 'high' = 'low';
    if (factors.length >= 2 || ruleCount > 6) {
      level = 'high';
    } else if (factors.length === 1 || ruleCount >= 3) {
      level = 'medium';
    }

    const rationale =
      factors.length > 0
        ? `Graded as ${level} due to: ${factors.join(' ')}`
        : `Graded as low due to low rule count (${ruleCount} rules) and clean conditional flow.`;

    return { level, factors, rationale };
  }
}
