import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { describe, beforeEach, expect, it, vi } from 'vitest';
import { RolesService } from '../roles.service';
import { Role } from '../entities/role.entity';
import { Permission } from '../../permissions/entities/permission.entity';

describe('RolesService', () => {
  let service: RolesService;

  // Mocks
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

  // Mock data
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
      // Arrange
      const mockRoles = [mockRole];
      mockRoleRepository.find.mockResolvedValue(mockRoles);

      // Act
      const result = await service.findAll();

      // Assert
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
      // Arrange
      mockRoleRepository.find.mockResolvedValue([]);

      // Act
      const result = await service.findAll();

      // Assert
      expect(mockRoleRepository.find).toHaveBeenCalledWith({
        relations: ['permissions'],
        where: { isActive: true },
        order: { name: 'ASC' },
      });
      expect(result).toEqual([]);
      expect(result.length).toBe(0);
    });

    it('should only return active roles', async () => {
      // Arrange
      const activeRoles = [mockRole];
      mockRoleRepository.find.mockResolvedValue(activeRoles);

      // Act
      const result = await service.findAll();

      // Assert
      expect(result).toEqual(activeRoles);
      expect(result.every(role => role.isActive)).toBe(true);
    });

    it('should include permissions relation', async () => {
      // Arrange
      const roleWithPermissions = {
        ...mockRole,
        permissions: [mockPermission],
      };
      mockRoleRepository.find.mockResolvedValue([roleWithPermissions]);

      // Act
      const result = await service.findAll();

      // Assert
      expect(result[0].permissions).toBeDefined();
      expect(result[0].permissions.length).toBe(1);
      expect(result[0].permissions[0].name).toBe('users.read');
    });

    it('should order roles by name ascending', async () => {
      // Arrange
      const roles = [
        { ...mockRole, id: '1', name: 'admin' },
        { ...mockRole, id: '2', name: 'moderator' },
        { ...mockRole, id: '3', name: 'user' },
      ];
      mockRoleRepository.find.mockResolvedValue(roles);

      // Act
      const result = await service.findAll();

      // Assert
      expect(mockRoleRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          order: { name: 'ASC' },
        })
      );
    });

    it('should handle repository errors', async () => {
      // Arrange
      const error = new Error('Database error');
      mockRoleRepository.find.mockRejectedValue(error);

      // Act & Assert
      await expect(service.findAll()).rejects.toThrow('Database error');
      expect(mockRoleRepository.find).toHaveBeenCalledTimes(1);
    });

    it('should return roles with correct structure', async () => {
      // Arrange
      const roles = [mockRole];
      mockRoleRepository.find.mockResolvedValue(roles);

      // Act
      const result = await service.findAll();

      // Assert
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('name');
      expect(result[0]).toHaveProperty('description');
      expect(result[0]).toHaveProperty('isActive');
      expect(result[0]).toHaveProperty('permissions');
      expect(result[0]).toHaveProperty('createdAt');
      expect(result[0]).toHaveProperty('updatedAt');
    });

    it('should not include inactive roles', async () => {
      // Arrange
      const mixedRoles = [mockRole, mockInactiveRole];
      const onlyActiveRoles = [mockRole];
      mockRoleRepository.find.mockResolvedValue(onlyActiveRoles);

      // Act
      const result = await service.findAll();

      // Assert
      expect(result).toEqual(onlyActiveRoles);
      expect(result.some(role => !role.isActive)).toBe(false);
    });
  });

  describe('findOne', () => {
    it('should return a role when found', async () => {
      // Arrange
      const roleId = 'role-1';
      mockRoleRepository.findOne.mockResolvedValue(mockRole);

      // Act
      const result = await service.findOne(roleId);

      // Assert
      expect(mockRoleRepository.findOne).toHaveBeenCalledWith({
      where: { id: roleId, isActive: true },
      relations: ['permissions']
      });
      expect(result).toEqual(mockRole);
      expect(result.id).toBe(roleId);
    });

    it('should include permissions when role is found', async () => {
      // Arrange
      const roleId = 'role-1';
      const roleWithPermissions = {
        ...mockRole,
        permissions: [mockPermission]
      };
      mockRoleRepository.findOne.mockResolvedValue(roleWithPermissions);

      // Act
      const result = await service.findOne(roleId);

      // Assert
      expect(result.permissions).toBeDefined();
      expect(result.permissions.length).toBe(1);
      expect(result.permissions[0].name).toBe('users.read');
    });

    it('should throw NotFoundException when role does not exist', async () => {
      // Arrange
      const roleId = 'non-existent-id';
      mockRoleRepository.findOne.mockResolvedValue(null);

      // Act & Assert
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
      // Arrange
      const roleId = 'inactive-role-id';
      mockRoleRepository.findOne.mockResolvedValue(null); // Inactive roles are filtered by isActive: true
      // Act & Assert
      await expect(service.findOne(roleId)).rejects.toThrow(NotFoundException);
      expect(mockRoleRepository.findOne).toHaveBeenCalledWith({
        where: { id: roleId, isActive: true },
        relations: ['permissions']
      });
    });

    it('should handle repository errors', async () => {
      // Arrange
      const roleId = 'role-1';
      const error = new Error('Database connection failed');
      mockRoleRepository.findOne.mockRejectedValue(error);

      // Act & Assert
      await expect(service.findOne(roleId)).rejects.toThrow('Database connection failed');
      expect(mockRoleRepository.findOne).toHaveBeenCalledTimes(1);
    });

    it('should search for active roles only', async () => {
      // Arrange
      const roleId = 'role-1';
      mockRoleRepository.findOne.mockResolvedValue(mockRole);

      // Act
      await service.findOne(roleId);

      // Assert
      expect(mockRoleRepository.findOne).toHaveBeenCalledWith({
        where: { id: roleId, isActive: true }, // ← isActive: true is important
        relations: ['permissions']
      });
    });

    it('should return role with correct structure', async () => {
      // Arrange
      const roleId = 'role-1';
      mockRoleRepository.findOne.mockResolvedValue(mockRole);

      // Act
      const result = await service.findOne(roleId);

      // Assert
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
    // Arrange
    const roleName = 'admin';
    mockRoleRepository.findOne.mockResolvedValue(mockRole);

    // Act
    const result = await service.findByName(roleName);

    // Assert
    expect(mockRoleRepository.findOne).toHaveBeenCalledWith({
      where: { name: roleName, isActive: true },
      relations: ['permissions']
    });
    expect(result).toEqual(mockRole);
    expect(result.name).toBe(roleName);
  });

  it('should include permissions when role is found by name', async () => {
    // Arrange
    const roleName = 'admin';
    const roleWithPermissions = {
      ...mockRole,
      permissions: [mockPermission]
    };
    mockRoleRepository.findOne.mockResolvedValue(roleWithPermissions);

    // Act
    const result = await service.findByName(roleName);

    // Assert
    expect(result.permissions).toBeDefined();
    expect(result.permissions.length).toBe(1);
    expect(result.permissions[0].name).toBe('users.read');
  });

  it('should throw NotFoundException when role does not exist by name', async () => {
    // Arrange
    const roleName = 'non-existent-role';
    mockRoleRepository.findOne.mockResolvedValue(null);

    // Act & Assert
    await expect(service.findByName(roleName)).rejects.toThrow(NotFoundException);
    await expect(service.findByName(roleName)).rejects.toThrow(
      `Role with name '${roleName}' not found`
    );
  });

  it('should throw NotFoundException when role is inactive', async () => {
    // Arrange
    const roleName = 'inactive-role';
    mockRoleRepository.findOne.mockResolvedValue(null);

    // Act & Assert
    await expect(service.findByName(roleName)).rejects.toThrow(NotFoundException);
  });

  it('should handle repository errors', async () => {
    // Arrange
    const roleName = 'admin';
    const error = new Error('Database error');
    mockRoleRepository.findOne.mockRejectedValue(error);

    // Act & Assert
    await expect(service.findByName(roleName)).rejects.toThrow('Database error');
  });

  it('should search for active roles only by name', async () => {
    // Arrange
    const roleName = 'admin';
    mockRoleRepository.findOne.mockResolvedValue(mockRole);

    // Act
    await service.findByName(roleName);

    // Assert
    expect(mockRoleRepository.findOne).toHaveBeenCalledWith({
      where: { name: roleName, isActive: true },
      relations: ['permissions']
    });
  });

  it('should be case sensitive or insensitive based on database configuration', async () => {
    // Arrange
    const roleName = 'Admin'; // Different case
    mockRoleRepository.findOne.mockResolvedValue(mockRole);

    // Act
    const result = await service.findByName(roleName);

    // Assert
    expect(result.name).toBe('admin'); // Should match regardless of case
  });
});
  // Other describe blocks for other methods will go here...
});
