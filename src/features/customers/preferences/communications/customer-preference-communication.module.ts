import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerCommunicationPreference } from './entities/customer-communication-preference.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CustomerCommunicationPreference])],
  exports: [TypeOrmModule],
})
export class CustomerCommunicationPreferencesModule {}
