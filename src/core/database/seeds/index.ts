import { Injectable, Logger } from '@nestjs/common';
import { RolesPermissionsSeeder } from './essential/roles-permissions.seeder';
import { CategoriesSeeder } from './essential/categories.seeder';
import { AdminUserSeeder } from './essential/admin-user.seeder';
import { FakeUsersSeeder } from './development/fake-users.seeder';
import { BaseSeeder } from './base-seeder.abstract';
import { FakeProductsSeeder } from './development/fake-products.seeder';

export type SeedMode = 'essential' | 'development' | 'testing';

@Injectable()
export class DatabaseSeeder {
  private readonly logger = new Logger(DatabaseSeeder.name);
  
  constructor(
    private rolesPermissionsSeeder: RolesPermissionsSeeder,
    private categoriesSeeder: CategoriesSeeder,
    private adminUserSeeder: AdminUserSeeder,
    private fakeUsersSeeder: FakeUsersSeeder,
    private fakeProductsSeeder: FakeProductsSeeder
  ) {}

  async run(mode: SeedMode = 'essential') {
    this.logger.log(`Running database seeders in mode: ${mode}`);

    // Define the CRITICAL execution order
    const essentialSeeders: BaseSeeder[] = [
      this.rolesPermissionsSeeder, // 1. Roles and permissions first
      this.categoriesSeeder,       // 2. Categories after
      this.adminUserSeeder,        // 3. Admin user at the end
    ];

    const developmentSeeders: BaseSeeder[] = [
      this.fakeUsersSeeder,
      // this.fakeProductsSeeder
    ];

    let seedersToRun: BaseSeeder[] = [];

    switch (mode) {
      case 'essential':
        seedersToRun = essentialSeeders;
        break;
      case 'development':
        seedersToRun = [...essentialSeeders, ...developmentSeeders];
        break;
      case 'testing':
        seedersToRun = [...essentialSeeders, ...developmentSeeders];
        break;
    }

    for (const seeder of seedersToRun) {
      if (await seeder.shouldRun()) {
        this.logger.log(`Running ${seeder.name}...`);
        await seeder.run();
        this.logger.log(`✅ Completed ${seeder.name}`);
      } else {
        this.logger.log(`⏭️  Skipped ${seeder.name} (already executed)`);
      }
    }

    this.logger.log('🎉 All seeders completed successfully!');
  }
}
