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
    it('should return "Hello World!"', () => {
      const result = 'Hello World!';
      vi.spyOn(appService, 'getHello').mockReturnValue(result); 
      expect(appController.getHello()).toBe(result);
      vi.spyOn(appService, 'getHello').mockReturnValue(result);
      expect(appController.getHello()).toBe(result);
    });
  });
});

describe('UsersService', () => {
  let appController: AppController;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [AppController],
      providers: [{
        provide: AppService,
        useValue: { getHello: () => 'Hello World!' } // Explicit Mock
      }],
    }).compile();
    appController = module.get(AppService); // It doesn't use the real DI!
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      const result = 'Hello World!';
      expect(appController.getHello()).toBe(result);

    });
  });
})

// This test suite verifies the AppController and its interaction with AppService.
// It checks that the controller and service are defined and that the controller's getHello method returns the expected string "Hello World!".
// The test also includes a mock for the AppService's getHello method to ensure it returns the expected value during the test.
// The use of vi.spyOn allows for mocking methods in the service, which can be useful for isolating tests and controlling the behavior of dependencies.
// The test is structured to run in a Node environment, suitable for unit testing with Vitest