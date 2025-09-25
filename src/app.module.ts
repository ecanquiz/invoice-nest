import { Module, forwardRef, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { DatabaseModule } from './database/database.module';
import { DatabaseSeedsModule } from './database/database-seeds.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard'
import { RolesGuard } from './auth/guards/roles.guard';
import { PermissionsGuard } from './auth/guards/permissions.guard';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { MailModule } from './mail/mail.module';
import { RolesModule } from './roles/roles.module';
import { PermissionsModule } from './permissions/permissions.module';
import { EncryptionService } from './encryption/encryption.service';
import { EncryptionMiddleware } from './encryption/encryption.middleware';
import { TasksModule } from './tasks/tasks.module';
import { TasksController } from './tasks/tasks.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      //envFilePath: process.env.NODE_ENV ? `.env.${process.env.NODE_ENV}` : '.env',
      envFilePath: '.env',
      //ignoreEnvFile: false,

    }),
    DatabaseModule,
    DatabaseSeedsModule,
    TasksModule,
    forwardRef(() => AuthModule),
    forwardRef(() => UsersModule),
    forwardRef(() => RolesModule),
    forwardRef(() => PermissionsModule),
    //forwardRef(() => TasksModule),
    MailModule,    
  ],
  controllers: [AppController],
  providers: [
    EncryptionService,
    AppService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
  ],
})

export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(EncryptionMiddleware)
      .forRoutes('*'); // Aplicar a todas las rutas
  }
}
