import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  BeforeUpdate,
  DeleteDateColumn,
  ManyToMany,
  JoinTable
} from 'typeorm';
// import * as bcrypt from 'bcrypt';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../../roles/entities/role.entity';

@Entity('users')
export class User {
  @ApiProperty({
    description: 'Unique UUID identifier of the user',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid'
  })
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty({
    description: 'User email address - must be unique',
    example: 'user@example.com',
    format: 'email'
  })
  @Column({ type: 'varchar', unique: true, length: 255 })
  email!: string;

  @ApiProperty({
    description: 'Hashed password - automatically encrypted before saving',
    example: '$2b$10$AbCdEfGhIjKlMnOpQrStUvWxYzAbCdEfGhIjKlMnOpQrStUvWxYz',
    writeOnly: true // Important: prevents password from being returned in responses
  })
  @Column({ type: 'varchar' }) 
  password!: string;

  @ApiProperty({
    description: 'Full name of the user',
    example: 'John Doe',
    required: false,
    nullable: true
  })
  @Column({ type: 'varchar', nullable: true, length: 100 })
  name!: string | null;

  @ApiProperty({
    description: 'Indicates if the user has verified their email address',
    example: false,
    default: false
  })
  @Column({ type: 'boolean', default: false })
  isEmailVerified!: boolean;

  @ApiProperty({
    description: 'Token used for email verification process',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    required: false,
    nullable: true
  })
  @Column({ type: 'varchar', nullable: true, length: 255 })
  emailVerificationToken: string | null;

  @ApiProperty({
    description: 'Token used for password reset process',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    required: false,
    nullable: true
  })
  @Column({ type: 'varchar', nullable: true, length: 255 })
  passwordResetToken?: string | null;

  @ApiProperty({
    description: 'Expiration date and time for the password reset token',
    example: '2024-12-31T23:59:59.999Z',
    required: false,
    nullable: true,
    format: 'date-time'
  })
  @Column({ nullable: true, type: 'timestamptz' })
  passwordResetExpires?: Date | null;

  @ApiProperty({
    description: 'URL or path to user profile avatar image',
    example: 'https://example.com/avatars/user123.jpg',
    required: false,
    nullable: true
  })
  @Column({ type: 'varchar', nullable: true, length: 255 })
  avatar?: string | null;

  @ApiProperty({
    description: 'Date and time when the user account was created',
    example: '2024-01-15T10:30:00.000Z',
    format: 'date-time',
    readOnly: true
  })
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @ApiProperty({
    description: 'Date and time when the user account was last updated',
    example: '2024-01-20T15:45:00.000Z',
    format: 'date-time',
    readOnly: true
  })
  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @DeleteDateColumn({ nullable: true })
  deletedAt: Date | null;

  @ManyToMany(() => Role, { eager: true })
  @JoinTable({
    name: 'user_roles',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' }
  })
  roles: Role[];

  /*@BeforeInsert()
  async setVerifiedInDevelopment() {
    if (process.env.NODE_ENV === 'development') {
      this.isEmailVerified = true;
    }
  }*/

  /*@BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.password && !this.password.startsWith('$2b$')) {
      this.password = await bcrypt.hash(this.password.trim(), 10);
    }
  }*/
}
