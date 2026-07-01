# QAMate Product Vision 🌟

> **QAMate is the QA workspace that understands software requirements, identifies risks, asks only the questions that materially affect quality, and generates trusted QA deliverables.**

---

## 🏛️ Core Philosophical Pillar
> **QAMate optimizes for user confidence over automation.**

We believe that generating a thousand automated tests of low quality or incorrect alignment is worse than generating zero. Our goal is to ensure the human QA Lead has complete trust and transparency in QAMate's reasoning before exporting any deliverables. This philosophy guides all features: strategy previews, explainable recommendations, and deterministic verification.

---

## 🚫 Product Non-Goals
QAMate is highly focused. To prevent feature creep, **QAMate is NOT**:
- **A chatbot**: We do not build conversational chat logs or free-form prompt windows.
- **Another ChatGPT wrapper**: The core reasoning is built on deterministic rules and static heuristics. LLMs amplify but do not replace the local engine.
- **A replacement for ChatGPT**: We do not answer general coding or trivial questions.
- **A replacement for Azure DevOps or Jira**: QAMate is a workspace that synchronizes with these tools, not a repository for long-term tickets.
- **A bug tracker / time tracker**: We do not log defects or track project times.
- **A project management / sprint planning tool**: We do not assign tasks or organize project roadmaps.
- **An IDE or code editor**: QAMate runs inside VS Code but does not replace the editor space.
- **A requirements management suite**: We do not write or author requirements.

---

## 🛑 Non-Negotiable Product Principles
Every pull request, design review, and feature build must strictly adhere to these principles:

1. **Paste First**: The first 15 seconds must feel premium, starting with a simple copy-paste requirement flow or file selection.
2. **No Fake Intelligence**: We never simulate AI outputs. No fake progress animation intervals. If a feature is offline or unimplemented, explicitly display "Not Implemented" or use the static rule fallback.
3. **Strategy Before Generation**: Never generate test cases or code skeletons without first confirming the testing strategy, risks, and exclusions.
4. **Preview Before Export**: The user must inspect, edit, and approve tables/deliverables before pushing to Azure DevOps, Jira, or file exports.
5. **AI Optional (Offline-First)**: The system must remain fully functional with static heuristics when LLM configurations are missing or offline.
6. **Rule Engine First**: Prioritize deterministic heuristics, structural parsers, and business rule extractors before sending prompt payloads to LLMs.
7. **Human Override**: The user can override any recommendation, skip questions, edit strategy matrices, and change context configuration details at any time.
8. **Questions Only When Needed**: Never ask a question if the answer can be inferred from the workspace, active files, or context. Never ask if the answer won't materially change the generated strategy.

---

## ⚖️ Feature Decision Principles
Before proposing or adding any new feature, ask these four questions:
1. **Does it reduce QA effort?**
2. **Does it reduce user clicks?**
3. **Does it increase trust?**
4. **Does it improve the core workflow?**

> [!IMPORTANT]
> If the answer to any of these questions is **No**, the feature must be **rejected**.
