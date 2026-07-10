import { ILLMProvider } from '../interfaces/index.js';
import { QuestionCandidate, Question, Requirement } from '../domain.js';
import { DOMAIN_PLAYBOOKS, DomainPlaybook } from './playbooks.js';
import { QAMentalModel } from '../platform/reasoningModel.js';

export interface TelemetryLog {
  domainsDetected: string[];
  playbooksLoaded: string[];
  questionsAsked: string[];
  questionsSkipped: { question: string; reason: string }[];
}

export class DomainIntelligenceEngine {
  public async classify(
    requirement: Requirement,
    provider?: ILLMProvider
  ): Promise<{ domains: string[]; confidencePercent: number }> {
    if (provider) {
      try {
        const prompt = `You are a Senior Principal QA Engineer. Classify the following requirement into one or more of these standard domains:
${Object.keys(DOMAIN_PLAYBOOKS).map((d) => `- ${d}`).join('\n')}

Requirement content:
"""
${requirement.content}
"""

Respond with a raw JSON array of string domain names matching these domains exactly. Do not output markdown code ticks or explanation text.`;

        const responseText = await provider.generate(prompt);
        const cleanedText = responseText.replace(/```json|```/gi, '').trim();
        const parsed = JSON.parse(cleanedText) as string[];
        const validDomains = parsed.filter((d) => DOMAIN_PLAYBOOKS[d]);
        if (validDomains.length > 0) {
          return {
            domains: validDomains,
            confidencePercent: 95
          };
        }
      } catch {
        // Fallback to rule-based classification on parse errors
      }
    }

    // Heuristic Rule-Based Fallback
    const text = (requirement.title + ' ' + requirement.content).toLowerCase();
    const detected: string[] = [];
    let maxMatches = 0;

    for (const [domain, playbook] of Object.entries(DOMAIN_PLAYBOOKS)) {
      const matches = playbook.relevantQuestions.filter((word) =>
        text.includes(word.toLowerCase())
      ).length;
      if (matches > 0) {
        detected.push(domain);
        if (matches > maxMatches) {
          maxMatches = matches;
        }
      }
    }

    if (detected.length === 0) {
      detected.push('CRUD Business Features');
    }

    let confidencePercent = 80;
    if (maxMatches === 1) confidencePercent = 50;
    else if (maxMatches === 2) confidencePercent = 75;
    else if (maxMatches >= 3) confidencePercent = 90;

    return {
      domains: detected,
      confidencePercent
    };
  }
}

export class PlaybookDecisionEngine {
  public async evaluateQuestions(
    mentalModel: QAMentalModel,
    candidates: QuestionCandidate[],
    provider?: ILLMProvider
  ): Promise<{
    activeQuestions: Question[];
    telemetry: TelemetryLog;
  }> {
    // Dynamically resolve domains by checking inferences
    const domains: string[] = [];
    for (const inference of mentalModel.inferences) {
      for (const d of Object.keys(DOMAIN_PLAYBOOKS)) {
        if (inference.toLowerCase().includes(d.toLowerCase())) {
          domains.push(d);
        }
      }
    }

    const playbooks = domains.map((d) => DOMAIN_PLAYBOOKS[d]).filter(Boolean) as DomainPlaybook[];
    const playbooksNames = playbooks.map((p) => p.domain);

    const telemetry: TelemetryLog = {
      domainsDetected: domains,
      playbooksLoaded: playbooksNames,
      questionsAsked: [],
      questionsSkipped: []
    };

    const passedQuestions: QuestionCandidate[] = [];

    for (const cand of candidates) {
      const candTextLower = cand.text.toLowerCase();

      // 1. Playbook & Mental Model Exclusion Check
      let excluded = false;
      let matchedReason = '';

      for (const excl of mentalModel.excludedTesting) {
        const exclLower = excl.toLowerCase();
        if (
          candTextLower.includes(exclLower) || 
          cand.category.toLowerCase().includes(exclLower)
        ) {
          excluded = true;
          matchedReason = `QA Mental Model Exclusion: "${excl}" is not in-scope.`;
          break;
        }
      }

      if (!excluded) {
        for (const playbook of playbooks) {
          for (const neverWord of playbook.neverAsk) {
            if (candTextLower.includes(neverWord.toLowerCase())) {
              excluded = true;
              matchedReason = `Playbook exclusion: Never ask about "${neverWord}" in ${playbook.domain} domain.`;
              break;
            }
          }
          if (excluded) break;
        }
      }

      if (excluded) {
        telemetry.questionsSkipped.push({
          question: cand.text,
          reason: matchedReason
        });
        continue;
      }

      // 2. Material Decision Check: check if the response materially changes QA strategy or outputs
      let isMaterial = false;
      let reason = 'Heuristic: Question priority low.';

      if (provider) {
        try {
          const evalPrompt = `Evaluate if answering this question: "${cand.text}"
materially changes any of the following for the QA mental model:
1. facts and assumptions
2. recommended testing types
3. excluded testing paths

QA Mental Model details:
- Facts: ${mentalModel.facts.join(', ')}
- Inferences: ${mentalModel.inferences.join(', ')}
- Recommended: ${mentalModel.recommendedTesting.join(', ')}

Respond with a raw JSON object matching this TypeScript interface (do not return explanations or code ticks):
{
  "material": boolean,
  "reason": string
}`;

          const res = await provider.generate(evalPrompt);
          const parsed = JSON.parse(res.replace(/```json|```/gi, '').trim()) as {
            material: boolean;
            reason: string;
          };
          isMaterial = parsed.material;
          reason = parsed.reason;
        } catch {
          // Heuristic fallback
          isMaterial = cand.priority === 'high' || cand.category === 'AMBIGUITY';
          reason = isMaterial
            ? 'Heuristic fallback: High priority category.'
            : 'Heuristic fallback: Low priority category.';
        }
      } else {
        isMaterial = cand.priority === 'high' || cand.category === 'AMBIGUITY';
        reason = isMaterial
          ? 'Heuristic: Question marked as high priority or ambiguity.'
          : 'Heuristic: Question priority is low.';
      }

      if (!isMaterial) {
        telemetry.questionsSkipped.push({
          question: cand.text,
          reason: `Failed Material Clarification Rule: ${reason}`
        });
        continue;
      }

      passedQuestions.push(cand);
    }

    // 3. Capping constraint: Sort by priority and restrict list to maximum target (0-2 questions)
    // Ambiguity questions first, then priority checks
    const sorted = [...passedQuestions].sort((a, b) => {
      const aScore = a.category === 'AMBIGUITY' ? 2 : a.priority === 'high' ? 1 : 0;
      const bScore = b.category === 'AMBIGUITY' ? 2 : b.priority === 'high' ? 1 : 0;
      return bScore - aScore;
    });

    const capped = sorted.slice(0, 2);

    // Track remainder as skipped due to capacity limits
    const remainingSkipped = sorted.slice(2);
    for (const rem of remainingSkipped) {
      telemetry.questionsSkipped.push({
        question: rem.text,
        reason: 'Pruned by capping constraints: exceeded maximum 0-2 questions limit.'
      });
    }

    const activeQuestions: Question[] = capped.map((cand, idx) => {
      telemetry.questionsAsked.push(cand.text);
      return {
        ...cand,
        id: `Q-${String(idx + 1).padStart(3, '0')}`,
        status: 'pending'
      };
    });

    return {
      activeQuestions,
      telemetry
    };
  }
}

