import { Controller, Get, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { UserFilterDto } from './dto/user-filter.dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ summary: 'Obtener lista de usuarios con filtros' })
  @ApiResponse({
    status: 200,
    description: 'Lista de usuarios obtenida exitosamente',
  })
  @Get()
  async findAll(@Query() filters: UserFilterDto) {
    return this.usersService.findAll(filters);
  }

  /*@Get(':id')  
  findOne(@Param('id') id: string) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {}

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {}

  @Delete(':id')
  remove(@Param('id') id: string) {}
  */
}
