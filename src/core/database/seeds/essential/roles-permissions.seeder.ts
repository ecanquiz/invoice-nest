import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseSeeder } from '../base-seeder.abstract';
import { Role } from '@features/iam/roles/entities/role.entity';
import { Permission } from '@features/iam/permissions/entities/permission.entity';

@Injectable()
export class RolesPermissionsSeeder extends BaseSeeder {
  name = 'RolesPermissionsSeeder';

  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
  ) {
    super();
  }

  async shouldRun(): Promise<boolean> {
    const roleCount = await this.roleRepository.count();
    return roleCount === 0; // Only run if there are no roles
  }

  async run(): Promise<void> {
    const permissions = await this.createPermissions();
    await this.createRoles(permissions);
  }

  private async createPermissions() {
    const permissionData = [
      // Users module
      { name: 'users.read', description: 'Read users', module: 'users', action: 'read' },
      { name: 'users.create', description: 'Create users', module: 'users', action: 'create' },
      { name: 'users.update', description: 'Update users', module: 'users', action: 'update' },
      { name: 'users.delete', description: 'Delete users', module: 'users', action: 'delete' },
      
      // Auth module
      { name: 'auth.manage', description: 'Manage auth settings', module: 'auth', action: 'manage' },
      
      // Roles module
      { name: 'roles.read', description: 'Read roles', module: 'roles', action: 'read' },
      { name: 'roles.create', description: 'Create roles', module: 'roles', action: 'create' },
      { name: 'roles.update', description: 'Update roles', module: 'roles', action: 'update' },
      { name: 'roles.delete', description: 'Delete roles', module: 'roles', action: 'delete' },
      
      // Products module
      { name: 'products.read', description: 'Read products', module: 'products', action: 'read' },
      { name: 'products.create', description: 'Create products', module: 'products', action: 'create' },
      { name: 'products.update', description: 'Update products', module: 'products', action: 'update' },
      { name: 'products.delete', description: 'Delete products', module: 'products', action: 'delete' },
      
      // Orders module
      { name: 'orders.read', description: 'Read orders', module: 'orders', action: 'read' },
      { name: 'orders.create', description: 'Create orders', module: 'orders', action: 'create' },
      { name: 'orders.update', description: 'Update orders', module: 'orders', action: 'update' },
      { name: 'orders.delete', description: 'Delete orders', module: 'orders', action: 'delete' },
      
      // Categories module
      { name: 'categories.read', description: 'Read categories', module: 'categories', action: 'read' },
      { name: 'categories.create', description: 'Create categories', module: 'categories', action: 'create' },
      { name: 'categories.update', description: 'Update categories', module: 'categories', action: 'update' },
      { name: 'categories.delete', description: 'Delete categories', module: 'categories', action: 'delete' },
    ];

    const permissions = [] as Permission[];
    for (const data of permissionData) {
      let permission = await this.permissionRepository.findOne({ where: { name: data.name } });
      if (!permission) {
        permission = this.permissionRepository.create(data);
        permission = await this.permissionRepository.save(permission);
        console.log(`✅ Permission created: ${data.name}`);
      } else {
        console.log(`ℹ️ Permission already exists: ${data.name}`);
      }
      permissions.push(permission);
    }

    return permissions;
  }

  private async createRoles(permissions: Permission[]) {
    // 1. ADMIN role - All permits
    await this.createOrUpdateRole(
      'admin',
      'Administrator with full access to all system features',
      permissions // All permits
    );

    // 2. CUSTOMER role - Basic purchasing permits
    const customerPermissions = permissions.filter(p => 
      p.module === 'auth' ||
      p.name === 'products.read' ||
      p.name === 'orders.read' ||
      p.name === 'orders.create' ||
      p.name === 'orders.update' || // To update your own orders
      p.name === 'categories.read' ||
      p.name === 'users.read' ||
      p.name === 'users.update' // To update your own profile
    );
    
    await this.createOrUpdateRole(
      'customer',
      'Regular customer who can browse products and place orders',
      customerPermissions
    );
  }

  private async createOrUpdateRole(
    roleName: string, 
    description: string, 
    permissions: Permission[]
  ) {
    let role = await this.roleRepository.findOne({ 
      where: { name: roleName },
      relations: ['permissions']
    });
    
    if (!role) {
      // Create a new role
      role = this.roleRepository.create({
        name: roleName,
        description,
        permissions,
      });
      role = await this.roleRepository.save(role);
      console.log(`✅ ${roleName} role created with ${permissions.length} permissions`);
    } else {
      // Update existing role
      role.description = description;
      role.permissions = permissions;
      role = await this.roleRepository.save(role);
      console.log(`✅ ${roleName} role updated with ${permissions.length} permissions`);
    }
    
    return role;
  }
}

