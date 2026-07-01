import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DefaultJiraAdapter } from '../src/integrations/jiraAdapter.js';
import { TestCase } from '../src/domain.js';

describe('Jira Integration Layer tests', () => {
  let mockFetch: any;

  beforeEach(() => {
    mockFetch = vi.fn();
    global.fetch = mockFetch;
  });

  it('should import a Jira issue and map fields correctly', async () => {
    const mockJiraResponse = {
      fields: {
        summary: 'Verify login screen input constraints',
        description: 'Please check that users can login securely.',
        creator: {
          displayName: 'Jane Doe',
        },
      },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockJiraResponse,
    });

    const adapter = new DefaultJiraAdapter();
    const requirement = await adapter.importIssue('PROJ-101', 'test.atlassian.net', 'user@test.com', 'test-token');

    expect(requirement).toBeDefined();
    expect(requirement.id).toBe('jira-PROJ-101');
    expect(requirement.title).toBe('Verify login screen input constraints');
    expect(requirement.content).toBe('Please check that users can login securely.');
    expect(requirement.metadata.externalId).toBe('PROJ-101');
    expect(requirement.metadata.author).toBe('Jane Doe');

    expect(mockFetch).toHaveBeenCalledWith(
      'https://test.atlassian.net/rest/api/3/issue/PROJ-101',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Basic dXNlckB0ZXN0LmNvbTp0ZXN0LXRva2Vu',
        }),
      }),
    );
  });

  it('should export test cases as Jira comments correctly', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'comment-123' }),
    });

    const testCases: TestCase[] = [
      {
        id: 'tc-1',
        requirementId: 'jira-101',
        conversationId: 'conv-1',
        title: 'Exploratory check 1',
        description: 'Verify login works',
        preconditions: ['User is on home'],
        steps: [
          {
            stepNumber: 1,
            action: 'Enter username',
            expectedResult: 'Field updated',
          },
        ],
        priority: 'P1',
        tags: ['login'],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const adapter = new DefaultJiraAdapter();
    await expect(
      adapter.exportTestCases(testCases, 'PROJ-101', 'test.atlassian.net', 'user@test.com', 'test-token'),
    ).resolves.not.toThrow();

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const lastCall = mockFetch.mock.calls[0];
    const url = lastCall[0];
    const opts = lastCall[1];

    expect(url).toBe('https://test.atlassian.net/rest/api/3/issue/PROJ-101/comment');
    expect(opts.method).toBe('POST');
    
    const body = JSON.parse(opts.body);
    expect(body.body.content[0].content[0].text).toContain('Exploratory check 1');
  });

  it('should throw error when Jira import status is not OK', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: async () => 'Unauthorized access token',
    });

    const adapter = new DefaultJiraAdapter();
    await expect(
      adapter.importIssue('PROJ-101', 'test.atlassian.net', 'user@test.com', 'test-token'),
    ).rejects.toThrow('Jira Import failed (401): Unauthorized access token');
  });
});
