import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, ILike } from 'typeorm';
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
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async updateUser(id: string, updateData: Partial<User>): Promise<User> {
    const user = await this.findById(id);
    Object.assign(user, updateData);
    return this.usersRepository.save(user);
  }

  /*// users.service.ts - Añadir estos métodos
  async create(createUserDto: CreateUserDto): Promise<User> {
    // Lógica para crear usuario
  }

  async remove(id: string): Promise<void> {
    // Lógica para eliminar usuario (soft delete)
  }*/


}
