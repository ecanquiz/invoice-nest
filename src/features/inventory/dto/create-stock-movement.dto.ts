import { IsString, IsNumber, IsEnum, IsOptional, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import type { StockMovementType } from '../entities/stock-movement.entity';

export class CreateStockMovementDto {
  @ApiProperty({ enum: ['in', 'out', 'adjustment', 'reserved', 'released'] })
  @IsEnum(['in', 'out', 'adjustment', 'reserved', 'released'])
  type: StockMovementType;

  @ApiProperty({ description: 'Quantity changed' })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({ description: 'Reason for the movement' })
  @IsString()
  reason: string;

  @ApiProperty({ description: 'Reference ID (order, adjustment, etc.)', required: false })
  @IsString()
  @IsOptional()
  reference_id?: string;

  @ApiProperty({ description: 'User who created the movement' })
  @IsString()
  created_by: string;
}
