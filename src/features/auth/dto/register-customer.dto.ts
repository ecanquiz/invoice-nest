import { IsEmail, IsString, MinLength, MaxLength, Matches, IsOptional, IsArray, IsBoolean, IsDateString, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

class CustomerPreferencesDto {
  @ApiProperty({
    example: ['red', 'white'],
    description: 'Preferred wine types',
    required: false,
    isArray: true,
    enum: ['white', 'rose', 'sparkling', 'red']
  })
  @IsOptional()
  @IsArray()
  @IsEnum(['white', 'rose', 'sparkling', 'red'], { each: true })
  wineTypes?: string[];

  @ApiProperty({
    example: true,
    description: 'Receive order notifications',
    required: false,
    default: true
  })
  @IsOptional()
  @IsBoolean()
  notifications?: boolean;

  @ApiProperty({
    example: false,
    description: 'Receive newsletter emails',
    required: false,
    default: false
  })
  @IsOptional()
  @IsBoolean()
  newsletter?: boolean;
}

export class RegisterCustomerDto {
  @ApiProperty({
    example: 'customer@example.com',
    description: 'Customer email',
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
    example: 'John Customer',
    description: 'Full name of customer',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  name: string;

  @ApiProperty({
    example: '+521234567890',
    description: 'Customer phone number',
    required: false
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({
    example: '1990-01-01',
    description: 'Customer birth date (YYYY-MM-DD)',
    required: false
  })
  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @ApiProperty({
    description: 'Customer preferences',
    required: false,
    type: CustomerPreferencesDto
  })
  @IsOptional()
  preferences?: CustomerPreferencesDto;
}
