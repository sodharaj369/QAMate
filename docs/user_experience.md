# QAMate User Experience Framework

This document outlines the core workflows, sidebar configurations, next best action engines, and editor widgets.

---

## 1. Guided Workspace Stepper

Users progress through a linear sequence:
1. **Requirement**: Pasteur file inputs or select from Azure DevOps context explorer. Exposes heuristic checklists.
2. **Clarifications**: Prompts the user with prioritized gaps questions.
3. **Strategy**: Visualizes recommended suites, risk levels, and automated templates recommendations.
4. **Review**: Quality gate review status scores.
5. **Coverage**: Rules traceability logs.

---

## 2. Next Best Action Engine Rules

Contextual recommendations steer user decisions:
- **State: Imported** ➔ Recommend: `Answer Clarifications`
- **State: Clarified** ➔ Recommend: `Generate Test Strategy`
- **State: Strategized** ➔ Recommend: `Generate Test Skeleton Code`
- **State: Generated** ➔ Recommend: `Review Generated Artifacts`

---

## 3. Command Palette Contributions

Exposes commands globally inside VS Code editor command palette:
- `QAMate: Analyze Active Requirement File`
- `QAMate: Generate Test Strategy`
- `QAMate: Generate Manual Test Cases`
- `QAMate: Review Generated Artifacts`
- `QAMate: Export Project Strategy Results`
