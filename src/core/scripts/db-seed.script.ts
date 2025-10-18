import { NestFactory } from '@nestjs/core';
import { AppModule } from '@/app.module';
import { DatabaseSeeder, SeedMode } from '../database/seeds';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const seeder = app.get(DatabaseSeeder);
  
  const mode = (process.argv[2] as SeedMode) || 'essential';
  
  try {
    await seeder.run(mode);
    console.log('✅ Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

bootstrap();