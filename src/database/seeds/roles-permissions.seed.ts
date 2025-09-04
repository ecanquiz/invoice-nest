import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../../roles/entities/role.entity';
import { Permission } from '../../permissions/entities/permission.entity';

@Injectable()
export class RolesPermissionsSeed {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
  ) {}

  async seed() {
    // Crear permisos básicos
    const permissions = await this.createPermissions();
    
    // Crear roles básicos
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
      
      // Puedes agregar más módulos según necesites
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
    const adminRole = await this.roleRepository.findOne({ where: { name: 'admin' } });
    if (!adminRole) {
      const admin = this.roleRepository.create({
        name: 'admin',
        description: 'Administrator with full access',
        permissions: permissions, // Todos los permisos
      });
      await this.roleRepository.save(admin);
    }

    const userRole = await this.roleRepository.findOne({ where: { name: 'user' } });
    if (!userRole) {
      const user = this.roleRepository.create({
        name: 'user',
        description: 'Regular user with basic access',
        permissions: permissions.filter(p => p.module === 'auth'), // Solo permisos de auth
      });
      await this.roleRepository.save(user);
    }
  }
}