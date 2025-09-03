import { Controller, Get, Query, Param, Post, Body, ParseUUIDPipe, Patch, Delete, HttpCode } from '@nestjs/common';
import { UsersService } from './users.service';
import { UserFilterDto } from './dto/user-filter.dto';
import { UserIdDto } from './dto/user-id.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

import { ApiOperation, ApiResponse, ApiTags, ApiParam, ApiBody } from '@nestjs/swagger';
import { User } from './entities/user.entity';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ summary: 'Get list of users with filters' })
  @ApiResponse({
    status: 200,
    description: 'User list successfully obtained',
  })
  @Get()
  async findAll(@Query() filters: UserFilterDto) {
    return this.usersService.findAll(filters);
  }

  @ApiOperation({ 
    summary: 'Get user by ID',
    description: 'Returns the details of a specific user using their UUID'
  })
  @ApiParam({
    name: 'id',
    description: 'Valid user UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid'
  })
  @ApiResponse({
    status: 200,
    description: 'User found successfully',
    type: User 
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid ID (not a valid UUID)'
  })
  @ApiResponse({
    status: 404,
    description: 'User not found'
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error'
  })
  @Get(':id')
  async findOne(@Param() params: UserIdDto) {
   return this.usersService.findById(params.id);
  }

  @ApiOperation({
    summary: 'Create a new user',
    description: 'Creates a new user account with email, password, and name. Email must be unique across the system.'
  })
  @ApiResponse({
    status: 201,
    description: 'User created successfully',
    type: User,
    headers: {
      'Location': {
        description: 'URL of the created user resource',
        schema: { type: 'string', example: '/users/550e8400-e29b-41d4-a716-446655440000' }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
    content: {
      'application/json': {
        examples: {
          'Invalid email': {
            value: {
              message: ['email must be an email'],
              error: 'Bad Request',
              statusCode: 400
            }
          },
          'Weak password': {
            value: {
              message: ['password too weak'],
              error: 'Bad Request', 
              statusCode: 400
            }
          },
          'Short name': {
            value: {
              message: ['name must be longer than or equal to 2 characters'],
              error: 'Bad Request',
              statusCode: 400
            }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 409,
    description: 'Email already registered',
    content: {
      'application/json': {
        example: {
          message: 'Email already registered',
          error: 'Conflict',
          statusCode: 409
        }
      }
    }
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
    content: {
      'application/json': {
        example: {
          message: 'Could not create user',
          error: 'Internal Server Error',
          statusCode: 500
        }
      }
    }
  })
  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @ApiOperation({
  summary: 'Update user partially',
  description: 'Updates specific fields of a user. Only provided fields will be updated.'
  })
  @ApiParam({
    name: 'id',
    description: 'Valid UUID of the user to update',
    example: '550e8400-e29b-41d4-a716-446655440000'
  })
  @ApiResponse({
    status: 200,
    description: 'User updated successfully',
    type: User
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid UUID format or validation error'
  })
  @ApiResponse({
    status: 404,
    description: 'User not found'
  })
  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto
  ) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @HttpCode(200)
  @ApiOperation({ 
    summary: 'Delete a user', 
    description: 'Performs a soft delete of the user. The user record remains in the database but is marked as deleted.' 
  })
  @ApiParam({ 
    name: 'id', 
    description: 'UUID of the user to delete',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'User deleted successfully',
    schema: {
      example: { message: 'User deleted successfully' }
    }
  })
  @ApiResponse({ 
    status: 404, 
    description: 'User not found',
    schema: {
      example: { 
        statusCode: 404,
        message: 'User with ID 123e4567-e89b-12d3-a456-426614174000 not found',
        error: 'Not Found'
      }
    }
  })
  @ApiResponse({ 
    status: 500, 
    description: 'Internal server error',
    schema: {
      example: { 
        statusCode: 500,
        message: 'Could not delete user',
        error: 'Internal Server Error'
      }
    }
  })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.remove(id);
  }
}
