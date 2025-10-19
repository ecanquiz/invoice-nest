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

  /* create(merchantId: string, createProductDto: CreateProductDto): Promise<Product> {
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
        ...createProductDto,
        merchant_id: merchantId,
      });
      const savedProduct = await queryRunner.manager.save(Product, product);

      await this.inventoryService.createInventoryForProduct(
        savedProduct.id, 
        merchantId, 
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

  async findAll(merchantId?: string, categoryId?: string, isActive: boolean = true): Promise<Product[]> {
    const where: any = { is_active: isActive };

    if (merchantId) {
      where.merchant_id = merchantId;
    }

    if (categoryId) {
      where.category_id = categoryId;
    }

    return await this.productsRepository.find({
      where,
      relations: ['merchant', 'category'],
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string, merchantId?: string): Promise<Product> {
    const where: any = { id };

    if (merchantId) {
      where.merchant_id = merchantId;
    }

    const product = await this.productsRepository.findOne({
      where,
      relations: ['merchant', 'category'],
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }

  async update(
    id: string, 
    merchantId: string, 
    updateProductDto: UpdateProductDto
  ): Promise<Product> {
    const product = await this.findOne(id, merchantId);

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

  async remove(id: string, merchantId: string): Promise<void> {
    const product = await this.findOne(id, merchantId);
    
    // Soft delete
    await this.productsRepository.softDelete(id);
  }

  async toggleStatus(id: string, merchantId: string, isActive: boolean): Promise<Product> {
    const product = await this.findOne(id, merchantId);
    
    product.is_active = isActive;
    return await this.productsRepository.save(product);
  }

  async findByMerchant(merchantId: string, isActive: boolean = true): Promise<Product[]> {
    return await this.productsRepository.find({
      where: {
        merchant_id: merchantId,
        is_active: isActive,
      },
      relations: ['category'],
      order: { created_at: 'DESC' },
    });
  }

  async searchProducts(
    query: string, 
    categoryIds?: string[], 
    merchantId?: string
  ): Promise<Product[]> {
    const qb = this.productsRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.merchant', 'merchant')
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

    if (merchantId) {
      qb.andWhere('product.merchant_id = :merchantId', { merchantId });
    }

    return await qb.orderBy('product.created_at', 'DESC').getMany();
  }

  async getProductsCount(merchantId?: string): Promise<number> {
    const where: any = { is_active: true };
    
    if (merchantId) {
      where.merchant_id = merchantId;
    }

    return await this.productsRepository.count({ where });
  }

  async bulkUpdateStatus(ids: string[], merchantId: string, isActive: boolean): Promise<void> {
    await this.productsRepository
      .createQueryBuilder()
      .update(Product)
      .set({ is_active: isActive })
      .where('id IN (:...ids)', { ids })
      .andWhere('merchant_id = :merchantId', { merchantId })
      .execute();
  }*/
}
