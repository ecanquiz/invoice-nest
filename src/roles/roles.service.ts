import { Injectable, NotFoundException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Role } from './entities/role.entity';
import { Permission } from '../permissions/entities/permission.entity';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
  ) {}

  async create(createRoleDto: CreateRoleDto): Promise<Role> {
    try {
      // Verificar si el rol ya existe
      const existingRole = await this.roleRepository.findOne({
        where: { name: createRoleDto.name }
      });

      if (existingRole) {
        throw new ConflictException(`Role with name '${createRoleDto.name}' already exists`);
      }

      // Obtener permisos si se especificaron
      let permissions: Permission[] = [];
      if (createRoleDto.permissionIds && createRoleDto.permissionIds.length > 0) {
        permissions = await this.permissionRepository.find({
          where: { id: In(createRoleDto.permissionIds) }
        });
      }

      // Crear el rol
      const role = this.roleRepository.create({
        ...createRoleDto,
        permissions
      });

      return await this.roleRepository.save(role);
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException('Could not create role');
    }
  }

  async findAll(): Promise<Role[]> {
    return this.roleRepository.find({
      relations: ['permissions'],
      where: { isActive: true }
    });
  }

  async findOne(id: string): Promise<Role> {
    const role = await this.roleRepository.findOne({
      where: { id, isActive: true },
      relations: ['permissions']
    });

    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    return role;
  }

  async findByName(name: string): Promise<Role> {
    const role = await this.roleRepository.findOne({
      where: { name, isActive: true },
      relations: ['permissions']
    });

    if (!role) {
      throw new NotFoundException(`Role with name '${name}' not found`);
    }

    return role;
  }

  async update(id: string, updateRoleDto: UpdateRoleDto): Promise<Role> {
    try {
      const role = await this.findOne(id);

      // Verificar si el nuevo nombre ya existe (si se está cambiando)
      if (updateRoleDto.name && updateRoleDto.name !== role.name) {
        const existingRole = await this.roleRepository.findOne({
          where: { name: updateRoleDto.name }
        });

        if (existingRole) {
          throw new ConflictException(`Role with name '${updateRoleDto.name}' already exists`);
        }
      }

      // Actualizar permisos si se especificaron
      if (updateRoleDto.permissionIds) {
        const permissions = await this.permissionRepository.find({
          where: { id: In(updateRoleDto.permissionIds) }
        });
        role.permissions = permissions;
      }

      // Actualizar otros campos
      Object.assign(role, updateRoleDto);

      return await this.roleRepository.save(role);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException('Could not update role');
    }
  }

  async remove(id: string): Promise<void> {
    try {
      const role = await this.findOne(id);
      
      // Soft delete: marcar como inactivo en lugar de eliminar
      role.isActive = false;
      
      await this.roleRepository.save(role);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Could not delete role');
    }
  }

  async addPermissionsToRole(roleId: string, permissionIds: string[]): Promise<Role> {
    try {
      const role = await this.findOne(roleId);
      const permissions = await this.permissionRepository.find({
        where: { id: In(permissionIds) }
      });

      // Agregar nuevos permisos (evitando duplicados)
      const existingPermissionIds = role.permissions.map(p => p.id);
      const newPermissions = permissions.filter(p => !existingPermissionIds.includes(p.id));
      
      role.permissions = [...role.permissions, ...newPermissions];

      return await this.roleRepository.save(role);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Could not add permissions to role');
    }
  }

  async removePermissionsFromRole(roleId: string, permissionIds: string[]): Promise<Role> {
    try {
      const role = await this.findOne(roleId);
      
      // Filtrar los permisos a remover
      role.permissions = role.permissions.filter(
        permission => !permissionIds.includes(permission.id)
      );

      return await this.roleRepository.save(role);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Could not remove permissions from role');
    }
  }
}