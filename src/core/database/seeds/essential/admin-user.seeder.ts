import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { BaseSeeder } from '../base-seeder.abstract';
import { User } from '@/features/iam/users/entities/user.entity';
import { Role } from '@/features/iam/roles/entities/role.entity';

@Injectable()
export class AdminUserSeeder extends BaseSeeder {
  name = 'AdminUserSeeder';

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
  ) {
    super();
  }

  async shouldRun(): Promise<boolean> {
    const existingAdmin = await this.userRepository.findOne({
      where: { email: 'admin@example.com' }
    });
    return !existingAdmin;
  }

  async run(): Promise<void> {
    const adminRole = await this.roleRepository.findOne({
      where: { name: 'admin' }
    });

    if (!adminRole) {
      throw new Error('Admin role not found. Run RolesPermissionsSeeder first.');
    }

    const hashedPassword = await bcrypt.hash('Admin123!', 12);
    const adminUser = this.userRepository.create({
      email: 'admin@example.com',
      password: hashedPassword,
      name: 'System Administrator',
      is_email_verified: true,
      roles: [adminRole]
    });

    await this.userRepository.save(adminUser);
    this.log('Admin user created: admin@example.com / Admin123!');
  }
}
