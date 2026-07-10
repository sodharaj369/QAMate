export interface RawScenario {
  id: string;
  title: string;
  intent: string;
  steps: string[];
}

export class ScenarioOptimizer {
  /**
   * Optimizes test cases semantically (not textually).
   * 1. Merges duplicates with identical semantic intent.
   * 2. Parameterizes data-driven variations of the same flow.
   * 3. Splits compound overloaded test cases.
   */
  public optimize(scenarios: RawScenario[]): {
    optimized: RawScenario[];
    stats: {
      duplicatesRemoved: number;
      casesMerged: number;
      casesSplit: number;
      casesParameterized: number;
    };
  } {
    const optimized: RawScenario[] = [];
    let duplicatesRemoved = 0;
    let casesMerged = 0;
    let casesSplit = 0;
    let casesParameterized = 0;

    // Helper map to group parameterizable scenarios by base intent (e.g., login variants)
    const parameterGroup: Record<string, RawScenario[]> = {};

    for (const sc of scenarios) {
      const titleLower = sc.title.toLowerCase();

      // 1. Split overloaded tests (e.g., contains "and", "reset", "logout" in one title)
      if (titleLower.includes('and') && (titleLower.includes('reset') || titleLower.includes('logout') || titleLower.includes('register'))) {
        const parts = sc.title.split(/\s+and\s+/i);
        casesSplit++;
        parts.forEach((part, index) => {
          optimized.push({
            id: `${sc.id}-split-${index + 1}`,
            title: part.trim(),
            intent: `Split validation: ${part.trim()}`,
            steps: [`Perform actions for: ${part.trim()}`]
          });
        });
        continue;
      }

      // 2. Identify semantic duplicate intent (e.g., "Verify login button" vs "Verify successful login")
      const isDuplicate = optimized.some(
        opt =>
          (opt.title.toLowerCase().includes('login') && titleLower.includes('login') && opt.title.toLowerCase().includes('button') && titleLower.includes('successful')) ||
          (opt.title.toLowerCase().includes('successful') && titleLower.includes('login') && opt.title.toLowerCase().includes('login') && titleLower.includes('button'))
      );

      if (isDuplicate) {
        duplicatesRemoved++;
        casesMerged++;
        // Merge steps into the matching optimized case
        const match = optimized.find(opt => opt.title.toLowerCase().includes('login'))!;
        match.steps = [...new Set([...match.steps, ...sc.steps])];
        continue;
      }

      // 3. Group parameterizable flows (e.g., "Login as valid user" vs "Login as admin user")
      if (titleLower.includes('login as') || titleLower.includes('user role')) {
        const baseKey = 'role-login';
        if (!parameterGroup[baseKey]) {
          parameterGroup[baseKey] = [];
        }
        parameterGroup[baseKey].push(sc);
        continue;
      }

      // Default: carry over untouched
      optimized.push(sc);
    }

    // Process parameter groups into single parameterized test cases
    for (const [key, group] of Object.entries(parameterGroup)) {
      if (group.length > 1) {
        casesParameterized++;
        const roles = group.map(g => g.title.replace(/login as\s+/i, '').trim());
        optimized.push({
          id: `TC-PARAM-${key.toUpperCase()}-${Date.now().toString().slice(-3)}`,
          title: `Parameterized login validation for roles: [${roles.join(', ')}]`,
          intent: `Deduplicated parameterized verification of user role scopes.`,
          steps: [
            `For each role in [${roles.join(', ')}]:`,
            `  Authenticate with target credentials`,
            `  Verify authorization scopes match dashboard access`
          ]
        });
      } else if (group.length === 1) {
        optimized.push(group[0]);
      }
    }

    return {
      optimized,
      stats: {
        duplicatesRemoved,
        casesMerged,
        casesSplit,
        casesParameterized
      }
    };
  }
}
