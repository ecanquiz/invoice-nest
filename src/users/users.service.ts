import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, ILike, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { UserFilterDto } from './dto/user-filter.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
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

    // Crear query builder
    const queryBuilder = this.usersRepository.createQueryBuilder('user');

    // Aplicar filtros
    if (email) {
      queryBuilder.andWhere('user.email ILIKE :email', { email: `%${email}%` });
    }

    if (name) {
      queryBuilder.andWhere('user.name ILIKE :name', { name: `%${name}%` });
    }

    if (isEmailVerified !== undefined) {
      queryBuilder.andWhere('user.isEmailVerified = :isEmailVerified', { isEmailVerified });
    }

    // Obtener resultados y total
    const [users, total] = await queryBuilder
      .orderBy('user.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    // Calcular total de páginas
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
      const user = await this.usersRepository.findOne({ where: { id } });
      
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
        isEmailVerified: false,
        emailVerificationToken: null,
        passwordResetToken: null,
        passwordResetExpires: null
      });

      // 4. Guardar usuario en la base de datos
      const savedUser = await this.usersRepository.save(user);

      // 5. Retornar usuario (excluyendo password por seguridad)
      const { password: _, ...userWithoutPassword } = savedUser;
      return userWithoutPassword as User;

    } catch (error) {
      if (error instanceof ConflictException) {
        throw error; // ← Propagar ConflictException tal cual
      }

      // Manejar otros errores (base de datos, etc.)
      throw new InternalServerErrorException('Could not create user');
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async updateUser(id: string, updateData: Partial<User>): Promise<User> {
    const user = await this.findById(id);
    Object.assign(user, updateData);
    return this.usersRepository.save(user);
  }
  
  async remove(id: string): Promise<void> {
    // Lógica para eliminar usuario (soft delete)
  }
}
