import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Customer } from '../../../customers/entities/customer.entity';

@Entity('customer_profiles')
export class CustomerProfile {
  @ApiProperty({
    description: 'Unique UUID identifier of the user profile',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Associated user ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @Column({ type: 'uuid', unique: true }) 
  customer_id: string;

  @ApiProperty({
    description: 'User phone number',
    example: '+521234567890',
    required: false,
    nullable: true
  })
  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string | null;

  @ApiProperty({
    description: 'User birth date',
    example: '1990-01-01',
    required: false,
    nullable: true,
    format: 'date'
  })
  @Column({ type: 'date', nullable: true })
  birth_date: Date | null;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2024-01-15T10:30:00.000Z',
  })
  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-01-20T15:45:00.000Z',
  })
  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @OneToOne(() => Customer, customer => customer.profile)
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;
}
