import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { describe, beforeEach, expect, it, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { User } from '../entities/user.entity';
import { UsersService } from '../users.service';

describe('UsersService', () => {
  let service: UsersService;
  
  const mockRepository = {
    findOne: vi.fn(),
    save: vi.fn()
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
});
