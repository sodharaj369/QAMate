# AI Orchestration Engine

The **AI Orchestration Engine** coordinates prompt completion routing across rules-based checkers, caches, local offline models (Ollama), and cloud provider endpoints (Gemini, OpenAI, Claude).

---

## 1. Task-Based Routing Policies

The orchestrator dynamically routes tasks depending on cost parameters and required logic depth:

- **Cheapest Tier / Local Mode**:
  - Direct routing to mock rule engine templates for analysis and question planning.
  - Direct routing to local Ollama servers for test case expansion.
- **Balanced Tier**:
  - Rule-based analysis first.
  - Local model execution for standard templates formatting.
  - Premium cloud models (e.g. Gemini Pro, GPT-4) reserved exclusively for complex test strategy generations.
- **Highest Quality Tier**:
  - Direct routing of all generation prompts to premium cloud endpoints.

---

## 2. Escalation & Fallback Cascade

If a preferred model fails (due to connection timeouts, API limits, or safety flags), the orchestrator automatically cascades down the provider stack:
1. Try local/cheap provider.
2. Catch failures and log to reasoning trace logs.
3. Escalate prompt execution to cloud provider premium models.
