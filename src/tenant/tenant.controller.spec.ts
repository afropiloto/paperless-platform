jest.mock('@trustvc/trustvc', () => ({
  SUPPORTED_CHAINS: [],
}));

import { Test, TestingModule } from '@nestjs/testing';
import { TenantController } from './tenant.controller';
import { ConfigService } from '@nestjs/config';
import { ApiKeyGuard } from '../api-key-auth/api-key.guard';

describe('TenantController', () => {
  let controller: TenantController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TenantController],
      providers: [
        {
          provide: ConfigService,
          useValue: { get: jest.fn() },
        },
      ],
    })
      .overrideGuard(ApiKeyGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<TenantController>(TenantController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
