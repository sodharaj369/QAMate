# Security Foundation

The **Security Foundation** protects QAMate from prompt injections, input data leaks, and secrets disclosure.

---

## 1. Adversarial Prompt Injection Detection

Before prompts are submitted to LLM backends, the security module scans text inputs for injection markers:
- "ignore previous instructions"
- "override system rules"
- Jailbreaks and persona shifts

If detected, QAMate triggers a safety error, blocking execution.

---

## 2. Secrets Redaction

To prevent developers from accidentally pushing corporate secrets (passwords, tokens, database credentials, API keys) into cloud LLM logs, a regex-based redaction parser replaces sensitive string patterns with `[REDACTED]` tokens.
