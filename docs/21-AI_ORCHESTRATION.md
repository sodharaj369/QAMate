# Volume 3: Architecture & AI Engines - Chapter 21: Pluggable AI Orchestration

## Purpose
Specifies how QAMate detects, resolves, and failovers AI providers within the editor workspace.

## Problem
Enterprise networks limit access to public LLM endpoints, and API key configuration introduces security friction for new users.

## Goals
- Detect and utilize the native VS Code Language Model API first.
- Support simultaneous connections to multiple AI models with dynamic failover parameters.

## Non Goals
- Tuning proprietary neural networks or model weights.
- Managing server load balancers.

## Architecture
The gateway is wrapped by [ILLMProvider](file:///d:/QAMate/packages/engine/src/interfaces/index.ts). The [LLMProviderFactory](file:///d:/QAMate/packages/engine/src/providers/providerFactory.ts) resolves the primary model and manages temporary overrides.

## UX
The WelcomePage connection status widget displays active badges (Connected, Offline, Failover Active) and model names.

## Engineering
*   **VS Code LM API first**: Queries the host editor for active providers, prioritizing GitHub Copilot.
*   **Simultaneous Connections**: Allows binding different models to different tasks (e.g. Gemini for analysis, Claude for Playwright code).
*   **Automatic Failover**: If the primary provider times out (30s limit), the orchestrator catches the error and redirects the payload to the fallback provider.

## Examples
User runs generation using Claude. The request fails due to rate limits; QAMate displays a notification warning and automatically redirects to the local Ollama fallback server.

## Anti Patterns
- Restricting compilation tasks to a single hardcoded LLM endpoint.

## Acceptance Criteria
- The factory must register VS Code LM API automatically on launch.
- Connection failures must trigger failover within 30 seconds.

## Future Evolution
Implement dynamic model performance comparison tools, logging metrics on tokens, costs, and quality scores.
