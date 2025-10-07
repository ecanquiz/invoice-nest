import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Customer } from '../../../../customers/entities/customer.entity';

@Entity('customer_wine_preferences')
@Unique(['customer_id', 'wine_type'])
export class CustomerWinePreference {
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
  @Column({ type: 'uuid' })
  customer_id: string;

  @ApiProperty({
    description: 'Type of wine preference',
    example: 'red',
    enum: ['white', 'rose', 'sparkling', 'red']
  })
  @Column({ type: 'varchar' })
  wine_type: string;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2024-01-15T10:30:00.000Z',
  })
  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @ManyToOne(() => Customer, customer => customer.winePreferences)
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;
}
