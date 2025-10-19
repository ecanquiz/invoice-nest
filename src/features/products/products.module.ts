import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsService } from './services/products.service';
import { ProductsController } from './controllers/products.controller';
import { Product } from './entities/product.entity';
import { Category } from '@/features/categories/entities/category.entity';
import { AuthModule } from '@/features/auth/auth.module';
import { InventoryModule } from '@/features/inventory/inventory.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, Category]),
    AuthModule,
    forwardRef(() => InventoryModule)
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
