import 'reflect-metadata'; 
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as morgan from 'morgan'
import {CORS} from './constants'
import { AppModule } from './app.module';
import { UserIdDto } from './users/dto/user-id.dto';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(morgan.default('dev'))

  // Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle('Authentication Nest API')
    .setDescription('Auth system with JWT authentication.')
    .setVersion('1.0')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      name: 'JWT',
      description: 'Enter the token JWT',
      in: 'header',
    })
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    extraModels: [UserIdDto], // ← Force include DTO
  });
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true, // Keeps the token between refills
    },
  });

  app.enableCors(CORS);

  // app.setGlobalPrefix('api/v1');

  await app.listen(process.env.PORT ?? 3000);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
