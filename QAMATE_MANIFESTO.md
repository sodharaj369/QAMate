# The QAMate Manifesto
**The Definitive Blueprint for the AI-Native QA Reasoning Workspace**

---

## Mission
> **"Help any AI think like an experienced Senior QA Engineer while minimizing unnecessary questions, tokens, duplicated work and cognitive load."**

---

## Philosophy
Software quality is not a code generation problem; it is a **cognitive reasoning problem**. 

Traditional AI testing tools optimize for the wrong metric: the quantity of generated test scripts. By focusing on rapid code emission, they pollute repositories with low-value, repetitive, and context-blind test suites that miss subtle boundary conditions and duplicate coverage. 

QAMate shifts the paradigm from *test case accumulation* to *evidence-based quality reasoning*. We believe that generating **zero tests of high confidence** is infinitely better than generating a thousand automated tests of incorrect alignment. 

QAMate acts as a cognitive scaffold. Rather than treating AI as the central decision-maker, QAMate treats the AI as **one evidence source among many**. The core engine orchestrates a structured reasoning pipeline, combining AI observations with local rule validations, historical knowledge, and the project's unique DNA.

The final output is a unified **QAMate Mental Model**, representing the collaborative reasoning of human QA Leads, structured project guidelines, and AI insights.

---

## What QAMate IS
* **A QA Reasoning Workspace**: A stateful workspace integrated directly into the developer's environment that guides users through a structured reasoning journey.
* **The Workspace Intelligence Engine**: A foundational scanner that runs upon project startup before any requirement is analyzed. It crawls the repository (README, package.json/pom.xml, Docker configs, OpenAPI specifications, existing test suites, and playbooks) to build the baseline **Workspace Intelligence**.
* **The Project DNA Store (Visible & Transparent)**: A central architectural component holding the project's permanent configuration. It serves as the project's "brain" and is fully transparent and editable in the UI. It contains: tech stack, coding standards, business vocabulary, domain glossary, system architecture, testing standards, team preferences, known limitations, existing suites, integration landscape, and reusable components.
* **The AI Request Optimizer (Redesigned TokenOptimizer)**: An intelligent layer that coordinates prompts and payloads without stripping comments or rewriting user inputs. It manages delta prompting, static context caching, prompt chunking, provider-specific formatting, context prioritization, Project DNA injection, and token budgeting.
* **The QA Value Engine**: A core compiler service that prunes, merges, parameterizes, and deduplicates suggested test cases to ensure that output scripts are lightweight and high-value (e.g. condensing 100 cases down to optimized sets).
* **The QA Review Engine**: An automated auditor responsible for detecting weak expected results, missing negative assertions, missing boundaries, checking traceability matrices, and verifying style and playbook compliance.
* **The QA Recommendation Engine (Platform-Wide Capability)**: A reusable reasoning component that evaluates any active workspace state (Requirement, System Model, Mental Model, or Strategy) against the Project DNA to output structured recommendations: `Requirement/State ➔ Recommendation ➔ Reason ➔ Industry Practice ➔ Accept/Ignore`.
* **The Change Intelligence Engine**: A core system coordinator that monitors requirements modifications. When a change is detected, it analyzes: **What changed? ➔ Why? ➔ Affected Components ➔ Affected Risks ➔ Affected Tests ➔ Affected Strategy**, and dynamically regenerates only the affected QA Deliverables.
* **A Human-in-the-Loop Quality Gate**: A framework that prepares, plans, and reviews strategies under human guidance before compiling deliverables.

---

## What QAMate IS NOT
* **A Conversational Chatbot**: We do not construct open-ended chat boxes, message feeds, or conversational threads. Interaction is guided, structured, and outcome-oriented.
* **A Simple AI Code Wrapper**: QAMate is not a passive conduit to a text generation model. The AI is simply one input to QAMate's core reasoning engine.
* **A Ticket or Sprint Management System**: We do not replace enterprise project trackers. We synchronize with them to read specs and export deliverables.
* **A Test Execution Runner**: QAMate does not run, execute, or monitor active test suites. We model and generate the test blueprints, strategies, and skeletons.

---

## Core Principles

### 1. Evidence-Based Reasoning (The Core Architecture)
QAMate does not pass raw requirements directly to the AI. Every request flows through a strict evidence collection pipeline:
```
Requirement ➔ Evidence Extraction ➔ [AI Observations / Knowledge / Workspace Intelligence / Project DNA] ➔ System Model ➔ QA Mental Model ➔ Test Strategy ➔ QA Deliverables
```
The **System Model** and **QA Mental Model** are the property and outputs of QAMate. The AI only contributes observations to the Evidence Extraction phase.

### 2. Structured Data Over Documents (Permanent Architecture Rule)
Every capability and engine in QAMate must produce and store **structured JSON data**, not raw documents. Markdown files, Excel sheets, PDF reports, and script files are strictly transient **views and export formats** rendered by the export engine. QAMate never stores files in raw document formats internally.

### 3. The QA Value Gate (Value Engine)
QA deliverables are treated as raw material. The workspace enforces the **QA Value Engine** checklist to prune, merge, and optimize test cases:
* **Pruning**: Keeping only essential validation paths (P0-P2).
* **Merging**: Combining redundant steps with overlapping test objectives.
* **Parameterizing**: Merging minor validation variations into data-driven parameter tables.
* **Pruning duplicates**: Removing out-of-scope or repetitive steps.

### 4. Structured Scaffolding for Non-Deterministic Minds
AI models are non-deterministic and prone to drift. The workspace provides a rigid, stateful schema that anchors the AI's reasoning, forcing it to populate defined concepts (actors, components, flows, risks) rather than writing unstructured prose.

---

## Immutable Rules
* **No Strategy, No Deliverables**: It is strictly forbidden to compile QA deliverables (manual tests, automation scripts, test strategies, or regression updates) without first presenting a Test Strategy for human review and approval.
* **Structured UI Modification (No Exposed Markdown)**: Users must never edit strategy documents as raw markdown. Editing of objectives, scope boundaries, and out-of-scope zones occurs through structured GUI fields. The engine stores this data as JSON internally and exports it as Markdown, but **never exposes raw markdown editing to the user**.
* **One Layout, Hidable Panels**: The workspace features **one unified layout** to prevent documentation duplication. Panels and views (e.g., manual steps, code skeletons) are hidden, collapsed, or expanded based on active user preferences, rather than redesigning the layout for different personas.
* **Manual Analysis Mode (AI Disconnected Mode)**: If cloud AI providers are blocked or offline, QAMate enters **Manual Analysis Mode**. The workspace does not halt; it degrades into a structured workspace where the human Lead manually populates the System Model and Strategy fields.
* **Confidence for Communication**: Confidence percentages (e.g., Understanding: 98%, Strategy: 91%, Deliverables: 74%) are kept and displayed to communicate readiness to the user. However, **confidence scores are never used to programmatically gate or decide workflow transitions**.
* **Truth in Progress**: The system must never simulate AI thinking or show fake progress indicators. If the system is offline, it must explicitly display the manual workspace indicator.
* **Outcome-Stepper Enforcement**: The workspace must guide the user sequentially through the six outcomes:
  `Understand` ➔ `Prepare` ➔ `Plan` ➔ `Generate` ➔ `Review` ➔ `Deliver`
