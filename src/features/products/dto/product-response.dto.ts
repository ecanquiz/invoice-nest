import { ApiProperty } from '@nestjs/swagger';

export class ProductResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty()
  category_id: string;

  @ApiProperty()
  vintage_year: number;

  @ApiProperty({ required: false })
  alcohol_content?: number;

  @ApiProperty({ required: false })
  grape_variety?: string;

  @ApiProperty({ required: false })
  region?: string;

  @ApiProperty({ required: false })
  volume?: number;

  @ApiProperty()
  price: number;

  @ApiProperty({ required: false })
  image_url?: string;

  @ApiProperty()
  images: string[];

  @ApiProperty({ required: false })
  tasting_notes?: string;

  @ApiProperty()
  food_pairing: string[];

  @ApiProperty()
  awards: string[];

  @ApiProperty()
  is_active: boolean;

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  updated_at: Date;

  @ApiProperty({ required: false })
  category?: any;
}
