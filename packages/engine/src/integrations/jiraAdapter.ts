import { Requirement, TestCase } from '../domain.js';
import { IJiraPersistenceAdapter } from '../interfaces/index.js';

export class DefaultJiraAdapter implements IJiraPersistenceAdapter {
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
    domain: string,
    email: string,
    token: string,
  ): Promise<void> {
    const authHeader = `Basic ${Buffer.from(`${email}:${token}`).toString('base64')}`;
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
      throw new Error(`Jira Export comment failed (${response.status}): ${errText}`);
    }
  }
}
