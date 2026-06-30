# QA Test Strategy Engine

The **QA Test Strategy Engine** evaluates the compiled `GeneratorContext` to construct a complete, executable test plan before test case generation occurs. Acting like a Senior QA Lead, the engine determines testing objectives, risk levels, exclusions (with YAGNI justifications), automation targets, manual exploratory focus, suggested data, environments, execution order, and estimated effort.

---

## 1. Domain Model Structure (`TestStrategy`)

The generated strategy contains:
- **`businessImpact`**: Grade (`low` | `medium` | `high` | `critical`) calculated from core spec keywords.
- **`riskLevel`**: Grade (`low` | `medium` | `high`) computed from intelligence complexity and gaps.
- **`objectives`**: Traceable testing objectives.
- **`recommendedSuites`**: Target test suites (e.g. Smoke, Regression, Security, API) with execution priority and justifications.
- **`excludedSuites`**: Suites marked out of scope (with reasons, e.g., Accessibility excluded due to zero UI updates).
- **`outOfScope`**: Deferred testing categories (e.g. Performance testing deferred due to no SLA benchmarks).
- **`automationCandidates`**: Specific regression scenarios mapped for automation code.
- **`manualExploratoryScenarios`**: Exploratory testing charters for human QA focus.
- **`suggestedTestData` & `suggestedPreconditions`**: Data matrices (e.g., Valid Token, Expired SAS) and subscription/environment prerequisites.
- **`executionOrder`**: Step-by-step suite execution sequence.
- **`estimatedEffort`**: Estimated duration metrics per suite.
- **`reasoningTrace`**: Detailed audit trail logs showing *why* the strategy concluded these parameters.

---

## 2. Evaluation Pipeline (`ITestStrategyEngine`)

The engine is consolidated into a single, high-fidelity class (`DefaultTestStrategyEngine`) to avoid premature micro-service interfaces:

```
                        GeneratorContext
                               │
                               ▼
                  [DefaultTestStrategyEngine]
                  ├── assessRisk()
                  ├── analyzeImpact()
                  ├── recommendSuites()
                  └── optimizeScope()
                               │
                               ▼
                     TestStrategy Aggregate
```

### A. Risk & Impact Assessment
Scans requirement keywords:
- Keywords `sec`, `security`, `auth`, `public` ➔ `critical` Business Impact.
- Keywords `payment`, `premium`, `financial` ➔ `high` Business Impact.
- Complexity `high` or ambiguities count > 2 ➔ `high` Risk Level.

### B. Objectives & Exclusions
Formulates objectives based on focus area tags (e.g. Cloud Infrastructure, Security / Authentication).
Provides detailed YAGNI justifications for suite exclusions (e.g. *"Accessibility: Infrastructure-only change. No user interface layout modified."*).

### C. Execution Plan & Effort
Recommends target environments (`QA Staging`, `UAT Sandbox`) and sequences execution:
1. **Smoke**: Verify basic ping connections (estimated: 15 min).
2. **Security**: Execute access boundaries and anonymous lockouts (estimated: 45 min).
3. **Regression**: Run integration API suites (estimated: 120 min).

---

## 3. QA Strategy Console Dashboard

The strategy is displayed in the terminal during analysis:

```
======================================================
📊 QAMate QA Strategy Dashboard
======================================================
Business Impact:      CRITICAL
Risk Level:           MEDIUM
Strategy Confidence:  100%
Primary Focus Areas:  Cloud Infrastructure / Storage, Security / Authentication
------------------------------------------------------
🎯 Traceable Testing Objectives:
  - Verify storage accounts are secured and public access is disabled.
  - Verify authenticated application read/write requests still function.
  - Verify token expiry validations and credential refresh flows.
------------------------------------------------------
📋 Preconditions Required:
  - Target Azure/AWS cloud subscription is active.
  - Mock storage container is created with public access initially enabled.
  - Valid Azure AD / SAS Token is generated and loaded in credentials store.
------------------------------------------------------
📦 Suggested Test Data Sets:
  - Valid Authentication Token
  - Expired SAS Token
  - Anonymous/Unauthenticated User request
  - Malformed Storage Container URL
------------------------------------------------------
🛡️  Recommended Test Suites:
  - [Security] (Priority: 1) - Feature alters infrastructure access policies.
  - [Smoke] (Priority: 2) - Ensures container ping connections are active.
  - [Regression] (Priority: 3) - Validates existing storage integration APIs.
```
*(Reasoning trace logs are printed following the effort summary, mapping out the full audit trail).*
