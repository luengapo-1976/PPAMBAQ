import { ConsoleLogger } from '@nestjs/common';

interface LogEntry {
  timestamp: string;
  level: string;
  context?: string;
  message: unknown;
}

export class StructuredLogger extends ConsoleLogger {
  protected formatMessage(level: string, message: unknown, context?: string) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      context,
      message,
    };
    return `${JSON.stringify(entry)}\n`;
  }

  log(message: unknown, context?: string) {
    process.stdout.write(this.formatMessage('log', message, context));
  }

  error(message: unknown, trace?: string, context?: string) {
    process.stderr.write(
      this.formatMessage('error', trace ? { message, trace } : message, context),
    );
  }

  warn(message: unknown, context?: string) {
    process.stdout.write(this.formatMessage('warn', message, context));
  }

  debug(message: unknown, context?: string) {
    process.stdout.write(this.formatMessage('debug', message, context));
  }

  verbose(message: unknown, context?: string) {
    process.stdout.write(this.formatMessage('verbose', message, context));
  }
}
