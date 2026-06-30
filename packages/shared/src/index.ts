/**
 * Custom base error class for all QAMate related errors.
 */
export class QAMateError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'QAMateError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Shared Logger Interface.
 */
export interface ILogger {
  debug(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
}

/**
 * Standard Console Logger implementation.
 */
export class ConsoleLogger implements ILogger {
  constructor(private readonly prefix: string = 'QAMate') {}

  private format(level: string, message: string): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${this.prefix}] [${level}] ${message}`;
  }

  public debug(message: string, ...args: unknown[]): void {
    console.debug(this.format('DEBUG', message), ...args);
  }

  public info(message: string, ...args: unknown[]): void {
    console.info(this.format('INFO', message), ...args);
  }

  public warn(message: string, ...args: unknown[]): void {
    console.warn(this.format('WARN', message), ...args);
  }

  public error(message: string, ...args: unknown[]): void {
    console.error(this.format('ERROR', message), ...args);
  }
}
