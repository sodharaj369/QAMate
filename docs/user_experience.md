# QAMate User Experience Framework

This document outlines the core workflows, outcome transitions, next best action logic, and client workspace views.

---

## 1. Outcome-Based Stepper

The sidebar workspace tracks user progress against six distinct outcomes rather than a chronological step wizard:

1. **Understand**:
   - Intake: Paste raw requirements, upload files, or trigger imports.
   - Output: Requirement Health score, business rules index, actors list, and risks list.
2. **Prepare** (QA Readiness):
   - Output: Verification questions with explicit coverage rationales. Appears conditionally ONLY if gaps are found.
3. **Plan** (Test Strategy):
   - Output: Risks matrix, target priorities, test approach overrides, and automation recommendations.
4. **Generate** (Generate Test Suite):
   - Output: Manual or automated test case drafts.
5. **Review**:
   - Output: Strategy details, test cases grid, coverage mapping, and audit check results. Support inline editing and search.
6. **Deliver** (Export & Sync):
   - Output: Excel/Markdown/PDF exports, and Azure DevOps or Jira sync confirmation.

---

## 2. Next Best Action Logic

Contextual actions guide the user based on outcome readiness:
- **Requirement Intake Active** ➔ Recommend: `Analyze Requirement` (**Understand**)
- **Ambiguities / Gaps Found** ➔ Recommend: `Complete QA Readiness Check` (**Prepare**)
- **Gaps Clarified / Resolved** ➔ Recommend: `Review & Edit Test Strategy` (**Plan**)
- **Strategy Approved** ➔ Recommend: `Generate Test Suite` (**Generate**)
- **Suite Generated** ➔ Recommend: `Review Test Cases & Coverage` (**Review**)
- **Review Approved** ➔ Recommend: `Export Deliverables` (**Deliver**)

---

## 3. Command Palette Contributions

Commands are registered globally inside the VS Code editor command palette:
- `QAMate: Open Workspace Home` (🏠 Home)
- `QAMate: View Session History` (📂 Sessions)
- `QAMate: Open Extension Settings` (⚙ Settings)
- `QAMate: Run Diagnostics Analysis` (Understand)
- `QAMate: Approve Strategy and Plan` (Plan)
- `QAMate: Generate Test Suite` (Generate)
- `QAMate: Export Deliverables` (Deliver)

