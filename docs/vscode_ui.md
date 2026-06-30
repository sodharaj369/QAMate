# VS Code Extension UI Integration

The **QAMate VS Code Extension** integrates the requirement analysis, clarification, and test artifact generation workflow directly into code editors.

---

## 1. Extension Manifest Contributions

The extension extends VS Code capabilities by contributing command hooks inside the `package.json` manifest:

```json
  "contributes": {
    "commands": [
      {
        "command": "qamate.analyze",
        "title": "QAMate: Analyze Active Requirement File"
      }
    ]
  }
```

---

## 2. Command Subscriptions & Buffer Extraction

When a user triggers `qamate.analyze`:
1. **Active Editor Validation**:
   - Ensures an active file editor view is focused (`vscode.window.activeTextEditor`).
2. **Buffer Extraction**:
   - Extracts active specification text values directly from the buffer:
     `vscode.window.activeTextEditor.document.getText()`
3. **Webview Presentation**:
   - Creates a side-by-side webview panel using `vscode.window.createWebviewPanel` matching standard theme properties (`var(--vscode-editor-background)`, `var(--vscode-button-background)`, etc.).
   - Renders interactive checklists and input answer forms.

---

## 3. Mock Testing Strategy

To run integration assertions in headless workspaces without full VS Code runtime overhead:
- We mock the `vscode` module namespace properties inside the Vitest environment using:
  `vi.mock('vscode', () => { ... })`
- Tests verify command triggers, subscriptions tracking list pushes, and context UI displays.
