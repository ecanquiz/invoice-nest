/* Identity & Access Management */
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { PermissionsModule } from './permissions/permissions.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([]),
    forwardRef(() => UsersModule),
    forwardRef(() => RolesModule),
    forwardRef(() => PermissionsModule),
  ],
  controllers: [],
  providers: [],
  exports: [
    forwardRef(() => UsersModule),
    forwardRef(() => RolesModule),
    forwardRef(() => PermissionsModule)]
})

export class IamModule {}
