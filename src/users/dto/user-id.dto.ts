import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UserIdDto {
  @ApiProperty({
    description: 'Valid UUID of the user',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid'
  })
  @IsUUID()
  id: string;
}
