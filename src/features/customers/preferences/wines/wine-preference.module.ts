import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerWinePreference } from './entities/customer-wine-preference.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CustomerWinePreference])],
  exports: [TypeOrmModule],
})
export class CustomerWinePreferencesModule {}
