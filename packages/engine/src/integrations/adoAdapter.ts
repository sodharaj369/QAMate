import { Requirement, TestCase } from '../domain.js';
import { IADOPersistenceAdapter } from '../interfaces/index.js';

export class DefaultADOAdapter implements IADOPersistenceAdapter {
  public async importWorkItem(
    workItemId: string,
    org: string,
    project: string,
    pat: string,
  ): Promise<Requirement> {
    const authHeader = `Basic ${Buffer.from(`:${pat}`).toString('base64')}`;
    const url = `https://dev.azure.com/${org}/${project}/_apis/wit/workitems/${workItemId}?api-version=7.1`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`ADO Import failed (${response.status}): ${errText}`);
    }

    const data = (await response.json()) as {
      rev?: number;
      fields?: Record<string, any>;
    };

    if (!data.fields) {
      throw new Error(`ADO Work Item [${workItemId}] does not contain fields metadata.`);
    }

    const title = data.fields['System.Title'] || 'Untitled ADO Requirement';
    const rawContent =
      data.fields['System.Description'] ||
      data.fields['Microsoft.VSTS.Common.AcceptanceCriteria'] ||
      'No description details provided.';

    // Clean html tags from ADO descriptions
    const cleanContent = rawContent.replace(/<[^>]*>/g, '').trim();

    return {
      id: `ado-${workItemId}`,
      projectId: project,
      title,
      content: cleanContent,
      contentType: 'plain-text',
      version: data.rev || 1,
      status: 'draft',
      metadata: {
        externalId: workItemId,
        author: data.fields['System.CreatedBy']?.displayName || 'ADO User',
      },
    };
  }

  public async exportTestCases(
    testCases: TestCase[],
    workItemId: string,
    org: string,
    project: string,
    pat: string,
  ): Promise<void> {
    const authHeader = `Basic ${Buffer.from(`:${pat}`).toString('base64')}`;
    const createUrl = `https://dev.azure.com/${org}/${project}/_apis/wit/workitems/$Test%20Case?api-version=7.1`;

    // Retrieve parent work item details to link tests
    const parentUrl = `https://dev.azure.com/${org}/${project}/_apis/wit/workitems/${workItemId}`;

    for (const tc of testCases) {
      const stepsHtml = tc.steps
        .map(
          (step) =>
            `<p>Step ${step.stepNumber}: ${step.action} -> Expected: ${step.expectedResult}</p>`,
        )
        .join('');

      const patchPayload = [
        {
          op: 'add',
          path: '/fields/System.Title',
          value: `[QAMate] ${tc.title}`,
        },
        {
          op: 'add',
          path: '/fields/Microsoft.VSTS.TCM.Steps',
          value: stepsHtml,
        },
        {
          op: 'add',
          path: '/relations/-',
          value: {
            rel: 'System.LinkTypes.Hierarchy-Reverse',
            url: parentUrl,
            attributes: {
              comment: 'Link generated test suite back to user requirement story.',
            },
          },
        },
      ];

      const response = await fetch(createUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json-patch+json',
          Authorization: authHeader,
        },
        body: JSON.stringify(patchPayload),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`ADO Export TestCase failed (${response.status}): ${errText}`);
      }
    }
  }
}
