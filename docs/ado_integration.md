# Azure DevOps Integration

The **Azure DevOps (ADO) Integration** module enables QAMate to natively synchronize requirements specifications and generated test cases with Azure DevOps Work Item boards without requiring third-party library dependencies.

---

## 1. Interface Definition

The integration is bound to the `@qamate/engine` via **`IADOPersistenceAdapter`**:

```typescript
export interface IADOPersistenceAdapter {
  importWorkItem(
    workItemId: string,
    org: string,
    project: string,
    pat: string,
  ): Promise<Requirement>;

  exportTestCases(
    testCases: TestCase[],
    workItemId: string,
    org: string,
    project: string,
    pat: string,
  ): Promise<void>;
}
```

---

## 2. Authentication Protocol

All API calls are authenticated using a **Personal Access Token (PAT)** encoded as a Basic Authorization header:

```typescript
const authHeader = `Basic ${Buffer.from(`:${pat}`).toString('base64')}`;
```

---

## 3. REST Schema Mappings

### Import Work Item
- **URL**: `GET https://dev.azure.com/{org}/{project}/_apis/wit/workitems/{workItemId}?api-version=7.1`
- **Fields Mapped**:
  - `System.Title` -> Mapped to requirement title.
  - `System.Description` or `Microsoft.VSTS.Common.AcceptanceCriteria` -> Mapped to requirement content (cleaned of HTML tags).
  - `System.CreatedBy.displayName` -> Mapped to spec metadata author.

### Export Test Cases
- **URL**: `POST https://dev.azure.com/{org}/{project}/_apis/wit/workitems/$Test%20Case?api-version=7.1`
- **Content-Type**: `application/json-patch+json`
- **Payload**:
  ```json
  [
    { "op": "add", "path": "/fields/System.Title", "value": "[QAMate] TestCase Title" },
    { "op": "add", "path": "/fields/Microsoft.VSTS.TCM.Steps", "value": "<p>Discrete Step HTML...</p>" },
    {
      "op": "add",
      "path": "/relations/-",
      "value": {
        "rel": "System.LinkTypes.Hierarchy-Reverse",
        "url": "https://dev.azure.com/{org}/{project}/_apis/wit/workitems/{parentWorkItemId}"
      }
    }
  ]
  ```

---

## 4. CLI Resumption & Export Triggers

### 1. Launching ADO Import
Run the analyze task passing `--ado <workItemId>`:
```bash
npm run analyze -- --ado 45892
```
This triggers command options prompting for the ADO Organization name, Project name, and PAT credentials (or resolves them automatically from environment variables `ADO_ORG`, `ADO_PROJECT`, and `ADO_PAT`).

### 2. Exporting Reviewed Test Cases
At the completion of the QAMate generation process, the CLI prompts:
```
Would you like to export generated test cases back to Azure DevOps? (y/n) [n]: y
```
Selecting `y` automatically translates the strategy's exploratory scenarios into strict `TestCase` structures and pushes them into the target ADO Board, linking them directly to the source user story parent ID.
