import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../../roles/entities/role.entity';
import { Permission } from '../../permissions/entities/permission.entity';

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
      
      // You can add more modules as needed
      { name: 'roles.read',   description: 'Read roles', module: 'roles', action: 'read' },
      { name: 'roles.create', description: 'Create roles', module: 'roles', action: 'create' },
      { name: 'roles.update', description: 'Update roles', module: 'roles', action: 'update' },
      { name: 'roles.delete', description: 'Delete roles', module: 'roles', action: 'delete' },
    ];

    const permissions = [] as Permission[];
    for (const data of permissionData) {
      let permission = await this.permissionRepository.findOne({ where: { name: data.name } });
      if (!permission) {
        permission = this.permissionRepository.create(data);
        permission = await this.permissionRepository.save(permission);
      }
      permissions.push(permission);
    }

    return permissions;
  }

  private async createRoles(permissions: Permission[]) {
    // 1. Para el rol ADMIN - crear o actualizar
    let adminRole = await this.roleRepository.findOne({ 
      where: { name: 'admin' },
      relations: ['permissions'] // ← Importante: cargar relaciones existentes
    });
    
    if (!adminRole) {
      // Crear nuevo rol admin
      const admin = this.roleRepository.create({
        name: 'admin',
        description: 'Administrator with full access',
        permissions: permissions, // Todos los permisos
      });
      adminRole = await this.roleRepository.save(admin);
      console.log('✅ Admin role created with all permissions');
    } else {
      // Actualizar rol admin existente con TODOS los permisos
      adminRole.permissions = permissions;
      adminRole = await this.roleRepository.save(adminRole);
      console.log('✅ Admin role updated with all permissions');
    }

    // 2. Para el rol USER - crear o actualizar
    let userRole = await this.roleRepository.findOne({ 
      where: { name: 'user' },
      relations: ['permissions']
    });
    
    const authPermissions = permissions.filter(p => p.module === 'auth');
    
    if (!userRole) {
      // Crear nuevo rol user
      const user = this.roleRepository.create({
        name: 'user',
        description: 'Regular user with basic access',
        permissions: authPermissions,
      });
      await this.roleRepository.save(user);
      console.log('✅ User role created with auth permissions');
    } else {
      // Actualizar rol user existente
      userRole.permissions = authPermissions;
      await this.roleRepository.save(userRole);
      console.log('✅ User role updated with auth permissions');
    }
  }
}