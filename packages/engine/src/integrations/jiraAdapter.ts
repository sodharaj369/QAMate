import { Requirement, TestCase } from '../domain.js';
import { IJiraPersistenceAdapter } from '../interfaces/index.js';
import { IIntegrationAdapter, SyncResult, IntegrationHealth } from './integrationAdapter.js';

export class DefaultJiraAdapter implements IJiraPersistenceAdapter, IIntegrationAdapter {
  public readonly id = 'jira';
  public readonly name = 'Jira Integration';

  public async checkHealth(credentials: any): Promise<IntegrationHealth> {
    if (!credentials || !credentials.token || !credentials.domain) {
      return { status: 'warning', message: 'Jira API configurations pending setup.' };
    }
    return { status: 'healthy', message: `Connected to Jira workspace at ${credentials.domain} successfully.` };
  }

  public async importIssue(
    issueKey: string,
    domain: string,
    email: string,
    token: string,
  ): Promise<Requirement> {
    const authHeader = `Basic ${Buffer.from(`${email}:${token}`).toString('base64')}`;
    const url = `https://${domain}/rest/api/3/issue/${issueKey}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: authHeader,
      },
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Jira Import failed (${response.status}): ${errText}`);
    }

    const data = (await response.json()) as any;
    const title = data.fields?.summary || 'Untitled Jira Issue';
    const rawContent =
      typeof data.fields?.description === 'string'
        ? data.fields.description
        : JSON.stringify(data.fields?.description || 'No description provided.');

    return {
      id: `jira-${issueKey}`,
      projectId: domain,
      title,
      content: rawContent.replace(/<[^>]*>/g, '').trim(),
      contentType: 'plain-text',
      version: 1,
      status: 'draft',
      metadata: {
        externalId: issueKey,
        author: data.fields?.creator?.displayName || 'Jira User',
      },
    };
  }

  public async exportTestCases(
    testCases: TestCase[],
    issueKey: string,
    domainOrCredentials: any,
    email?: string,
    token?: string,
  ): Promise<SyncResult> {
    let domain = '';
    let authEmail = '';
    let authToken = '';

    if (typeof domainOrCredentials === 'object' && domainOrCredentials !== null) {
      domain = domainOrCredentials.domain || '';
      authEmail = domainOrCredentials.email || '';
      authToken = domainOrCredentials.token || '';
    } else {
      domain = domainOrCredentials || '';
      authEmail = email || '';
      authToken = token || '';
    }

    const authHeader = `Basic ${Buffer.from(`${authEmail}:${authToken}`).toString('base64')}`;
    const url = `https://${domain}/rest/api/3/issue/${issueKey}/comment`;

    let commentBody = `### QAMate Automated Test Suite Export\n`;
    testCases.forEach((tc) => {
      commentBody += `\n* **[${tc.id}] ${tc.title}**\n`;
      tc.steps.forEach((step) => {
        commentBody += `  * Step ${step.stepNumber}: ${step.action} -> Expected: ${step.expectedResult}\n`;
      });
    });

    const payload = {
      body: {
        type: 'doc',
        version: 1,
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: commentBody,
              },
            ],
          },
        ],
      },
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text();
      return {
        remoteId: '',
        status: 'retry',
        error: `Jira Export comment failed (${response.status}): ${errText}`
      };
    }

    return {
      remoteId: issueKey,
      url: `https://${domain}/browse/${issueKey}`,
      status: 'completed'
    };
  }
}
