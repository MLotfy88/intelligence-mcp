import { logger } from './logger.js';

interface ErrorDetails {
  message: string;
  code?: string;
  stack?: string;
  timestamp: string;
  severity: 'error' | 'fatal';
  context?: Record<string, unknown>;
}

export class MCPError extends Error {
  constructor(
    message: string,
    public code?: string,
    public severity: 'error' | 'fatal' = 'error',
    public context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'MCPError';
  }
}

export function handleError(context: string, error: unknown): void {
  const details = extractErrorDetails(error);
  logger.error(context, details);

  // If it's a fatal error, we might want to terminate the process
  if (details.severity === 'fatal') {
    logger.error('Fatal error occurred, terminating process');
    process.exit(1);
  }
}

function extractErrorDetails(error: unknown): ErrorDetails {
  const timestamp = new Date().toISOString();

  if (error instanceof MCPError) {
    return {
      message: error.message,
      stack: error.stack,
      code: error.code,
      severity: error.severity,
      context: error.context,
      timestamp
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      stack: error.stack,
      code: (error as any).code,
      severity: 'error',
      timestamp
    };
  }
  
  return {
    message: String(error),
    severity: 'error',
    timestamp
  };
}
