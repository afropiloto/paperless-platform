import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ApiKeyAuthService } from './api-key-auth.service';
import { Client } from './schemas/client.schema';

describe('ApiKeyAuthService', () => {
  let service: ApiKeyAuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApiKeyAuthService,
        {
          provide: getModelToken(Client.name),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: CACHE_MANAGER,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ApiKeyAuthService>(ApiKeyAuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
