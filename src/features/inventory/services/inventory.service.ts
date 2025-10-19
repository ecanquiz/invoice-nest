import { Injectable, NotFoundException, forwardRef, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, QueryRunner } from 'typeorm';
import { Inventory } from '../entities/inventory.entity';
import { StockMovement } from '../entities/stock-movement.entity';
import { UpdateInventoryDto } from '../dto/update-inventory.dto';
import { CreateStockMovementDto } from '../dto/create-stock-movement.dto';
import { ProductsService } from '@/features/products/services/products.service';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(Inventory)
    private inventoryRepository: Repository<Inventory>,
    @InjectRepository(StockMovement)
    private stockMovementRepository: Repository<StockMovement>,
    @Inject(forwardRef(() => ProductsService))
    private productsService: ProductsService,
    private dataSource: DataSource,
  ) {}

  /**
   * Crear inventory automáticamente para un nuevo producto
   */
  async createInventoryForProduct(
    productId: string, 
    updatedBy: string, 
    queryRunner?: QueryRunner
  ): Promise<Inventory> {
    const repository = queryRunner ? queryRunner.manager.getRepository(Inventory) : this.inventoryRepository;
    
    const inventory = repository.create({
      product_id: productId,
      current_stock: 0,
      reserved_stock: 0,
      minimum_stock: 10,
      maximum_stock: 1000,
      updated_by: updatedBy,
    });

    return await repository.save(inventory);
  }

  /**
   * Obtener inventory por product ID
   */
  async findByProductId(productId: string, merchantId?: string): Promise<Inventory> {
    const query = this.inventoryRepository
      .createQueryBuilder('inventory')
      .leftJoinAndSelect('inventory.product', 'product')
      .where('inventory.product_id = :productId', { productId });

    // Si es merchant, verificar que el producto le pertenece
    if (merchantId) {
      query.andWhere('product.merchant_id = :merchantId', { merchantId });
    }

    const inventory = await query.getOne();

    if (!inventory) {
      throw new NotFoundException(
        merchantId 
          ? `Inventory for product ${productId} not found or you don't have access`
          : `Inventory for product ${productId} not found`
      );
    }

    return inventory;
  }

  /**
   * Actualizar inventory con transacción y historial
   */
  async updateInventory(
    productId: string, 
    updateDto: UpdateInventoryDto, 
    merchantId?: string
  ): Promise<{ inventory: Inventory; movement: StockMovement }> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Obtener inventory actual (con verificación de merchant si aplica)
      const currentInventory = await this.findByProductId(productId, merchantId);

      // 2. Calcular nuevo stock si se está actualizando current_stock
      let newStock = currentInventory.current_stock;
      if (updateDto.current_stock !== undefined) {
        newStock = updateDto.current_stock;
      }

      // 3. Actualizar inventory
      const updatedInventory = await queryRunner.manager.save(Inventory, {
        ...currentInventory,
        ...updateDto,
        current_stock: newStock,
        last_updated: new Date(),
      });

      // 4. Crear registro en historial si hubo cambio de stock
      let movement: StockMovement | null = null;
      if (updateDto.current_stock !== undefined && updateDto.current_stock !== currentInventory.current_stock) {
        movement = await queryRunner.manager.save(StockMovement, {
          product_id: productId,
          type: 'adjustment',
          quantity: Math.abs(updateDto.current_stock - currentInventory.current_stock),
          previous_stock: currentInventory.current_stock,
          new_stock: updateDto.current_stock,
          reason: `Stock adjustment by ${updateDto.updated_by}`,
          created_by: updateDto.updated_by,
        });
      }

      await queryRunner.commitTransaction();
      return { inventory: updatedInventory, movement: movement! };

    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Registrar movimiento de stock (entrada/salida)
   */
  async recordStockMovement(
    productId: string,
    movementDto: CreateStockMovementDto,
    merchantId?: string
  ): Promise<{ inventory: Inventory; movement: StockMovement }> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Verificar inventory y permisos
      const currentInventory = await this.findByProductId(productId, merchantId);

      // 2. Calcular nuevo stock basado en el tipo de movimiento
      let newStock = currentInventory.current_stock;
      switch (movementDto.type) {
        case 'in':
          newStock += movementDto.quantity;
          break;
        case 'out':
          newStock = Math.max(0, newStock - movementDto.quantity);
          break;
        case 'adjustment':
          newStock = movementDto.quantity;
          break;
        // reserved y released no afectan current_stock directamente
      }

      // 3. Actualizar inventory
      const updatedInventory = await queryRunner.manager.save(Inventory, {
        ...currentInventory,
        current_stock: newStock,
        last_updated: new Date(),
        updated_by: movementDto.created_by,
      });

      // 4. Crear registro de movimiento
      const movement = await queryRunner.manager.save(StockMovement, {
        product_id: productId,
        ...movementDto,
        previous_stock: currentInventory.current_stock,
        new_stock: newStock,
      });

      await queryRunner.commitTransaction();
      return { inventory: updatedInventory, movement };

    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Obtener historial de movimientos de un producto
   */
  async getStockMovements(productId: string, merchantId?: string): Promise<StockMovement[]> {
    const query = this.stockMovementRepository
      .createQueryBuilder('movement')
      .leftJoinAndSelect('movement.product', 'product')
      .where('movement.product_id = :productId', { productId })
      .orderBy('movement.created_at', 'DESC');

    // Si es merchant, verificar que el producto le pertenece
    if (merchantId) {
      query.andWhere('product.merchant_id = :merchantId', { merchantId });
    }

    return await query.getMany();
  }

  /**
   * Obtener productos con stock bajo
   */
  async getLowStockProducts(merchantId?: string): Promise<Inventory[]> {
    const query = this.inventoryRepository
      .createQueryBuilder('inventory')
      .leftJoinAndSelect('inventory.product', 'product')
      .where('inventory.current_stock <= inventory.minimum_stock')
      .andWhere('inventory.current_stock > 0') // No incluir stock cero
      .andWhere('product.is_active = :isActive', { isActive: true });

    if (merchantId) {
      query.andWhere('product.merchant_id = :merchantId', { merchantId });
    }

    return await query.getMany();
  }

  /**
   * Obtener productos sin stock
   */
  async getOutOfStockProducts(merchantId?: string): Promise<Inventory[]> {
    const query = this.inventoryRepository
      .createQueryBuilder('inventory')
      .leftJoinAndSelect('inventory.product', 'product')
      .where('inventory.current_stock = 0')
      .andWhere('product.is_active = :isActive', { isActive: true });

    if (merchantId) {
      query.andWhere('product.merchant_id = :merchantId', { merchantId });
    }

    return await query.getMany();
  }
}
