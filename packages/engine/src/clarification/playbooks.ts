export interface DomainPlaybook {
  domain: string;
  relevantQuestions: string[];
  neverAsk: string[];
}

export const DOMAIN_PLAYBOOKS: Record<string, DomainPlaybook> = {
  'Monitoring & Observability': {
    domain: 'Monitoring & Observability',
    relevantQuestions: [
      'Alert Threshold',
      'Evaluation Window',
      'Notification Channel',
      'Retry Policy',
      'Duplicate Suppression',
      'Severity',
      'Tenant Scope',
      'metric',
      'log',
      'trace',
      'dashboard',
      'alert',
      'exception'
    ],
    neverAsk: [
      'Boundary Value',
      'Login Authentication',
      'User Roles',
      'UI Validation',
      'Browser Compatibility',
      'css',
      'font',
      'button click',
      'screen size'
    ]
  },
  'Infrastructure': {
    domain: 'Infrastructure',
    relevantQuestions: [
      'Cloud Provider',
      'Resource Sizing',
      'Network Access',
      'Security Group',
      'Deployment Tool',
      'SLA',
      'Storage Sizing',
      'server',
      'cloud',
      'kubernetes',
      'subnet',
      'load balancer'
    ],
    neverAsk: [
      'UI Validation',
      'Browser Compatibility',
      'User Roles',
      'Login Authentication',
      'css',
      'font',
      'button click'
    ]
  },
  'API': {
    domain: 'API',
    relevantQuestions: [
      'Request Payload',
      'Response Schema',
      'Status Code',
      'Rate Limit',
      'Auth Token',
      'Versioning',
      'Input Validation',
      'endpoint',
      'rest',
      'graphql',
      'http method',
      'headers'
    ],
    neverAsk: [
      'UI Validation',
      'Browser Compatibility',
      'Offline Support',
      'Device Orientation',
      'css',
      'font',
      'button click'
    ]
  },
  'Authentication': {
    domain: 'Authentication',
    relevantQuestions: [
      'Multi-Factor Auth',
      'Token Expiry',
      'Password Policy',
      'Session Lockout',
      'Encryption',
      'Identity Provider',
      'Role Mapping',
      'oauth',
      'login',
      'sign-in',
      'saml',
      'jwt'
    ],
    neverAsk: [
      'Monitoring',
      'Alert Threshold',
      'Evaluation Window',
      'SLA',
      'Resource Sizing',
      'cpu usage',
      'memory allocation'
    ]
  },
  'Payments': {
    domain: 'Payments',
    relevantQuestions: [
      'Payment Provider',
      'Currency Code',
      'PCI Compliance',
      'Refund Policy',
      'Retry Window',
      'Fraud Prevention',
      'Invoice Template',
      'stripe',
      'paypal',
      'checkout',
      'card tokenization'
    ],
    neverAsk: [
      'UI Validation',
      'Alert Threshold',
      'SLA',
      'Evaluation Window',
      'cpu usage',
      'browser extensions'
    ]
  },
  'Reporting': {
    domain: 'Reporting',
    relevantQuestions: [
      'File Export Formats',
      'Cache Limit',
      'Query Filter',
      'Load Frequency',
      'Report Layout',
      'Graph Details',
      'Page Size',
      'csv',
      'pdf',
      'excel',
      'aggregation'
    ],
    neverAsk: [
      'Multi-Factor Auth',
      'Encryption',
      'Token Expiry',
      'Identity Provider',
      'password policy',
      'session lockout'
    ]
  },
  'CRUD Business Features': {
    domain: 'CRUD Business Features',
    relevantQuestions: [
      'Data Validation',
      'Search Fields',
      'DB Schema',
      'Unique Constraints',
      'soft-delete',
      'Audit Fields',
      'Batch Sizes',
      'create',
      'read',
      'update',
      'delete',
      'form fields'
    ],
    neverAsk: [
      'Monitoring',
      'SLA',
      'Sizing',
      'Cloud Provider',
      'alert',
      'kubernetes'
    ]
  },
  'Workflow': {
    domain: 'Workflow',
    relevantQuestions: [
      'Step Order',
      'State Transitions',
      'Approval Gates',
      'Auto-escalation',
      'Notification Triggers',
      'Deadlock Rules',
      'Audit Logging',
      'state machine',
      'transition flow'
    ],
    neverAsk: [
      'UI Validation',
      'SLA',
      'Sizing',
      'browser compatibility',
      'css'
    ]
  },
  'Notifications': {
    domain: 'Notifications',
    relevantQuestions: [
      'Delivery Channel',
      'Template Variables',
      'Retry Interval',
      'Opt-out Settings',
      'Rate Limits',
      'Localization',
      'Priority',
      'email',
      'sms',
      'push notification'
    ],
    neverAsk: [
      'UI Validation',
      'Sizing',
      'Database Schema',
      'foreign key',
      'index columns'
    ]
  },
  'Integrations': {
    domain: 'Integrations',
    relevantQuestions: [
      'API Protocol',
      'Sync Interval',
      'Conflict Resolution',
      'Fallback Mode',
      'Data Mapping',
      'Retry Backoff',
      'Sync Batch Size',
      'webhook',
      'third-party api'
    ],
    neverAsk: [
      'UI Validation',
      'Multi-Factor Auth',
      'Password Policy',
      'font size',
      'screen size'
    ]
  },
  'Background Jobs': {
    domain: 'Background Jobs',
    relevantQuestions: [
      'Schedule Pattern',
      'Concurrency Limit',
      'Timeout Limit',
      'Retry Strategy',
      'Failure Notification',
      'Execution Log',
      'Dead Letter Queue',
      'cron',
      'worker pool'
    ],
    neverAsk: [
      'UI Validation',
      'Multi-Factor Auth',
      'Password Policy',
      'login credentials',
      'css design'
    ]
  },
  'Database': {
    domain: 'Database',
    relevantQuestions: [
      'Transaction Isolation',
      'Table Partitioning',
      'Connection Limit',
      'Index Columns',
      'Backup Frequency',
      'Retention Policy',
      'Query Timeout',
      'sql',
      'nosql',
      'migration script'
    ],
    neverAsk: [
      'UI Validation',
      'Multi-Factor Auth',
      'Browser Compatibility',
      'touch gesture',
      'font'
    ]
  },
  'Configuration': {
    domain: 'Configuration',
    relevantQuestions: [
      'Config Storage',
      'Encryption Keys',
      'Cache Settings',
      'Reload Strategy',
      'Feature Flag Provider',
      'Default Fallback',
      'Schema Validation',
      'env vars',
      'settings'
    ],
    neverAsk: [
      'UI Validation',
      'Multi-Factor Auth',
      'Browser Compatibility',
      'responsive design',
      'touch gesture'
    ]
  },
  'Mobile': {
    domain: 'Mobile',
    relevantQuestions: [
      'OS Version',
      'Device Model',
      'Offline Support',
      'Push Notification',
      'Local Database',
      'Screen Layout',
      'Touch Gesture',
      'ios',
      'android',
      'react native'
    ],
    neverAsk: [
      'Server Sizing',
      'Transaction Isolation',
      'Connection Limit',
      'subnet configuration',
      'kubernetes cluster'
    ]
  },
  'Web UI': {
    domain: 'Web UI',
    relevantQuestions: [
      'Browser Compatibility',
      'Responsive Layout',
      'Loading Skeleton',
      'Form Validation',
      'Font Styling',
      'Accessibility Contrast',
      'Keyboard Tab Order',
      'html',
      'css',
      'javascript',
      'dom element'
    ],
    neverAsk: [
      'Server Sizing',
      'Transaction Isolation',
      'Dead Letter Queue',
      'Alert Threshold',
      'database partitions'
    ]
  }
};
