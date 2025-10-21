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

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'Create a new product' })
  @ApiResponse({ status: 201, description: 'Product created successfully', type: Product })
  async create(
    @CurrentUser() user: User,
    @Body() createProductDto: CreateProductDto,
  ): Promise<Product> {
    return this.productsService.create(user.id, createProductDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all products' })
  @ApiResponse({ status: 200, description: 'List of products', type: [Product] })
  async findAll(
    @CurrentUser() user: User,
    @Query('categoryId') categoryId?: string,
    @Query('isActive') isActive?: boolean,
  ): Promise<Product[]> {

    return this.productsService.findAll(categoryId, isActive);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search products' })
  @ApiResponse({ status: 200, description: 'Search results', type: [Product] })
  async search(
    @CurrentUser() user: User,
    @Query('q') query: string,
    @Query('categoryIds') categoryIds?: string
  ): Promise<Product[]> {
    const categoryIdsArray = categoryIds ? categoryIds.split(',') : undefined;

    return this.productsService.searchProducts(query, categoryIdsArray);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID' })
  @ApiResponse({ status: 200, description: 'Product found', type: Product })
  async findOne(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<Product> {
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Update product' })
  @ApiResponse({ status: 200, description: 'Product updated', type: Product })
  async update(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    return this.productsService.update(id, updateProductDto);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Delete product' })
  @ApiResponse({ status: 200, description: 'Product deleted' })
  async remove(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.productsService.remove(id);
  }

  @Patch(':id/status')
  @Roles('admin')
  @ApiOperation({ summary: 'Toggle product status' })
  @ApiResponse({ status: 200, description: 'Status updated', type: Product })
  async toggleStatus(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body('isActive') isActive: boolean,
  ): Promise<Product> {
    return this.productsService.toggleStatus(id, isActive);
  }

  @Get('count')
  @Roles('admin')
  @ApiOperation({ summary: 'Get products count' })
  @ApiResponse({ status: 200, description: 'Products count' })
  async getMyProductsCount(@CurrentUser() user: User): Promise<{ count: number }> {
    const count = await this.productsService.getProductsCount();
    return { count };
  }
}