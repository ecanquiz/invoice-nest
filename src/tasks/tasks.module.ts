import { Module } from '@nestjs/common';
import { TasksController } from './tasks.controller';
import { EncryptionService } from '../encryption/encryption.service';

@Module({
  controllers: [TasksController],
  providers: [EncryptionService],
})
export class TasksModule {}
