import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { faker } from '@faker-js/faker';
import { BaseSeeder } from '../base-seeder.abstract';
import { User } from '@/features/iam/users/entities/user.entity';
import { Customer } from '@/features/customers/entities/customer.entity';
import { CustomerProfile } from '@/features/customers/profiles/entities/customer-profile.entity';
import { CustomerCommunicationPreference } from '@/features/customers/preferences/communications/entities/customer-communication-preference.entity';
import { CustomerWinePreference } from '@/features/customers/preferences/wines/entities/customer-wine-preference.entity';
import { Role } from '@/features/iam/roles/entities/role.entity';

@Injectable()
export class FakeUsersSeeder extends BaseSeeder {
  name = 'FakeUsersSeeder';

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    @InjectRepository(CustomerProfile)
    private profileRepository: Repository<CustomerProfile>,
    @InjectRepository(CustomerCommunicationPreference)
    private communicationPrefsRepository: Repository<CustomerCommunicationPreference>,
    @InjectRepository(CustomerWinePreference)
    private winePrefsRepository: Repository<CustomerWinePreference>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
  ) {
    super();
  }

  async shouldRun(): Promise<boolean> {
    if (process.env.NODE_ENV !== 'development') {
      return false;
    }
    const userCount = await this.userRepository.count();
    return userCount <= 3;
  }

  async run(): Promise<void> {
    this.log('Starting fake users generation...');

    const [customerRole] = await Promise.all([
      this.roleRepository.findOne({ where: { name: 'customer' }}),
    ]);

    if (!customerRole) {
      throw new Error('Customer roles not found. Run essential seeders first.');
    }

    // Create 20 Customers
    const customers = await this.createCustomers(customerRole, 20);
    this.log(`Created ${customers.length} customers`);

    this.log('Fake users generation completed!');
  }

  private async createCustomers(customerRole: Role, count: number): Promise<Customer[]> {
    const customers: Customer[] = [];

    for (let i = 0; i < count; i++) {
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      const email = faker.internet.email({ firstName, lastName });
        
      const existingUser = await this.userRepository.findOne({ 
        where: { email } 
      });
        
      if (existingUser) {
        this.log(`Customer ${email} already exists, skipping...`);
        continue;
      }

      // Crete User
      const user = this.userRepository.create({
        email,
        password: await bcrypt.hash('Password123!', 12),
        name: `${firstName} ${lastName}`,
        is_email_verified: faker.datatype.boolean(0.7),
        roles: [customerRole],
      });

      const savedUser = await this.userRepository.save(user);

      // 1. Create Customer
      const customer = this.customerRepository.create({
        user_id: savedUser.id,
        customer_code: `CUST-${Date.now()}-${i}`,
      });

      const savedCustomer = await this.customerRepository.save(customer);

      // 2. Create Profile
      const phone = this.generatePhoneNumber();
      const birthDate = faker.date.birthdate({ min: 18, max: 80, mode: 'age' });
        
      if (phone || birthDate) {
        await this.profileRepository.save({
            customer_id: savedCustomer.id,
            phone: phone,
            birth_date: birthDate,
        });
      }

      // 3. Create Communication Preferences
      await this.communicationPrefsRepository.save({
        customer_id: savedCustomer.id,
        receive_notifications: faker.datatype.boolean(0.6),
        receive_newsletter: faker.datatype.boolean(0.4),
      });

      // 4. Create Wine Preferences
      const wineTypes = ['white', 'rose', 'sparkling', 'red'];
      const preferredWineTypes = faker.helpers.arrayElements(wineTypes, faker.number.int({ min: 1, max: 3 }));
        
      if (preferredWineTypes.length > 0) {
        const winePrefs = preferredWineTypes.map(wineType => ({
            customer_id: savedCustomer.id,
            wine_type: wineType,
        }));
        await this.winePrefsRepository.save(winePrefs);
      }

      customers.push(savedCustomer);
      this.log(`Created customer: ${user.name} (${user.email}) - Phone: ${phone}`);
    }

    return customers;
  }

  private generatePhoneNumber(): string {
    // International short format (+52 1 234 567 8900 = 15 characters)
    const countryCode = faker.helpers.arrayElement(['+1', '+52', '+34', '+39']);
    const areaCode = faker.number.int({ min: 100, max: 999 }).toString();
    const firstPart = faker.number.int({ min: 100, max: 999 }).toString();
    const secondPart = faker.number.int({ min: 1000, max: 9999 }).toString();
    
    return `${countryCode} ${areaCode} ${firstPart} ${secondPart}`; // Maximum 18 characters
  }  
}
