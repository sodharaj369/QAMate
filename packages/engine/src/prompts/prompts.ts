export interface PromptTemplateDef {
  readonly name: string;
  readonly inputContract: string[];
  readonly outputContract: string;
  readonly template: string;
}

export const PromptTemplates: Record<string, PromptTemplateDef> = {
  systemUnderstanding: {
    name: 'system-understanding',
    inputContract: ['requirement', 'DNA'],
    outputContract: 'AIObservation[] in JSON format',
    template: `You are an AI Observation Provider.
Your task is to analyze the requirement spec and Project DNA to extract semantic observations.

Project DNA context:
"""
{DNA}
"""

Requirement Spec:
"""
{requirement}
"""

Extract all components, actors, flows, risks, and unknowns as an array of observations.
For each observation, output:
- type: one of "Component", "Actor", "Flow", "Risk", "Unknown"
- value: string name of the entity or risk
- confidence: score between 0.0 and 1.0
- evidence: string array of exact text snippets from requirement/DNA matching this observation
- reason: brief architectural description explaining why this was observed

Respond ONLY with a valid JSON object matching this structure:
{
  "observations": [
    {
      "id": "obs-1",
      "type": "Component",
      "value": "Application Insights",
      "confidence": 0.95,
      "evidence": ["Application Insights", "KQL"],
      "reason": "Telemetry platform detected"
    }
  ]
}
Do not return any other text, markdown formatting blocks, or explanations.`
  }
};
