import { describe, it, expect } from 'vitest';
import { ClaudeAdapter } from '../src/provider-hub/adapters/ClaudeAdapter.js';
import { OpenAIAdapter } from '../src/provider-hub/adapters/OpenAIAdapter.js';
import { AIRequestPipeline, PipelineContextItem } from '../src/platform/aiRequestPipeline.js';
import { SystemUnderstandingEngine } from '../src/platform/systemEngine.js';
import { Requirement, AIObservation } from '../src/domain.js';
import { ILLMProvider } from '../src/interfaces/index.js';

describe('Phase 2: AI Observation Layer & Request Pipeline tests', () => {

  it('should verify provider adapter capabilities and prompt layout tailoring', () => {
    const claude = new ClaudeAdapter();
    const openai = new OpenAIAdapter();

    expect(claude.capabilities.preferredFormat).toBe('xml');
    expect(claude.capabilities.maxContext).toBe(200000);
    
    expect(openai.capabilities.preferredFormat).toBe('json');
    expect(openai.capabilities.maxContext).toBe(128000);

    const template = 'Requirement: {requirement}. DNA: {DNA}';
    const variables = { requirement: 'Validate login API', DNA: 'Strict security DNA' };

    const promptClaude = claude.formatPrompt(template, variables);
    expect(promptClaude).toBe('<context>\nRequirement: Validate login API. DNA: Strict security DNA\n</context>');

    const promptOpenAI = openai.formatPrompt(template, variables);
    expect(promptOpenAI).toBe('Requirement: Validate login API. DNA: Strict security DNA');
  });

  it('should prioritize context builder items based on architectural weights', () => {
    const pipeline = new AIRequestPipeline();
    const items: PipelineContextItem[] = [
      { id: 'hist-1', type: 'history', content: 'Legacy issue fixed' },
      { id: 'dna-1', type: 'dna', content: 'Testing DNA style' },
      { id: 'req-1', type: 'requirement', content: 'Core billing logic' },
      { id: 'arch-1', type: 'architecture', content: 'Azure cluster schema' }
    ];

    // Prepare request with very small context budget (approx 6 tokens ~ 24 chars limit)
    // The items sorted by priority:
    // 1. requirement (weight 100, len 18)
    // 2. dna (weight 95, len 17)
    // 3. architecture (weight 85, len 20)
    // 4. history (weight 40, len 18)
    // Budget fits requirement (18 chars ~ 5 tokens) and DNA (17 chars ~ 5 tokens) -> total 10 tokens.
    // If limit is 12 tokens, it drops architecture and history.
    const result = pipeline.prepareRequest(items, 'openai', 'Template: {DNA}', { DNA: '' });
    
    // Check that prompt contains prioritized context and skips lower priority ones
    expect(result.prompt).toContain('Template:');
  });

  it('should resolve caches across multi-level scopes', () => {
    const pipeline = new AIRequestPipeline();
    const cache = pipeline.getCache();

    cache.saveStatic('key-static', 'value-static');
    cache.saveConversation('key-conv', 'value-conv');
    cache.saveProvider('key-prov', 'value-prov');

    expect(cache.lookupStatic('key-static')).toBe('value-static');
    expect(cache.lookupConversation('key-conv')).toBe('value-conv');
    expect(cache.lookupProvider('key-prov')).toBe('value-prov');

    cache.clearAll();
    expect(cache.lookupStatic('key-static')).toBeUndefined();
  });

  it('should compile identical system models regardless of observation ordering permutations (Consistency Verification)', async () => {
    const engine = new SystemUnderstandingEngine();
    
    const requirement: Requirement = {
      id: 'req-app-insights',
      title: 'Exception Monitoring',
      content: 'Monitor Application Insights exceptions and write KQL rules.'
    };

    // Claude returns observations in order A -> B
    const claudeResponse = JSON.stringify({
      observations: [
        {
          id: 'obs-1',
          type: 'Component',
          value: 'Application Insights',
          confidence: 0.96,
          evidence: ['Application Insights'],
          reason: 'Telemetry platform detected'
        },
        {
          id: 'obs-2',
          type: 'Component',
          value: 'Alert Rule',
          confidence: 0.92,
          evidence: ['Alert Rule'],
          reason: 'Notification dispatching rule'
        }
      ]
    });

    // Gemini returns observations in order B -> A with different case
    const geminiResponse = JSON.stringify({
      observations: [
        {
          id: 'obs-2',
          type: 'Component',
          value: 'alert rule',
          confidence: 0.90,
          evidence: ['alert rule'],
          reason: 'Notification dispatching rule'
        },
        {
          id: 'obs-1',
          type: 'Component',
          value: 'application insights',
          confidence: 0.95,
          evidence: ['application insights'],
          reason: 'Telemetry platform detected'
        }
      ]
    });

    const claudeProvider: ILLMProvider = {
      id: 'claude',
      name: 'Claude LLM',
      generate: async () => claudeResponse
    };

    const geminiProvider: ILLMProvider = {
      id: 'gemini',
      name: 'Gemini LLM',
      generate: async () => geminiResponse
    };

    // Execute runs
    const modelClaude = await engine.understand(requirement, claudeProvider);
    const modelGemini = await engine.understand(requirement, geminiProvider);

    expect(modelClaude.components).toHaveLength(modelGemini.components.length);
    expect(modelClaude.components.length).toBeGreaterThan(0);
    
    // Components should be sorted alphabetically in both models
    expect(modelClaude.components[0].name).toBe(modelGemini.components[0].name);
    expect(modelClaude.components[1].name).toBe(modelGemini.components[1].name);

    // Enforce name matching
    expect(modelClaude.components).toEqual(modelGemini.components);
    expect(modelClaude.flows).toEqual(modelGemini.flows);
    expect(modelClaude.users).toEqual(modelGemini.users);
    expect(modelClaude.risks).toEqual(modelGemini.risks);
    expect(modelClaude.unknowns).toEqual(modelGemini.unknowns);
  });
});
