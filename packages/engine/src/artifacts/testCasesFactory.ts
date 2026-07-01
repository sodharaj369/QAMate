import { GeneratorContext } from '../types.js';

export class TestCasesFactory {
  public static generateCases(context: GeneratorContext, type: string, persona: string): string {
    const rules = context.intelligence.businessRules;
    const domains = (context as any).detectedDomains || [];
    const contentLower = context.requirement.content.toLowerCase();

    // Determine domain triggers
    const isSecurityDomain = domains.includes('Authentication') || domains.includes('Payments') || domains.includes('API');
    const isApiOrDb = domains.includes('API') || domains.includes('Infrastructure') || contentLower.includes('save') || contentLower.includes('database');
    const isUIFeature = !domains.includes('Infrastructure') && !domains.includes('API');

    const sections: string[] = [];

    // Title & Metadata Header
    sections.push(`### QA Test Suite - ${type}\n- **Persona**: ${persona.toUpperCase()}\n- **Requirement**: ${context.requirement.title}\n- **Operational Domains**: ${domains.join(', ')}`);

    // 1. Positive Checklist
    sections.push(`#### 🟢 Positive Test Cases (Functional Verification)`);
    if (rules.length > 0) {
      rules.forEach((rule, idx) => {
        sections.push(`- [ ] **TC-POS-${idx + 1}**: Verify rule [${rule.id}] - "${rule.expectedOutcome}" under condition: "${rule.condition}".`);
      });
    } else {
      sections.push(`- [ ] **TC-POS-1**: Verify standard functional path execution of "${context.requirement.title}".`);
    }

    // 2. Negative Checklist
    sections.push(`\n#### 🔴 Negative Test Cases (Failure Paths & Exceptions)`);
    sections.push(`- [ ] **TC-NEG-1**: Trigger validation errors by submitting empty or malformed inputs.`);
    sections.push(`- [ ] **TC-NEG-2**: Verify authentication denial / authorization lockout for unauthorized actions.`);

    // 3. Boundary & Edge Case Checklist
    sections.push(`\n#### 📐 Boundary & Edge Case Checklist`);
    sections.push(`- [ ] **TC-BND-1**: Assert character limit overflows (e.g., input values at limit, limit + 1).`);
    sections.push(`- [ ] **TC-EDGE-1**: Trigger race conditions or concurrent connection interrupts.`);

    // 4. API & Database checklists (suggested only when domain/persistence warrants it)
    if (isApiOrDb) {
      sections.push(`\n#### 🔌 API & Persistence Integration Checks`);
      sections.push(`- [ ] **TC-API-1**: Verify JSON payload compliance, schema structure, and header validations.`);
      sections.push(`- [ ] **TC-DB-1**: Confirm database persistence commits clean records and does not log confidential parameters.`);
    }

    // 5. Security Rules (Authentication, Payments, API)
    if (isSecurityDomain) {
      sections.push(`\n#### 🔒 Security Vulnerability Checklist`);
      sections.push(`- [ ] **SEC-1**: Verify token injection exploits, signature tampering, and session expiry lockdowns.`);
      sections.push(`- [ ] **SEC-2**: Audit response headers for credential leakage (e.g., masking secrets, avoiding plain text API keys).`);
    }

    // 6. Performance rules (Infrastructure, API, or speed keywords)
    const hasPerformanceTrigger = domains.includes('Infrastructure') || domains.includes('API') || contentLower.includes('fast') || contentLower.includes('instant');
    if (hasPerformanceTrigger) {
      sections.push(`\n#### ⚡ Performance & Resource SLA Checklist`);
      sections.push(`- [ ] **PERF-1**: Assert API responses execute under 200ms SLA threshold guidelines.`);
      sections.push(`- [ ] **PERF-2**: Run stress simulation asserting connection stability under peak request volume.`);
    }

    // 7. Accessibility rules (suggested only for UI features)
    if (isUIFeature) {
      sections.push(`\n#### ♿ Accessibility & UX Compliance Checks (WCAG)`);
      sections.push(`- [ ] **ACC-1**: Verify keyboard navigation (Tab indices) and focus indicator visibility.`);
      sections.push(`- [ ] **ACC-2**: Assert screen reader accessibility via ARIA labels and semantic markup validation.`);
    }

    return sections.join('\n');
  }
}
