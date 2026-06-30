# Platform Foundation Services

The **Platform Foundation** centralizes configuration, cost modes, telemetry, and export formats.

---

## 1. Cost Configuration Settings

Project preferences centralize settings:
- **cheapest**: Bypasses cloud AI entirely for rule-based analysis, routing only to local offline/mock engines.
- **balanced**: Standard cost/quality optimization balance.
- **highest-quality**: Directs all generation pipelines to premium cloud endpoints.

---

## 2. Telemetry and Diagnostics Metrics

A local telemetry tracker keeps statistics of:
- Cache hits.
- Tokens used vs tokens saved via prompt compression and cache lookups.
- Total calls avoided.
- Overall cost savings.

---

## 3. Export Formats

Supports exporting generated test strategies and artifacts directly into Markdown (`.md`), HTML (`.html`), and JSON format structures.
