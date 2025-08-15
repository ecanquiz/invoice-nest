import { Injectable } from '@nestjs/common';

@Injectable()
export class TokenBlacklistService {
  private readonly blacklist = new Set<string>();

  add(token: string): void {
    this.blacklist.add(token);
  }

  contains(token: string): boolean {
    return this.blacklist.has(token);
  }
}
