import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CommonModule } from '@core/common/common.module';
import { MailService } from './services/mail.service';

@Module({
  imports: [
    ConfigModule,
    CommonModule
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
