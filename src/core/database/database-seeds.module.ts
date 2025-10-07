import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from '@features/iam/roles/entities/role.entity';
import { Permission } from '@features/iam/permissions/entities/permission.entity';
import { RolesPermissionsSeed } from './seeds/roles-permissions.seed';

@Module({
  imports: [TypeOrmModule.forFeature([Role, Permission])],
  providers: [RolesPermissionsSeed],
  exports: [RolesPermissionsSeed],
})
export class DatabaseSeedsModule {}