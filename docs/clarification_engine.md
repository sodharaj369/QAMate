# QA Readiness Engine (Prepare Outcome)

The **QA Readiness Engine** (formerly Clarification Engine) drives the **Prepare** outcome. It generates targeted, high-value clarification questions when critical ambiguities or gaps are detected in requirements.

Its primary goal is to ensure the requirement is ready for strategic testing plan formulation.

---

## 1. QA Readiness Execution Rules
To prevent unnecessary user friction, the QA Readiness phase conforms to these strict product rules:
1. **Show Only If Gaps Exist**: If the requirement has no critical gaps or questions, the **Prepare** outcome step is completely skipped in the UI, transitioning directly from **Understand** to **Plan**.
2. **Never Ask Generic Questions**: Questions must be context-specific. General queries like "Please provide more details" are prohibited.
3. **Always Explain "Why"**: Every question must include an explicit rationale explaining how the answer changes test coverage. For example:
   - *Question*: Authentication protocol details.
   - *Why*: This decision changes authorization test coverage and determines security matrix requirements.

---

## 2. QA Readiness Pipeline

The engine maps requirement intelligence gaps to coverage outcomes using four sub-modules:

```
          RequirementIntelligenceReport (extracted gaps & ambiguities)
                         │
                         ▼
             [Candidate Generation]  ➔  Produces raw QuestionCandidate[]
                         │
                         ▼
             [Prioritizer & Impact]  ➔  Calculates Priority, QA Impact Level,
                         │              and formulates Skip Risk warnings
                         ▼
             [Semantic Deduplicator] ➔  Merges redundant or overlapping queries
                         │
                         ▼
             [Question Grouping/Plan]➔  Groups by category and filters sets
                         │              (e.g., blocking-only vs. all questions)
                         ▼
                   Planned Questions[]
```

### A. Candidate Generator (`IQuestionCandidateGenerator`)
Parses gaps in the `RequirementIntelligenceReport` and designs queries. For example, a missing `error-handling` block triggers a query on validation formats.

### B. Prioritizer & Impact Analyzer (`IQuestionPrioritizer`)
Computes importance metrics for each candidate:
- **QA Impact Ratings**:
  - `blocking-test-strategy`: Questions that decide test frameworks or architectural boundaries (e.g. Authentication/Authorization protocols). Without answers, tests cannot be planned.
  - `blocking-understanding`: Questions that clarify core functional requirements (e.g. incomplete conditionals, undefined fallback states). Without answers, logic flows are ambiguous.
  - `optional`: General clarifications or format definitions. Good-to-have, but does not block test strategy.
- **Skip Risk Warnings**: Explicit warnings detailing the testing impact if skipped (e.g. *"Skipping this auth question will result in missing security regression test matrices."*).

### C. Deduplicator (`IQuestionDeduplicator`)
Filters out redundant questions using keyword-driven grouping.

### D. Planner (`IQuestionPlanner`)
Groups candidates by business categories (e.g. Authentication, Boundaries, Performance) and determines which ones should be active.

---

## 3. Outcome-Based State Transitions

The session state machine tracks transitions aligned to outcomes:
1. `Understanding` (Analyzing requirements)
2. `Preparing` (Generating and resolving QA Readiness questions, if required)
3. `Planning` (Formulating and reviewing Test Strategy)
4. `Generating` (Creating the test cases)
5. `Reviewing` (Inspecting results, coverage logs, and audits)
6. `Delivering` (Exporting deliverables)

