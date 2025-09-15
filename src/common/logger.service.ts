import { Injectable, Scope } from '@nestjs/common';

@Injectable({ scope: Scope.TRANSIENT })
export class LoggerService {
  private isTestEnv = process.env.NODE_ENV === 'test';

  log(message: string, ...optionalParams: any[]) {
    if (!this.isTestEnv) {
      console.log(`[LOG] ${message}`, ...optionalParams);
    }
  }

  warn(message: string, ...optionalParams: any[]) {
    if (!this.isTestEnv) {
      console.warn(`[WARN] ${message}`, ...optionalParams);
    }
  }

  error(message: string, error?: any, ...optionalParams: any[]) {
    if (!this.isTestEnv) {
      if (error) {
        console.error(`[ERROR] ${message}`, error, ...optionalParams);
      } else {
        console.error(`[ERROR] ${message}`, ...optionalParams);
      }
    }
  }

  debug(message: string, ...optionalParams: any[]) {
    if (!this.isTestEnv && process.env.NODE_ENV === 'development') {
      console.debug(`[DEBUG] ${message}`, ...optionalParams);
    }
  }
}
