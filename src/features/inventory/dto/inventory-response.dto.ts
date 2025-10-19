import { ApiProperty } from '@nestjs/swagger';

export class InventoryResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  product_id: string;

  @ApiProperty()
  current_stock: number;

  @ApiProperty()
  reserved_stock: number;

  @ApiProperty()
  minimum_stock: number;

  @ApiProperty()
  maximum_stock: number;

  @ApiProperty()
  last_updated: Date;

  @ApiProperty()
  updated_by: string;
}
