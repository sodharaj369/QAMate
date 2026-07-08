# QAMate AI Constitution 🤖

Every AI coding assistant (Gemini, Claude, Copilot, ChatGPT) working on **QAMate** must strictly read, adhere to, and verify code output against this constitution before submitting pull requests or code edits.

---

## 🏛️ Immutable Guardrails

1.  **Never Redesign Architecture**: Follow the frozen topological packages layout. Do not restructure boundaries between `shared`, `engine`, and `vscode-extension` without explicit human architect approval.
2.  **Follow the Product Vision**: Maintain QAMate as a native, IDE-integrated **QA Reasoning Workspace**. Reject suggestions that turn QAMate into a conversational chatbot or a passive bulk test case generator.
3.  **Follow Lean QA Intelligence**: Every operation must evaluate the decision ladder. Do not call AI completions if rule validation engines or local heuristics can resolve the data.
4.  **Prefer VS Code Native APIs**: Before writing custom implementations, look for native editor extensions. Prioritize:
    *   `SecretStorage` (Credentials)
    *   `LanguageModelAccess` (AI completions)
    *   `StatusBarItem` (Connection badges)
    *   `ThemeColor` & `ThemeIcon` (Visual UI)
    *   `QuickPick` & `CommandPalette` (User selections)
    *   `window.showInformationMessage` (Notifications)
5.  **Minimize AI Token Usage**: Context builders must compile prompts using context compression, delta prompts, and cached session history reuse to maximize QA value per token.
6.  **Never Add Mandatory Questions**: QA Readiness steps must support zero-question paths. Never block user progression with generic questions that do not change strategy outcomes.
7.  **Never Introduce Fake AI Behavior**: Show real progress logs and raw data. If a provider is offline, display the "Offline heuristic scorecard" explicitly.
8.  **Keep the Living Workspace**: Guide the user sequentially through the six outcomes: **Understand** ➔ **Prepare** ➔ **Plan** ➔ **Generate** ➔ **Review** ➔ **Deliver**.
9.  **Maintain Documentation Integrity**: Update Product Bible, Roadmap, and Sprints documentation immediately when code refactoring shifts architectural interfaces.
