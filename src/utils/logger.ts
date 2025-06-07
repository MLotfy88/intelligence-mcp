type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  details?: unknown;
}

interface LogOptions {
  useColors?: boolean;
  includeTimestamp?: boolean;
  timestampFormat?: string;
}

class Logger {
  private options: LogOptions = {
    useColors: true,
    includeTimestamp: true,
    timestampFormat: 'ISO'
  };

  constructor(options?: Partial<LogOptions>) {
    this.options = { ...this.options, ...options };
  }

  private formatTimestamp(): string {
    const date = new Date();
    switch (this.options.timestampFormat) {
      case 'ISO':
        return date.toISOString();
      case 'locale':
        return date.toLocaleString();
      default:
        return date.toISOString();
    }
  }

  private getColor(level: LogLevel): string {
    if (!this.options.useColors) return '';
    
    switch (level) {
      case 'info': return '\x1b[32m'; // Green
      case 'warn': return '\x1b[33m'; // Yellow
      case 'error': return '\x1b[31m'; // Red
      case 'debug': return '\x1b[36m'; // Cyan
      default: return '';
    }
  }

  private logToConsole(entry: LogEntry): void {
    const color = this.getColor(entry.level);
    const reset = this.options.useColors ? '\x1b[0m' : '';
    const timestamp = this.options.includeTimestamp ? `[${entry.timestamp}] ` : '';
    const details = entry.details ? JSON.stringify(entry.details, null, 2) : '';

    console.log(`${color}${timestamp}${entry.level.toUpperCase()}: ${entry.message}${reset}${details ? '\n' + details : ''}`);
  }

  info(message: string, details?: unknown): void {
    this.logToConsole({
      level: 'info',
      message,
      timestamp: this.formatTimestamp(),
      details
    });
  }

  warn(message: string, details?: unknown): void {
    this.logToConsole({
      level: 'warn',
      message,
      timestamp: this.formatTimestamp(),
      details
    });
  }

  error(message: string, details?: unknown): void {
    this.logToConsole({
      level: 'error',
      message,
      timestamp: this.formatTimestamp(),
      details
    });
  }

  debug(message: string, details?: unknown): void {
    if (process.env.DEBUG) {
      this.logToConsole({
        level: 'debug',
        message,
        timestamp: this.formatTimestamp(),
        details
      });
    }
  }
}

export const logger = new Logger();
