# Volume 1: Product Foundation - Chapter 04: Lean QA Intelligence & Diagnostics

## Purpose
Establishes the core principles of diagnostic requirement analysis and token-efficient reasoning workflows.

## Problem
Generative AI tools parse entire requirement documents repeatedly, causing high token consumption and generating generic tests that miss boundary edge rules.

## Goals
- Enforce the QAMate Operational Decision Ladder to minimize LLM completion requests.
- Deploy local validation rule engines to scan syntax structure before calling AI.

## Non Goals
- Automating requirement writing or code reviews.
- Running live test executions on active software packages.

## Architecture
The requirement analyzer coordinates validators, confidence scorers, and analysis strategies. It checks the decision ladder hierarchy before initiating any HTTP completes.

## UX
Renders confidence scorecard badges, actor profiles, business rules, and complexity score charts locally. If confidence is high, it bypasses the Prepare question stepper entirely (zero-question path).

## Engineering
The [DefaultRequirementAnalyzer](file:///d:/QAMate/packages/engine/src/analyzer/analyzer.ts) evaluates text blocks against the Operational Decision Ladder:
```
Need this operation?
   ↓ (No) ➔ Skip
Can skip/mock?
   ↓ (Yes) ➔ Return cache
Already known/saved?
   ↓ (Yes) ➔ Return database
Already cached?
   ↓ (Yes) ➔ Return cache
Rule Validation Engine?
   ↓ (Can resolve) ➔ Run local strategy
VS Code API?
   ↓ (Can resolve) ➔ Run native tool
Need AI?
   ↓ (No) ➔ Skip LLM call
Need user clarification?
   ↓ (No) ➔ Skip stepper
Generate Deliverables
```

## Examples
The engine identifies that the payment spec requires a SAS auth validation check. It verifies that the SAS format is already defined in the project settings database, skipping the LLM clarification call entirely.

## Anti Patterns
- Calling AI models directly to extract actors or parse business rules from raw specifications.

## Acceptance Criteria
- Local heuristic checks must compile requirement scorecards in under 5ms.
- LLM completion queries are blocked if the local validation scorecard detects critical syntax blocks (VAL-006/VAL-005).

## Future Evolution
Integrate semantic search rules matching new requirements to historical templates, allowing complete strategy reuse without LLM generation calls.
