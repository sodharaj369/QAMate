import { GeneratorContext } from '../types.js';
import { TestStrategy, QAArtifact, ReviewReport, ReviewIssue } from '../domain.js';
import { IReviewEngine } from '../interfaces/index.js';

export class DefaultReviewEngine implements IReviewEngine {
  public async reviewArtifacts(
    artifacts: QAArtifact[],
    context: GeneratorContext,
    strategy: TestStrategy,
  ): Promise<ReviewReport> {
    const trace: string[] = [];
    const issues: ReviewIssue[] = [];
    const suggestions: string[] = [];

    trace.push('Beginning Quality Gate review of generated QA artifacts.');

    let deduplicationScore = 100;
    let businessValueScore = 100;
    let codeQualityScore = 100;

    // 1. Compliance Audit (e.g. naming Style rules)
    trace.push(
      'Compliance Audit: Verifying code styling against project configuration guidelines.',
    );
    const targetStyle = context.projectConfig.namingConvention || 'Given/When/Then';
    let complianceViolated = false;

    for (const art of artifacts) {
      const text = art.content.toLowerCase();
      if (targetStyle === 'Given/When/Then' && !art.type.includes('SQL')) {
        if (!text.includes('given') || !text.includes('when') || !text.includes('then')) {
          complianceViolated = true;
          issues.push({
            id: `REV-CMP-${Date.now().toString().slice(-3)}`,
            category: 'compliance',
            description: `Artifact "${art.type}" does not contain structured Gherkin steps: Given, When, Then.`,
            severity: 'low',
            fileArtifactId: art.id,
          });
        }
      }
    }
    if (complianceViolated) {
      codeQualityScore -= 20;
      suggestions.push(
        `Format the scenario descriptions to explicitly use the Project naming style: "${targetStyle}".`,
      );
      trace.push('Compliance Audit: Flagged naming style formatting issues.');
    } else {
      trace.push('Compliance Audit: Passed naming standard style evaluations.');
    }

    // 2. Deduplication Scanner
    trace.push('Deduplication Audit: Scanning scenario titles for duplicate definitions.');
    const titles = new Set<string>();
    let duplicatesFound = false;

    for (const art of artifacts) {
      const lines = art.content.split('\n');
      for (const line of lines) {
        if (
          line.trim().startsWith('#### TC-') ||
          line.trim().startsWith('public async Task Should_')
        ) {
          const cleanTitle = line.trim().toLowerCase();
          if (titles.has(cleanTitle)) {
            duplicatesFound = true;
            issues.push({
              id: `REV-DUP-${Date.now().toString().slice(-3)}`,
              category: 'duplication',
              description: `Duplicate scenario title detected: "${line.replace(/^(#+|\s+|\[Fact\]|public async Task\s+)/, '')}".`,
              severity: 'medium',
              fileArtifactId: art.id,
            });
          } else {
            titles.add(cleanTitle);
          }
        }
      }
    }
    if (duplicatesFound) {
      deduplicationScore -= 30;
      suggestions.push(
        'Consolidate duplicate test case steps into reusable parameterized parameters or data matrices.',
      );
      trace.push('Deduplication Audit: Flagged duplicate test scenarios.');
    } else {
      trace.push(
        'Deduplication Audit: Passed duplicate logic evaluation (no duplicate titles found).',
      );
    }

    // 3. Low-Value Check
    trace.push('Quality Audit: Searching for empty or low-value code skeleton structures.');
    let lowValueFound = false;

    for (const art of artifacts) {
      if (
        art.content.includes('// Act') &&
        art.content.includes('// Assert') &&
        art.content.length < 150
      ) {
        lowValueFound = true;
        issues.push({
          id: `REV-VAL-${Date.now().toString().slice(-3)}`,
          category: 'low-value',
          description: `Artifact "${art.type}" contains empty or shallow test skeletons lacking mocks or assertions.`,
          severity: 'high',
          fileArtifactId: art.id,
        });
      }
    }
    if (lowValueFound) {
      codeQualityScore -= 20;
      suggestions.push(
        'Enhance test skeletons with mock method signatures, sample inputs, and specific assert values.',
      );
      trace.push('Quality Audit: Flagged low-value skeleton structures.');
    } else {
      trace.push('Quality Audit: Passed code skeleton quality check.');
    }

    // 4. Business Value / Coverage Mapping
    trace.push('Coverage Audit: Mapping test artifacts back to strategy objectives.');
    let missingCoverage = false;

    const mergedContent = artifacts.map((a) => a.content.toLowerCase()).join(' ');
    for (const objective of strategy.objectives) {
      // Scrutinize keywords matching objectives
      const objWords = objective
        .toLowerCase()
        .split(' ')
        .filter((w) => w.length > 4);
      const matchesObjective = objWords.some((word) => mergedContent.includes(word));
      if (!matchesObjective) {
        missingCoverage = true;
        issues.push({
          id: `REV-COV-${Date.now().toString().slice(-3)}`,
          category: 'coverage',
          description: `Strategy objective not covered in generated files: "${objective}"`,
          severity: 'high',
        });
      }
    }
    if (missingCoverage) {
      businessValueScore -= 30;
      suggestions.push('Add specific validation test cases targeting missing strategy objectives.');
      trace.push('Coverage Audit: Flagged coverage gaps against strategy objectives.');
    } else {
      trace.push('Coverage Audit: Passed objectives coverage checks.');
    }

    // 5. Overall Scores compilation
    const overallScore = Math.max(
      0,
      Math.round((deduplicationScore + businessValueScore + codeQualityScore) / 3),
    );
    let status: 'approved' | 'flagged' | 'rejected' = 'approved';
    if (overallScore < 50) {
      status = 'rejected';
    } else if (overallScore < 80) {
      status = 'flagged';
    }
    trace.push(`Quality Gate completed with overall score: ${overallScore}%`);

    return {
      id: `REV-${Date.now().toString().slice(-4)}`,
      strategyId: strategy.id,
      checkedAt: new Date(),
      status,
      issues,
      scores: {
        deduplicationScore,
        businessValueScore,
        codeQualityScore,
        overallScore,
      },
      suggestions,
      traceLogs: trace,
    };
  }
}
