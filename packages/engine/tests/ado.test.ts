import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DefaultADOAdapter } from '../src/integrations/adoAdapter.js';
import { TestCase } from '../src/domain.js';

describe('Azure DevOps Integration Layer tests', () => {
  let mockFetch: any;

  beforeEach(() => {
    mockFetch = vi.fn();
    global.fetch = mockFetch;
  });

  it('should import a work item and map fields correctly', async () => {
    const mockAdoResponse = {
      id: 1234,
      rev: 2,
      fields: {
        'System.Title': 'Verify login screen input constraints',
        'System.Description': '<div>Please check that users can login securely.</div>',
        'System.CreatedBy': {
          displayName: 'Jane Doe',
        },
      },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockAdoResponse,
    });

    const adapter = new DefaultADOAdapter();
    const requirement = await adapter.importWorkItem('1234', 'test-org', 'test-proj', 'test-pat');

    expect(requirement).toBeDefined();
    expect(requirement.id).toBe('ado-1234');
    expect(requirement.title).toBe('Verify login screen input constraints');
    // HTML tags stripped
    expect(requirement.content).toBe('Please check that users can login securely.');
    expect(requirement.metadata.externalId).toBe('1234');
    expect(requirement.metadata.author).toBe('Jane Doe');

    // Verify correct authorization headers were sent
    expect(mockFetch).toHaveBeenCalledWith(
      'https://dev.azure.com/test-org/test-proj/_apis/wit/workitems/1234?api-version=7.1',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Basic OnRlc3QtcGF0', // ':' + 'test-pat' in base64
        }),
      }),
    );
  });

  it('should export test cases linking back to parent work item', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ id: 9999 }),
    });

    const testCases: TestCase[] = [
      {
        id: 'tc-1',
        requirementId: 'ado-1234',
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

    const adapter = new DefaultADOAdapter();
    await expect(
      adapter.exportTestCases(testCases, '1234', 'test-org', 'test-proj', 'test-pat'),
    ).resolves.not.toThrow();

    expect(mockFetch).toHaveBeenCalledTimes(1);

    // Assert correct JSON patch request structure
    const lastCall = mockFetch.mock.calls[0];
    const url = lastCall[0];
    const opts = lastCall[1];

    expect(url).toBe('https://dev.azure.com/test-org/test-proj/_apis/wit/workitems/$Test%20Case?api-version=7.1');
    expect(opts.method).toBe('POST');
    expect(opts.headers['Content-Type']).toBe('application/json-patch+json');

    const body = JSON.parse(opts.body);
    expect(body).toContainEqual(
      expect.objectContaining({
        op: 'add',
        path: '/fields/System.Title',
        value: '[QAMate] Exploratory check 1',
      }),
    );
    expect(body).toContainEqual(
      expect.objectContaining({
        op: 'add',
        path: '/relations/-',
        value: expect.objectContaining({
          rel: 'System.LinkTypes.Hierarchy-Reverse',
          url: 'https://dev.azure.com/test-org/test-proj/_apis/wit/workitems/1234',
        }),
      }),
    );
  });

  it('should throw error when import status is not OK', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: async () => 'Unauthorized access token',
    });

    const adapter = new DefaultADOAdapter();
    await expect(
      adapter.importWorkItem('1234', 'test-org', 'test-proj', 'test-pat'),
    ).rejects.toThrow('ADO Import failed (401): Unauthorized access token');
  });
});
