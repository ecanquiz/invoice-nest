import { Controller, Get, Post, Body, Put, Param, Delete, Inject } from '@nestjs/common';
import { EncryptionService } from '@core/encryption/encryption.service';
import { Public } from '@features/auth/decorators/public.decorator';

@Controller('tasks')
export class TasksController {

  constructor(
    @Inject(EncryptionService)
    private readonly encryptionService: EncryptionService
  ) {}
  
  @Get()
  @Public()
  findAll() {
    // ✅ El middleware desencriptó el request automáticamente
    // ✅ El middleware encriptará la respuesta automáticamente
    return [
      { id: 1, title: 'Task 1', completed: false },
      { id: 2, title: 'Task 2', completed: true }
    ];
  }

  @Post()
  @Public()
  create(@Body() createTaskDto: any) {
    // ✅ Body ya viene desencriptado por el middleware
    console.log('Received data:', createTaskDto);
    
    // Tu lógica de negocio aquí...
    const newTask = {
      id: Date.now(),
      ...createTaskDto,
      createdAt: new Date()
    };
    
    return {
      message: 'Task created successfully',
      task: newTask
    };
  }

  @Put(':id')
  @Public()
  update(@Param('id') id: string, @Body() updateTaskDto: any) {
    // ✅ Body desencriptado automáticamente
    console.log(`Updating task ${id} with:`, updateTaskDto);
    
    return {
      message: 'Task updated successfully',
      taskId: id,
      updates: updateTaskDto
    };
  }

  @Delete(':id')
  @Public()
  remove(@Param('id') id: string) {
    return {
      message: `Task ${id} deleted successfully`
    };
  }

  @Post('compatibility-test')
@Public()
async compatibilityTest(@Body() body: any) {
  console.log('🔐 [COMPATIBILITY] Testing encryption compatibility...');
  
  try {
    // Test 1: Encriptar en NestJS y ver el resultado
    const testData = { message: 'Test from NestJS', number: 42 };
    const encrypted = this.encryptionService.encryptObject(testData);
    console.log('🔐 [COMPATIBILITY] NestJS encrypted:', encrypted.length, 'chars');
    
    // Test 2: Intentar desencriptar lo que envió Nuxt
    if (body.encData) {
      console.log('🔐 [COMPATIBILITY] Attempting to decrypt Nuxt data...');
      const decrypted = this.encryptionService.decryptToObject(body.encData);
      console.log('🔐 [COMPATIBILITY] Successfully decrypted Nuxt data:', decrypted);
      
      return {
        nestjsEncryption: 'Working',
        nuxtDecryption: 'Working', 
        decryptedData: decrypted,
        nestjsEncryptedSample: encrypted
      };
    }
    
    return { error: 'No encData received from Nuxt' };
  } catch (error) {
    console.error('🔐 [COMPATIBILITY] Test failed:', error);
    return { 
      error: 'Compatibility test failed',
      details: error.message 
    };
  }
}

@Post('debug-raw')
@Public()
async debugRaw(@Body() body: any) {
  console.log('🔐 [DEBUG-RAW] Raw body received:', body);
  console.log('🔐 [DEBUG-RAW] encData length:', body.encData?.length);
  console.log('🔐 [DEBUG-RAW] encData first 100 chars:', body.encData?.substring(0, 100));
  
  // Devolver el body tal cual para inspección
  return {
    received: true,
    encDataLength: body.encData?.length,
    bodyKeys: Object.keys(body)
  };
}
}