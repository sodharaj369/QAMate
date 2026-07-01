# QAMate Engineering Principles 🛠️

These engineering guidelines represent the repository's architectural guardrails. They are designed to prevent structural drift, prevent package circular dependencies, and maintain code quality.

---

## 🏛️ Code Architecture Guardrails

### 1. VS Code APIs Before Custom Implementations
- **Don't Reinvent**: If the host environment (VS Code) provides an API or utility, you **must** use it instead of writing a custom solution or importing an npm dependency.
- **Leverage Native Features**:
  - **AI Capability**: Use VS Code's Language Model API (e.g. Chat/AI Extension interfaces) as the primary discovery source before third-party model setups.
  - **Secure Storage**: Use VS Code's `SecretStorage` API to store Personal Access Tokens (PATs) and passwords. Never write them to configuration files, JSON storage, or variables.
  - **Widgets**: Use native Tree Views, QuickPicks, VS Code standard Command Palettes, and native Color Themes.

### 2. Platform Independence of Core Engine (`@qamate/engine`)
- **No Client Dependencies**: The core reasoning package must not depend on `vscode`, `electron`, `window`, `document`, or any other host-specific visual module.
- **Stateless Execution**: The engine must remain stateless and fully testable via pure Node.js command-line interfaces (CLI) and unit test runners (Vitest).

### 3. MVVM Pattern (Model-View-ViewModel)
- **Separation of Concerns**: Never embed logic, file state parsing, or storage serialization directly within React/Webview UI components.
- **Roles**:
  - **Model**: The core domain entities (`Requirement`, `Strategy`, `Artifact`) governed by `@qamate/engine`.
  - **ViewModel**: Controller classes that manage UI state transitions, command dispatches, and connection statuses.
  - **View**: Simple, reactive HTML/TypeScript rendering components.

### 4. AI Provider Abstraction
- **Bypass Direct SDKs**: Core package modules must never import vendor-specific SDK packages (like `@google/generative-ai` or `openai`).
- **Interface Driven**: All AI communication must go through the `ILLMProvider` interface. This allows simple rules-based fallbacks to swap in during offline states or unit testing.

### 5. Rule Engine Before AI
- **Deterministic First**: Always run static heuristics, AST parsers, business rule extractors, and regex-based validators first.
- **AI as an Amplifier**: Use LLMs only to validate complex logic, detect gaps, or refine phrasing. The base layers must work without internet or API keys.

### 6. No Monolithic Files
- **Single Responsibility**: Keep files focused on one class or single function suite.
- **Component Limit**: No React/Webview component or script file should exceed **300 lines of code**. If a component grows larger, refactor it into smaller, reusable child nodes or utility strategies.

### 7. Feature Flags & Plugin Architecture
- **Safe Launches**: Wrap experimental features (e.g. advanced multi-model comparisons or specific auto-completion widgets) in configuration feature flags.
- **Extensible Hooks**: Expose pipeline lifecycles (`onImport`, `onClarify`, `onStrategize`) so other developers can write plugins without modifying the core compiler.
