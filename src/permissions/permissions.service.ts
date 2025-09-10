import { Injectable, NotFoundException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission } from './entities/permission.entity';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
  ) {}

  async create(createPermissionDto: CreatePermissionDto): Promise<Permission> {
    try {
      // Verificar si el permiso ya existe
      const existingPermission = await this.permissionRepository.findOne({
        where: { name: createPermissionDto.name }
      });

      if (existingPermission) {
        throw new ConflictException(`Permission with name '${createPermissionDto.name}' already exists`);
      }

      const permission = this.permissionRepository.create(createPermissionDto);
      return await this.permissionRepository.save(permission);
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException('Could not create permission');
    }
  }

  async findAll(): Promise<Permission[]> {
    return this.permissionRepository.find({
      order: { name: 'ASC' }
    });
  }

  async findOne(id: string): Promise<Permission> {
    const permission = await this.permissionRepository.findOne({ where: { id } });

    if (!permission) {
      throw new NotFoundException(`Permission with ID ${id} not found`);
    }

    return permission;
  }

  async findByName(name: string): Promise<Permission> {
    const permission = await this.permissionRepository.findOne({ where: { name } });

    if (!permission) {
      throw new NotFoundException(`Permission with name '${name}' not found`);
    }

    return permission;
  }

  async findByModule(module: string): Promise<Permission[]> {
    return this.permissionRepository.find({ where: { module } });
  }

  async update(id: string, updatePermissionDto: UpdatePermissionDto): Promise<Permission> {
    try {
      const permission = await this.findOne(id);

      // Verificar si el nuevo nombre ya existe (si se está cambiando)
      if (updatePermissionDto.name && updatePermissionDto.name !== permission.name) {
        const existingPermission = await this.permissionRepository.findOne({
          where: { name: updatePermissionDto.name }
        });

        if (existingPermission) {
          throw new ConflictException(`Permission with name '${updatePermissionDto.name}' already exists`);
        }
      }

      Object.assign(permission, updatePermissionDto);
      return await this.permissionRepository.save(permission);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException('Could not update permission');
    }
  }

  async remove(id: string): Promise<void> {
    try {
      const permission = await this.findOne(id);
      await this.permissionRepository.remove(permission);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Could not delete permission');
    }
  }
}
