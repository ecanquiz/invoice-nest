import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Inventory } from './entities/inventory.entity';
import { StockMovement } from './entities/stock-movement.entity';
import { InventoryService } from './services/inventory.service';
import { InventoryController } from './controllers/inventory.controller';
import { ProductsModule } from '@/features/products/products.module';
import { AuthModule } from '@/features/auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Inventory, StockMovement]),
    forwardRef(() => ProductsModule), // To use ProductsService
    AuthModule
  ],
  controllers: [InventoryController],
  providers: [InventoryService],
  exports: [InventoryService], // So that ProductsService can use it
})
export class InventoryModule {}