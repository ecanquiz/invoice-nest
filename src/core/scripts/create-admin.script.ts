import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AppModule } from '../../app.module';

async function bootstrap() {
  console.log('🚀 Starting admin creation script...');
  
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);
  
  try {
    console.log('🔍 Looking for admin role...');
    
    const adminRole = await dataSource.getRepository('Role').findOne({
      where: { name: 'admin', is_active: true }
    });

    if (!adminRole) {
      throw new Error('Admin role not found. Please run the seed script first: npm run migration:run');
    }

    console.log('✅ Admin role found:', adminRole.name);

    const existingAdmin = await dataSource.getRepository('User').findOne({
      where: {
        email: 'admin@example.com',
        deleted_at: null
      },
      relations: ['roles']
    });

    if (existingAdmin) {
      console.log('⚠️ Admin user already exists:');
      console.log('📧 Email:', existingAdmin.email);
      console.log('👤 Name:', existingAdmin.name);
      console.log('🎯 Roles:', existingAdmin.roles.map(r => r.name));
      return;
    }

    console.log('👤 Creating new admin user...');
    const hashedPassword = await bcrypt.hash('Admin123!', 12);   
    const adminUser = dataSource.getRepository('User').create({
      email: 'admin@example.com',
      password: hashedPassword,
      name: 'System Administrator',
      is_email_verified: true,
      roles: [adminRole]
    });
    const savedAdmin = await dataSource.getRepository('User').save(adminUser);
    
    console.log('✅ Admin user created successfully!');
    console.log('📧 Email:', savedAdmin.email);
    console.log('🔑 Password: Admin123!');
    console.log('👤 Name:', savedAdmin.name);
    console.log('🎯 Roles:', savedAdmin.roles.map(r => r.name));    
  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
    if (error.message.includes('role not found')) {
      console.log('\n💡 Solution: Run the migrations and seeds first:');
      console.log('npm run migration:run');
    }
  } finally {
    await app.close();
    console.log('🔚 Script finished');
  }
}

bootstrap();
