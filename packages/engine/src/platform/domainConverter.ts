import { SystemModelDTO, TestStrategyDTO } from '../domain.js';
import { SystemModel } from './reasoningModel.js';
import { TestStrategy } from '../domain.js';

export class DomainConverter {
  public static toSystemModel(dto: SystemModelDTO): SystemModel {
    return {
      schemaVersion: 2,
      name: dto.name || 'Generated System Model',
      components: (dto.components || []).map(c => ({
        name: c.name || '',
        type: c.type || '',
        description: c.description
      })),
      flows: (dto.flows || []).map(f => ({
        from: f.from || '',
        to: f.to || '',
        description: f.description || '',
        trigger: f.trigger
      })),
      users: dto.users || [],
      qualityAttributes: dto.qualityAttributes || [],
      risks: dto.risks || [],
      unknowns: dto.unknowns || []
    };
  }

  public static toTestStrategy(dto: TestStrategyDTO): TestStrategy {
    return {
      id: dto.id || 'strat-default',
      schemaVersion: 2,
      revision: 1,
      lastUpdated: new Date(),
      requirementId: dto.requirementId || 'req-default',
      businessImpact: (dto.businessImpact || 'medium') as any,
      riskLevel: (dto.riskLevel || 'medium') as any,
      objectives: dto.objectives || [],
      scope: dto.primaryFocus || ['General Functional Scope'],
      primaryFocus: dto.primaryFocus || [],
      risks: [],
      approach: 'Direct mapped strategy approach',
      recommendedSuites: (dto.recommendedSuites || []).map(s => ({
        suite: s.suite || '',
        priority: 2,
        reason: s.reason || 'Recommended test suite target'
      })),
      excludedSuites: (dto.excludedSuites || []).map(s => ({
        suite: s.suite || '',
        reason: s.reason || 'Excluded test suite scope'
      })),
      outOfScope: (dto.outOfScope || []).map(item => ({
        area: item.area || '',
        reason: item.reason || ''
      })),
      coverage: dto.objectives || [],
      deliverables: ['Strategy Deliverable'],
      decisions: [],
      automationCandidates: [],
      manualExploratoryScenarios: [],
      suggestedTestData: [],
      suggestedPreconditions: [],
      suggestedEnvironments: [],
      executionOrder: [],
      estimatedEffort: [],
      confidenceScore: dto.confidenceScore || 0.8,
      reasoningTrace: dto.reasoningTrace || [],
      createdAt: new Date()
    };
  }
}
