import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  NotFoundException
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { InventoryService } from '../services/inventory.service';
import { UpdateInventoryDto } from '../dto/update-inventory.dto';
import { CreateStockMovementDto } from '../dto/create-stock-movement.dto';
import { Inventory } from '../entities/inventory.entity';
import { StockMovement } from '../entities/stock-movement.entity';
import { JwtAuthGuard } from '@/features/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/features/auth/guards/roles.guard';
import { Roles } from '@/features/auth/decorators/roles.decorator';
import { CurrentUser } from '@/features/auth/decorators/current-user.decorator';
import { User } from '@/features/iam/users/entities/user.entity';

@ApiTags('inventory')
@Controller('inventory')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
export class InventoryController {
  constructor(
    private readonly inventoryService: InventoryService
  ) {}

  @Get('product/:productId')
  @Roles('admin')
  @ApiOperation({ summary: 'Get inventory for a product' })
  @ApiResponse({ status: 200, description: 'Inventory found', type: Inventory })
  async getInventory(
    @CurrentUser() user: User,
    @Param('productId', ParseUUIDPipe) productId: string,
  ): Promise<Inventory> {
    const merchantId = undefined;
    return this.inventoryService.findByProductId(productId, merchantId);
  }

  @Put('product/:productId')
  @Roles('admin')
  @ApiOperation({ summary: 'Update inventory for a product' })
  @ApiResponse({ status: 200, description: 'Inventory updated' })
  async updateInventory(
    @CurrentUser() user: User,
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body() updateDto: UpdateInventoryDto,
  ): Promise<{ inventory: Inventory; movement?: StockMovement }> {
    const merchantId = undefined;
    
    // Include the current user in the DTO
    updateDto.updated_by = user.name || user.email;

    return this.inventoryService.updateInventory(productId, updateDto, merchantId);
  }

  @Post('product/:productId/movements')
  @Roles('admin')
  @ApiOperation({ summary: 'Record stock movement' })
  @ApiResponse({ status: 201, description: 'Movement recorded' })
  async recordMovement(
    @CurrentUser() user: User,
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body() movementDto: CreateStockMovementDto,
  ): Promise<{ inventory: Inventory; movement: StockMovement }> {
    const merchantId = undefined;

    // Incluir el usuario actual en el DTO
    movementDto.created_by = user.name || user.email;

    return this.inventoryService.recordStockMovement(productId, movementDto, merchantId);
  }

  @Get('product/:productId/movements')
  @Roles('admin')
  @ApiOperation({ summary: 'Get stock movement history' })
  @ApiResponse({ status: 200, description: 'Movement history', type: [StockMovement] })
  async getMovements(
    @CurrentUser() user: User,
    @Param('productId', ParseUUIDPipe) productId: string,
  ): Promise<StockMovement[]> {
    const merchantId = undefined;

    return this.inventoryService.getStockMovements(productId, merchantId);
  }

  @Get('low-stock')
  @Roles('admin')
  @ApiOperation({ summary: 'Get products with low stock' })
  @ApiResponse({ status: 200, description: 'Low stock products', type: [Inventory] })
  async getLowStock(@CurrentUser() user: User): Promise<Inventory[]> {
    const merchantId = undefined;

    return this.inventoryService.getLowStockProducts(merchantId);
  }

  @Get('out-of-stock')
  @Roles('admin')
  @ApiOperation({ summary: 'Get out of stock products' })
  @ApiResponse({ status: 200, description: 'Out of stock products', type: [Inventory] })
  async getOutOfStock(@CurrentUser() user: User): Promise<Inventory[]> {
    const merchantId = undefined;
    
    return this.inventoryService.getOutOfStockProducts(merchantId);
  }
}
