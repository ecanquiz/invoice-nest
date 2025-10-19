import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Product } from '../../products/entities/product.entity';

export type StockMovementType = 'in' | 'out' | 'adjustment' | 'reserved' | 'released';

@Entity('stock_movements')
@Index(['product_id', 'created_at']) // For efficient searches
export class StockMovement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  product_id: string;

  @Column({ type: 'varchar', length: 20 })
  type: StockMovementType;

  @Column({ type: 'integer' })
  quantity: number;

  @Column({ type: 'integer' })
  previous_stock: number;

  @Column({ type: 'integer' })
  new_stock: number;

  @Column({ type: 'varchar', length: 200 })
  reason: string;

  @Column({ type: 'uuid', nullable: true })
  reference_id: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @Column({ type: 'varchar', length: 100 })
  created_by: string;

  // Relations
  @ManyToOne(() => Product, product => product.stock_movements)
  @JoinColumn({ name: 'product_id' })
  product: Product;
}
