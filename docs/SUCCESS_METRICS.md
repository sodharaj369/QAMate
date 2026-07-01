# QAMate Success Metrics 📊

We measure the success of every sprint and feature addition against clear quantitative goals. If a feature degrades these numbers, it must be refactored or rolled back.

---

## 🎯 Product Success Metrics

| Metric | Target | Description |
|---|---|---|
| **Time to First Value (TTFV)** | `< 30 seconds` | The time it takes a newly installed user to open QAMate, paste a requirement, and see the first analysis. |
| **Time to Analyze Requirement** | `< 10 seconds` | Time elapsed from clicking "Analyze" or pasting a requirements file to completing the domain and health analysis. |
| **Average Clarification Questions** | `< 2 questions` | Number of questions we prompt the user with. Minimize cognitive load by only asking blocked/critical gaps questions. |
| **Strategy Approval Rate** | `> 85%` | Percentage of generated strategies that are approved by users without overrides. |
| **Export Rate** | `> 90%` | Percentage of generated strategies that the user exports to Azure DevOps, Jira, or Markdown files. |
| **Manual Edits After Generation**| `< 10%` | Percentage of test cases or strategies requiring manual textual edits by the user post-generation. |
| **User Satisfaction (CSAT)** | `> 4.5 / 5` | Direct user feedback rating collected during preview releases. |

---

## 🛠️ Engineering & Operational Metrics

| Metric | Target | Description |
|---|---|---|
| **Token Cost per Requirement** | `< $0.02` | Average token expenditure (prompt & completion) per requirement analysis and generation. |
| **Offline Success Rate** | `100%` | Deterministic heuristics must compile without errors when network connections are cut. |
| **AI Fallback Rate** | `100%` | Percentage of times static rules engines successfully mock and deliver outcomes when LLM APIs time out or fail. |
| **Average Response Time (LLM)** | `< 3.0 seconds` | Average network latency for LLM-assisted generations (using VS Code native models or endpoint cache). |
