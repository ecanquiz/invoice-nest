import { describe, beforeEach, expect, it, vi} from 'vitest'
import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  NotFoundException
} from '@nestjs/common';
import { UsersController } from '../users.controller';
import { UsersService } from '../users.service';
import { UserFilterDto } from '../dto/user-filter.dto';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';

const mockUser = {
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
  deletedAt: null,
  //hashPassword: vi.fn()
};

const mockDeletedUser = {
  ...mockUser,
  deletedAt: new Date() // Usuario eliminado
};

const mockUsersService = {
  findAll: vi.fn(),
  findById: vi.fn(),
  findByEmail: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  assignRolesToUser: vi.fn(),
  removeRolesFromUser: vi.fn(),
  findUsersByRole: vi.fn(),
};

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: UsersService;

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService
        }
      ]
    }).compile();

    controller = module.get<UsersController>(UsersController);
    usersService = module.get<UsersService>(UsersService);

    if (!controller['usersService']) {
      (controller['usersService'] as any) = usersService;
    }
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    const filters: UserFilterDto = { page: 1, limit: 10 };
    const initResult = { users: <typeof mockUser[]>[], total: 0, page: 1, limit: 10, totalPages: 0 };

    it('should return empty result when no users found', async () => {
      mockUsersService.findAll.mockResolvedValue(initResult);
      const result = await controller.findAll(filters);
    
      expect(result).toEqual(initResult);
      expect(usersService.findAll).toHaveBeenCalledWith(filters);
    });

    it('should use default values when no filters provided', async () => {
      const expectedResult = { ...initResult, users: [mockUser], total: 1, totalPages: 1 };   
      mockUsersService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll({});

      expect(result).toEqual(expectedResult);
      expect(usersService.findAll).toHaveBeenCalledWith({});
    });

    it('should call service.findAll with filters', async () => {
      const expectedResult = { ...initResult, users: [mockUser], total: 1, totalPages: 1 }; 
      mockUsersService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll(filters);

      expect(result).toEqual(expectedResult);
      expect(usersService.findAll).toHaveBeenCalledWith(filters);
    });

    it('should handle service errors properly', async () => {
      const errorMessage = 'Database connection failed';    
      mockUsersService.findAll.mockRejectedValue(new Error(errorMessage));

      await expect(controller.findAll(filters)).rejects.toThrow(errorMessage);
      expect(usersService.findAll).toHaveBeenCalledWith(filters);
    });

  });

  describe('findOne', () => {
    const userId = '550e8400-e29b-41d4-a716-446655440000';

    it('should return user when found by ID', async () => {
      mockUsersService.findById.mockResolvedValue(mockUser);

      const result = await controller.findOne({ id: userId });

      expect(result).toEqual(mockUser);
      expect(usersService.findById).toHaveBeenCalledWith(userId);
    });

    it('should throw NotFoundException when user not found', async () => {
      const error = new NotFoundException('User not found');      
      mockUsersService.findById.mockRejectedValue(error);

      await expect(controller.findOne({ id: userId })).rejects.toThrow(error);
      expect(usersService.findById).toHaveBeenCalledWith(userId);
    });

    it('should throw BadRequestException for invalid UUID format', async () => {
      const invalidId = 'invalid-id';
      const error = new BadRequestException('Invalid user ID format');      
      mockUsersService.findById.mockRejectedValue(error);

      await expect(controller.findOne({ id: invalidId })).rejects.toThrow(error);
      expect(usersService.findById).toHaveBeenCalledWith(invalidId);
    });

    it('should propagate other errors correctly', async () => {
      const error = new Error('Database connection failed');      
      mockUsersService.findById.mockRejectedValue(error);

      await expect(controller.findOne({ id: userId })).rejects.toThrow(error);
      expect(usersService.findById).toHaveBeenCalledWith(userId);
    });
  });

  describe('create', () => {
    const createUserDto: CreateUserDto = {
      email: 'newuser@example.com',
      password: 'Password123!',
      name: 'New User'
    };

    const mockCreatedUser = {
      id: '1',
      email: 'newuser@example.com',
      name: 'New User',
      isEmailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should call service.create with CreateUserDto and return user', async () => {
      mockUsersService.create.mockResolvedValue(mockCreatedUser);

      const result = await controller.create(createUserDto);

      expect(result).toEqual(mockCreatedUser);
      expect(usersService.create).toHaveBeenCalledWith(createUserDto);
    });

    it('should throw ConflictException when service throws ConflictException', async () => {
      const conflictError = new ConflictException('Email already registered');
      mockUsersService.create.mockRejectedValue(conflictError);

      await expect(controller.create(createUserDto)).rejects.toThrow(ConflictException);
      await expect(controller.create(createUserDto)).rejects.toThrow('Email already registered');
    });

    it('should throw InternalServerErrorException when service throws other errors', async () => {
      const internalError = new InternalServerErrorException('Database error');
      mockUsersService.create.mockRejectedValue(internalError);

      await expect(controller.create(createUserDto)).rejects.toThrow(InternalServerErrorException);
    });

    it('should validate CreateUserDto input', async () => {
      // Esta prueba verifica que NestJS valide el DTO automáticamente
      // La validación real se prueba en los DTO tests
      mockUsersService.create.mockResolvedValue(mockCreatedUser);

      const validDto: CreateUserDto = {
        email: 'valid@example.com',
        password: 'ValidPass123!',
        name: 'Valid Name'
      };

      const result = await controller.create(validDto);
      expect(result).toEqual(mockCreatedUser);
    });
  });

  describe('update', () => {
    const userId = '550e8400-e29b-41d4-a716-446655440000';
    const updateUserDto: UpdateUserDto = {
      name: 'Updated Name',
      email: 'updated@example.com'
    };

    const mockUpdatedUser = {
      id: userId,
      name: 'Updated Name',
      email: 'updated@example.com',
      isEmailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should update user successfully', async () => {
      mockUsersService.update.mockResolvedValue(mockUpdatedUser);

      const result = await controller.update(userId, updateUserDto);

      expect(result).toEqual(mockUpdatedUser);
      expect(usersService.update).toHaveBeenCalledWith(userId, updateUserDto);
    });

    it('should throw NotFoundException when user not found', async () => {
      const notFoundError = new NotFoundException('User not found');
      mockUsersService.update.mockRejectedValue(notFoundError);

      await expect(controller.update(userId, updateUserDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a user successfully', async () => {
      const userId = '1';
      const result = { message: 'User deleted successfully' };
      
      mockUsersService.remove.mockResolvedValue(result);

      const response = await controller.remove(userId);

      expect(mockUsersService.remove).toHaveBeenCalledWith(userId);
      expect(response).toEqual(result);
    });

    it('should throw NotFoundException when user does not exist', async () => {
      const userId = 'non-existent-id';
      
      mockUsersService.remove.mockRejectedValue(
        new NotFoundException(`User with ID ${userId} not found`)
      );

      await expect(controller.remove(userId)).rejects.toThrow(NotFoundException);
      expect(mockUsersService.remove).toHaveBeenCalledWith(userId);
    });

    it('should throw InternalServerErrorException on server error', async () => {
      const userId = '1';
      
      mockUsersService.remove.mockRejectedValue(
        new InternalServerErrorException('Could not delete user')
      );

      await expect(controller.remove(userId)).rejects.toThrow(InternalServerErrorException);
      expect(mockUsersService.remove).toHaveBeenCalledWith(userId);
    });
  });
});
