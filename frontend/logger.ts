// Singleton logger for frontend (browser and SSR)
class Logger {
  private static instance: Logger;
  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  info(message: string, ...args: unknown[]) {
    // Could be enhanced to send logs to a remote server
    console.info(`[INFO]`, message, ...args);
  }
  warn(message: string, ...args: unknown[]) {
    console.warn(`[WARN]`, message, ...args);
  }
  error(message: string, ...args: unknown[]) {
    console.error(`[ERROR]`, message, ...args);
  }
  debug(message: string, ...args: unknown[]) {
    console.debug(`[DEBUG]`, message, ...args);
  }
}

export default Logger;
