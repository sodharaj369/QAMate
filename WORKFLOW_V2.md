# QAMate Ideal Product Workflow (Workflow v2)
**A Deep Cognitive Framework Specialize for Senior QA Engineering Reasoning**

---

## Overview
This document defines the ideal, end-to-end product workflow of **QAMate**. The workflow is structured around six sequential outcomes, designed to replicate the cognitive process of an experienced Senior QA Engineer. 

Unlike simple generative bots, QAMate treats the AI as **one evidence source among many**, compiling a unified **QAMate Mental Model** through an evidence-based pipeline. All outputs are stored internally as structured JSON data, never as raw documents (which are generated strictly as export views).

```
                             [Workspace Intake]
                                     │
                                     ▼
                      [Workspace Intelligence Engine] (Step 0)
                                     │
                                     ▼
                                Requirement
                                     │
                                     ▼
                [Evidence Extraction] (Pulls spec, notes, DNA)
                                     │
         ┌───────────────────────────┼───────────────────────────┐
         ▼                           ▼                           ▼
  [AI Observations]             [Knowledge]                [Project DNA]
         │                           │                           │
         └───────────────────────────┼───────────────────────────┘
                                     ▼
                           [QAMate System Model] (Belongs to QAMate)
                                     │
                                     ▼
                            [QA Mental Model] (Heart of QAMate)
                                     │
                                     ▼
                          [Test Strategy Blueprint] (Plan)
                                     │
                                     ▼
                        [Compile QA Deliverables] (Generate)
                                     │
                                     ▼
                          [QA Value Engine] (USP Compiler)
                                     │
                                     ▼
                          [Peer Review Gate] (Human-in-the-loop)
                                     │
                                     ▼
                          [QA Review Engine] (Compliance auditor)
                                     │
                                     ▼
                           [QA Deliverables JSON] (Stored)
                                     │
                                     ▼
                          [Deliver & Export views] (Markdown/API Sync)
```

---

## Step 0: Workspace & Project Intelligence (Bootstrapping)

### Purpose
To analyze the target workspace environment, mapping the repository layout, system architecture, third-party interfaces, active frameworks, and testing playbooks before any single user story is loaded.

### Inputs
* Repository structure (root directory scan).
* Configuration and documentation files (README, package.json/pom.xml, Docker configs, OpenAPI schemas, existing test suites, and playbooks).

### Outputs
* **Workspace Intelligence Store**: A structured JSON registry detailing:
  * **System Tech Profile**: Languages, databases, and container targets.
  * **API Contracts Map**: Extracted endpoints from OpenAPI specs.
  * **Test Coverage State**: Registry of existing test files, folders, and framework types.
  * **Project DNA**: Visible, transparent, and editable configuration rules.

### Human Contribution
Opens the repository workspace in the IDE. Reviews the extracted **Project DNA** and manually edits business vocabulary glossaries, known limitations, team preferences, or playbook rules directly in the settings panel.

### AI Contribution
Acts as an **Environment Observer**. It reads README headers, package configurations, and API structures to compile a high-level summary of the system architecture, domain vocabulary, and testing standards. It does not write code.

### QAMate Responsibility
* Runs the repository crawler upon workspace launch.
* Compiles the Project DNA Store.
* Exposes the Project DNA configuration in a transparent, fully editable GUI settings view.
* **Operation Contract Guarantee**: *No Alteration*—The local workspace files, scripts, and configurations are never modified or rewritten.

### Why This Step Cannot Be Skipped
A Senior QA Lead joining a project does not start by writing tests for Story #1. They first seek to understand the product: what architecture it runs on, what databases it uses, what APIs already exist, and what the team's coding standard is. Skipping this step leads to generic, context-blind test recommendations that violate the repository's existing standards.

### Expected UX
A "Workspace Intelligence" loading dial on startup. Once finished, a permanent "Project DNA" tab becomes available in the sidebar, displaying editable cards for Architecture, Tech Stack, Vocabulary, and Playbooks.

---

## Step 1: Spec Intake & Evidence Extraction (Understand)

### Purpose
To ingest raw requirement text, extract syntactic tokens, collect manual user notes, and combine them with the **Workspace Intelligence** and **Project DNA** to build the initial evidence base.

### Inputs
* Raw requirements document.
* **Project DNA** (loaded from the Workspace Intelligence Store).

### Outputs
* **Evidence Ledger**: Combined tokens, active rules, and DNA parameters.
* **QAMate System Model**: The structural mapping of system boundaries. AI only contributes observations; the model itself belongs to QAMate. It contains Actors, Components, and Flows.

### Human Contribution
Pastes the raw requirement text or synchronizes the issue ticket. Confirms or manually adjusts system component mappings. If AI is offline, enters **Manual Analysis Mode** (visualizing the **AI Disconnected Mode** state) to map components manually.

### AI Contribution
Acts as an **Observation Source**. It reviews the raw specification text and reports structured semantic observations (actors list, logical interfaces, and implicit risks) back to the core engine. It never makes final model decisions.

### QAMate Responsibility
* Coordinates the local evidence extraction pipeline.
* Injects Project DNA parameters into the active context.
* Compiles the System Model based on observations, knowledge, and DNA.
* **Operation Contract Guarantee**: *Structural Integrity*—Preserves the source requirement text exactly.

### Why This Step Cannot Be Skipped
Without this step, the AI would reason directly from raw spec text. This leads to semantic drift, shallow understanding, poor explainability, and inconsistent testing scopes, as the AI fails to align with the project's permanent technical architecture and vocabulary.

### Expected UX
A split-screen interface. The top header displays the active **Understand Contract** (Guarantees vs. Forbidden actions). The side-panel displays the **Understanding Confidence** (e.g. "98%") and the System Model visual map.

---

## Step 2: Assumption Verification & QA Mental Model Gating (Prepare)

### Purpose
To expose requirements omissions, audit unstated assumptions, resolve critical ambiguities, and compile the **QA Mental Model**.

### Inputs
* The **QAMate System Model** generated in Step 1.
* Historical knowledge base entries.

### Outputs
* **QA Mental Model**: The heart of QAMate, capturing the active quality logic state (facts, assumptions, inferences, unknowns, exclusions, reasoning trace).
* **Assumption Verification Card**: A checklist of assumptions the user must confirm.
* **Material Clarification Cards**: A targeted list of high-priority questions.

### Human Contribution
Reviews and confirms the AI-extracted assumptions list. Answers up to three targeted clarification questions to resolve gaps.

### AI Contribution
Acts as an **Adversarial Diagnostician**. It audits the System Model against the Project DNA rules to locate logic gaps and drafts targeted questions.

### QAMate Responsibility
* Compiles the QA Mental Model based on confirmed assumptions and user answers.
* Enforces the Assumption Gate, blocking strategy creation until the user confirms the assumptions list.
* **Operation Contract Guarantee**: *Semantic Traceability*—Every clarification question maps directly to an active gap in the System Model.

### Why This Step Cannot Be Skipped
Without this step, the testing strategy is built on silent, unverified assumptions. Bypassing this gate lets implicit developer assumptions pass into the test suite, leading to incorrect validation criteria.

### Expected UX
An "Assumption Gate" checklist appearing above the questions stepper. The screen displays the **Prepare Contract** badge showing its operational guarantees.

---

## Step 3: DNA-Guided Strategy Planning (Plan)

### Purpose
To establish testing priorities, recommended suites, and scope exclusions, guided by the **Project DNA**.

### Inputs
* Refined **QA Mental Model** (including user clarified answers).
* **Project DNA** (Known risks, playbooks, tech stack patterns).

### Outputs
* **Test Strategy Blueprint**: A structured strategic plan containing Objectives, Recommended Suites, Exclusions, and Test Data plans.

### Human Contribution
Reviews the **QA Recommendation Engine** card stack. Clicks "Accept" or "Ignore" on recommendations. Edits the Objectives, Scope, and Out of Scope boundaries directly in **structured GUI input fields**.

### AI Contribution
Acts as a **Specialized QA Advisor**. It evaluates the System Model, QA Mental Model, Strategy, and Knowledge against the Project DNA patterns to output structured recommendation cards.

### QAMate Responsibility
* **No Raw Markdown Editing**: Stores the Strategy as JSON internally and exports it as Markdown, but **never exposes raw markdown editing to the user**.
* Tracks and displays **Strategy Confidence** (e.g., "91%").
* **Operation Contract Guarantee**: *Logical Exclusivity*—Every suite marked as "Excluded" must feature a user-approved justification.
* **Explainability Guarantee (Reasoning Trace)**: Every recommendation must display a complete trace mapping:
  `Evidence ➔ Reasoning ➔ Decision ➔ Confidence ➔ Recommendation`

### Why This Step Cannot Be Skipped
Without a formal Strategy Blueprint, the generation step produces bloated, redundant, and out-of-scope test cases. Defining the strategy first ensures that testing resources are focused on high-risk components.

### Expected UX
A structured card layout with swipable recommendation cards. Objectives and scope boundaries are displayed as clean, editable form fields. The **Plan Contract** is displayed in the panel header.

---

## Step 4: Compile QA Deliverables (Generate)

### Purpose
To compile the raw testing deliverables (manual test scenarios, automated script skeletons, regression impacts) based on the approved strategy.

### Inputs
* Approved **Test Strategy Blueprint**.
* Compiled context parameters.

### Outputs
* **QA Deliverables JSON**: Raw compiled test files and strategy details stored in structured JSON format.

### Human Contribution
Selects the active view preferences (e.g., collapsing the code panel to focus on manual descriptions). Reviews the generated templates.

### AI Contribution
Acts as a **Generative Compiler**. It reads the approved objectives and tech standards, writing code scripts or step sequences that adhere to playbooks, avoiding placeholders.

### QAMate Responsibility
* **QA Value Engine Gate**: The core engine compiles and optimizes the raw test cases, pruning duplicate cases, merging similar objectives, and parameterizing minor validation variations into data tables (e.g., mapping 100 raw AI cases down to 37 kept, 41 merged, 15 parameterized, and 7 removed).
* **Operation Contract Guarantee**: *No Placeholders*—guarantees that generated scripts contain zero `"TODO"` or dummy assertions.

### Why This Step Cannot Be Skipped
Translates planned objectives into actual engineering files. The QA Value Engine ensures that the generated suite remains lightweight, high-value, and free of redundant scripts.

### Expected UX
A code editor workspace. Collapsible drawers allow the user to toggle between manual descriptions and automated script views. The **Generate Contract** outlines formatting constraints.

---

## Step 5: Compliance Gate & Auditing (Review)

### Purpose
To check generated deliverables against project standards, check expectations, and verify complete coverage of business rules.

### Inputs
* Generated **QA Deliverables JSON**.
* Original **System Model** rules.

### Outputs
* **Compliance Review Report**: A quality gate report detailing coverage traces and violations.

### Human Contribution
Reviews compliance alerts and overrides or requests rewrites for flagged violations. Performs **Peer Review** audits.

### AI Contribution
Contributes **audit observations**. It parses the generated scripts to report potential compliance omissions back to the engine. It never decides compliance approval.

### QAMate Responsibility
* Performs the **compliance verification** by running the **QA Review Engine** (evaluating weak expected results, missing negative assertions, missing boundaries, checking traceability matrices, verifying style and playbook compliance).
* **Operation Contract Guarantee**: *Semantic Integrity*—guarantees that the generated tests verify the exact logic boundaries of the requirements without introducing new assumptions.

### Why This Step Cannot Be Skipped
Without an automated review gate, model drift can go undetected. The compliance gate ensures that the final deliverables strictly adhere to the Project DNA standards before export.

### Expected UX
A compliance checklist panel. Warning badges highlight gaps, duplicate scenarios, or standard violations. The **Review Contract** outlines the verification rules.

---

## Step 6: Workspace Synchronization & Export (Deliver)

### Purpose
To export the validated deliverables to local folders or synchronize them with project ticket tools.

### Inputs
* Validated **QA Deliverables JSON**.

### Outputs
* Synchronized files in local workspace folders or updated external tickets.

### Human Contribution
Selects the export path and clicks "Deliver" to synchronize deliverables with the repository or ticket system.

### AI Contribution
* **None** (Bypassed entirely).

### QAMate Responsibility
* Serializes the internal JSON models into clean markdown or runner scripts (Gherkin, Playwright, CSV, HTML, PDF).
* Performs network updates to external ticket APIs.
* **Operation Contract Guarantee**: *Transactional Safety*—local state is preserved on write failures.
* **Change History Log**: Automatically appends a change history audit log showing *why* a Strategy or Test Case changed.
* **Change Intelligence Engine**: When a requirements change is made, it intercepts the change and maps:
  `Requirement Changed ➔ Detect What Changed? ➔ Why? ➔ Affected Components ➔ Affected Risks ➔ Affected Tests ➔ Affected Strategy ➔ Regenerate only affected outputs`
* **Story Evolution Tracker**: Links story dependencies across sprints (e.g. Story B extends Story A), showing existing regression tests, new cases, and regression impact.

### Why This Step Cannot Be Skipped
QA deliverables are useless if they remain trapped in the reasoning workspace. Exporting them integrates them directly into the team's active deployment pipelines.
