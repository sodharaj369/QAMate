# Question Planning & Clarification Engine

The **Question Planning & Clarification Engine** is designed to ask targeted, high-value QA clarification questions. Its goal is to maximize QA coverage understanding while minimizing noise and unnecessary user interaction.

Consistent with our philosophy—**"Ask first. Think second. Generate last."**—the engine prevents premature test case generation by mapping gaps, ranking them by testing impact, merging redundancies, and planning active question sets.

---

## 1. The Planning Pipeline

The engine breaks down clarification into four isolated, single-responsibility sub-modules:

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
Parses the ambiguities and missing information categories in the `RequirementIntelligenceReport` and designs context-specific questions. For instance, an `error-handling` gap triggers a query about validation failure formats, whereas a `vague term "fast"` ambiguity triggers a query about performance SLAs.

### B. Prioritizer & Impact Analyzer (`IQuestionPrioritizer`)
Computes the QA importance metrics for each candidate.
- **QA Impact Ratings**:
  - `blocking-test-strategy`: Questions that decide test frameworks or architectural boundaries (e.g. Authentication/Authorization protocols). Without answers, tests cannot be planned.
  - `blocking-understanding`: Questions that clarify core functional requirements (e.g. incomplete conditionals, undefined fallback states). Without answers, logic flows are ambiguous.
  - `optional`: General clarifications or format definitions (e.g. data format inputs). Good-to-have, but does not block test strategy.
- **Skip Risk Warnings**: Explicit warning messages explaining what test quality or coverage dimension is degraded if the QA engineer decides to skip answering the question (e.g. *"Skipping this auth question will result in missing security regression test matrices."*).

### C. Deduplicator (`IQuestionDeduplicator`)
Filters out redundant questions. If multiple different requirements or ambiguities result in similar queries, the deduplicator merges them based on normalized keyword grouping.

### D. Planner (`IQuestionPlanner`)
Groups candidates by business categories (e.g. Authentication, Boundaries, Performance, Permissions) and determines which ones should be active. 
It supports targeted planning scopes:
- **Blocking Only**: Activates only the critical queries that block strategy formulation.
- **All Questions**: Activates the complete query suite.

---

## 2. Conversation State Transitions

To match QAMate's reasoning flow, the conversation aggregate status changes across the following lifecycle:

1. `analyzing`: Extracting requirement intelligence.
2. `planning-questions`: Generating candidates, prioritizing, deduplicating, and selecting the active set.
3. `waiting-for-answers`: Displaying active questions to the user and waiting for responses.
4. `ready-for-generation`: All blocking questions are resolved. Generation context is complete.
5. `generating`: Running AI test suite generation.
6. `reviewing`: Post-processing validation, duplicate merging, and coverage audit.

---

## 3. Interactive CLI Workflow

When run in the terminal (`npm run analyze -- <file>`), QAMate provides an interactive question planner:

1. **Pre-Analysis & Summary**: Validates input and prints actors, rules, complexity, and initial testing confidence.
2. **Selection Prompts**:
   ```
   QAMate found 4 clarification questions. Only 2 are blocking.
   Would you like to answer just the blocking questions [B] or review all questions [A]? (Default: B):
   ```
3. **Interactive Questionnaire**: Prompts you one-by-one with rationales and options.
4. **Skip Warning Gates**: If you type `skip`, the console checks:
   ```
   ⚠️  WARNING: Skipping this auth question will result in missing security regression test matrices.
   Are you sure you want to skip? (y/n) [n]:
   ```
5. **State Persist**: Appends answers, sets status to `ready-for-generation`, and outputs the updated `Conversation` aggregate JSON.
