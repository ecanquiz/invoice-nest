import { 
  IsString, IsNumber, IsBoolean, IsArray, IsOptional, 
  Min, Max, MinLength, MaxLength, IsUUID, IsPositive 
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({ description: 'Product name' })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name: string;

  @ApiProperty({ description: 'Product description', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Category ID' })
  @IsUUID()
  category_id: string;

  @ApiProperty({ description: 'Vintage year' })
  @IsNumber()
  @Min(1900)
  @Max(new Date().getFullYear() + 5)
  vintage_year: number;

  @ApiProperty({ description: 'Alcohol content percentage', required: false })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  alcohol_content?: number;

  @ApiProperty({ description: 'Grape variety', required: false })
  @IsString()
  @IsOptional()
  grape_variety?: string;

  @ApiProperty({ description: 'Wine region', required: false })
  @IsString()
  @IsOptional()
  region?: string;

  @ApiProperty({ description: 'Bottle volume in ml', required: false })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  volume?: number;

  @ApiProperty({ description: 'Product price' })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ description: 'Main image URL', required: false })
  @IsString()
  @IsOptional()
  image_url?: string;

  @ApiProperty({ description: 'Additional images', required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];

  @ApiProperty({ description: 'Tasting notes', required: false })
  @IsString()
  @IsOptional()
  tasting_notes?: string;

  @ApiProperty({ description: 'Food pairing suggestions', required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  food_pairing?: string[];

  @ApiProperty({ description: 'Awards and recognitions', required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  awards?: string[];

  @ApiProperty({ description: 'Product active status', default: true })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}
