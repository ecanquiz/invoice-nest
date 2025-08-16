import { describe, beforeEach, expect, it} from 'vitest'
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';

describe.todo('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthService],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
