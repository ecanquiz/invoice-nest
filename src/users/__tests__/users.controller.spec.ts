import { describe, beforeEach, expect, it, vi} from 'vitest'
import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from '../users.controller';
import { UsersService } from '../users.service';
import { UserFilterDto } from '../dto/user-filter.dto';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { NotFoundException } from '@nestjs/common';

// Mock user data
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
  hashPassword: vi.fn()
};

const mockUsersService = {
  findAll: vi.fn(),
  findById: vi.fn(),
  findByEmail: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn()
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

        // // We ensure that the mocks are injected
    if (!controller['usersService']) {
      (controller['usersService'] as any) = usersService;
    }
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should call service.findAll with filters', async () => {
      const filters: UserFilterDto = { page: 1, limit: 10 };
      const expectedResult = { users: [mockUser], total: 1, page: 1, limit: 10, totalPages: 1 };
      
      mockUsersService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll(filters);

      expect(result).toEqual(expectedResult);
      expect(usersService.findAll).toHaveBeenCalledWith(filters);
    });

    it('should handle service errors properly', async () => {
      const filters: UserFilterDto = { page: 1, limit: 10 };
      const errorMessage = 'Database connection failed';
    
      mockUsersService.findAll.mockRejectedValue(new Error(errorMessage));

      await expect(controller.findAll(filters)).rejects.toThrow(errorMessage);
      expect(usersService.findAll).toHaveBeenCalledWith(filters);
    });

    it('should return empty result when no users found', async () => {
      const filters: UserFilterDto = { page: 1, limit: 10 };
      const emptyResult = { 
        users: [], 
        total: 0, 
        page: 1, 
        limit: 10, 
        totalPages: 0 
      };
    
      mockUsersService.findAll.mockResolvedValue(emptyResult);

      const result = await controller.findAll(filters);
    
      expect(result).toEqual(emptyResult);
      expect(usersService.findAll).toHaveBeenCalledWith(filters);
    });

    it('should use default values when no filters provided', async () => {
      const expectedResult = { 
        users: [mockUser], 
        total: 1, 
        page: 1, 
        limit: 10, 
        totalPages: 1 
      };
    
      mockUsersService.findAll.mockResolvedValue(expectedResult);

      // Llamar sin filtros (debería usar valores por defecto)
      const result = await controller.findAll({});

      expect(result).toEqual(expectedResult);
      expect(usersService.findAll).toHaveBeenCalledWith({});
    });
  });

  /*describe('findOne', () => {
    it('should call service.findById with correct ID', async () => {
      mockUsersService.findById.mockResolvedValue(mockUser);

      const result = await controller.findOne('1');

      expect(result).toEqual(mockUser);
      expect(usersService.findById).toHaveBeenCalledWith('1');
    });

    it('should throw NotFoundException when user not found', async () => {
      mockUsersService.findById.mockRejectedValue(new NotFoundException('User not found'));

      await expect(controller.findOne('999')).rejects.toThrow(NotFoundException);
      expect(usersService.findById).toHaveBeenCalledWith('999');
    });
  });

  describe('create', () => {
    it('should call service.create with createUserDto', async () => {
      const createUserDto: CreateUserDto = {
        email: 'new@example.com',
        password: 'Password123!',
        name: 'New User'
      };

      mockUsersService.create.mockResolvedValue(mockUser);

      const result = await controller.create(createUserDto);

      expect(result).toEqual(mockUser);
      expect(usersService.create).toHaveBeenCalledWith(createUserDto);
    });
  });

  describe('update', () => {
    it('should call service.update with correct parameters', async () => {
      const updateUserDto: UpdateUserDto = { name: 'Updated Name' };
      const updatedUser = { ...mockUser, name: 'Updated Name' };

      mockUsersService.update.mockResolvedValue(updatedUser);

      const result = await controller.update('1', updateUserDto);

      expect(result).toEqual(updatedUser);
      expect(usersService.update).toHaveBeenCalledWith('1', updateUserDto);
    });
  });

  describe('remove', () => {
    it('should call service.remove with correct ID', async () => {
      mockUsersService.remove.mockResolvedValue(undefined);

      const result = await controller.remove('1');

      expect(result).toBeUndefined();
      expect(usersService.remove).toHaveBeenCalledWith('1');
    });

    it('should throw NotFoundException when user to delete not found', async () => {
      mockUsersService.remove.mockRejectedValue(new NotFoundException('User not found'));

      await expect(controller.remove('999')).rejects.toThrow(NotFoundException);
      expect(usersService.remove).toHaveBeenCalledWith('999');
    });
  });*/
});
