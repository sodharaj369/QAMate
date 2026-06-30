import { describe, it, expect } from 'vitest';
import { Project, Requirement, Conversation } from '../src/domain.js';

describe('QAMate Domain Models Smoke Test', () => {
  it('should allow constructing domain models matching Project, Requirement, and Conversation structures', () => {
    // 1. Mock Project
    const project: Project = {
      id: 'proj-123',
      name: 'E-Commerce Platform',
      description: 'Main shopping cart project',
      createdAt: new Date(),
      updatedAt: new Date(),
      config: {
        targetLanguage: 'TypeScript',
        targetFramework: 'Playwright',
        qualityStandards: ['Preconditions mandatory', 'Assert every action']
      }
    };

    expect(project.id).toBe('proj-123');
    expect(project.config.targetFramework).toBe('Playwright');

    // 2. Mock Requirement
    const requirement: Requirement = {
      id: 'req-456',
      projectId: project.id,
      title: 'Add Items to Cart',
      content: 'As a customer, I want to add items to my shopping cart so that I can purchase them later.',
      contentType: 'markdown',
      version: 1,
      status: 'draft',
      metadata: {
        externalId: 'JIRA-999'
      }
    };

    expect(requirement.id).toBe('req-456');
    expect(requirement.metadata.externalId).toBe('JIRA-999');

    // 3. Mock Conversation Session
    const conversation: Conversation = {
      id: 'conv-789',
      projectId: project.id,
      requirementId: requirement.id,
      status: 'analyzing',
      questions: [],
      answers: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    expect(conversation.id).toBe('conv-789');
    expect(conversation.status).toBe('analyzing');
    expect(conversation.questions).toHaveLength(0);
  });
});
