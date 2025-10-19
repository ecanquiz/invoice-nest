import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn, OneToOne, JoinColumn } from 'typeorm';
import { Product } from '../../products/entities/product.entity';

@Entity('inventory')
export class Inventory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', unique: true })
  product_id: string;

  @Column({ type: 'integer', default: 0 })
  current_stock: number;

  @Column({ type: 'integer', default: 0 })
  reserved_stock: number;

  @Column({ type: 'integer', default: 10 })
  minimum_stock: number;

  @Column({ type: 'integer', default: 1000 })
  maximum_stock: number;

  @UpdateDateColumn({ type: 'timestamptz' })
  last_updated: Date;

  @Column({ type: 'varchar', length: 100 })
  updated_by: string;

  // Relations
  @OneToOne(() => Product, product => product.inventory)
  @JoinColumn({ name: 'product_id' })
  product: Product;
}
