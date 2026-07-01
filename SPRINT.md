# QAMate Sprint Tracking Board 📋

Welcome to the QAMate active sprint board. This document tracks our immediate tasks, active execution steps, and verification procedures.

- **Immutable Product Roadmap**: See [ROADMAP.md](docs/ROADMAP.md)
- **Product Backlog & Feature Backlog**: See [BACKLOG.md](docs/BACKLOG.md)
- **Product Constitution & Principles**: See [PRODUCT_VISION.md](docs/PRODUCT_VISION.md), [UX_PRINCIPLES.md](docs/UX_PRINCIPLES.md), and [ENGINEERING_PRINCIPLES.md](docs/ENGINEERING_PRINCIPLES.md).

---

## 📐 Principal CTO Directives
- **Rule 1**: Every sprint must end with a usable product slice (functioning, integrated, and testable from the VS Code extension interface).
- **Rule 2**: Every sprint must provide or validate CLI demonstration outputs.
- **Rule 3**: Every sprint must validate/expand the `examples/` golden dataset containing real-world requirements.

---

## ✅ Completed Sprints

### Sprint PF-1: First Launch Experience
- [x] Welcome screen dashboard (session listings, empty state pages).
- [x] Connections status widget (theme detection, offline status, connection badges).
- [x] Workspace preferences (QA Persona dropdown and workspaceState caching).
- [x] Session manager (create, load, and delete active sessions).
- [x] Integration with `ux.test.ts` layout rendering verification.

### Sprint PF-2: AI & Connection Manager
- [x] Secure storage connector using VS Code's `SecretStorage` for API keys and DevOps/Jira PATs.
- [x] Asynchronous rendering engine integration to prevent visual blocking.
- [x] Connection configuration forms under collapsible sidebar drawer.
- [x] Dynamic `ILLMProvider` resolver and injector for engine generation steps.

### Sprint PF-3: Requirement Intake
- [x] Paste intake workspace card (`📥 Paste Requirement or URL`).
- [x] Auto-detection classifier mapping raw text/urls/IDs to their correct structures.
- [x] Extended file-watch listener supporting `.md`, `.feature`, `.txt`, `.docx`, `.pdf`, and `.json`.
- [x] Zero-dependency binary text extractor parsing ASCII runs out of Word/PDF specifications.
- [x] Classifier regex pattern verification tests.

### Sprint RI-1: Requirement Analysis
- [x] Validation warning triggers VAL-005 (Duplicates), VAL-006 (Missing Acceptance Criteria), and VAL-007 (Inconsistent Gherkin steps).
- [x] Sidebar scorecard dashboard presenting health rating scorecards.

### Sprint RI-2: Domain Detection
- [x] Rule-based keyword-driven domain detector interface (`IDomainDetector`).
- [x] Decoupled domain engine mapping confidence scores (Payments, Healthcare, Authentication, etc.).

### Sprint RI-3: Reasoning Engine
- [x] Added `database-models` missing info category option.
- [x] Heuristic rules parsing unverified assumptions (`implied-behavior`), contradictions, and database schema gaps.

### Sprint RI-4: QA Readiness
- [x] Fully responsive, dynamic question stepper wizard.
- [x] Skips, backtracking, explicit rationales, and skip risk explanations.

### Sprint TS-1: Test Strategy
- [x] Risk Matrix Grid coordinates mapping visualizer widget.
- [x] Interactive exclusions & priorities overrides editor dashboard.

### Sprint TS-2: Test Cases (Manual & Skeletons)
- [x] Cases factory generating positive, negative, boundary, edge case, and API checklists.
- [x] Tailored security, performance, and accessibility advice based on domain context.

### Sprint TS-3: Results Workspace
- [x] Tab-based consolidated workspace tabs (Strategy, Cases, Review).
- [x] Cases list search filtering and inline markdown text editor.

### Sprint TS-4: Export Adapter
- [x] Standard multi-format exporters (Markdown, CSV, Excel, HTML, JSON).
- [x] Sync selectors linking test scripts back to Azure DevOps and Jira issue cards.

### Sprint UX-1: Living Workspace
- [x] Single-page stepper workspace layout displaying the active step only.
- [x] Next Best Action footer tracker recommendation guidance.

### Sprint UX-2: Native VS Code
- [x] System theme color overrides and font size scaling.
- [x] Keybindings registration shortcuts (`ctrl+alt+a`, `ctrl+alt+c`, `ctrl+alt+n`).

### Sprint UX-3: Micro-interactions & Polish
- [x] Shimmering animated skeleton loaders.
- [x] Drag and drop spec file intake drop zone area.

### Sprint ENT-1: Azure & Jira Synchronization
- [x] Standard ADO and Jira persistence adapters mapping test deliverables back to active user story boards.

### Sprint ENT-2: Team Settings & Org Playbooks
- [x] Configurable corporate playbooks interface and custom keyword compliance triggers.

### Sprint LRN-1: Pattern Memory Reuse
- [x] Knowledge base learning from user corrections and similar historical requirement pattern matching context compilation.

---

## 🧱 Project-Wide Rules (Never Change)

1. **Every sprint must end with**:
   - Working CLI demo.
   - Unit tests.
   - Updated documentation.
   - Golden dataset validation.
   - Monorepo build passing.
2. **Every recommendation must include reasoning.**
3. **Every generated artifact must be traceable back to**:
   `Requirement` ➔ `Intelligence` ➔ `Questions` ➔ `Context` ➔ `Strategy` ➔ `Artifact` ➔ `Review` ➔ `Coverage`
4. **AI must never be the source of truth.** AI assists. QAMate reasons.
5. **Build vertical slices.** Never build infrastructure that has no active consumer.
6. **Every new module must have**: Interface, One implementation, Unit tests, CLI demonstration, and Documentation.

---

## 📂 Golden Dataset Layout (Mandatory)

```
examples/
├── authentication/
├── banking/
├── crm/
├── ecommerce/
├── education/
├── healthcare/
├── hospitality/
├── infrastructure/
├── payments/
├── security/
```
Each folder contains:
- `Requirement.md`
- `ExpectedIntelligence.json`
- `ExpectedQuestions.json`
- `ExpectedContext.json`
- `ExpectedStrategy.json`
- `ExpectedArtifacts.json`
- `ExpectedReview.json`
- `ExpectedCoverage.json`
- `README.md`

---

## 🛠️ Verification Commands

Run these commands from the monorepo root to verify the codebase:

```bash
# Compile TypeScript Project References
npm run build

# Run Vitest Unit Tests
npm run test

# Run Format and Lint checks
npm run format && npm run lint
```
