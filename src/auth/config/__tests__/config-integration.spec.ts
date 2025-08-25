import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import jwtConfig from '../jwt.config';

describe('Config Integration', () => {
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          load: [jwtConfig],
        }),
      ],
      providers: [ConfigService],
    }).compile();

    configService = module.get<ConfigService>(ConfigService);
  });

  it('should have jwt config loaded', () => {    
    const secret = configService.get('jwt.secret');
    const expiresIn = configService.get('jwt.expiresIn');
    
    expect(secret).toBe(process.env.JWT_SECRET );
    expect(expiresIn).toBe('3600s');

    expect(secret).toBeDefined();
    expect(secret).toBeTruthy();
    expect(typeof secret).toBe('string');
    
    expect(expiresIn).toBe('3600s');
  });
});
