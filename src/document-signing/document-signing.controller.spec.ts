import { Test, TestingModule } from '@nestjs/testing';
import { DocumentSigningController } from './document-signing.controller';
import { DocumentSigningService } from './document-signing.service';
import { JwtGuard } from '../auth/guards/jwt-guard';
import { ApiKeyGuard } from '../api-key-auth/api-key.guard';

describe('DocumentSigningController', () => {
  let controller: DocumentSigningController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DocumentSigningController],
      providers: [
        {
          provide: DocumentSigningService,
          useValue: {},
        },
      ],
    })
      .overrideGuard(JwtGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(ApiKeyGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<DocumentSigningController>(DocumentSigningController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
