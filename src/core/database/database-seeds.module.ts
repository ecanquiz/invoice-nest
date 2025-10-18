import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseSeeder } from './seeds';
import { RolesPermissionsSeeder } from './seeds/essential/roles-permissions.seeder';
import { CategoriesSeeder } from './seeds/essential/categories.seeder';
import { AdminUserSeeder } from './seeds/essential/admin-user.seeder';
import { Role } from '@features/iam/roles/entities/role.entity';
import { FakeUsersSeeder } from './seeds/development/fake-users.seeder';
import { Permission } from '@features/iam/permissions/entities/permission.entity';
import { Category } from '@features/categories/entities/category.entity';
import { User } from '@features/iam/users/entities/user.entity';
import { Customer } from '@features/customers/entities/customer.entity';
import { CustomerProfile } from '@features/customers/profiles/entities/customer-profile.entity';
import { CustomerCommunicationPreference } from '@features/customers/preferences/communications/entities/customer-communication-preference.entity';
import { CustomerWinePreference } from '@features/customers/preferences/wines/entities/customer-wine-preference.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Role, 
      Permission, 
      Category, 
      User,
      Customer,
      CustomerProfile,
      CustomerCommunicationPreference,
      CustomerWinePreference,
    ])
  ],
  providers: [
    DatabaseSeeder,
    RolesPermissionsSeeder,
    CategoriesSeeder, 
    AdminUserSeeder,
    FakeUsersSeeder,
  ],
  exports: [DatabaseSeeder],
})
export class DatabaseSeedsModule {}
