import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryRunner } from 'typeorm';
import { Customer } from '../entities/customer.entity';
import { CustomerProfile } from '../profiles/entities/customer-profile.entity';
import { CustomerCommunicationPreference } from '../preferences/communications/entities/customer-communication-preference.entity';
import { CustomerWinePreference } from '../preferences/wines/entities/customer-wine-preference.entity';

@Injectable()
export class CustomerRegistrationService {
  constructor(
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    @InjectRepository(CustomerProfile)
    private profileRepository: Repository<CustomerProfile>,
    @InjectRepository(CustomerCommunicationPreference)
    private communicationPrefsRepository: Repository<CustomerCommunicationPreference>,
    @InjectRepository(CustomerWinePreference)
    private winePrefsRepository: Repository<CustomerWinePreference>,
  ) {}

  async registerCustomer(userId: string, registerDto: any) {
    // 1. Create Customer
    const customer = this.customerRepository.create({
      user_id: userId,
      customer_code: `CUST-${Date.now()}`,
    });
    const savedCustomer = await this.customerRepository.save(customer);

    // 2. Create Profile
    if (registerDto.phone || registerDto.birthDate) {
      await this.profileRepository.save({
        customer_id: savedCustomer.id,
        phone: registerDto.phone,
        birth_date: registerDto.birthDate ? new Date(registerDto.birthDate) : null,
      });
    }

    // 3. Create Communication Preferences
    await this.communicationPrefsRepository.save({
      customer_id: savedCustomer.id,
      receive_notifications: registerDto.preferences?.notifications ?? true,
      receive_newsletter: registerDto.preferences?.newsletter ?? false,
    });

    // 4. Create Wine Preferences
    if (registerDto.preferences?.wineTypes?.length > 0) {
      const winePrefs = registerDto.preferences.wineTypes.map(wineType => ({
        customer_id: savedCustomer.id,
        wine_type: wineType,
      }));
      await this.winePrefsRepository.save(winePrefs);
    }

    return savedCustomer;
  }

  async registerCustomerWithTransaction(
    queryRunner: QueryRunner, 
    userId: string, 
    registerDto: any
  ) {
    // 1. Create Customer USING queryRunner.manager
    const customer = queryRunner.manager.create(Customer, {
      user_id: userId,
      customer_code: `CUST-${Date.now()}`,
    });
    const savedCustomer = await queryRunner.manager.save(Customer, customer);

    // 2. Create Profile
    if (registerDto.phone || registerDto.birthDate) {
      const profile = queryRunner.manager.create(CustomerProfile, {
        customer_id: savedCustomer.id,
        phone: registerDto.phone?.trim(),
        birth_date: registerDto.birthDate ? new Date(registerDto.birthDate) : null,
      });
      await queryRunner.manager.save(CustomerProfile, profile);
    }

    // 3. Create Communication Preferences
    const communicationPrefs = queryRunner.manager.create(CustomerCommunicationPreference, {
      customer_id: savedCustomer.id,
      receive_notifications: registerDto.preferences?.notifications ?? true,
      receive_newsletter: registerDto.preferences?.newsletter ?? false,
    });
    await queryRunner.manager.save(CustomerCommunicationPreference, communicationPrefs);

    // 4. Create Wine Preferences
    if (registerDto.preferences?.wineTypes && registerDto.preferences.wineTypes.length > 0) {
      const winePrefs = registerDto.preferences.wineTypes.map(wineType => 
        queryRunner.manager.create(CustomerWinePreference, {
          customer_id: savedCustomer.id,
          wine_type: wineType,
        })
      );
      await queryRunner.manager.save(CustomerWinePreference, winePrefs);
    }

    return savedCustomer;
  }
}
