import { ConsoleLogger } from '@qamate/shared';
import * as engine from '@qamate/engine';

const logger = new ConsoleLogger('VSCodeExtension');

export function activate() {
  logger.info('QAMate VS Code Extension activated.');
  logger.debug('Engine modules interfaces available:', Object.keys(engine).length);
}

export function deactivate() {
  logger.info('QAMate VS Code Extension deactivated.');
}
