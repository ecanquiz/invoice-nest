import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, ILike, Repository, IsNull, In } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '@/features/iam/users/entities/user.entity';
import { Role } from '@/features/iam/roles/entities/role.entity';
import { UserFilterDto } from '@/features/iam/users/dto/user-filter.dto';
import { CreateUserDto } from '@/features/iam/users/dto/create-user.dto';
// import { UpdateUserDto } from '@/features/users/dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
  ) {}

  async findAll(filters: UserFilterDto): Promise<{ 
    users: User[]; 
    total: number; 
    page: number; 
    limit: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 10, email, name, isEmailVerified } = filters;
    const skip = (page - 1) * limit;

    // Create query builder
    const queryBuilder = this.usersRepository.createQueryBuilder('user');

    queryBuilder.andWhere('user.deleted_at IS NULL');

    // Apply filters
    if (email) {
      queryBuilder.andWhere('user.email ILIKE :email', { email: `%${email}%` });
    }

    if (name) {
      queryBuilder.andWhere('user.name ILIKE :name', { name: `%${name}%` });
    }

    if (isEmailVerified !== undefined) {
      queryBuilder.andWhere('user.isEmailVerified = :isEmailVerified', { isEmailVerified });
    }

    queryBuilder.leftJoinAndSelect('user.roles', 'role');

    // Get results and total
    const [users, total] = await queryBuilder
      .orderBy('user.created_at', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    // Calculate total pages
    const totalPages = Math.ceil(total / limit);

    return {
      users,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages
    };
  }

  async findById(id: string): Promise<User> {
    try {
      const user = await this.usersRepository.findOne({ where: { id, deleted_at: IsNull() } });
      
      if (!user) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }
      
      return user;
    } catch (error) {

      if (error instanceof NotFoundException) {
        throw error; // ← Propagar NotFoundException tal cual 
      }
      
      // Para otros errores (UUID inválido, etc.)
      throw new BadRequestException('Invalid user ID format');
    }
  }

async create(createUserDto: CreateUserDto): Promise<User> {
    const { email, password, name } = createUserDto;

    try {
      // 1. Verificar si el email ya existe
      const existingUser = await this.findByEmail(email);
      if (existingUser) {
        throw new ConflictException('Email already registered');
      }

      // 2. Hashear password
      const hashedPassword = await bcrypt.hash(password, 12); // ↑ cost factor a 12

      // 3. Crear instancia de usuario
      const user = this.usersRepository.create({
        email: email.toLowerCase().trim(), // ← Normalizar email
        password: hashedPassword,
        name: name?.trim(), // ← Trim si existe
        is_email_verified: false,
        email_verification_token: null,
        password_reset_token: null,
        password_reset_expires: null
      });

      // 4. Save user to database
      const savedUser = await this.usersRepository.save(user);

      // 5. Return user (excluding password for security)
      const { password: _, ...userWithoutPassword } = savedUser;
      return userWithoutPassword as User;

    } catch (error) {
      if (error instanceof ConflictException) {
        throw error; // ← Propagate ConflictException as is
      }

      // Handling other errors (database, etc.)
      throw new InternalServerErrorException('Could not create user');
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { email,  deleted_at: IsNull() }
    });
  }

  /*async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ 
      where: { email },
      relations: ['roles', 'roles.permissions'] 
    });
  }*/

  async update(id: string, updateData: Partial<User>): Promise<User> {
    const user = await this.findById(id);
    //const user = await this.usersRepository.findOne({ where: { id } });
    
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Update only the provided fields
    Object.assign(user, updateData);
    
    return this.usersRepository.save(user);
  }
  
  async remove(id: string): Promise<{ message: string }> {
    try {
      const user = await this.usersRepository.findOne({
        where: { id, deleted_at: IsNull() } // Only search for non-deleted users
      });
      
      if (!user) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      // Soft delete: update deleted_at instead of physically deleting
      await this.usersRepository.softDelete(id);
      
      return { message: 'User deleted successfully' };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      throw new InternalServerErrorException('Could not delete user');
    }
  }

  async restore(id: string): Promise<User> {
    try {
      const result = await this.usersRepository.restore(id);
      
      if (result.affected === 0) {
        throw new NotFoundException(`User with ID ${id} not found or already restored`);
      }
      
      return this.findById(id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      throw new InternalServerErrorException('Could not restore user');
    }
  }

  async assignRolesToUser(userId: string, roleIds: string[]): Promise<User> {
    try {
      const user = await this.findById(userId);
      const roles = await this.roleRepository.find({
        where: { 
          id: In(roleIds), 
          is_active: true 
        }
      });

      if (roles.length === 0) {
        throw new NotFoundException('No valid roles found');
      }

      user.roles = roles;
      return await this.usersRepository.save(user);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Could not assign roles to user');
    }
  }

  async removeRolesFromUser(userId: string, roleIds: string[]): Promise<User> {
    try {
      const user = await this.findById(userId);
      
      user.roles = user.roles.filter(role => !roleIds.includes(role.id));
      return await this.usersRepository.save(user);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Could not remove roles from user');
    }
  }

  async findUsersByRole(roleName: string): Promise<User[]> {
    return this.usersRepository
      .createQueryBuilder('user')
      .innerJoin('user.roles', 'role')
      .where('role.name = :roleName', { roleName })
      .andWhere('user.deleted_at IS NULL')
      .getMany();
  }
}
