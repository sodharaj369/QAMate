import { ISchemaValidator } from '../interfaces/index.js';
import { SystemModelDTO, TestStrategyDTO, ValidationResult } from '../domain.js';

export class SchemaValidator implements ISchemaValidator {
  public validateSystemModel(raw: any): ValidationResult<SystemModelDTO> {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!raw || typeof raw !== 'object') {
      return {
        isValid: false,
        errors: ['Input is not a valid JSON object.'],
        warnings: []
      };
    }

    const schemaVersion = raw.schemaVersion || 2;
    if (schemaVersion !== 2) {
      warnings.push(`Expected schemaVersion 2, but received ${schemaVersion}. Attempting normalization.`);
    }

    const name = typeof raw.name === 'string' ? raw.name.trim() : '';
    if (!name) {
      errors.push('SystemModel is missing a name attribute.');
    }

    const components: any[] = [];
    if (!Array.isArray(raw.components)) {
      errors.push('components attribute is missing or is not a valid array.');
    } else {
      raw.components.forEach((c: any, index: number) => {
        if (!c || typeof c !== 'object') {
          errors.push(`Component at index ${index} is not an object.`);
          return;
        }
        const cName = typeof c.name === 'string' ? c.name.trim() : '';
        const cType = typeof c.type === 'string' ? c.type.trim() : '';
        if (!cName) {
          errors.push(`Component at index ${index} is missing a name.`);
        }
        if (!cType) {
          errors.push(`Component at index ${index} is missing a type.`);
        }
        components.push({
          name: cName,
          type: cType,
          description: typeof c.description === 'string' ? c.description.trim() : undefined
        });
      });
    }

    const flows: any[] = [];
    if (!Array.isArray(raw.flows)) {
      errors.push('flows attribute is missing or is not a valid array.');
    } else {
      raw.flows.forEach((f: any, index: number) => {
        if (!f || typeof f !== 'object') {
          errors.push(`Flow at index ${index} is not an object.`);
          return;
        }
        const from = typeof f.from === 'string' ? f.from.trim() : '';
        const to = typeof f.to === 'string' ? f.to.trim() : '';
        const description = typeof f.description === 'string' ? f.description.trim() : '';
        if (!from) {
          errors.push(`Flow at index ${index} is missing source component (from).`);
        }
        if (!to) {
          errors.push(`Flow at index ${index} is missing target component (to).`);
        }
        if (!description) {
          warnings.push(`Flow at index ${index} is missing a description.`);
        }
        flows.push({
          from,
          to,
          description,
          trigger: typeof f.trigger === 'string' ? f.trigger.trim() : undefined
        });
      });
    }

    const users = Array.isArray(raw.users) ? raw.users.filter((u: any) => typeof u === 'string') : [];
    if (!Array.isArray(raw.users)) {
      warnings.push('users attribute is missing or is not a valid array.');
    }

    const qualityAttributes = Array.isArray(raw.qualityAttributes) 
      ? raw.qualityAttributes.filter((q: any) => typeof q === 'string') 
      : [];
    if (!Array.isArray(raw.qualityAttributes)) {
      warnings.push('qualityAttributes attribute is missing.');
    }

    const risks = Array.isArray(raw.risks) ? raw.risks.filter((r: any) => typeof r === 'string') : [];
    if (!Array.isArray(raw.risks)) {
      warnings.push('risks attribute is missing.');
    }

    const unknowns = Array.isArray(raw.unknowns) ? raw.unknowns.filter((u: any) => typeof u === 'string') : [];
    if (!Array.isArray(raw.unknowns)) {
      warnings.push('unknowns attribute is missing.');
    }

    const data: SystemModelDTO = {
      schemaVersion,
      name,
      components,
      flows,
      users,
      qualityAttributes,
      risks,
      unknowns
    };

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      data
    };
  }

  public validateTestStrategy(raw: any): ValidationResult<TestStrategyDTO> {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!raw || typeof raw !== 'object') {
      return {
        isValid: false,
        errors: ['Input is not a valid JSON object.'],
        warnings: []
      };
    }

    const schemaVersion = raw.schemaVersion || 2;
    if (schemaVersion !== 2) {
      warnings.push(`Expected schemaVersion 2, but received ${schemaVersion}. Attempting normalization.`);
    }

    const id = typeof raw.id === 'string' ? raw.id.trim() : '';
    const requirementId = typeof raw.requirementId === 'string' ? raw.requirementId.trim() : '';

    if (!id) {
      errors.push('TestStrategy is missing an ID.');
    }
    if (!requirementId) {
      errors.push('TestStrategy is missing a requirementId.');
    }

    const businessImpact = typeof raw.businessImpact === 'string' ? raw.businessImpact.trim() : 'medium';
    const riskLevel = typeof raw.riskLevel === 'string' ? raw.riskLevel.trim() : 'medium';

    const objectives = Array.isArray(raw.objectives) ? raw.objectives.filter((o: any) => typeof o === 'string') : [];
    if (objectives.length === 0) {
      errors.push('TestStrategy must specify at least one testing objective.');
    }

    const primaryFocus = Array.isArray(raw.primaryFocus) ? raw.primaryFocus.filter((f: any) => typeof f === 'string') : [];

    const recommendedSuites: any[] = [];
    if (Array.isArray(raw.recommendedSuites)) {
      raw.recommendedSuites.forEach((s: any, idx: number) => {
        if (s && typeof s === 'object') {
          recommendedSuites.push({
            suite: typeof s.suite === 'string' ? s.suite.trim() : `suite-${idx}`,
            reason: typeof s.reason === 'string' ? s.reason.trim() : undefined
          });
        }
      });
    }

    const excludedSuites: any[] = [];
    if (Array.isArray(raw.excludedSuites)) {
      raw.excludedSuites.forEach((s: any, idx: number) => {
        if (s && typeof s === 'object') {
          excludedSuites.push({
            suite: typeof s.suite === 'string' ? s.suite.trim() : `suite-${idx}`,
            reason: typeof s.reason === 'string' ? s.reason.trim() : undefined
          });
        }
      });
    }

    const outOfScope: any[] = [];
    if (Array.isArray(raw.outOfScope)) {
      raw.outOfScope.forEach((item: any, idx: number) => {
        if (item && typeof item === 'object') {
          outOfScope.push({
            area: typeof item.area === 'string' ? item.area.trim() : `area-${idx}`,
            reason: typeof item.reason === 'string' ? item.reason.trim() : `reason-${idx}`
          });
        }
      });
    }

    const confidenceScore = typeof raw.confidenceScore === 'number' ? raw.confidenceScore : 0.8;
    const reasoningTrace = Array.isArray(raw.reasoningTrace) ? raw.reasoningTrace.filter((t: any) => typeof t === 'string') : [];

    const data: TestStrategyDTO = {
      schemaVersion,
      id,
      requirementId,
      businessImpact,
      riskLevel,
      objectives,
      primaryFocus,
      recommendedSuites,
      excludedSuites,
      outOfScope,
      confidenceScore,
      reasoningTrace
    };

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      data
    };
  }
}
