// The following disables are required because Winston's types are trusted and strict ESLint rules produce false positives for its API usage.

import { LoggerService } from "@nestjs/common";
import { createLogger, format, transports, Logger } from "winston";

// Logging level is set based on NODE_ENV:
//   - 'debug' for local development (NODE_ENV === 'development')
//   - 'error' for all other environments
// Adjust NODE_ENV to control log verbosity.
export class AppLogger implements LoggerService {
  private static instance: AppLogger;
  private logger: Logger;

  private constructor() {
    const env = process.env.NODE_ENV;
    const level = env === "development" ? "debug" : "error";
    // Initialize Winston logger with specified settings.
    this.logger = createLogger({
      // Winston logger is a well-typed, trusted library. These are false positives from strict ESLint rules.
      level,
      format: format.combine(
        format.timestamp(),
        format.errors({ stack: true }),
        format.splat(),
        format.json(),
      ),
      transports: [
        // Winston transports are safe to use; false positives.
        new transports.Console({
          format: format.combine(format.colorize(), format.simple()),
        }),

        // Winston transports are safe to use; false positives.
        new transports.File({ filename: "app.log" }),
      ],
    });
  }

  static getInstance(): AppLogger {
    if (!AppLogger.instance) {
      AppLogger.instance = new AppLogger();
    }
    return AppLogger.instance;
  }

  log(message: string, ...meta: any[]) {
    // Winston logger method is safe to use; false positive.
    this.logger.info(message, ...meta);
  }
  error(message: string, ...meta: any[]) {
    // Winston logger method is safe to use; false positive.
    this.logger.error(message, ...meta);
  }
  warn(message: string, ...meta: any[]) {
    // Winston logger method is safe to use; false positive.
    this.logger.warn(message, ...meta);
  }
  debug(message: string, ...meta: any[]) {
    // Winston logger method is safe to use; false positive.
    this.logger.debug(message, ...meta);
  }
  verbose(message: string, ...meta: any[]) {
    // Winston logger method is safe to use; false positive.
    this.logger.verbose(message, ...meta);
  }
}
