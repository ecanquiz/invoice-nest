import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Customer } from './entities/customer.entity';
import { CustomerProfile } from   './profiles/entities/customer-profile.entity';
import { CustomerCommunicationPreference } from './preferences/communications/entities/customer-communication-preference.entity';
import { CustomerWinePreference } from './preferences/wines/entities/customer-wine-preference.entity';
import { CustomerRegistrationService } from './services/customer-registration.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Customer,
      CustomerProfile, 
      CustomerCommunicationPreference,
      CustomerWinePreference
    ]),
  ],
  providers: [CustomerRegistrationService],
  exports: [CustomerRegistrationService],
})
export class CustomersModule {}
