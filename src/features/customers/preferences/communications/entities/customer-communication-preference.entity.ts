import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Customer } from '../../../../customers/entities/customer.entity';

@Entity('customer_communication_preferences')
export class CustomerCommunicationPreference {
  @ApiProperty({
    description: 'Unique UUID identifier',
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
    description: 'Receive order and system notifications',
    example: true,
    default: true
  })
  @Column({ type: 'boolean', default: true })
  receive_notifications: boolean;

  @ApiProperty({
    description: 'Receive newsletter and promotional emails',
    example: false,
    default: false
  })
  @Column({ type: 'boolean', default: false })
  receive_newsletter: boolean;

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

  @OneToOne(() => Customer, customer => customer.communicationPreferences)
  @JoinColumn({ name: 'customer_id' })
  customer: Customer
}
