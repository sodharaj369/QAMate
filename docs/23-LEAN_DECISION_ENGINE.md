# Volume 3: Architecture & AI Engines - Chapter 23: Lean Decision Engine (Clarification Engine)

## Purpose
Governs question formulation and QA readiness workflows.

## Problem
AI tools prompt users with generic questionnaires that do not affect quality outcomes, increasing token costs and user fatigue.

## Goals
- Generate clarification questions focused on critical logic gaps.
- Avoid asking questions if confidence score meets the target threshold.

## Non Goals
- Conducting general conversation or answering free-form questions.
- Managing test cases directly.

## Architecture
The clarification engine manages candidate generation, prioritization, deduplication, and planning steps.

## UX
Renders the stepper wizard UI allowing users to select option choices or enter open text clarifications.

## Engineering
Uses static rule generators to identify ambiguities and draft clarification candidate cards offline.

## Examples
Detecting an ambiguous session timeout parameter triggers a high-priority question mapping the expected behavior.

## Anti Patterns
- Prompting users with boilerplate questions that do not change generated test case objectives.

## Acceptance Criteria
- The engine lists a maximum of three blocking questions.
- Questions contain a rationale explaining the risk of skipping.

## Future Evolution
Implement dynamic dependency maps to hide questions if parent conditions are skipped or updated.
