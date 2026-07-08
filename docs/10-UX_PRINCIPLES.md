# Volume 2: UX & Visual Design - Chapter 10: UX Principles & Design System

## Purpose
Governs the visual aesthetics and interaction rules of the QAMate client panels.

## Problem
IDE webview extensions often feel cluttered, slow, and mismatched with the host environment, degrading developer experience.

## Goals
- Build a cohesive, premium visual style conforming to VS Code design standards.
- Guide the user sequentially using the outcome-based step model.

## Non Goals
- Building a complex, heavy external styling system.
- Relying on styling configurations that bypass host IDE themes.

## Architecture
The client UI compiles pages dynamically using structured component templates, theme variables, and icon mappings.

## UX
Employs fluid skeleton shimmer loaders, subtle hover animations, and persistent Next Best Action guidance footer.

## Engineering
Utilizes CSS variables linked directly to VS Code native theme definitions.

## Examples
Switching the IDE from dark to light mode automatically redrafts Webview font variables and border colors.

## Anti Patterns
- Using custom hardcoded hex codes or heavy UI framework grids.

## Acceptance Criteria
- The panel fits inside standard sidebar widths (300px - 400px).
- Hover states and active buttons use clear system styling indicators.

## Future Evolution
Transition inlined visual styling variables into a shared CSS asset package to support multiple target editor environments.
