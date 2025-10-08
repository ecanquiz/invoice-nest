import { IsEmail, IsString, MinLength, MaxLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({
    description: 'User email address - must be unique across the system',
    example: 'user@example.com',
    format: 'email',
    maxLength: 255
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'User password - must contain at least 1 uppercase letter, 1 number, and 1 special character',
    example: 'SecurePassword123!',
    minLength: 8,
    maxLength: 20,
    pattern: '/((?=.*\\d)|(?=.*\\W+))(?![.\\n])(?=.*[A-Z])(?=.*[a-z]).*$/'
  })
  @IsString()
  @MinLength(8)
  @MaxLength(20)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'La contraseña debe tener al menos 1 mayúscula, 1 número y 1 carácter especial',
  })
  password: string;

  @ApiProperty({
    description: 'Full name of the user',
    example: 'John Doe',
    minLength: 2,
    maxLength: 50,
    required: false,
    nullable: true
  })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  name: string;

  role: string //cambiar a array de string en un futuro si se soporta mas de un rol
}
