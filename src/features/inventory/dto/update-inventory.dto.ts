import { IsNumber, IsString, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateInventoryDto {
  @ApiProperty({ description: 'Current stock quantity', required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  current_stock?: number;

  @ApiProperty({ description: 'Minimum stock threshold', required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  minimum_stock?: number;

  @ApiProperty({ description: 'Maximum stock capacity', required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  maximum_stock?: number;

  @ApiProperty({ description: 'User who is updating the inventory' })
  @IsString()
  updated_by: string;
}
