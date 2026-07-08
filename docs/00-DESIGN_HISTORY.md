# Volume 0: Design History - Chapter 00: Design History & Architecture Evolution

## Purpose
Tracks the evolutionary milestones and design decisions of the QAMate workspace platform.

## Problem
Without an immutable audit record of architectural decisions, codebases drift under developer churn and speculative features.

## Goals
- Record the sprint evolution from PF-1 (Launch experience) through LRN-1 (Learning patterns).
- Provide a reference of historical design decisions to prevent architectural regression.

## Non Goals
- Tracking active issue tickets or day-to-day bug progress (use DevOps/Jira instead).
- Acting as a dynamic code roadmap.

## Architecture
Documents the transition from pure CLI prototypes to the dual-package framework: a portable core engine (@qamate/engine) and a thin editor interface (@qamate/vscode-extension). Traceability flows linearly from raw input requirements to exported verification packages.

## UX
Records the transformation of user interaction: from CLI menus to the outcome-driven sidebar panel featuring skeleton shimmer loaders and responsive step navigation tabs.

## Engineering
Tracks workspace references (npm workspaces), ESM targets, project dependencies, and standard compilation configs across packages.

## Examples
Lists references to early project milestones (PF-1 welcome boards, PF-3 file watchers, TS-4 export systems).

## Anti Patterns
- Speculative refactoring of interfaces or database models without explicit sprint target approval.

## Acceptance Criteria
- Changes must retain linear package structure and interface boundaries.
- Every major evolution record must list the corresponding ADR reference.

## Future Evolution
Integrate automated ADR compliance linting into CI/CD pipelines to raise warnings when PRs bypass architectural guardrails.
