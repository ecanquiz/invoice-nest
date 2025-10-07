import { Module } from '@nestjs/common';
import { EncryptionService } from '@core/encryption/encryption.service';
import { TasksController } from './tasks.controller';

@Module({
  controllers: [TasksController],
  providers: [EncryptionService],
})
export class TasksModule {}
