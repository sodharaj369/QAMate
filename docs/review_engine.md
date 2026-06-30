# QA Review Engine (Quality Gate)

The **QA Review Engine** is QAMate's unique selling point — the module that transforms AI-generated outputs from "drafts" into **reviewed, scored, and gate-checked deliverables**. No other AI QA tool does this.

---

## 1. Philosophy

> **AI generates. QAMate reviews.**

The Review Engine exists because AI-generated test artifacts are inherently unreliable. They may contain:
- Duplicate scenarios that waste execution time.
- Shallow skeletons with no meaningful assertions.
- Naming convention violations that break CI pipelines.
- Missing coverage for critical business objectives.

The Review Engine catches all of these **before** a human ever sees the output.

---

## 2. Domain Models

### `ReviewIssue`
Each detected problem is captured as a structured issue:
- **`id`**: Unique issue identifier (e.g. `REV-CMP-123`).
- **`category`**: One of `compliance`, `duplication`, `low-value`, or `coverage`.
- **`description`**: Human-readable explanation of the problem.
- **`severity`**: `low` | `medium` | `high`.
- **`fileArtifactId`**: Links back to the specific artifact that triggered the issue.

### `QualityScores`
Four orthogonal quality dimensions:
| Score | What it measures |
|---|---|
| `deduplicationScore` | Absence of duplicate scenario titles across all artifacts. |
| `businessValueScore` | Coverage of strategy objectives in the generated content. |
| `codeQualityScore` | Naming convention compliance + skeleton depth checks. |
| `overallScore` | Weighted average of the three scores above. |

### `ReviewReport`
The aggregate root combining everything:
- **`status`**: `approved` (≥80%), `flagged` (50–79%), or `rejected` (<50%).
- **`issues`**: All detected `ReviewIssue[]`.
- **`scores`**: The `QualityScores` breakdown.
- **`suggestions`**: Actionable improvement recommendations.
- **`traceLogs`**: Step-by-step reasoning trail of every audit phase.

---

## 3. Audit Phases

The engine runs four sequential audit phases:

### Phase 1: Compliance Audit
Checks whether artifacts follow the project's configured `namingConvention` (e.g. `Given/When/Then`). Scans artifact content for the presence of structured Gherkin keywords. SQL artifacts are excluded from this check.

### Phase 2: Deduplication Scanner
Extracts scenario titles (lines starting with `#### TC-` or `public async Task Should_`) and checks for exact duplicates across all artifacts. Duplicate titles indicate copy-paste waste.

### Phase 3: Low-Value Check
Identifies empty or shallow test skeletons — artifacts that contain `// Act` and `// Assert` comments but have very little actual content (< 150 characters). These indicate the AI produced boilerplate without meaningful logic.

### Phase 4: Coverage Mapping
Maps strategy objectives back to the merged content of all artifacts. For each objective, extracts significant keywords (length > 4) and checks whether at least one appears in the generated output. Missing coverage means the generated tests don't actually verify what the strategy asked for.

---

## 4. Quality Gate Decision Logic

```
overallScore = avg(deduplication, businessValue, codeQuality)

if overallScore >= 80  → 🟢 APPROVED
if overallScore 50-79  → 🟡 FLAGGED (review suggested)
if overallScore < 50   → 🔴 REJECTED (regeneration required)
```

---

## 5. CLI Dashboard Output

```
======================================================
🛡️  QAMate Quality Gate Review Dashboard
======================================================
Review Status:        🟢 APPROVED
Overall Score:        100%
Deduplication Score:  100%
Business Value Score: 100%
Code Quality Score:   100%
------------------------------------------------------
✔ No quality issues detected.
------------------------------------------------------
✔ No enhancement suggestions.
------------------------------------------------------
🧠 Quality Gate Reasoning Trace:
  1. Beginning Quality Gate review of generated QA artifacts.
  2. Compliance Audit: Verifying code styling against project configuration guidelines.
  3. Compliance Audit: Passed naming standard style evaluations.
  4. Deduplication Audit: Scanning scenario titles for duplicate definitions.
  5. Deduplication Audit: Passed duplicate logic evaluation.
  6. Quality Audit: Searching for empty or low-value code skeleton structures.
  7. Quality Audit: Passed code skeleton quality check.
  8. Coverage Audit: Mapping test artifacts back to strategy objectives.
  9. Coverage Audit: Passed objectives coverage checks.
  10. Quality Gate completed with overall score: 100%
======================================================
```

---

## 6. Architecture

```
IReviewEngine (Interface)
    │
    └── DefaultReviewEngine (Implementation)
            │
            ├── Compliance Audit  → namingConvention checks
            ├── Deduplication     → title uniqueness scanner
            ├── Low-Value Check   → skeleton depth analysis
            └── Coverage Mapping  → strategy objectives traceability
```

The engine is **completely rule-based** — no AI calls are needed for review. This is intentional: the review layer must be deterministic and reproducible.
