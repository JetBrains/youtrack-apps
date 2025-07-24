---
to: "src/common/utils/logger.ts"
---

/**
 * Logger utility using loglevel library
 * Provides structured logging with different levels and context information
 */

import log from 'loglevel';

export interface LogContext {
  module?: string;
  component?: string;
  action?: string;
  [key: string]: unknown;
}

class Logger {
  private baseLogger: log.Logger;
  private context: LogContext;
  private loggerName: string;

  constructor(name: string, context: LogContext = {}) {
    this.loggerName = name;
    this.baseLogger = log.getLogger(name);
    this.context = context;

    // Set log level based on environment
    this.setLogLevel();
  }

  private setLogLevel(): void {
    const env = process.env.NODE_ENV;

    if (env === 'test') {
      this.baseLogger.setLevel('SILENT');
    } else if (env === 'development') {
      this.baseLogger.setLevel('DEBUG');
    } else if (env === 'production') {
      this.baseLogger.setLevel('WARN');
    } else {
      this.baseLogger.setLevel('INFO');
    }
  }

  private formatMessage(message: string, additionalContext?: LogContext): string {
    const fullContext = { ...this.context, ...additionalContext };

    let formattedMessage = message;

    if (fullContext.module) {
      formattedMessage = `[${fullContext.module}] ${formattedMessage}`;
    }

    if (fullContext.component) {
      formattedMessage = `[${fullContext.component}] ${formattedMessage}`;
    }

    if (fullContext.action) {
      formattedMessage = `[${fullContext.action}] ${formattedMessage}`;
    }

    return formattedMessage;
  }

  debug(message: string, context?: LogContext, data?: unknown): void {
    const formattedMessage = this.formatMessage(message, context);
    if (data !== undefined) {
      this.baseLogger.debug(formattedMessage, data);
    } else {
      this.baseLogger.debug(formattedMessage);
    }
  }

  info(message: string, context?: LogContext, data?: unknown): void {
    const formattedMessage = this.formatMessage(message, context);
    if (data !== undefined) {
      this.baseLogger.info(formattedMessage, data);
    } else {
      this.baseLogger.info(formattedMessage);
    }
  }

  warn(message: string, context?: LogContext, data?: unknown): void {
    const formattedMessage = this.formatMessage(message, context);
    if (data !== undefined) {
      this.baseLogger.warn(formattedMessage, data);
    } else {
      this.baseLogger.warn(formattedMessage);
    }
  }

  error(message: string, context?: LogContext, data?: unknown): void {
    const formattedMessage = this.formatMessage(message, context);
    if (data !== undefined) {
      this.baseLogger.error(formattedMessage, data);
    } else {
      this.baseLogger.error(formattedMessage);
    }
  }

  withContext(additionalContext: LogContext): Logger {
    return new Logger(this.loggerName, { ...this.context, ...additionalContext });
  }
}

// Create loggers for different modules
export const createApiLogger = (component: string) =>
  new Logger('API', { module: 'API', component });

export const createComponentLogger = (component: string) =>
  new Logger('UI', { module: 'UI', component });

export const createHookLogger = (hook: string) =>
  new Logger('HOOKS', { module: 'HOOKS', component: hook });

export const createBackendLogger = (module: string) =>
  new Logger('BACKEND', { module: 'BACKEND', component: module });

// Default logger instance
export const logger = new Logger('APP');

// Export types
export type { Logger as ContextualLogger };
