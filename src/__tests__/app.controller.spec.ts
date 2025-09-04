import { Test, TestingModule } from '@nestjs/testing';
import { describe, beforeEach, expect, it, vi } from 'vitest';
import { AppController } from '../app.controller';
import { AppService } from '../app.service';

describe('AppController', () => {
  let appController: AppController;
  let appService: AppService;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    // appController = app.get<AppController>(AppController);
    // With this way of Nest, it doesn't work with Vitest
    
    appService = app.get<AppService>(AppService); // or appService = new AppService();
    appController = app.get<AppController>(AppService) // or appController = new AppController(appService);
  });

  describe('root', () => {
    it('should return User Authentication System!', () => {
      const result = 'User Authentication System!';
      vi.spyOn(appService, 'getGreeting').mockReturnValue(result); 
      expect(appController.getGreeting()).toBe(result);
      vi.spyOn(appService, 'getGreeting').mockReturnValue(result);
      expect(appController.getGreeting()).toBe(result);
    });
  });
});

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [AppController],
      providers: [{
        provide: AppService,
        useValue: { getGreeting: () => 'User Authentication System!' } // Explicit Mock
      }],
    }).compile();
    appController = module.get(AppService); // It doesn't use the real DI!
  });

  describe('root', () => {
    it('should return "User Authentication System!"', () => {
      const result = 'User Authentication System!';
      expect(appController.getGreeting()).toBe(result);
    });
  });
})
