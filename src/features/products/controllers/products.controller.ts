import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseUUIDPipe,
  NotFoundException
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ProductsService } from '../services/products.service';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { Product } from '../entities/product.entity';
import { JwtAuthGuard } from '@/features/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/features/auth/guards/roles.guard';
import { Roles } from '@/features/auth/decorators/roles.decorator';
import { CurrentUser } from '@/features/auth/decorators/current-user.decorator';
import { User } from '@/features/iam/users/entities/user.entity';

@ApiTags('products')
@Controller('products')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProductsController {
  constructor( private readonly productsService: ProductsService ) {}
/*
  @Post()
  @Roles('merchant', 'admin')
  @ApiOperation({ summary: 'Create a new product' })
  @ApiResponse({ status: 201, description: 'Product created successfully', type: Product })
  async create(
    @CurrentUser() user: User,
    @Body() createProductDto: CreateProductDto,
  ): Promise<Product> {
    // For merchants, use your own merchant_id
    const merchantId = await this.getMerchantId(user);
    return this.productsService.create(merchantId, createProductDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all products' })
  @ApiResponse({ status: 200, description: 'List of products', type: [Product] })
  async findAll(
    @CurrentUser() user: User,
    @Query('merchantId') merchantId?: string,
    @Query('categoryId') categoryId?: string,
    @Query('isActive') isActive?: boolean,
  ): Promise<Product[]> {
    // If you are a merchant, you can only see your products.
    const effectiveMerchantId = user.roles.some(role => role.name === 'merchant') 
      ? await this.getMerchantId(user)
      : merchantId;

    return this.productsService.findAll(effectiveMerchantId, categoryId, isActive);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search products' })
  @ApiResponse({ status: 200, description: 'Search results', type: [Product] })
  async search(
    @CurrentUser() user: User,
    @Query('q') query: string,
    @Query('categoryIds') categoryIds?: string,
    @Query('merchantId') merchantId?: string,
  ): Promise<Product[]> {
    // Si es merchant, solo puede buscar en sus productos
    const effectiveMerchantId = user.roles.some(role => role.name === 'merchant') 
      ? await this.getMerchantId(user)
      : merchantId;

    const categoryIdsArray = categoryIds ? categoryIds.split(',') : undefined;

    return this.productsService.searchProducts(query, categoryIdsArray, effectiveMerchantId);
  }

  @Get('merchant/my-products')
  @Roles('merchant')
  @ApiOperation({ summary: 'Get current merchant products' })
  @ApiResponse({ status: 200, description: 'Merchant products', type: [Product] })
  async findMyProducts(
    @CurrentUser() user: User,
    @Query('isActive') isActive?: boolean,
  ): Promise<Product[]> {
    const merchantId = await this.getMerchantId(user);
    return this.productsService.findByMerchant(merchantId, isActive);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID' })
  @ApiResponse({ status: 200, description: 'Product found', type: Product })
  async findOne(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<Product> {
    // Si es merchant, solo puede ver sus productos
    const merchantId = user.roles.some(role => role.name === 'merchant') 
      ? await this.getMerchantId(user)
      : undefined;

    return this.productsService.findOne(id, merchantId);
  }

  @Patch(':id')
  @Roles('merchant', 'admin')
  @ApiOperation({ summary: 'Update product' })
  @ApiResponse({ status: 200, description: 'Product updated', type: Product })
  async update(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    const merchantId = await this.getMerchantId(user);
    return this.productsService.update(id, merchantId, updateProductDto);
  }

  @Delete(':id')
  @Roles('merchant', 'admin')
  @ApiOperation({ summary: 'Delete product' })
  @ApiResponse({ status: 200, description: 'Product deleted' })
  async remove(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    const merchantId = await this.getMerchantId(user);
    return this.productsService.remove(id, merchantId);
  }

  @Patch(':id/status')
  @Roles('merchant', 'admin')
  @ApiOperation({ summary: 'Toggle product status' })
  @ApiResponse({ status: 200, description: 'Status updated', type: Product })
  async toggleStatus(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body('isActive') isActive: boolean,
  ): Promise<Product> {
    const merchantId = await this.getMerchantId(user);
    return this.productsService.toggleStatus(id, merchantId, isActive);
  }

  @Get('merchant/count')
  @Roles('merchant')
  @ApiOperation({ summary: 'Get merchant products count' })
  @ApiResponse({ status: 200, description: 'Products count' })
  async getMyProductsCount(@CurrentUser() user: User): Promise<{ count: number }> {
    const merchantId = await this.getMerchantId(user);
    const count = await this.productsService.getProductsCount(merchantId);
    return { count };
  }

  private async getMerchantId(user: User): Promise<string> {
    if (user.roles.some(role => role.name === 'admin')) {
      throw new Error('Admin should specify merchantId in query params');
    }

    // Usar el merchantsService para encontrar el merchant del usuario
    const merchant = await this.merchantsService.findByUserId(user.id);
    
    if (!merchant) {
      throw new NotFoundException('Merchant profile not found');
    }

    return merchant.id;
  }*/
}