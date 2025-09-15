import { Module } from '@nestjs/common';
import { LoggerService } from './';

@Module({
  providers: [LoggerService],
  exports: [LoggerService],
})
export class CommonModule {}