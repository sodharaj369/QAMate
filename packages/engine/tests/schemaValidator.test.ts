import { describe, it, expect } from 'vitest';
import { SchemaValidator } from '../src/platform/schemaValidator.js';
import { JSONResponseRepairer } from '../src/platform/responseRepairer.js';
import { DomainConverter } from '../src/platform/domainConverter.js';
import { WorkspaceSecurity } from '../src/platform/security.js';

describe('Phase 1: Domain Contracts & Schema Validation tests', () => {
  
  it('should validate a correct SystemModelDTO and flag errors/warnings on malformed layouts', () => {
    const validator = new SchemaValidator();

    // 1. Valid DTO
    const validRaw = {
      name: 'User Authentication System',
      components: [
        { name: 'LoginController', type: 'Controller', description: 'Handles log in' }
      ],
      flows: [
        { from: 'UI', to: 'LoginController', description: 'User submits details' }
      ],
      users: ['End User'],
      qualityAttributes: ['Security'],
      risks: ['Credential theft'],
      unknowns: []
    };

    const resValid = validator.validateSystemModel(validRaw);
    expect(resValid.isValid).toBe(true);
    expect(resValid.errors).toHaveLength(0);
    expect(resValid.data?.name).toBe('User Authentication System');

    // 2. Malformed DTO
    const malformedRaw = {
      components: 'not-an-array',
      flows: [
        { to: 'Database' } // missing 'from'
      ]
    };

    const resMalformed = validator.validateSystemModel(malformedRaw);
    expect(resMalformed.isValid).toBe(false);
    expect(resMalformed.errors).toContain('SystemModel is missing a name attribute.');
    expect(resMalformed.errors).toContain('components attribute is missing or is not a valid array.');
    expect(resMalformed.errors).toContain('Flow at index 0 is missing source component (from).');
  });

  it('should validate a TestStrategyDTO and return structured errors and default values', () => {
    const validator = new SchemaValidator();

    const malformedStrategy = {
      id: '',
      requirementId: 'req-1',
      objectives: [] // objective required
    };

    const res = validator.validateTestStrategy(malformedStrategy);
    expect(res.isValid).toBe(false);
    expect(res.errors).toContain('TestStrategy is missing an ID.');
    expect(res.errors).toContain('TestStrategy must specify at least one testing objective.');
    expect(res.data?.confidenceScore).toBe(0.8); // default value filled
  });

  it('should repair casing anomalies, trailing commas, and markdown backticks', () => {
    const repairer = new JSONResponseRepairer();

    const rawJsonWithMarkdownAndCommas = `
    \`\`\`json
    {
      "name": "Payment Gateway",
      "quality_attributes": ["Reliability"],
      "components": [
        { "name": "API", "type": "HTTP" },
      ]
    }
    \`\`\`
    `;

    const repairedText = repairer.repair(rawJsonWithMarkdownAndCommas, 'SystemModel');
    const parsed = JSON.parse(repairedText);

    expect(parsed.name).toBe('Payment Gateway');
    expect(parsed.qualityAttributes).toEqual(['Reliability']);
    expect(parsed.quality_attributes).toBeUndefined(); // mapped and deleted
    expect(parsed.components).toHaveLength(1); // comma stripped and parsed
  });

  it('should convert validated DTOs to Domain Models with schema version 2', () => {
    const dto = {
      schemaVersion: 2,
      name: 'Telemetry Hub',
      components: [{ name: 'LogCollector', type: 'Ingress' }],
      flows: [{ from: 'Client', to: 'LogCollector', description: 'Uploads telemetry' }],
      users: [],
      qualityAttributes: [],
      risks: [],
      unknowns: []
    };

    const domainModel = DomainConverter.toSystemModel(dto);
    expect(domainModel.schemaVersion).toBe(2);
    expect(domainModel.name).toBe('Telemetry Hub');
    expect(domainModel.components[0].name).toBe('LogCollector');
  });

  it('should mask sensitive credential patterns and enforce workspace privacy rules', () => {
    const security = new WorkspaceSecurity();

    const textWithApiKey = 'Sending prompt context config API_KEY="sk-1234567890abcdef12345678"';
    const maskedText = security.maskSecrets(textWithApiKey);
    expect(maskedText).toContain('API_KEY: "[REDACTED]"');

    // Check privacy file violations
    expect(security.checkPrivacyViolation('.env')).toBe(true);
    expect(security.checkPrivacyViolation('key.pem')).toBe(true);
    expect(security.checkPrivacyViolation('packages/engine/src/main.ts')).toBe(false);

    // Sanitize path traversals
    expect(security.sanitizePath('../../etc/passwd')).toBe('etc/passwd');
  });
});
