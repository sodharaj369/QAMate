# QAMate Workspace Design System

The QAMate design system utilizes VS Code theme variables to provide clean dark and light mode rendering out of the box.

---

## 1. UI Tokens & Styling Tokens

Styling custom properties map directly to VS Code tokens:
- **Background**: `var(--vscode-editor-background)`
- **Foreground**: `var(--vscode-editor-foreground)`
- **Sidebar**: `var(--vscode-sideBar-background)`
- **Button Active**: `var(--vscode-button-background)`
- **Button Text**: `var(--vscode-button-foreground)`
- **Notification border**: `var(--vscode-textSeparator-foreground)`

---

## 2. Reusable Layout Components

- **Visual Cards**:
  - Class: `.card`
  - Utilizes `var(--vscode-editorWidget-background)` to render rounded panels separating heuristics, summaries, and risk summaries.
- **Workflow Steppers**:
  - Class: `.stepper-container` and `.step-item`
  - Render linear progress bars indicating active steps and finished steps.
- **Recommendation Alerts**:
  - Class: `.action-box`
  - Renders colored notification highlights with left borders matching buttons highlight colors.
- **Status Tags**:
  - Class: `.tag`
  - Exposes colored states: `.tag-warn` (Orange) and `.tag-ok` (Teal).
