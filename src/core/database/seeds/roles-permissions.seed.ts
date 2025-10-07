import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '@features/iam/roles/entities/role.entity';
import { Permission } from '@features/iam/permissions/entities/permission.entity';

@Injectable()
export class RolesPermissionsSeed implements OnModuleInit {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
  ) {}

  async onModuleInit() {
    await this.seed();
  }

  async seed() {
    // Create basic permissions
    const permissions = await this.createPermissions();
    
    // Create basic roles
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
      
      // Products module (para merchants)
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
    // 1. Rol ADMIN - Todos los permisos
    await this.createOrUpdateRole(
      'admin',
      'Administrator with full access to all system features',
      permissions // Todos los permisos
    );

    // 2. Rol MERCHANT - Permisos para gestionar productos y órdenes
    const merchantPermissions = permissions.filter(p => 
      p.module === 'auth' || 
      p.module === 'products' || 
      p.module === 'orders' ||
      p.module === 'categories' ||
      p.name === 'users.read' || 
      p.name === 'users.update' // Puede actualizar su propio perfil
    );
    
    await this.createOrUpdateRole(
      'merchant',
      'Business user who can manage products, orders, and categories',
      merchantPermissions
    );

    // 3. Rol CUSTOMER - Permisos básicos para comprar
    const customerPermissions = permissions.filter(p => 
      p.module === 'auth' ||
      p.name === 'products.read' ||
      p.name === 'orders.read' ||
      p.name === 'orders.create' ||
      p.name === 'orders.update' || // Para actualizar sus propias órdenes
      p.name === 'categories.read' ||
      p.name === 'users.read' ||
      p.name === 'users.update' // Para actualizar su propio perfil
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
      // Crear nuevo rol
      role = this.roleRepository.create({
        name: roleName,
        description,
        permissions,
      });
      role = await this.roleRepository.save(role);
      console.log(`✅ ${roleName} role created with ${permissions.length} permissions`);
    } else {
      // Actualizar rol existente
      role.description = description;
      role.permissions = permissions;
      role = await this.roleRepository.save(role);
      console.log(`✅ ${roleName} role updated with ${permissions.length} permissions`);
    }
    
    return role;
  }
}

