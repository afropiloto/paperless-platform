import { Test, TestingModule } from '@nestjs/testing';
import { DocumentSigningController } from './document-signing.controller';

describe('DocumentSigningController', () => {
  let controller: DocumentSigningController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DocumentSigningController],
    }).compile();

    controller = module.get<DocumentSigningController>(DocumentSigningController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
