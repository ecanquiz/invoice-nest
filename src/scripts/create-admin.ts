import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { RolesService } from '../roles/roles.service';

@Injectable()
export class AdminCreator {
  constructor(
    private usersService: UsersService,
    private rolesService: RolesService,
  ) {}

  async createAdmin() {
    const adminRole = await this.rolesService.findByName('admin');
    const adminUser = await this.usersService.create({
      email: 'admin@example.com',
      password: 'Admin123!',
      name: 'System Administrator'
    });

    await this.usersService.assignRolesToUser(adminUser.id, [adminRole.id]);
  }
}
