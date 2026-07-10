# QAMate Operation Contracts
**Semantic, Quality, and Behavioral Standards for AI and Engine Execution**

This document establishes the operational contracts for all core workflows inside QAMate. Every processing step must satisfy these contracts to prevent semantic drift, token waste, or loss of user confidence.

---

## Visual Contract Exposure Rule
To build maximum trust with the QA Lead, **every screen in the QAMate workspace must visually display its active Operation Contract**. The UI will display a collapsible panel showing the active **Guarantees (✓)** and **Forbidden Actions (✗)** for that step, ensuring complete transparency in QAMate's execution rules.

---

## 1. Bootstrapping (Workspace Intelligence)

* **Purpose**: Scan the repository structure and baseline configurations on launch to build the project brain context.
* **Allowed Changes**: Extracting config parameters, mapping directory structures, and profiling API endpoints.
* **Forbidden Changes**: Modifying project files, deleting tests, or altering playbooks.
* **Expected Guarantees**: Returns a schema-compliant Workspace Intelligence Store JSON.
* **Semantic Integrity Rules**: All DNA metrics extracted are saved in JSON format, fully transparent and editable in the settings GUI.
* **Confidence Behaviour**: Diagnostic baseline, no confidence scores.
* **Explainability Requirements**: None.

---

## 2. Understand (System Modeling)

* **Purpose**: Parse raw requirements and Project DNA into a structured System Model.
* **Allowed Changes**: Structuring actors, mapping component nodes, and identifying sequence flows.
* **Forbidden Changes**: Modifying requirement text, inventing components that aren't mentioned or implied, or treating assumptions as verified facts.
* **Expected Guarantees**: Returns a schema-compliant System Model (actors, components, flows). The System Model belongs to QAMate; AI only contributes observations.
* **Semantic Integrity Rules**: *Structural Integrity*—The source requirement text is preserved exactly. Every node and actor maps back to a reference sentence in the requirement.
* **Confidence Behaviour**: Calculates and displays an "Understanding Confidence" metric (e.g. 98%) based on the number of unmapped components and unknowns. This score is for user display only; it is never used to programmatically block progress.
* **Explainability Requirements**: Each node and actor must display a rationale explaining why it was extracted from the requirement.

---

## 3. Prepare (QA Mental Model & Gaps Gating)

* **Purpose**: Expose omissions, audit unstated assumptions, and compile the QA Mental Model before strategy planning.
* **Allowed Changes**: Identifying logic ambiguities, drafting clarification cards, and listing system assumptions.
* **Forbidden Changes**: Asking generic, boilerplate questions or bypassing the Assumption Verification Gate.
* **Expected Guarantees**: Yields a QA Mental Model (facts, assumptions, inferences, unknowns, reasoning trace), an Assumption Verification Card checklist, and a maximum of three clarification questions.
* **Semantic Integrity Rules**: *Semantic Traceability*—Every clarification question must map directly to an active gap or unknown in the System Model.
* **Confidence Behaviour**: Completing verification cards and answering questions raises the overall readiness confidence, but the gate status is checklist-based, not numeric-based.
* **Explainability Requirements**: Each question must display the risk justification showing the cost of ignoring it.

---

## 4. Plan (Strategy Formulation)

* **Purpose**: Formulate a Test Strategy Blueprint mapping objectives, recommended suites, and scope exclusions.
* **Allowed Changes**: Recommending test suites, scheduling execution orders, and identifying out-of-scope zones.
* **Forbidden Changes**: Removing critical transaction paths (P0) without human consent.
* **Expected Guarantees**: Yields a Strategy Blueprint containing objectives, suites, exclusions, and test data plans.
* **Semantic Integrity Rules**: *Logical Exclusivity*—Every test suite marked as "Excluded" must feature a user-approved justification. Direct edits must occur through structured GUI input fields, never exposing raw markdown editing. Stored internally as JSON.
* **Confidence Behaviour**: Calculates and displays a "Strategy Confidence" metric (e.g. 91%). This is for user display only.
* **Explainability Requirements**: The **QA Recommendation Engine** stack evaluates the System Model, QA Mental Model, Strategy, and Knowledge against the Project DNA to output structured recommendations: `Requirement ➔ Recommendation ➔ Reason ➔ Industry Practice ➔ Accept/Ignore`. Every recommendation must trace: `Evidence ➔ Reasoning ➔ Decision ➔ Confidence ➔ Recommendation`.

---

## 5. Generate (Compile QA Deliverables)

* **Purpose**: Compile the raw testing deliverables (manual test scenarios, automated script skeletons, regression updates, review notes) based on the approved strategy.
* **Allowed Changes**: Naming variables, structuring code loops, and adding testing frameworks templates.
* **Forbidden Changes**: Introducing placeholder text (e.g., `"TODO: fill this"` or `"Dummy assertion"`).
* **Expected Guarantees**: Emits a syntax-valid QA Deliverables JSON matching the approved strategy. The **QA Value Engine** checklist is run to handle duplicate removal, parameterization of minor checks, merging similar objectives, and coverage optimization.
* **Semantic Integrity Rules**: *No Placeholders*—Guarantees that generated scripts contain zero `"TODO"` or dummy assertions. Generated files must match the approved strategy objectives. Stored internally as JSON.
* **Confidence Behaviour**: Calculates and displays a "Generation Confidence" metric (e.g. 74%).
* **Explainability Requirements**: Generated scripts must contain inline comments referencing the requirement rule ID verified by that test step.

---

## 6. Review (Compliance Auditing)

* **Purpose**: Audit generated deliverables against project standards, check expectations, and verify complete coverage of business rules.
* **Allowed Changes**: Flagging syntax errors, duplicates, or missing rule checks.
* **Forbidden Changes**: Modifying the test case code or documents directly without human permission.
* **Expected Guarantees**: Yields a gate review report detailing coverage traces and violations, audited by the **QA Review Engine** (evaluating weak expected results, missing boundaries, negatives, traceability, review quality, compliance, and style).
* **Semantic Integrity Rules**: *Semantic Integrity*—The generated tests must verify the exact logic boundaries of the requirements without introducing new assumptions.
* **Confidence Behaviour**: Lowers the overall suite readiness state if critical violations are detected.
* **Explainability Requirements**: AI contributes audit observations, QAMate performs compliance verification, and human approves. Provide a trace log mapping the exact guideline clause or requirement rule verified by each scenario.

---

## 7. Deliver (Workspace Serialization & Export)

* **Purpose**: Format and push validated deliverables back to the local repository and ticket managers.
* **Allowed Changes**: Spacing layout, file paths, and external API payload formatting.
* **Forbidden Changes**: Mutating ticket fields that are not in the mapping definition.
* **Expected Guarantees**: Executes atomic, safe network writes to external tools. Bypasses AI entirely.
* **Semantic Integrity Rules**: *Transactional Safety*—If the write fails, the local workspace state remains unchanged. No changes to test logic occur during transmission. Structured JSON models are converted to Markdown, Excel, PDF, or runner scripts strictly as transient export views.
* **Confidence Behaviour**: Deterministic 100%.
* **Explainability Requirements**: None required (bypasses AI). Automatically appends a change history log showing why the strategy/cases changed, and updates sprint story evolution trace metrics using the **Change Intelligence Engine**.
