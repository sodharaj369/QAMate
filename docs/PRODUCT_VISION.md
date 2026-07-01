# QAMate Product Vision 🌟

> **QAMate is NOT an AI chat application.**
>
> It is:
> **A QA workspace that transforms software requirements into trusted QA deliverables.**
> 
> Everything should reinforce that core philosophy.

---

## 🏛️ Core Philosophical Pillar
> **QAMate optimizes for user confidence over automation.**

We believe that generating a thousand automated tests of low quality or incorrect alignment is worse than generating zero. Our goal is to ensure the human QA Lead has complete trust and transparency in QAMate's reasoning before exporting any deliverables. This philosophy guides all features: strategy previews, explainable recommendations, and deterministic verification.

---

## 🚫 Product Non-Goals
QAMate is highly focused. To prevent feature creep, **QAMate is NOT**:
- **An AI chat application / chatbot**: We do not build conversational chat logs, message feeds, or free-form chat boxes.
- **Another ChatGPT wrapper**: The core reasoning is built on deterministic rules and static heuristics. LLMs amplify but do not replace the local engine.
- **A replacement for Azure DevOps or Jira**: QAMate is a workspace that synchronizes with these tools, not a repository for long-term tickets or sprint boards.
- **A bug tracker / time tracker**: We do not log defects or track project times.
- **A requirements writing tool**: We do not write or author requirements. We consume them.

---

## 🛑 Non-Negotiable Product Rules & Principles
Every pull request, design review, and feature build must strictly adhere to these rules:

1. **Value First, Configuration Later**: The user must be able to paste or select a requirement immediately on launch without completing forms first. AI, Azure, and Jira configurations are pushed to Settings or configured via lazy wizards only when needed.
2. **Offline-First (Rule Engine First)**: The engine must remain fully functional with static heuristics and rule checkers when LLM configurations are missing or offline. AI is optional.
3. **No Fake Intelligence**: The UI must never simulate progress or show fake confidence. If a feature is offline or unimplemented, explicitly display "Offline" or "Not Implemented".
4. **Outcome-Based Stepper**: Structure the workspace around six outcomes:
   `Understand` ➔ `Prepare` ➔ `Plan` ➔ `Generate` ➔ `Review` ➔ `Deliver`
5. **No Generic/Unnecessary Questions**: Never ask if the engine already knows the answer or if the answer will not materially change the generated strategy. Every question must explain *why* it is asked.
6. **Strategy Before Generation**: Always present the Test Strategy for review and approval before generating test suites or code skeletons.
7. **Preview Before Export**: The user must review and approve test deliverables before export or synchronization.
8. **Always Explain Recommendations**: Every recommendation, risk, and priority must clearly explain *what* happened, *why*, and *what the user should do next*.
9. **Zero-Configuration AI**: QAMate automatically discovers and uses AI providers already available in the user's VS Code environment. Users should not be required to configure an API key if a compatible provider is already installed and authenticated.

