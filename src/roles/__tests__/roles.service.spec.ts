import { describe, beforeEach, expect, it, vi } from 'vitest';
import { NotFoundException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { In } from 'typeorm';
import { RolesService } from '../roles.service';
import { Role } from '../entities/role.entity';
import { Permission } from '../../permissions/entities/permission.entity';
import { CreateRoleDto } from '../dto/create-role.dto';
import { UpdateRoleDto } from '../dto/update-role.dto';


describe('RolesService', () => {
  let service: RolesService;

  const mockRoleRepository = {
    find: vi.fn(),
    findOne: vi.fn(),
    create: vi.fn(),
    save: vi.fn(),
    softDelete: vi.fn(),
    restore: vi.fn(),
  };

  const mockPermissionRepository = {
    find: vi.fn(),
    findOne: vi.fn(),
  };

  const mockPermission: Permission = {
    id: 'permission-1',
    name: 'users.read',
    description: 'Read users',
    module: 'users',
    action: 'read',
    createdAt: new Date(),
    updatedAt: new Date(),
    roles: [],
  };

  const mockPermission2: Permission = {
    id: 'permission-2',
    name: 'users.create',
    description: 'Create users',
    module: 'users',
    action: 'create',
    createdAt: new Date(),
    updatedAt: new Date(),
    roles: [],
  };

  const mockPermission3: Permission = {
    id: 'permission-3',
    name: 'users.update',
    description: 'Update users',
    module: 'users',
    action: 'update',
    createdAt: new Date(),
    updatedAt: new Date(),
    roles: [],
  };

  const mockPermission4: Permission = {
    id: 'permission-4',
    name: 'users.delete',
    description: 'Delete users',
    module: 'users',
    action: 'delete',
    createdAt: new Date(),
    updatedAt: new Date(),
    roles: [],
  };

  const mockRole: Role = {
    id: 'role-1',
    name: 'admin',
    description: 'Administrator role',
    isActive: true,
    permissions: [mockPermission],
    users: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockInactiveRole: Role = {
    ...mockRole,
    id: 'role-2',
    name: 'inactive-role',
    isActive: false,
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesService,
        {
          provide: getRepositoryToken(Role),
          useValue: mockRoleRepository,
        },
        {
          provide: getRepositoryToken(Permission),
          useValue: mockPermissionRepository,
        },
      ],
    }).compile();

    service = module.get<RolesService>(RolesService);
  });

  describe('findAll', () => {
    it('should return an array of active roles with permissions', async () => {
      const mockRoles = [mockRole];
      mockRoleRepository.find.mockResolvedValue(mockRoles);

      const result = await service.findAll();

      expect(mockRoleRepository.find).toHaveBeenCalledWith({
        relations: ['permissions'],
        where: { isActive: true },
        order: { name: 'ASC' },
      });
      expect(result).toEqual(mockRoles);
      expect(result.length).toBe(1);
      expect(result[0].permissions).toBeDefined();
    });

    it('should return empty array when no active roles exist', async () => {
      mockRoleRepository.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(mockRoleRepository.find).toHaveBeenCalledWith({
        relations: ['permissions'],
        where: { isActive: true },
        order: { name: 'ASC' },
      });
      expect(result).toEqual([]);
      expect(result.length).toBe(0);
    });

    it('should only return active roles', async () => {
      const activeRoles = [mockRole];
      mockRoleRepository.find.mockResolvedValue(activeRoles);

      const result = await service.findAll();

      expect(result).toEqual(activeRoles);
      expect(result.every(role => role.isActive)).toBe(true);
    });

    it('should include permissions relation', async () => {
      const roleWithPermissions = {
        ...mockRole,
        permissions: [mockPermission],
      };
      mockRoleRepository.find.mockResolvedValue([roleWithPermissions]);

      const result = await service.findAll();

      expect(result[0].permissions).toBeDefined();
      expect(result[0].permissions.length).toBe(1);
      expect(result[0].permissions[0].name).toBe('users.read');
    });

    it('should order roles by name ascending', async () => {
      const roles = [
        { ...mockRole, id: '1', name: 'admin' },
        { ...mockRole, id: '2', name: 'moderator' },
        { ...mockRole, id: '3', name: 'user' },
      ];
      mockRoleRepository.find.mockResolvedValue(roles);

      const result = await service.findAll();

      expect(mockRoleRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          order: { name: 'ASC' },
        })
      );
    });

    it('should handle repository errors', async () => {
      const error = new Error('Database error');
      mockRoleRepository.find.mockRejectedValue(error);

      await expect(service.findAll()).rejects.toThrow('Database error');
      expect(mockRoleRepository.find).toHaveBeenCalledTimes(1);
    });

    it('should return roles with correct structure', async () => {
      const roles = [mockRole];
      mockRoleRepository.find.mockResolvedValue(roles);

      const result = await service.findAll();

      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('name');
      expect(result[0]).toHaveProperty('description');
      expect(result[0]).toHaveProperty('isActive');
      expect(result[0]).toHaveProperty('permissions');
      expect(result[0]).toHaveProperty('createdAt');
      expect(result[0]).toHaveProperty('updatedAt');
    });

    it('should not include inactive roles', async () => {
      const mixedRoles = [mockRole, mockInactiveRole];
      const onlyActiveRoles = [mockRole];
      mockRoleRepository.find.mockResolvedValue(onlyActiveRoles);

      const result = await service.findAll();

      expect(result).toEqual(onlyActiveRoles);
      expect(result.some(role => !role.isActive)).toBe(false);
    });
  });

  describe('findOne', () => {
    it('should return a role when found', async () => {
      const roleId = 'role-1';
      mockRoleRepository.findOne.mockResolvedValue(mockRole);

      const result = await service.findOne(roleId);

      expect(mockRoleRepository.findOne).toHaveBeenCalledWith({
        where: { id: roleId, isActive: true },
        relations: ['permissions']
      });
      expect(result).toEqual(mockRole);
      expect(result.id).toBe(roleId);
    });

    it('should include permissions when role is found', async () => {
      const roleId = 'role-1';
      const roleWithPermissions = {
        ...mockRole,
        permissions: [mockPermission]
      };
      mockRoleRepository.findOne.mockResolvedValue(roleWithPermissions);

      const result = await service.findOne(roleId);

      expect(result.permissions).toBeDefined();
      expect(result.permissions.length).toBe(1);
      expect(result.permissions[0].name).toBe('users.read');
    });

    it('should throw NotFoundException when role does not exist', async () => {
      const roleId = 'non-existent-id';
      mockRoleRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(roleId)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(roleId)).rejects.toThrow(
        `Role with ID ${roleId} not found`
      );
      expect(mockRoleRepository.findOne).toHaveBeenCalledWith({
        where: { id: roleId, isActive: true },
        relations: ['permissions']
      });
    });

    it('should throw NotFoundException when role is inactive', async () => {
      const roleId = 'inactive-role-id';      
      mockRoleRepository.findOne.mockResolvedValue(null); // Inactive roles are filtered by isActive: true

      await expect(service.findOne(roleId)).rejects.toThrow(NotFoundException);
      expect(mockRoleRepository.findOne).toHaveBeenCalledWith({
        where: { id: roleId, isActive: true },
        relations: ['permissions']
      });
    });

    it('should handle repository errors', async () => {
      const roleId = 'role-1';
      const error = new Error('Database connection failed');
      mockRoleRepository.findOne.mockRejectedValue(error);

      await expect(service.findOne(roleId)).rejects.toThrow('Database connection failed');
      expect(mockRoleRepository.findOne).toHaveBeenCalledTimes(1);
    });

    it('should search for active roles only', async () => {
      const roleId = 'role-1';
      mockRoleRepository.findOne.mockResolvedValue(mockRole);

      await service.findOne(roleId);

      expect(mockRoleRepository.findOne).toHaveBeenCalledWith({
        where: { id: roleId, isActive: true }, // ← isActive: true is important
        relations: ['permissions']
      });
    });

    it('should return role with correct structure', async () => {
      const roleId = 'role-1';
      mockRoleRepository.findOne.mockResolvedValue(mockRole);

      const result = await service.findOne(roleId);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('description');
      expect(result).toHaveProperty('isActive');
      expect(result).toHaveProperty('permissions');
      expect(result).toHaveProperty('createdAt');
      expect(result).toHaveProperty('updatedAt');
    });

    it('should find role by different IDs', async () => {
      const roleId = 'different-id';
      const differentRole = { ...mockRole, id: roleId, name: 'moderator' };
      mockRoleRepository.findOne.mockResolvedValue(differentRole);

      const result = await service.findOne(roleId);

      expect(result.id).toBe(roleId);
      expect(result.name).toBe('moderator');
    });

    it('should handle empty permissions array', async () => {
      const roleId = 'role-1';
      const roleWithoutPermissions = { ...mockRole, permissions: [] };
      mockRoleRepository.findOne.mockResolvedValue(roleWithoutPermissions);

      const result = await service.findOne(roleId);

      expect(result.permissions).toEqual([]);
      expect(result.permissions.length).toBe(0);
    });
  });

  describe('findByName', () => {
    it('should return a role when found by name', async () => {
      const roleName = 'admin';
      mockRoleRepository.findOne.mockResolvedValue(mockRole);

      const result = await service.findByName(roleName);

      expect(mockRoleRepository.findOne).toHaveBeenCalledWith({
        where: { name: roleName, isActive: true },
        relations: ['permissions']
      });
      expect(result).toEqual(mockRole);
      expect(result.name).toBe(roleName);
    });

    it('should include permissions when role is found by name', async () => {
      const roleName = 'admin';
      const roleWithPermissions = {
        ...mockRole,
        permissions: [mockPermission]
      };
      mockRoleRepository.findOne.mockResolvedValue(roleWithPermissions);

      const result = await service.findByName(roleName);

      expect(result.permissions).toBeDefined();
      expect(result.permissions.length).toBe(1);
      expect(result.permissions[0].name).toBe('users.read');
    });

    it('should throw NotFoundException when role does not exist by name', async () => {
      const roleName = 'non-existent-role';
      mockRoleRepository.findOne.mockResolvedValue(null);

      await expect(service.findByName(roleName)).rejects.toThrow(NotFoundException);
      await expect(service.findByName(roleName)).rejects.toThrow(
        `Role with name '${roleName}' not found`
      );
    });

    it('should throw NotFoundException when role is inactive', async () => {
      const roleName = 'inactive-role';
      mockRoleRepository.findOne.mockResolvedValue(null);

      await expect(service.findByName(roleName)).rejects.toThrow(NotFoundException);
    });

    it('should handle repository errors', async () => {
      const roleName = 'admin';
      const error = new Error('Database error');
      mockRoleRepository.findOne.mockRejectedValue(error);

      await expect(service.findByName(roleName)).rejects.toThrow('Database error');
    });

    it('should search for active roles only by name', async () => {
      const roleName = 'admin';
      mockRoleRepository.findOne.mockResolvedValue(mockRole);

      await service.findByName(roleName);

      expect(mockRoleRepository.findOne).toHaveBeenCalledWith({
        where: { name: roleName, isActive: true },
        relations: ['permissions']
      });
    });

    it('should be case sensitive or insensitive based on database configuration', async () => {
      const roleName = 'Admin'; // Different case
      mockRoleRepository.findOne.mockResolvedValue(mockRole);

      const result = await service.findByName(roleName);

      expect(result.name).toBe('admin'); // Should match regardless of case
    });
  });

  describe('create', () => {
    const createRoleDto: CreateRoleDto = {
      name: 'new-role',
      description: 'A new role for testing',
      permissionIds: ['permission-1', 'permission-2']
    };

    const createRoleDtoWithoutPermissions: CreateRoleDto = {
      name: 'new-role',
      description: 'A new role without permissions',
      permissionIds: []
    };

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should create a new role successfully with permissions', async () => {
      mockRoleRepository.findOne.mockResolvedValue(null); // No existing role
      mockPermissionRepository.find.mockResolvedValue([mockPermission]); // Permissions found
      mockRoleRepository.create.mockReturnValue(mockRole);
      mockRoleRepository.save.mockResolvedValue(mockRole);

      const result = await service.create(createRoleDto);

      expect(mockRoleRepository.findOne).toHaveBeenCalledWith({
        where: { name: createRoleDto.name }
      });
      expect(mockPermissionRepository.find).toHaveBeenCalledWith({
        where: { id: In(createRoleDto.permissionIds as any) }
      });
      expect(mockRoleRepository.create).toHaveBeenCalledWith({
        ...createRoleDto,
        permissions: [mockPermission]
      });
      expect(mockRoleRepository.save).toHaveBeenCalledWith(mockRole);
      expect(result).toEqual(mockRole);
    });

    it('should create a new role without permissions when permissionIds is empty', async () => {
      mockRoleRepository.findOne.mockResolvedValue(null);
      mockRoleRepository.create.mockReturnValue(mockRole);
      mockRoleRepository.save.mockResolvedValue(mockRole);

      const result = await service.create(createRoleDtoWithoutPermissions);

      expect(mockPermissionRepository.find).not.toHaveBeenCalled();
      expect(mockRoleRepository.create).toHaveBeenCalledWith({
        ...createRoleDtoWithoutPermissions,
        permissions: []
      });
      expect(result).toEqual(mockRole);
    });

    it('should create a new role without permissions when permissionIds is undefined', async () => {
      const dtoWithoutPermissionIds = { name: 'new-role', description: 'Test' };
      mockRoleRepository.findOne.mockResolvedValue(null);
      mockRoleRepository.create.mockReturnValue(mockRole);
      mockRoleRepository.save.mockResolvedValue(mockRole);

      const result = await service.create(dtoWithoutPermissionIds as CreateRoleDto);

      expect(mockPermissionRepository.find).not.toHaveBeenCalled();
      expect(mockRoleRepository.create).toHaveBeenCalledWith({
        ...dtoWithoutPermissionIds,
        permissions: []
      });
      expect(result).toEqual(mockRole);
    });

    it('should throw ConflictException when role name already exists', async () => {
      mockRoleRepository.findOne.mockResolvedValue(mockRole); // Existing role found

      await expect(service.create(createRoleDto)).rejects.toThrow(ConflictException);
      await expect(service.create(createRoleDto)).rejects.toThrow(
        `Role with name '${createRoleDto.name}' already exists`
      );
      expect(mockRoleRepository.findOne).toHaveBeenCalledWith({
        where: { name: createRoleDto.name }
      });
      expect(mockPermissionRepository.find).not.toHaveBeenCalled();
      expect(mockRoleRepository.create).not.toHaveBeenCalled();
    });

    it('should handle case where some permissions are not found', async () => {
      const foundPermissions = [mockPermission]; // Only one permission found
      mockRoleRepository.findOne.mockResolvedValue(null);
      mockPermissionRepository.find.mockResolvedValue(foundPermissions);
      mockRoleRepository.create.mockReturnValue(mockRole);
      mockRoleRepository.save.mockResolvedValue(mockRole);

      const result = await service.create(createRoleDto);

      expect(mockPermissionRepository.find).toHaveBeenCalledWith({
        where: { id: In(createRoleDto.permissionIds as any) }
      });
      expect(mockRoleRepository.create).toHaveBeenCalledWith({
        ...createRoleDto,
        permissions: foundPermissions // Only the found permissions
      });
      expect(result).toEqual(mockRole);
    });

    it('should handle database errors during role creation', async () => {
      const dbError = new Error('Database save failed');
      mockRoleRepository.findOne.mockResolvedValue(null);
      mockPermissionRepository.find.mockResolvedValue([mockPermission]);
      mockRoleRepository.create.mockReturnValue(mockRole);
      mockRoleRepository.save.mockRejectedValue(dbError);

      await expect(service.create(createRoleDto)).rejects.toThrow(InternalServerErrorException);
      await expect(service.create(createRoleDto)).rejects.toThrow('Could not create role');
    });

    it('should handle database errors during permission lookup', async () => {
      const dbError = new Error('Database permission lookup failed');
      mockRoleRepository.findOne.mockResolvedValue(null);
      mockPermissionRepository.find.mockRejectedValue(dbError);

      await expect(service.create(createRoleDto)).rejects.toThrow(InternalServerErrorException);
      await expect(service.create(createRoleDto)).rejects.toThrow('Could not create role');
    });

    it('should handle database errors during role existence check', async () => {
      const dbError = new Error('Database lookup failed');
      mockRoleRepository.findOne.mockRejectedValue(dbError);

      await expect(service.create(createRoleDto)).rejects.toThrow(InternalServerErrorException);
      await expect(service.create(createRoleDto)).rejects.toThrow('Could not create role');
    });

    it('should propagate ConflictException without wrapping it', async () => {
      mockRoleRepository.findOne.mockResolvedValue(mockRole); // Existing role

      await expect(service.create(createRoleDto)).rejects.toThrow(ConflictException);
      await expect(service.create(createRoleDto)).rejects.not.toThrow(InternalServerErrorException);
    });

    it('should create role with correct structure and relationships', async () => {
      const expectedRole = {
        ...mockRole,
        name: createRoleDto.name,
        description: createRoleDto.description,
        permissions: [mockPermission]
      };

      mockRoleRepository.findOne.mockResolvedValue(null);
      mockPermissionRepository.find.mockResolvedValue([mockPermission]);
      mockRoleRepository.create.mockReturnValue(expectedRole);
      mockRoleRepository.save.mockResolvedValue(expectedRole);

      const result = await service.create(createRoleDto);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('name', createRoleDto.name);
      expect(result).toHaveProperty('description', createRoleDto.description);
      expect(result).toHaveProperty('permissions');
      expect(result.permissions[0]).toHaveProperty('name', 'users.read');
    });
  });

  describe('update', () => {
    const roleId = 'role-1';
    const updateRoleDto: UpdateRoleDto = {
      name: 'updated-role',
      description: 'Updated description',
      permissionIds: ['permission-1', 'permission-2']
    };

    const updateRoleDtoWithoutName: UpdateRoleDto = {
      description: 'Updated description only'
    };

    const updateRoleDtoWithSameName: UpdateRoleDto = {
      name: 'admin', // Same as existing role
      description: 'Updated description'
    };

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should update a role successfully with all fields', async () => {
      const existingRole = { ...mockRole, name: 'old-name' };
      const updatedRole = { ...existingRole, ...updateRoleDto, permissions: [mockPermission] };
      
      vi.spyOn(service, 'findOne').mockResolvedValue(existingRole);
      mockRoleRepository.findOne.mockResolvedValue(null); // No conflict with name
      mockPermissionRepository.find.mockResolvedValue([mockPermission]);
      mockRoleRepository.save.mockResolvedValue(updatedRole);

      const result = await service.update(roleId, updateRoleDto);

      expect(service.findOne).toHaveBeenCalledWith(roleId);
      expect(mockRoleRepository.findOne).toHaveBeenCalledWith({
        where: { name: updateRoleDto.name }
      });
      expect(mockPermissionRepository.find).toHaveBeenCalledWith({
        where: { id: In(updateRoleDto.permissionIds as any) }
      });
      expect(mockRoleRepository.save).toHaveBeenCalledWith(expect.objectContaining(updateRoleDto));
      expect(result).toEqual(updatedRole);
    });

    it('should update a role without changing the name', async () => {
      const existingRole = { ...mockRole, name: 'admin' };
      const updatedRole = { ...existingRole, description: updateRoleDtoWithoutName.description };
      
      vi.spyOn(service, 'findOne').mockResolvedValue(existingRole);
      mockRoleRepository.save.mockResolvedValue(updatedRole);

      const result = await service.update(roleId, updateRoleDtoWithoutName);

      expect(service.findOne).toHaveBeenCalledWith(roleId);
      expect(mockRoleRepository.findOne).not.toHaveBeenCalled(); // No name check needed
      expect(mockPermissionRepository.find).not.toHaveBeenCalled(); // No permission changes
      expect(mockRoleRepository.save).toHaveBeenCalledWith(updatedRole);
      expect(result.description).toBe(updateRoleDtoWithoutName.description);
    });

    it('should update a role with same name (no conflict check needed)', async () => {
      const existingRole = { ...mockRole, name: 'admin' };
      const updatedRole = { ...existingRole, ...updateRoleDtoWithSameName };
      
      vi.spyOn(service, 'findOne').mockResolvedValue(existingRole);
      mockRoleRepository.save.mockResolvedValue(updatedRole);

      const result = await service.update(roleId, updateRoleDtoWithSameName);

      expect(service.findOne).toHaveBeenCalledWith(roleId);
      expect(mockRoleRepository.findOne).not.toHaveBeenCalled(); // Same name, no check needed
      expect(result.name).toBe(updateRoleDtoWithSameName.name);
    });

    it('should throw ConflictException when new name already exists', async () => {
      const existingRole = { ...mockRole, name: 'old-name' };
      const conflictingRole = { ...mockRole, id: 'other-role', name: updateRoleDto.name };
      
      vi.spyOn(service, 'findOne').mockResolvedValue(existingRole);
      mockRoleRepository.findOne.mockResolvedValue(conflictingRole); // Conflict found

      await expect(service.update(roleId, updateRoleDto)).rejects.toThrow(ConflictException);
      await expect(service.update(roleId, updateRoleDto)).rejects.toThrow(
        `Role with name '${updateRoleDto.name}' already exists`
      );
      expect(mockRoleRepository.save).not.toHaveBeenCalled();
    });

    it('should update permissions when permissionIds are provided', async () => {
      const existingRole = { ...mockRole, permissions: [] };
      const updatedRole = { ...existingRole, permissions: [mockPermission] };
      const updateWithPermissions: UpdateRoleDto = {
        permissionIds: ['permission-1']
      };
      
      vi.spyOn(service, 'findOne').mockResolvedValue(existingRole);
      mockPermissionRepository.find.mockResolvedValue([mockPermission]);
      mockRoleRepository.save.mockResolvedValue(updatedRole);

      const result = await service.update(roleId, updateWithPermissions);

      expect(mockPermissionRepository.find).toHaveBeenCalledWith({
        where: { id: In(updateWithPermissions.permissionIds as any) }
      });
      expect(result.permissions).toEqual([mockPermission]);
    });

    it('should handle empty permissionIds array', async () => {
      const existingRole = { ...mockRole, permissions: [mockPermission] };
      const updatedRole = { ...existingRole, permissions: [] };
      const updateWithEmptyPermissions: UpdateRoleDto = {
        permissionIds: []
      };
      
      vi.spyOn(service, 'findOne').mockResolvedValue(existingRole);
      mockPermissionRepository.find.mockResolvedValue([]);
      mockRoleRepository.save.mockResolvedValue(updatedRole);

      const result = await service.update(roleId, updateWithEmptyPermissions);

      expect(result.permissions).toEqual([]);
    });

    it('should propagate NotFoundException from findOne', async () => {
      const notFoundError = new NotFoundException('Role not found');
      vi.spyOn(service, 'findOne').mockRejectedValue(notFoundError);

      await expect(service.update(roleId, updateRoleDto)).rejects.toThrow(NotFoundException);
      await expect(service.update(roleId, updateRoleDto)).rejects.toThrow('Role not found');
      expect(mockRoleRepository.save).not.toHaveBeenCalled();
    });

    it('should handle database errors during permission lookup', async () => {
      const dbError = new Error('Database permission lookup failed');

      const updateWithoutNameChange: UpdateRoleDto = {
        description: 'Updated description',
        permissionIds: ['permission-1', 'permission-2']
      };

      vi.spyOn(service, 'findOne').mockResolvedValue(mockRole);
      mockPermissionRepository.find.mockRejectedValue(dbError);

      await expect(service.update(roleId, updateWithoutNameChange)).rejects.toThrow(InternalServerErrorException);
      await expect(service.update(roleId, updateWithoutNameChange)).rejects.toThrow('Could not update role');
    });

    it('should handle database errors during role save', async () => {
      const dbError = new Error('Database save failed');
      vi.spyOn(service, 'findOne').mockResolvedValue(mockRole);
      mockRoleRepository.findOne.mockResolvedValue(null);
      mockPermissionRepository.find.mockResolvedValue([mockPermission]);
      mockRoleRepository.save.mockRejectedValue(dbError);

      await expect(service.update(roleId, updateRoleDto)).rejects.toThrow(InternalServerErrorException);
      await expect(service.update(roleId, updateRoleDto)).rejects.toThrow('Could not update role');
    });

    it('should handle database errors during name conflict check', async () => {
      const dbError = new Error('Database conflict check failed');
      vi.spyOn(service, 'findOne').mockResolvedValue(mockRole);
      mockRoleRepository.findOne.mockRejectedValue(dbError);

      await expect(service.update(roleId, updateRoleDto)).rejects.toThrow(InternalServerErrorException);
      await expect(service.update(roleId, updateRoleDto)).rejects.toThrow('Could not update role');
    });

    it('should update only specified fields using Object.assign', async () => {
      const existingRole = { ...mockRole, name: 'old-name', description: 'old-desc' };
      const partialUpdate: UpdateRoleDto = { description: 'new-desc' };
      const updatedRole = { ...existingRole, description: 'new-desc' };
      
      vi.spyOn(service, 'findOne').mockResolvedValue(existingRole);
      mockRoleRepository.save.mockResolvedValue(updatedRole);

      const result = await service.update(roleId, partialUpdate);

      expect(result.name).toBe('old-name'); // Should remain unchanged
      expect(result.description).toBe('new-desc'); // Should be updated
    });
  });

  describe('remove', () => {
    const roleId = 'role-1';

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should soft delete a role successfully by setting isActive to false', async () => {
      const activeRole = { ...mockRole, isActive: true };
      const deactivatedRole = { ...activeRole, isActive: false };
      
      vi.spyOn(service, 'findOne').mockResolvedValue(activeRole);
      mockRoleRepository.save.mockResolvedValue(deactivatedRole);

      await service.remove(roleId);

      expect(service.findOne).toHaveBeenCalledWith(roleId);
      expect(mockRoleRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ isActive: false })
      );
    });

    it('should propagate NotFoundException from findOne', async () => {
      const notFoundError = new NotFoundException('Role not found');
      vi.spyOn(service, 'findOne').mockRejectedValue(notFoundError);

      await expect(service.remove(roleId)).rejects.toThrow(NotFoundException);
      await expect(service.remove(roleId)).rejects.toThrow('Role not found');
      expect(mockRoleRepository.save).not.toHaveBeenCalled();
    });

    it('should handle database errors during role save', async () => {
      const dbError = new Error('Database save failed');
      vi.spyOn(service, 'findOne').mockResolvedValue(mockRole);
      mockRoleRepository.save.mockRejectedValue(dbError);

      await expect(service.remove(roleId)).rejects.toThrow(InternalServerErrorException);
      await expect(service.remove(roleId)).rejects.toThrow('Could not delete role');
    });

    it('should not throw error when deactivating already inactive role', async () => {
      const inactiveRole = { ...mockRole, isActive: false };
      vi.spyOn(service, 'findOne').mockResolvedValue(inactiveRole);
      mockRoleRepository.save.mockResolvedValue(inactiveRole);

      await expect(service.remove(roleId)).resolves.not.toThrow();
      expect(mockRoleRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ isActive: false })
      );
    });

    it('should preserve other role properties when deactivating', async () => {
      const roleWithDetails = {
        ...mockRole,
        name: 'test-role',
        description: 'Test role description',
        permissions: [mockPermission],
        isActive: true
      };
      const deactivatedRole = { ...roleWithDetails, isActive: false };
      
      vi.spyOn(service, 'findOne').mockResolvedValue(roleWithDetails);
      mockRoleRepository.save.mockResolvedValue(deactivatedRole);

      await service.remove(roleId);

      expect(mockRoleRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: roleWithDetails.id,
          name: roleWithDetails.name,
          description: roleWithDetails.description,
          permissions: roleWithDetails.permissions,
          isActive: false // Only this should change
        })
      );
    });

    it('should call repository save with the modified role', async () => {
      const activeRole = { ...mockRole, isActive: true };
      vi.spyOn(service, 'findOne').mockResolvedValue(activeRole);
      mockRoleRepository.save.mockResolvedValue({ ...activeRole, isActive: false });

      await service.remove(roleId);

      expect(mockRoleRepository.save).toHaveBeenCalledTimes(1);
      const savedRole = mockRoleRepository.save.mock.calls[0][0];
      expect(savedRole.isActive).toBe(false);
    });

    it('should handle unexpected errors during the process', async () => {
      const unexpectedError = new Error('Unexpected error');
      vi.spyOn(service, 'findOne').mockRejectedValue(unexpectedError);

      await expect(service.remove(roleId)).rejects.toThrow(InternalServerErrorException);
      await expect(service.remove(roleId)).rejects.toThrow('Could not delete role');
    });

    it('should not modify other properties besides isActive', async () => {
      const originalRole = {
        ...mockRole,
        name: 'original-name',
        description: 'original-description',
        permissions: [mockPermission],
        isActive: true
      };
      vi.spyOn(service, 'findOne').mockResolvedValue(originalRole);
      mockRoleRepository.save.mockResolvedValue({ ...originalRole, isActive: false });

      await service.remove(roleId);

      const savedRole = mockRoleRepository.save.mock.calls[0][0];
      expect(savedRole.name).toBe(originalRole.name);
      expect(savedRole.description).toBe(originalRole.description);
      expect(savedRole.permissions).toEqual(originalRole.permissions);
      expect(savedRole.isActive).toBe(false); // Only this changed
    });
  });

  describe('addPermissionsToRole', () => {
    const roleId = 'role-1';
    const permissionIds = ['permission-1', 'permission-2'];
    const newPermissionIds = ['permission-3', 'permission-4'];

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should add new permissions to role successfully', async () => {
      const roleWithPermissions = { ...mockRole, permissions: [mockPermission] };
      const newPermissions = [mockPermission3, mockPermission4];
      const updatedRole = { ...roleWithPermissions, permissions: [...roleWithPermissions.permissions, ...newPermissions] };
      
      vi.spyOn(service, 'findOne').mockResolvedValue(roleWithPermissions);
      mockPermissionRepository.find.mockResolvedValue(newPermissions);
      mockRoleRepository.save.mockResolvedValue(updatedRole);

      const result = await service.addPermissionsToRole(roleId, newPermissionIds);

      expect(service.findOne).toHaveBeenCalledWith(roleId);
      expect(mockPermissionRepository.find).toHaveBeenCalledWith({
        where: { id: In(newPermissionIds) }
      });
      expect(mockRoleRepository.save).toHaveBeenCalledWith(updatedRole);
      expect(result.permissions).toHaveLength(3);
      expect(result.permissions.map(p => p.id)).toEqual(
        expect.arrayContaining(['permission-1', 'permission-3', 'permission-4'])
      );
    });

    it('should avoid duplicate permissions when adding', async () => {
      const roleWithPermissions = { ...mockRole, permissions: [mockPermission, mockPermission2] };
      const permissionsToAdd = [mockPermission2, mockPermission3]; // mockPermission2 is duplicate
      const updatedRole = { ...roleWithPermissions, permissions: [...roleWithPermissions.permissions, mockPermission3] };
      
      vi.spyOn(service, 'findOne').mockResolvedValue(roleWithPermissions);
      mockPermissionRepository.find.mockResolvedValue(permissionsToAdd);
      mockRoleRepository.save.mockResolvedValue(updatedRole);

      const result = await service.addPermissionsToRole(roleId, ['permission-2', 'permission-3']);

      expect(result.permissions).toHaveLength(3); // Should not add duplicate
      expect(result.permissions.map(p => p.id)).toEqual(
        expect.arrayContaining(['permission-1', 'permission-2', 'permission-3'])
      );
      // Verify permission-2 is not duplicated
      const permission2Count = result.permissions.filter(p => p.id === 'permission-2').length;
      expect(permission2Count).toBe(1);
    });

    it('should return role unchanged when no new permissions are found', async () => {
      const roleWithPermissions = { ...mockRole, permissions: [mockPermission, mockPermission2] };
      const duplicatePermissions = [mockPermission, mockPermission2]; // All duplicates
      
      vi.spyOn(service, 'findOne').mockResolvedValue(roleWithPermissions);
      mockPermissionRepository.find.mockResolvedValue(duplicatePermissions);
      mockRoleRepository.save.mockResolvedValue(roleWithPermissions);

      const result = await service.addPermissionsToRole(roleId, ['permission-1', 'permission-2']);

      expect(result.permissions).toHaveLength(2); // Unchanged
      expect(mockRoleRepository.save).toHaveBeenCalledWith(roleWithPermissions);
    });

    it('should handle empty permissionIds array', async () => {
      const roleWithPermissions = { ...mockRole, permissions: [mockPermission] };
      const updatedRole = { ...roleWithPermissions, permissions: [...roleWithPermissions.permissions] }; // Same permissions
      
      vi.spyOn(service, 'findOne').mockResolvedValue(roleWithPermissions);
      mockPermissionRepository.find.mockResolvedValue([]); // Empty array for empty permissionIds
      mockRoleRepository.save.mockResolvedValue(updatedRole);

      const result = await service.addPermissionsToRole(roleId, []);

      expect(mockPermissionRepository.find).toHaveBeenCalledWith({
          where: { id: In([]) } // Se llama con array vacío
      });
      expect(result.permissions).toHaveLength(1); // Permissions remain unchanged
      expect(result.permissions[0].id).toBe('permission-1');
    });

    it('should propagate NotFoundException from findOne', async () => {
      const notFoundError = new NotFoundException('Role not found');
      vi.spyOn(service, 'findOne').mockRejectedValue(notFoundError);

      await expect(service.addPermissionsToRole(roleId, permissionIds)).rejects.toThrow(NotFoundException);
      await expect(service.addPermissionsToRole(roleId, permissionIds)).rejects.toThrow('Role not found');
      expect(mockPermissionRepository.find).not.toHaveBeenCalled();
    });

    it('should handle database errors during permission lookup', async () => {
      const dbError = new Error('Database permission lookup failed');
      vi.spyOn(service, 'findOne').mockResolvedValue(mockRole);
      mockPermissionRepository.find.mockRejectedValue(dbError);

      await expect(service.addPermissionsToRole(roleId, permissionIds)).rejects.toThrow(InternalServerErrorException);
      await expect(service.addPermissionsToRole(roleId, permissionIds)).rejects.toThrow('Could not add permissions to role');
    });

    it('should handle database errors during role save', async () => {
      const dbError = new Error('Database save failed');
      vi.spyOn(service, 'findOne').mockResolvedValue(mockRole);
      mockPermissionRepository.find.mockResolvedValue([mockPermission3]);
      mockRoleRepository.save.mockRejectedValue(dbError);

      await expect(service.addPermissionsToRole(roleId, ['permission-3'])).rejects.toThrow(InternalServerErrorException);
      await expect(service.addPermissionsToRole(roleId, ['permission-3'])).rejects.toThrow('Could not add permissions to role');
    });

    it('should handle case where some permissions are not found in database', async () => {
      const roleWithPermissions = { ...mockRole, permissions: [mockPermission] };
      const foundPermissions = [mockPermission3]; // Only one permission found from the request
      const updatedRole = { ...roleWithPermissions, permissions: [...roleWithPermissions.permissions, ...foundPermissions] };
      
      vi.spyOn(service, 'findOne').mockResolvedValue(roleWithPermissions);
      mockPermissionRepository.find.mockResolvedValue(foundPermissions);
      mockRoleRepository.save.mockResolvedValue(updatedRole);

      const result = await service.addPermissionsToRole(roleId, ['permission-3', 'non-existent-permission']);

      expect(result.permissions).toHaveLength(2); // Only the found permission was added
      expect(result.permissions.map(p => p.id)).toEqual(
        expect.arrayContaining(['permission-1', 'permission-3'])
      );
    });

    it('should maintain existing permissions and add new ones', async () => {
      const roleWithPermissions = { ...mockRole, permissions: [mockPermission, mockPermission2] };
      const newPermissions = [mockPermission3];
      const updatedRole = { ...roleWithPermissions, permissions: [...roleWithPermissions.permissions, ...newPermissions] };
      
      vi.spyOn(service, 'findOne').mockResolvedValue(roleWithPermissions);
      mockPermissionRepository.find.mockResolvedValue(newPermissions);
      mockRoleRepository.save.mockResolvedValue(updatedRole);

      const result = await service.addPermissionsToRole(roleId, ['permission-3']);

      expect(result.permissions).toHaveLength(3);
      // Verify existing permissions are preserved
      expect(result.permissions).toEqual(
        expect.arrayContaining([mockPermission, mockPermission2, mockPermission3])
      );
    });
  });

  describe('removePermissionsFromRole', () => {
    const roleId = 'role-1';
    const permissionIdsToRemove = ['permission-2', 'permission-3'];

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should remove specified permissions from role successfully', async () => {
      const roleWithMultiplePermissions = { 
        ...mockRole, 
        permissions: [mockPermission, mockPermission2, mockPermission3] 
      };
      const updatedRole = { 
        ...roleWithMultiplePermissions, 
        permissions: [mockPermission] // permission-2 and permission-3 removed
      };
      
      vi.spyOn(service, 'findOne').mockResolvedValue(roleWithMultiplePermissions);
      mockRoleRepository.save.mockResolvedValue(updatedRole);

      const result = await service.removePermissionsFromRole(roleId, permissionIdsToRemove);

      expect(service.findOne).toHaveBeenCalledWith(roleId);
      expect(mockRoleRepository.save).toHaveBeenCalledWith(updatedRole);
      expect(result.permissions).toHaveLength(1);
      expect(result.permissions[0].id).toBe('permission-1');
    });

    it('should handle empty permissionIds array (no permissions to remove)', async () => {
      const roleWithPermissions = { ...mockRole, permissions: [mockPermission, mockPermission2] };
      
      vi.spyOn(service, 'findOne').mockResolvedValue(roleWithPermissions);
      mockRoleRepository.save.mockResolvedValue(roleWithPermissions);

      const result = await service.removePermissionsFromRole(roleId, []);

      expect(service.findOne).toHaveBeenCalledWith(roleId);
      expect(mockRoleRepository.save).toHaveBeenCalledWith(roleWithPermissions);
      expect(result.permissions).toHaveLength(2); // Unchanged
    });

    it('should handle permissionIds that do not exist in role permissions', async () => {
      const roleWithPermissions = { ...mockRole, permissions: [mockPermission] };
      const nonExistentPermissionIds = ['non-existent-1', 'non-existent-2'];
      
      vi.spyOn(service, 'findOne').mockResolvedValue(roleWithPermissions);
      mockRoleRepository.save.mockResolvedValue(roleWithPermissions);

      const result = await service.removePermissionsFromRole(roleId, nonExistentPermissionIds);

      expect(result.permissions).toHaveLength(1); // Unchanged
      expect(result.permissions[0].id).toBe('permission-1');
    });

    it('should remove some permissions and ignore non-existent ones', async () => {
      const roleWithPermissions = { 
        ...mockRole, 
        permissions: [mockPermission, mockPermission2, mockPermission3] 
      };
      const mixedPermissionIds = ['permission-2', 'non-existent-1']; // One exists, one doesn't
      const updatedRole = { 
        ...roleWithPermissions, 
        permissions: [mockPermission, mockPermission3] // permission-2 removed
      };
      
      vi.spyOn(service, 'findOne').mockResolvedValue(roleWithPermissions);
      mockRoleRepository.save.mockResolvedValue(updatedRole);

      const result = await service.removePermissionsFromRole(roleId, mixedPermissionIds);

      expect(result.permissions).toHaveLength(2);
      expect(result.permissions.map(p => p.id)).toEqual(
        expect.arrayContaining(['permission-1', 'permission-3'])
      );
      expect(result.permissions.map(p => p.id)).not.toContain('permission-2');
    });

    it('should propagate NotFoundException from findOne', async () => {
      const notFoundError = new NotFoundException('Role not found');
      vi.spyOn(service, 'findOne').mockRejectedValue(notFoundError);

      await expect(service.removePermissionsFromRole(roleId, permissionIdsToRemove))
        .rejects.toThrow(NotFoundException);
      await expect(service.removePermissionsFromRole(roleId, permissionIdsToRemove))
        .rejects.toThrow('Role not found');
      expect(mockRoleRepository.save).not.toHaveBeenCalled();
    });

    it('should handle database errors during role save', async () => {
      const dbError = new Error('Database save failed');
      const roleWithPermissions = { ...mockRole, permissions: [mockPermission, mockPermission2] };
      
      vi.spyOn(service, 'findOne').mockResolvedValue(roleWithPermissions);
      mockRoleRepository.save.mockRejectedValue(dbError);

      await expect(service.removePermissionsFromRole(roleId, ['permission-2']))
        .rejects.toThrow(InternalServerErrorException);
      await expect(service.removePermissionsFromRole(roleId, ['permission-2']))
        .rejects.toThrow('Could not remove permissions from role');
    });

    it('should remove all permissions when all permissionIds are provided', async () => {
      const roleWithPermissions = { 
        ...mockRole, 
        permissions: [mockPermission, mockPermission2] 
      };
      const allPermissionIds = ['permission-1', 'permission-2'];
      const updatedRole = { 
        ...roleWithPermissions, 
        permissions: [] // All permissions removed
      };
      
      vi.spyOn(service, 'findOne').mockResolvedValue(roleWithPermissions);
      mockRoleRepository.save.mockResolvedValue(updatedRole);

      const result = await service.removePermissionsFromRole(roleId, allPermissionIds);

      expect(result.permissions).toHaveLength(0);
    });

    it('should preserve role properties other than permissions', async () => {
      const roleWithDetails = {
        ...mockRole,
        name: 'test-role',
        description: 'Test role description',
        permissions: [mockPermission, mockPermission2],
        isActive: true
      };
      const updatedRole = { 
        ...roleWithDetails, 
        permissions: [mockPermission] // permission-2 removed
      };
      
      vi.spyOn(service, 'findOne').mockResolvedValue(roleWithDetails);
      mockRoleRepository.save.mockResolvedValue(updatedRole);

      const result = await service.removePermissionsFromRole(roleId, ['permission-2']);

      expect(result.name).toBe('test-role');
      expect(result.description).toBe('Test role description');
      expect(result.isActive).toBe(true);
      expect(result.permissions).toHaveLength(1);
    });

    it('should handle case with no permissions in role', async () => {
      const roleWithoutPermissions = { ...mockRole, permissions: [] };
      
      vi.spyOn(service, 'findOne').mockResolvedValue(roleWithoutPermissions);
      mockRoleRepository.save.mockResolvedValue(roleWithoutPermissions);

      const result = await service.removePermissionsFromRole(roleId, ['permission-1']);

      expect(result.permissions).toHaveLength(0); // Still empty
    });
  });
});
