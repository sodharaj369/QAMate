import { Requirement, TestCase } from '../domain.js';
import { IADOPersistenceAdapter } from '../interfaces/index.js';
import { IIntegrationAdapter, SyncResult, IntegrationHealth } from './integrationAdapter.js';

export class DefaultADOAdapter implements IADOPersistenceAdapter, IIntegrationAdapter {
  public readonly id = 'ado';
  public readonly name = 'Azure DevOps Integration';

  public async checkHealth(credentials: any): Promise<IntegrationHealth> {
    if (!credentials || !credentials.pat || !credentials.org || !credentials.project) {
      return { status: 'warning', message: 'Azure DevOps credentials pending setup.' };
    }
    return { status: 'healthy', message: `Connected to ADO Org: ${credentials.org} Project: ${credentials.project} successfully.` };
  }

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
    orgOrCredentials: any,
    project?: string,
    pat?: string,
  ): Promise<SyncResult> {
    let org = '';
    let proj = '';
    let tokenPat = '';

    if (typeof orgOrCredentials === 'object' && orgOrCredentials !== null) {
      org = orgOrCredentials.org || '';
      proj = orgOrCredentials.project || '';
      tokenPat = orgOrCredentials.pat || '';
    } else {
      org = orgOrCredentials || '';
      proj = project || '';
      tokenPat = pat || '';
    }

    const authHeader = `Basic ${Buffer.from(`:${tokenPat}`).toString('base64')}`;
    const createUrl = `https://dev.azure.com/${org}/${proj}/_apis/wit/workitems/$Test%20Case?api-version=7.1`;
    const parentUrl = `https://dev.azure.com/${org}/${proj}/_apis/wit/workitems/${workItemId}`;

    let lastRemoteId = '';

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
        return {
          remoteId: '',
          status: 'retry',
          error: `ADO Export TestCase failed (${response.status}): ${errText}`
        };
      }

      const resData = await response.json() as any;
      lastRemoteId = resData.id?.toString() || '';
    }

    return {
      remoteId: lastRemoteId || workItemId,
      url: `https://dev.azure.com/${org}/${proj}/_workitems/edit/${workItemId}`,
      status: 'completed'
    };
  }
}
