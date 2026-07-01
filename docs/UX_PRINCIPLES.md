# QAMate UX Principles 🎨

Every screen, interaction, and workflow in the QAMate client extension must respect the user's focus and optimize for high trust and productivity.

---

## 🧭 The Three-Question Rule
Every single screen in QAMate must clearly and immediately answer these three questions for the user:
1. **What happened?** (Clear context, current state, or analysis outcome).
2. **What should I do next?** (The singular, high-contrast Next Best Action button).
3. **Why?** (Reasoning behind the recommendation or status).

If a designed view cannot answer these three questions in 3 seconds, it must be redesigned.

---

## 🏛️ Core UX Principles

### 1. Progressive Disclosure
- **Hide Complexity by Default**: Users must never see raw prompt layouts, complex orchestration trees, or JSON tokens in the standard workspace views. Expose only clean decisions, clear tables, and actionable cards.
- **Developer Mode**: Expose detailed engine outputs, raw traces, token usages, and terminal logs only inside an optional, explicit "Developer Mode" pane.

### 2. Never Interrupt the Workflow
- **No Repeated Prompts**: Never prompt the user for configuration details like Persona, AI models, or settings on every run. Save preferences and remember the last session configurations.
- **Silent Heuristics**: Analyze files and detect requirements in the background. Only trigger question-clarification boards when the engine is blocked by critical contradictions or gaps.

### 3. Workflow-First, Not Chat-First
- **Guided Stepper**: Structure the workspace around a linear progression timeline:
  `Requirement` ➔ `Clarifications` ➔ `Strategy` ➔ `Review` ➔ `Coverage`
- **Minimal Chat**: Limit chat interactions to refinement operations on selected items rather than making a text input the primary interaction model.

### 4. One-Click Next Action
- **Contextual Recommendation**: The UI must calculate the state machine level and highlight the "Next Best Action" (e.g. `Requirement Imported` ➔ `Answer Clarifications` ➔ `Generate Test Strategy`).
- **Singular Focus**: Place this primary action button prominently at the bottom of the active panel to steer focus.

### 5. No Fake AI / Real Progress
- **Real Timing**: Never use simulated progress loaders or artificial timeouts to make the AI look "thoughtful."
- **Traceability Logs & Skeletons**: Show actual engine phase transitions or structured skeleton loaders representing the raw engine events resolving in real-time.

### 6. Living Workspace
- **Single Page Interface**: Avoid scattering tabs across multiple VS Code panels. Consolidate current status, next actions, and the generation timeline into a single, clean vertical panel.
- **Session Header**: Maintain a sticky, small widget showing connection status (AI Provider, DevOps/Jira Org) and preference states.

### 7. Keyboard-First Productivity
- **Hotkeys**: Bind all core workflow steps to VS Code command palettes (e.g. `Ctrl+Alt+A` to analyze requirements, `Ctrl+Alt+S` to view strategy).
- **Native VS Code Integration**: Match user spacing, font families, active theme tokens, and native Codicons so QAMate feels built-in rather than bolted-on.
