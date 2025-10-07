import { Module, forwardRef, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { DatabaseModule } from './core/database/database.module';
import { DatabaseSeedsModule } from './core/database/database-seeds.module';
import { EncryptionService } from './core/encryption/encryption.service';
import { EncryptionMiddleware } from './core/encryption/encryption.middleware';
import { MailModule } from './core/mail/mail.module';
import { JwtAuthGuard } from './features/auth/guards/jwt-auth.guard'
import { RolesGuard } from './features/auth/guards/roles.guard';
import { PermissionsGuard } from './features/auth/guards/permissions.guard';
import { AuthModule } from './features/auth/auth.module';
import { IamModule } from './features/iam/iam.module'; /* Identity & Access Management */
import { CustomersModule } from './features/customers/customers.module';
import { TasksModule } from './features/tasks/tasks.module';
// import { TasksController } from './tasks/tasks.controller';

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
    forwardRef(() => IamModule), /* Identity & Access Management */
    forwardRef(() => CustomersModule),
    //forwardRef(() => TasksModule),
    MailModule,    
  ],
  providers: [
    EncryptionService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
  ],
})

export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(EncryptionMiddleware)
      .forRoutes('*'); // Apply to all routes
  }
}
