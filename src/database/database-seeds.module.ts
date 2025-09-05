import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolesPermissionsSeed } from './seeds/roles-permissions.seed';
import { Role } from '../roles/entities/role.entity';
import { Permission } from '../permissions/entities/permission.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Role, Permission])],
  providers: [RolesPermissionsSeed],
  exports: [RolesPermissionsSeed],
})
export class DatabaseSeedsModule {}