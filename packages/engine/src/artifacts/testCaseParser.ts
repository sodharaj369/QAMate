import { TestCase, TestStep } from '../domain.js';

export class TestCaseParser {
  public static parseMarkdown(markdown: string, requirementId: string, conversationId: string): TestCase[] {
    const testCases: TestCase[] = [];
    const lines = markdown.split('\n');
    let currentCase: TestCase | null = null;
    let currentSection: 'preconditions' | 'steps' | 'expected' | '' = '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      const newCaseMatch = trimmed.match(/(?:-\s*\[\s*\]\s*\*\*|####\s+)(TC-[A-Z0-9-]+|SEC-\d+|PERF-\d+|ACC-\d+)(?:\*\*|)?:\s*(.*)/i);
      if (newCaseMatch) {
        if (currentCase) {
          testCases.push(currentCase);
        }
        
        const id = newCaseMatch[1].toUpperCase();
        let title = newCaseMatch[2].trim();
        title = title.replace(/\*\*$/, '').replace(/^\*\*/, '').trim();

        let priority: 'P0' | 'P1' | 'P2' | 'P3' = 'P1';
        if (id.includes('SEC') || id.includes('PERF')) priority = 'P0';
        if (id.includes('NEG')) priority = 'P1';
        if (id.includes('BND') || id.includes('ACC')) priority = 'P2';

        currentCase = {
          id,
          requirementId,
          conversationId,
          title,
          description: title,
          preconditions: [],
          steps: [],
          priority,
          tags: [id.split('-')[1] || 'general'],
          createdAt: new Date(),
          updatedAt: new Date()
        };
        currentSection = '';
        continue;
      }

      if (!currentCase) continue;

      if (trimmed.toLowerCase().includes('preconditions')) {
        currentSection = 'preconditions';
        continue;
      } else if (trimmed.toLowerCase().includes('actions') || trimmed.toLowerCase().includes('steps')) {
        currentSection = 'steps';
        continue;
      } else if (trimmed.toLowerCase().includes('expected') || trimmed.toLowerCase().includes('outcome')) {
        currentSection = 'expected';
        continue;
      }

      const cleanContent = trimmed.replace(/^[-*+\d.]\s*/, '').replace(/^\s*[-*+\d.]\s*/, '');
      if (currentSection === 'preconditions') {
        currentCase.preconditions.push(cleanContent);
      } else if (currentSection === 'steps') {
        const stepNum = currentCase.steps.length + 1;
        currentCase.steps.push({
          stepNumber: stepNum,
          action: cleanContent,
          expectedResult: 'System executes successfully.'
        });
      } else if (currentSection === 'expected') {
        if (currentCase.steps.length > 0) {
          const lastStep = currentCase.steps[currentCase.steps.length - 1];
          (lastStep as any).expectedResult = cleanContent;
        }
      }
    }

    if (currentCase) {
      testCases.push(currentCase);
    }

    return testCases;
  }
}
