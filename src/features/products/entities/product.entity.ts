import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  OneToOne,
  OneToMany
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Category } from '../../categories/entities/category.entity';
import { Inventory } from '../../inventory/entities/inventory.entity';
import { StockMovement } from '../../inventory/entities/stock-movement.entity';

@Entity('products')
@Index(['category_id', 'is_active']) // For searches by category
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Product name' })
  @Column({ type: 'varchar', length: 200 })
  name: string;

  @ApiProperty({ description: 'Product description', required: false })
  @Column({ type: 'text', nullable: true })
  description: string | null;

  @ApiProperty({ description: 'Reference to product category' })
  @Column({ type: 'uuid' })
  category_id: string;

  @ApiProperty({ description: 'Vintage year of the wine' })
  @Column({ type: 'integer', name: 'vintage_year' })
  vintage_year: number;

  @ApiProperty({ description: 'Alcohol content percentage', required: false })
  @Column({ type: 'decimal', precision: 4, scale: 2, nullable: true, name: 'alcohol_content' })
  alcohol_content: number | null;

  @ApiProperty({ description: 'Grape variety', required: false })
  @Column({ type: 'varchar', length: 100, nullable: true, name: 'grape_variety' })
  grape_variety: string | null;

  @ApiProperty({ description: 'Wine region', required: false })
  @Column({ type: 'varchar', length: 100, nullable: true })
  region: string | null;

  @ApiProperty({ description: 'Bottle volume in ml', required: false })
  @Column({ type: 'integer', nullable: true })
  volume: number | null;

  @ApiProperty({ description: 'Product price' })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @ApiProperty({ description: 'Main product image URL', required: false })
  @Column({ type: 'varchar', length: 500, nullable: true, name: 'image_url' })
  image_url: string | null;

  @ApiProperty({ description: 'Additional product images', required: false })
  @Column({ type: 'text', array: true, default: () => 'ARRAY[]::text[]' })
  images: string[];

  @ApiProperty({ description: 'Tasting notes', required: false })
  @Column({ type: 'text', nullable: true, name: 'tasting_notes' })
  tasting_notes: string | null;

  @ApiProperty({ description: 'Food pairing suggestions', required: false })
  @Column({ type: 'text', array: true, default: () => 'ARRAY[]::text[]', name: 'food_pairing' })
  food_pairing: string[];

  @ApiProperty({ description: 'Awards and recognitions', required: false })
  @Column({ type: 'text', array: true, default: () => 'ARRAY[]::text[]' })
  awards: string[];

  @ApiProperty({ description: 'Product active status' })
  @Column({ type: 'boolean', default: true, name: 'is_active' })
  is_active: boolean;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updated_at: Date;

  @DeleteDateColumn({ type: 'timestamptz', name: 'deleted_at', nullable: true })
  deleted_at: Date | null;

  @ManyToOne(() => Category, (category) => category.products, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @OneToOne(() => Inventory, inventory => inventory.product)
  inventory: Inventory;

  @OneToMany(() => StockMovement, movement => movement.product)
  stock_movements: StockMovement[];
}
