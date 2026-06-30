import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { Requirement, RequirementIntelligenceReport, Answer } from '../src/domain.js';
import { ProjectConfig, GenerationPreferences } from '../src/types.js';
import {
  DefaultContextCompiler,
  DefaultContextValidator,
  DefaultContextRenderer
} from '../src/context/index.js';

const mockReq: Requirement = {
  id: 'req-spec',
  projectId: 'proj-1',
  title: 'Cloud Storage Account Spec',
  content: 'As an admin, I want to secure public access.',
  contentType: 'plain-text',
  version: 1,
  status: 'draft',
  metadata: {},
  createdAt: new Date(),
};

const mockIntelligence: RequirementIntelligenceReport = {
  requirementId: 'req-spec',
  analyzedAt: new Date(),
  actors: [{ name: 'admin', description: 'System Administrator' }],
  entities: [],
  businessRules: [],
  ambiguities: [],
  missingInformation: [
    { description: 'No error validation schema is detailed.', category: 'error-handling', impactSeverity: 'medium' },
  ],
  riskAreas: [],
  complexity: { level: 'low', factors: [], rationale: 'low' },
  confidenceScore: 0.8,
};

const mockAnswers: Answer[] = [
  {
    questionId: 'Q-001', // Corresponds to error-handling gap CAND-001 / Q-001
    textValue: 'Use standard JSON validation format.',
    answeredAt: new Date(),
    answeredBy: 'QA',
  },
];

const mockProjectConfig: ProjectConfig = {
  targetLanguage: 'TypeScript',
  targetFramework: 'Playwright',
  namingConvention: 'Given/When/Then',
  companyRules: ['No public buckets allowed.'],
  qaGuidelines: ['Verify positive/negative branches.'],
};

const mockGenerationPreferences: GenerationPreferences = {
  maxCases: 5,
  focusAreas: ['security'],
  includeAutomationCandidate: true,
};

describe('Context Compiler tests', () => {
  const compiler = new DefaultContextCompiler();

  it('should compile context aggregate completely', async () => {
    const context = await compiler.compile(
      mockReq,
      mockIntelligence,
      mockAnswers,
      mockProjectConfig,
      mockGenerationPreferences
    );

    expect(context.version).toBe('1.0');
    expect(context.requirement.title).toBe('Cloud Storage Account Spec');
    expect(context.projectConfig.targetFramework).toBe('Playwright');
    expect(context.generationPreferences.maxCases).toBe(5);
    expect(context.answers).toHaveLength(1);
  });
});

describe('Context Validator tests', () => {
  const compiler = new DefaultContextCompiler();
  const validator = new DefaultContextValidator();

  it('should pass validation when all blocking clarifications are answered', async () => {
    const context = await compiler.compile(
      mockReq,
      mockIntelligence,
      mockAnswers,
      mockProjectConfig,
      mockGenerationPreferences
    );

    const report = await validator.validate(context);
    expect(report.ready).toBe(true);
    expect(report.blockingIssues).toHaveLength(0);
    expect(report.confidence).toBeGreaterThan(0.9);
    expect(report.recommendation).toContain('Ready');
  });

  it('should fail validation with blocking issues if requirement is empty', async () => {
    const emptyReq = { ...mockReq, content: '  ' };
    const context = await compiler.compile(
      emptyReq,
      mockIntelligence,
      mockAnswers,
      mockProjectConfig,
      mockGenerationPreferences
    );

    const report = await validator.validate(context);
    expect(report.ready).toBe(false);
    expect(report.blockingIssues.some((issue) => issue.includes('content is empty'))).toBe(true);
    expect(report.confidence).toBe(0.0);
  });

  it('should fail validation with blocking issues if critical questions remain unanswered', async () => {
    // Add a critical auth gap that is not in mockAnswers
    const intelligenceWithAuth = {
      ...mockIntelligence,
      missingInformation: [
        ...mockIntelligence.missingInformation,
        { description: 'Authentication not described.', category: 'permissions-auth' as const, impactSeverity: 'high' as const },
      ],
    };

    const context = await compiler.compile(
      mockReq,
      intelligenceWithAuth,
      mockAnswers,
      mockProjectConfig,
      mockGenerationPreferences
    );

    const report = await validator.validate(context);
    expect(report.ready).toBe(false);
    // Unresolved permissions auth gap (CAND-002 -> Q-002) is not answered.
    expect(report.blockingIssues.some((issue) => issue.includes('Unresolved blocking gap'))).toBe(true);
    expect(report.confidence).toBeLessThan(0.9);
  });
});

describe('Context Renderer tests', () => {
  const compiler = new DefaultContextCompiler();
  const renderer = new DefaultContextRenderer();

  it('should substitute placeholders in markdown template layout', async () => {
    const tempDir = path.resolve('./packages/engine/tests/temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    const tempTemplatePath = path.join(tempDir, 'test_generation.md');
    fs.writeFileSync(
      tempTemplatePath,
      'Title: {{REQUIREMENT_TITLE}}\nLanguage: {{TARGET_LANGUAGE}}\nFramework: {{TARGET_FRAMEWORK}}'
    );

    const context = await compiler.compile(
      mockReq,
      mockIntelligence,
      mockAnswers,
      mockProjectConfig,
      mockGenerationPreferences
    );

    const prompt = await renderer.renderToMarkdown(context, tempTemplatePath);
    expect(prompt).toContain('Title: Cloud Storage Account Spec');
    expect(prompt).toContain('Language: TypeScript');
    expect(prompt).toContain('Framework: Playwright');

    // cleanup temp file
    fs.unlinkSync(tempTemplatePath);
  });

  it('should render correct JSON serialized context representation', async () => {
    const context = await compiler.compile(
      mockReq,
      mockIntelligence,
      mockAnswers,
      mockProjectConfig,
      mockGenerationPreferences
    );

    const json = await renderer.renderToJSON(context);
    const parsed = JSON.parse(json);
    expect(parsed.version).toBe('1.0');
    expect(parsed.requirement.id).toBe('req-spec');
  });
});
