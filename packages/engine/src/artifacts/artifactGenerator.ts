import { GeneratorContext } from '../types.js';
import { ArtifactPlan, QAArtifact } from '../domain.js';
import { IArtifactGenerator, ILLMProvider } from '../interfaces/index.js';
import { TestCasesFactory } from './testCasesFactory.js';

export class DefaultArtifactGenerator implements IArtifactGenerator {
  public async generateArtifacts(
    context: GeneratorContext,
    plan: ArtifactPlan,
    provider: ILLMProvider,
  ): Promise<QAArtifact[]> {
    // 1. Compile prompt using strategy, context, and planner instructions
    const prompt = this.compilePrompt(context, plan);

    // 2. Call LLM Provider
    const response = await provider.generate(prompt, {
      systemInstruction:
        'You are QAMate, a Senior QA Thinking Assistant. Generate precise engineering artifacts matching the plan requested.',
      responseFormat: 'text',
    });

    const artifacts: QAArtifact[] = [];

    // 3. Parse and extract separate artifacts from LLM response
    for (const type of plan.selectedArtifacts) {
      let content = '';

      if (
        provider.id === 'mock-llm-provider' ||
        !response ||
        response.trim().length === 0 ||
        response.includes('MOCK_COMPLETION')
      ) {
        // Fallback to high-quality rule-based templates for offline golden dataset runs
        content = this.getMockContentForPersona(type, plan, context);
      } else {
        // Parse section from the provider completion response
        content = this.extractSection(response, type);
        if (!content) {
          // If sub-section parsing fails, assign the raw response to the first artifact, and fallback for others
          if (artifacts.length === 0) {
            content = response;
          } else {
            content = this.getMockContentForPersona(type, plan, context);
          }
        }
      }

      artifacts.push({
        id: `ART-${Date.now().toString().slice(-4)}-${type.slice(0, 3).toUpperCase()}`,
        planId: plan.id,
        type,
        content,
        createdAt: new Date(),
      });
    }

    return artifacts;
  }

  private compilePrompt(context: GeneratorContext, plan: ArtifactPlan): string {
    return `Generate QA Artifacts for Requirement: "${context.requirement.title}"
Strategy Objectives:
${context.intelligence.businessRules.map((r) => `- [${r.id}]: ${r.description}`).join('\n')}

Persona: ${plan.persona.toUpperCase()}
Tech Stack Profile:
- Language:  ${plan.profile.language}
- Framework: ${plan.profile.framework}
- Database:  ${plan.profile.database || 'None'}
- Cloud:     ${plan.profile.cloud || 'None'}
- Style:     ${plan.profile.testingStyle}

Selected Artifacts:
${plan.selectedArtifacts.map((a) => `- ${a}`).join('\n')}

Generation Directives:
${plan.generationInstructions.map((i) => `- ${i}`).join('\n')}

Please format your response by placing each artifact under its respective Markdown header, e.g. "### ${plan.selectedArtifacts[0]}".`;
  }

  private extractSection(response: string, heading: string): string {
    const lines = response.split('\n');
    let capturing = false;
    const sectionLines: string[] = [];

    // Clean heading term
    const cleanHeading = heading.toLowerCase().replace(/[^a-z0-9]/g, '');

    for (const line of lines) {
      const isHeadingLine = line.trim().startsWith('#') || line.trim().startsWith('**');
      if (isHeadingLine) {
        const cleanLine = line.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (cleanLine.includes(cleanHeading)) {
          capturing = true;
          continue;
        } else if (capturing) {
          // Hit the next heading section
          break;
        }
      }

      if (capturing) {
        sectionLines.push(line);
      }
    }

    return sectionLines.join('\n').trim();
  }

  private getMockContentForPersona(
    type: string,
    plan: ArtifactPlan,
    context?: GeneratorContext,
  ): string {
    if (context) {
      return TestCasesFactory.generateCases(context, type, plan.persona);
    }
    const testingStyle = plan.profile.testingStyle || 'AAA';
    switch (plan.persona) {
      case 'manual-qa':
        if (type.includes('Manual Test Cases')) {
          return `### Manual Test Cases (Persona: Manual QA)

#### TC-001: Anonymous Access Blocked (Security Boundary)
- **Preconditions**:
  1. Storage Account exists on Azure environment.
  2. Public Access flag is set to Disabled.
- **Actions**:
  1. Send an unauthenticated HTTP GET request to a sample blob file URL.
- **Expected Outcome**:
  - Request fails with HTTP 403 Forbidden validation error.

#### TC-002: Authenticated Access Succeeds
- **Preconditions**:
  1. Valid Azure AD / SAS Token generated.
- **Actions**:
  1. Send HTTP GET request containing active SAS auth token headers.
- **Expected Outcome**:
  - Request returns HTTP 200 OK and successfully streams content.`;
        }
        if (type.includes('Regression Checklist')) {
          return `### Regression Checklist
- [ ] Verify image rendering assets loading on existing web templates.
- [ ] Check document template loading using secure storage accounts.
- [ ] Verify storage replication connections are functional.`;
        }
        return `### Exploratory Charter
- **Target Area**: SAS Parameter Tampering
- **Focus Guidelines**: Manipulate generated SAS tokens parameters (e.g. modify expiry timestamps, signatures, key claims) and verify container access locks out modified requests.`;

      case 'backend-developer':
        if (type.includes('Unit Test Skeletons')) {
          return `### Unit Test Skeletons (Persona: Backend Developer - Style: ${testingStyle})

\`\`\`csharp
[Fact]
public async Task Should_Return_Forbidden_When_Anonymous_User_Accesses_Private_Blob()
{
    // Arrange: Ensure public access disabled in configuration mock
    
    // Act: Send request to storage controller without credentials
    
    // Assert: Verify response code is HTTP 403 Forbidden
}

[Fact]
public async Task Should_Authenticate_Successfully_When_Valid_Token_Presented()
{
    // Arrange: Generate mock Entra token with valid expiry
    
    // Act: Access storage API passing token credentials
    
    // Assert: Verify successful read stream output
}
\`\`\``;
        }
        if (type.includes('Integration Test Skeletons')) {
          return `### Integration Test Skeletons
- Mocks: Setup Azure SDK Mock clients.
- Scenarios:
  - Connect to mock Azure storage server.
  - Assert configuration flags lock out anonymous access.`;
        }
        if (type.includes('SQL Validation Rules')) {
          return `### SQL Validation Rules
\`\`\`sql
-- Verify database logs do not capture raw token strings
SELECT log_id, timestamp, details
FROM system_audit_logs
WHERE details LIKE '%sas%' OR details LIKE '%token%';
\`\`\``;
        }
        return `### API Test Collection (REST API)
\`\`\`json
{
  "name": "Verify SAS Token Expiry check",
  "request": {
    "method": "GET",
    "url": "https://storage.bluerunner.com/container/sample.png",
    "headers": {
      "Authorization": "Bearer SAS_TOKEN_HERE"
    }
  }
}
\`\`\``;

      case 'automation-qa':
        return `### Playwright Test Skeletons (Language: ${plan.profile.language})
\`\`\`typescript
import { test, expect } from '@playwright/test';

test('should deny access to public blob when public access is disabled', async ({ request }) => {
  // Arrange: Target secure container URL
  
  // Act: Send anonymous fetch request
  const response = await request.get('/blob/secure-img.png');
  
  // Assert: Verify request returns forbidden code
  expect(response.status()).toBe(403);
});
\`\`\``;

      case 'security-tester':
        return `### Security Checklist
- [ ] Run SAS token signature manipulation exploits.
- [ ] Confirm credentials expiry enforces instant connection lockouts.`;

      default:
        return `### QA Artifact - ${type}
- Target: ${plan.persona.toUpperCase()}
- Content template mapped for engineering stacks.`;
    }
  }
}
