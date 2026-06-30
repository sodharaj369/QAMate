# QA Rule Coverage Engine

The **QA Rule Coverage Engine** compiles rule-traceability metrics mapping strategic inputs directly to generated verification scripts and exploratory outlines.

---

## 1. Core Architecture

The Coverage Engine maps three domains:
- **Business Rules** (`businessRules` array).
- **Risk Areas** (`riskAreas` array).
- **Actors** (`actors` array).

It scans strategy objectives, recommended suites, candidates, exploratory guides, and generated artifact files.

---

## 2. Coverage Status Classifications

| Status | Verification Density | Description |
|---|---|---|
| **`full`** | $\ge 80\%$ matched keywords | The target keywords appear in generated test files and strategy objectives, indicating high probability of verification. |
| **`partial`** | $1\% - 79\%$ matched keywords | The target is partially mentioned in objectives but lacks explicit verification skeletons in code. |
| **`uncovered`** | $0\%$ matched keywords | No scenario verification checks or strategy objectives cover this target. |

---

## 3. Coverage Score Formula

The overall coverage percentage is calculated as:

$$\text{Coverage Score} = \frac{\text{Full Matches} + (0.5 \times \text{Partial Matches})}{\text{Total Targets}} \times 100\%$$

If no targets exist in the specification, the engine defaults to a `100%` baseline.

---

## 4. Visual CLI Traceability Report

The results are rendered in the console like so:

```
======================================================
📊 QAMate Rule Coverage Dashboard
======================================================
Overall Rule Coverage: 100%
Total Targets Tracked:  3
------------------------------------------------------
📋 Target Coverage Traceability:
  1. [BUSINESS-RULE] BR-SEC-1: 🟢 FULL
     Description: Disable anonymous storage account access
     Matched Scenarios: SysAdmin disables anonymous profiles
  2. [RISK-AREA] AuthLockout: 🟢 FULL
     Description: Expired token validation fails
     Matched Scenarios: Exploratory: AuthLockout Check
  3. [ACTOR] SysAdmin: 🟢 FULL
     Description: SysAdmin: System Administrator managing configuration profiles
     Matched Scenarios: SysAdmin disables anonymous profiles
------------------------------------------------------
🧠 Coverage Analysis Trace:
  1. Beginning Coverage Analysis of QA targets.
  2. Auditing Business Rules coverage...
  3. Target [BR-SEC-1] (business-rule) evaluated as: FULL coverage.
  4. Auditing Risk Areas coverage...
  5. Target [AuthLockout] (risk-area) evaluated as: FULL coverage.
  6. Auditing Actors coverage...
  7. Target [SysAdmin] (actor) evaluated as: FULL coverage.
  8. Coverage mapping complete. Overall Score: 100%
======================================================
```
