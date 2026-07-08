# Volume 3: Architecture & AI Engines - Chapter 22: Local Rule & Validation Engine

## Purpose
Specifies the parsing logic used to evaluate specification validation states.

## Problem
AI analyzers fail to catch basic syntax rules and omissions, leading to hallucinated assumptions in downstream steps.

## Goals
- Validate that requirements contain necessary title, description, and acceptance structure tags.
- Scan text inputs for ambiguities, logic gaps, rules, and actor profiles locally.

## Non Goals
- Validating codebase syntax or compiling active source code.
- Authoring test scripts directly.

## Architecture
Coordinated by DefaultRequirementAnalyzer, running validators, confidence scorers, and analysis strategies sequentially.

## UX
Presents issue flags (VAL-005, VAL-006, VAL-007) and health scorecard dashboards in the sidebar.

## Engineering
Implements RuleBasedAnalysisStrategy, extracting actors and business rules via regex and AST pattern trackers.

## Examples
Scanning a specification document; the analyzer identifies three business rules and flags a medium-severity ambiguity.

## Anti Patterns
- Sending raw user inputs straight to LLMs without local validation and rules scanning.

## Acceptance Criteria
- Validator results classify files as valid or invalid with issue logs.
- Heuristic analysis operates successfully in a completely offline environment.

## Future Evolution
Integrate custom validation rules editors to let QA leads configure compliance keyword sets.
