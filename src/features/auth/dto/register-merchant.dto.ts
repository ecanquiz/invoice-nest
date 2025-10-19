import { IsEmail, IsString, MinLength, MaxLength, Matches, IsOptional, IsNumber, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

class LocationDto {
  @ApiProperty({
    example: 40.7128,
    description: 'Latitude coordinate',
  })
  @IsNumber()
  lat: number;

  @ApiProperty({
    example: -74.0060,
    description: 'Longitude coordinate',
  })
  @IsNumber()
  lng: number;
}

export class RegisterMerchantDto {
  // Personal Information
  @ApiProperty({
    example: 'merchant@example.com',
    description: 'Merchant email',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'Password123!',
    description: 'Password (min 8 characters, 1 uppercase, 1 number, 1 special)',
  })
  @IsString()
  @MinLength(8)
  @MaxLength(20)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'password too weak',
  })
  password: string;

  @ApiProperty({
    example: 'Juan Merchant',
    description: 'Full name of merchant responsible',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  name: string;

  @ApiProperty({
    example: '+521234567890',
    description: 'Merchant phone number',
  })
  @IsString()
  phone: string;

  // Trade Information
  @ApiProperty({
    example: 'Wine & Co Shop',
    description: 'Business name',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  businessName: string;

  @ApiProperty({
    example: 'A premium wine shop with the best selection',
    description: 'Business description',
    required: false
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  businessDescription?: string;

  @ApiProperty({
    description: 'Business location coordinates',
    type: LocationDto
  })
  @IsObject()
  location: LocationDto;
}
