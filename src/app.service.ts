import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getGreeting(): string {
    return 'User Authentication System!';
  }
}
