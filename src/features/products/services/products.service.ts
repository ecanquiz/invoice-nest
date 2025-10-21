import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { Product } from '../entities/product.entity';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { Category } from '@/features/categories/entities/category.entity';
import { InventoryService } from '@/features/inventory/services/inventory.service';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
    @InjectRepository(Category)
    private categoriesRepository: Repository<Category>,
    private inventoryService: InventoryService,
    private dataSource: DataSource,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Verify that the category exists
      const category = await this.categoriesRepository.findOne({
        where: { id: createProductDto.category_id }
      });

      if (!category) {
        throw new NotFoundException('Category not found');
      }

      const product = this.productsRepository.create({
        ...createProductDto
      });
      const savedProduct = await queryRunner.manager.save(Product, product);

      await this.inventoryService.createInventoryForProduct(
        savedProduct.id, 
        queryRunner
      );

      await queryRunner.commitTransaction();
      return savedProduct;

    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(categoryId?: string, isActive: boolean = true): Promise<Product[]> {
    const where: any = { is_active: isActive };

    if (categoryId) {
      where.category_id = categoryId;
    }

    return await this.productsRepository.find({
      where,
      relations: ['category'],
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Product> {
    const where: any = { id };

    const product = await this.productsRepository.findOne({
      where,
      relations: ['category'],
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }

  async update(
    id: string, 
    updateProductDto: UpdateProductDto
  ): Promise<Product> {
    const product = await this.findOne(id);

    // If the category is being updated, check that it exists
    if (updateProductDto.category_id) {
      const category = await this.categoriesRepository.findOne({
        where: { id: updateProductDto.category_id }
      });

      if (!category) {
        throw new NotFoundException('Category not found');
      }
    }

    const updatedProduct = this.productsRepository.merge(product, updateProductDto);
    return await this.productsRepository.save(updatedProduct);
  }

  async remove(id: string): Promise<void> {
    const product = await this.findOne(id);
    
    // Soft delete
    await this.productsRepository.softDelete(id);
  }

  async toggleStatus(id: string, isActive: boolean): Promise<Product> {
    const product = await this.findOne(id);
    
    product.is_active = isActive;
    return await this.productsRepository.save(product);
  }

  async searchProducts(
    query: string, 
    categoryIds?: string[]
  ): Promise<Product[]> {
    const qb = this.productsRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .where('product.is_active = :isActive', { isActive: true });

    if (query) {
      qb.andWhere(
        '(product.name ILIKE :query OR product.description ILIKE :query OR product.grape_variety ILIKE :query OR product.region ILIKE :query)',
        { query: `%${query}%` }
      );
    }

    if (categoryIds && categoryIds.length > 0) {
      qb.andWhere('product.category_id IN (:...categoryIds)', { categoryIds });
    }

    return await qb.orderBy('product.created_at', 'DESC').getMany();
  }

  async getProductsCount(): Promise<number> {
    const where: any = { is_active: true };

    return await this.productsRepository.count({ where });
  }

  async bulkUpdateStatus(ids: string[], isActive: boolean): Promise<void> {
    await this.productsRepository
      .createQueryBuilder()
      .update(Product)
      .set({ is_active: isActive })
      .where('id IN (:...ids)', { ids })
      .execute();
  }
}
