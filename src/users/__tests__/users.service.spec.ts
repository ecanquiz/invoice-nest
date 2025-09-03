import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { describe, beforeEach, expect, it, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { User } from '../entities/user.entity';
import { UsersService } from '../users.service';
import { UserFilterDto } from '../dto/user-filter.dto'

describe('UsersService', () => {
  let service: UsersService;
  
  const mockRepository = {
    findOne: vi.fn(),
    save: vi.fn(),
    createQueryBuilder: vi.fn()
  };

  // Mock user data
  const mockUser: User = {
    id: '1',
    email: 'test@example.com',
    password: 'hashed-password',
    name: 'Test User',
    isEmailVerified: true,
    emailVerificationToken: null,
    passwordResetToken: null,
    passwordResetExpires: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    hashPassword: vi.fn()
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository
        },
      ],
    }).compile();

    service = moduleRef.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findById', () => {
    it('should return user when found', async () => {
      mockRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findById('1');

      expect(result).toEqual(mockUser);
      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
    });

    it('should throw NotFoundException when user not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findById('non-existent-id')).rejects.toThrow(NotFoundException);
      await expect(service.findById('non-existent-id')).rejects.toThrow('User not found');
    });

    it('should handle repository errors', async () => {
      mockRepository.findOne.mockRejectedValue(new Error('Database error'));

      await expect(service.findById('1')).rejects.toThrow('Database error');
    });
  });

  describe('findByEmail', () => {
    it('should return user when found by email', async () => {
      mockRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findByEmail('test@example.com');

      expect(result).toEqual(mockUser);
      expect(mockRepository.findOne).toHaveBeenCalledWith({ 
        where: { email: 'test@example.com' } 
      });
    });

    it('should return null when user not found by email', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
      expect(mockRepository.findOne).toHaveBeenCalledWith({ 
        where: { email: 'nonexistent@example.com' } 
      });
    });

    it('should handle case insensitive email search', async () => {
      // It depends on how your database is configured
      // Normally the search is case-sensitive unless configured
      mockRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findByEmail('TEST@example.com');

      expect(result).toEqual(mockUser);
    });
  });

  describe('updateUser', () => {

    beforeEach(() => {
      //vi.clearAllMocks(); // Clean all mocks for this tests
      // or specifically:
      mockRepository.findOne.mockReset();
      mockRepository.save.mockReset();
    }); 

    it('should update user successfully', async () => {
      const updatedUser = { ...mockUser, name: 'Updated Name' };
      
      // Mock for findById (which uses findOne internally)
      mockRepository.findOne
        .mockResolvedValueOnce(mockUser) // First call: findById
        .mockResolvedValueOnce(updatedUser); // Second call: save result
      
      mockRepository.save.mockResolvedValue(updatedUser);

      const result = await service.updateUser('1', { name: 'Updated Name' });

      expect(result).toEqual(updatedUser);
      expect(mockRepository.save).toHaveBeenCalledWith({
        ...mockUser,
        name: 'Updated Name'
      });
    });

    it('should update multiple fields', async () => {
      const updateData = { name: 'New Name', isEmailVerified: false };
      const updatedUser = { ...mockUser, ...updateData };
      
      mockRepository.findOne.mockResolvedValueOnce(mockUser);
      mockRepository.save.mockResolvedValue(updatedUser);

      const result = await service.updateUser('1', updateData);

      expect(result).toEqual(updatedUser);
      expect(mockRepository.save).toHaveBeenCalledWith({
        ...mockUser,
        ...updateData
      });
    });

    it('should throw NotFoundException if user to update does not exist', async () => {
      vi.spyOn(service, 'findById').mockRejectedValue(new NotFoundException('User not found'));

      await expect(service.updateUser('non-existent-id', { name: 'New Name' }))
        .rejects.toThrow(NotFoundException);
    });

    it('should propagate NotFoundException from findById', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const caughtErrorPromise = service.updateUser('non-existent-id', { name: 'New Name' })
      await expect(caughtErrorPromise).rejects.toThrow(NotFoundException);
      await expect(caughtErrorPromise).rejects.toThrow('User not found');        
    });

    it('should handle save errors', async () => {
      mockRepository.findOne.mockResolvedValue(mockUser);
      mockRepository.save.mockRejectedValue(new Error('Save failed'));

      await expect(service.updateUser('1', { name: 'New Name' }))
        .rejects.toThrow('Save failed');
    });
  });

  describe('findAll', () => {
    /*
      To test directly with the database from Postman, run this:

      curl -X POST http://localhost:3000/auth/signup \
        -H "Content-Type: application/json" \
        -d '{
          "email": "test1@example.com",
          "password": "Password123!",
          "name": "Usuario Uno"
        }'

      curl -X POST http://localhost:3000/auth/signup \
        -H "Content-Type: application/json" \
        -d '{
          "email": "test2@example.com", 
          "password": "Password123!",
          "name": "Usuario Dos"
        }'
    */

    // Mock base del QueryBuilder que todos los tests usarán
    const createMockQueryBuilder = (mockData: [User[], number] = [[], 0]) => {
      const mockQueryBuilder = {
        andWhere: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        take: vi.fn().mockReturnThis(),
        getManyAndCount: vi.fn().mockResolvedValue(mockData),
      };
      
      mockRepository.createQueryBuilder = vi.fn().mockReturnValue(mockQueryBuilder);
      return mockQueryBuilder;
    };

    it('should return users with pagination', async () => {
      const mockUsers = [mockUser, { ...mockUser, id: '2', email: 'test2@example.com' }];
      const total = 2;
      
      const mockQueryBuilder = createMockQueryBuilder([mockUsers as User[], total]);

      const filters: UserFilterDto = { page: 1, limit: 10 };
      const result = await service.findAll(filters);

      expect(result).toEqual({
        users: mockUsers,
        total,
        page: 1,
        limit: 10,
        totalPages: 1
      });

      // Verificaciones adicionales
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('user.createdAt', 'DESC');
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
    });

    it('should filter by email', async () => {
      const mockUsers = [mockUser];
      const total = 1;
      
      const mockQueryBuilder = createMockQueryBuilder([mockUsers, total]);

      const filters: UserFilterDto = { email: 'test@example.com' };
      const result = await service.findAll(filters);

      expect(result).toEqual({
        users: mockUsers,
        total,
        page: 1,
        limit: 10,
        totalPages: 1
      });

      // Verificar que se aplicó el filtro de email
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'user.email ILIKE :email',
        { email: '%test@example.com%' }
      );
    });

    it('should filter by name', async () => {
      const mockUsers = [mockUser];
      const total = 1;
      
      const mockQueryBuilder = createMockQueryBuilder([mockUsers, total]);

      const filters: UserFilterDto = { name: 'Test' };
      await service.findAll(filters);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'user.name ILIKE :name',
        { name: '%Test%' }
      );
    });

    it('should filter by isEmailVerified', async () => {
      const mockUsers = [mockUser];
      const total = 1;
      
      const mockQueryBuilder = createMockQueryBuilder([mockUsers, total]);

      const filters: UserFilterDto = { isEmailVerified: true };
      await service.findAll(filters);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'user.isEmailVerified = :isEmailVerified',
        { isEmailVerified: true }
      );
    });

    it('should calculate totalPages correctly', async () => {
      const mockUsers = Array(15).fill(mockUser); // 15 usuarios
      const total = 15;
      
      createMockQueryBuilder([mockUsers, total]);

      const filters: UserFilterDto = { page: 2, limit: 10 };
      const result = await service.findAll(filters);

      expect(result.totalPages).toBe(2); // 15 usuarios / 10 por página = 2 páginas
      expect(result.page).toBe(2);
      expect(result.limit).toBe(10);
      expect(result.total).toBe(15);
    });

    it('should handle empty results', async () => {
      createMockQueryBuilder([[], 0]); // Array vacío

      const filters: UserFilterDto = { page: 1, limit: 10 };
      const result = await service.findAll(filters);

      expect(result).toEqual({
        users: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0
      });
    });

    it('should use default pagination values', async () => {      
      const result = await service.findAll({});

      expect(result.page).toBe(1);
      expect(result.limit).toBe(10); 
    });
  });  
});


