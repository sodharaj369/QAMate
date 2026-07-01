# QAMate UX Principles 🎨

Every screen, interaction, and workflow in the QAMate client extension must respect the user's focus and optimize for high trust and productivity.

---

## 🧭 The Three-Question Rule
Every single screen in QAMate must clearly and immediately answer these three questions for the user:
1. **What happened?** (Clear context, current state, or analysis outcome).
2. **What should I do next?** (The singular, high-contrast Next Best Action button/stepper target).
3. **Why?** (Reasoning behind recommendations, requirements health warnings, or questions).

If a designed view cannot answer these three questions in 3 seconds, it must be redesigned.

---

## 🏛️ Core UX Principles

### 1. Value First, Configuration Later (Progressive Disclosure)
- **Zero Forms on Home**: The Home screen is for intake. Never show credentials forms, API tokens, provider selectors, or setup instructions here. 
- **Centralized Settings**: Move all configuration (AI Connections, Azure DevOps, Jira, QA Personas, Themes, and Defaults) to a dedicated **Settings** screen.
- **Wizard Setup**: Trigger credentials setups only when a user actively initiates a task requiring connection (e.g., "Import Azure DevOps Story" triggers a modal credential wizard).

### 2. Simplified Navigation
We restrict navigation to exactly four main destinations:
- 🏠 **Home** (Intake, session creation, status summary)
- 📂 **Sessions** (Recent session history: resume, rename, duplicate, delete)
- ⚙ **Settings** (AI connections, preferences, and developer tools)
- ❓ **Help** (Getting started guides, help docs, links)

No other sidebar tabs or navigation headers are allowed.

### 3. Workflow-First via Outcomes
Instead of a wizard guiding the user through numbered steps, the workspace tracks user progress against six key outcomes:
1. **Understand**: Requirements intake, heuristic analysis, business rule identification, and actors list.
2. **Prepare**: QA Readiness checklist, answering targeted validation questions only if gaps exist.
3. **Plan**: Strategy formulation, risk assessment, exclusions, and priority settings.
4. **Generate**: Creating the manual or automated test suites.
5. **Review**: Previewing test cases, reviewing coverage, and applying inline corrections.
6. **Deliver**: Exporting files or syncing directly with DevOps platforms.

### 4. No Fake Intelligence / Real Progress
- **Real Timing**: Never use simulated progress loaders or artificial timeouts to make the AI look "thoughtful."
- **Traceability Logs & Skeletons**: Show actual engine phase transitions or structured skeleton loaders representing the raw engine events resolving in real-time.

### 5. Developer Mode Isolation
- Expose detailed engine outputs, raw prompt templates, token calculations, and diagnostics logs only inside an optional, explicit "Developer Mode" pane in Settings. It must remain invisible in normal user workflows.

