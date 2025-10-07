import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@features/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@features/auth/guards/roles.guard';
import { PermissionsGuard } from '@features/auth/guards/permissions.guard';
import { Roles } from '@features/auth/decorators/roles.decorator';
import { Permissions } from '@features/auth/decorators/permissions.decorator';
import { RolesService } from '../services/roles.service';
import { CreateRoleDto } from '../dto/create-role.dto';
import { UpdateRoleDto } from '../dto/update-role.dto';

@Controller('roles')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @Roles('admin')
  @Permissions('roles.create')
  create(@Body() createRoleDto: CreateRoleDto) {
    return this.rolesService.create(createRoleDto);
  }

  @Get()
  @Roles('admin')
  @Permissions('roles.read')
  findAll() {
    return this.rolesService.findAll();
  }

  @Get(':id')
  @Roles('admin')
  @Permissions('roles.read')
  findOne(@Param('id') id: string) {
    return this.rolesService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin')
  @Permissions('roles.update')
  update(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
    return this.rolesService.update(id, updateRoleDto);
  }

  @Delete(':id')
  @Roles('admin')
  @Permissions('roles.delete')
  remove(@Param('id') id: string) {
    return this.rolesService.remove(id);
  }

  @Post(':id/permissions')
  @Roles('admin')
  @Permissions('roles.update')
  addPermissions(
    @Param('id') id: string,
    @Body() body: { permissionIds: string[] }
  ) {
    return this.rolesService.addPermissionsToRole(id, body.permissionIds);
  }

  @Delete(':id/permissions')
  @Roles('admin')
  @Permissions('roles.update')
  removePermissions(
    @Param('id') id: string,
    @Body() body: { permissionIds: string[] }
  ) {
    return this.rolesService.removePermissionsFromRole(id, body.permissionIds);
  }
}
