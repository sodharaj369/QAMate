# Volume 3: Architecture & AI Engines - Chapter 25: Pattern Memory & Knowledge Engine

## Purpose
Governs local pattern learning, QA memory accumulation, and organization playbooks.

## Problem
AI reasoning tools make the same mistakes repeatedly on subsequent analysis runs because they lack a localized learning memory.

## Goals
- Build a three-tiered memory system: Session Memory ➔ Project Memory ➔ Organization Playbooks.
- Implement approval workflows for learning suggestions to prevent rules pollution.

## Non Goals
- Syncing private workspace memory to public global models.
- Auto-updating requirements without QA verification.

## Architecture
The [DefaultKnowledgeEngine](file:///d:/QAMate/packages/engine/src/knowledge/knowledgeEngine.ts#L24) parses lessons, templates, and corrections. Suggested entries must pass approval gates before writing to the database.

## UX
Displays learning suggest checklists in the review workspace, allowing QA leads to approve or discard rules suggestions.

## Engineering
*   **Tiered Memory Chain**:
    *   *Session Memory*: Temporary corrections answered during the active stepper wizard.
    *   *Project Memory*: Local database entries shared across the workspace.
    *   *Organization Playbooks*: Global compliance playbooks imported from Jira/ADO.
*   **Approval Workflow**: Corrections are saved as pending suggestions. Only approved items are serialized to the project's database.
*   **No Auto-modification**: The Knowledge Engine must never rewrite the local Rule Validation Engine code; it only appends guidelines to context compiles.

## Examples
QA Lead approves a learning suggestion regarding payment timeout rules. The next session uses this rule during intake analysis.

## Anti Patterns
- Automatically modifying static rules engines or prompts without a human approval confirmation step.

## Acceptance Criteria
- Approved corrections write to `store.json` with keywords.
- Matched lessons are loaded and appended to context compilations.

## Future Evolution
Support versioned knowledge base configurations, letting teams rollback Playbook configurations to older branches.
