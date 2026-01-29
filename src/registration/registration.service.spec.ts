import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { RegistrationService } from './registration.service';
import { RegistrationRepository } from './registration.repository';
import { AccountsService } from '../accounts/accounts.service';
import { FILE_STORAGE_SERVICE } from '../file-storage/file-storage.constants';
import { OnboardingQueues } from '../constants/app.constants';

describe('RegistrationService', () => {
  let service: RegistrationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegistrationService,
        {
          provide: AccountsService,
          useValue: { accountForWalletAddressExists: jest.fn() },
        },
        {
          provide: RegistrationRepository,
          useValue: {
            create: jest.fn(),
            findByRegistrationId: jest.fn(),
            registrationForWalletAddressExists: jest.fn(),
          },
        },
        {
          provide: FILE_STORAGE_SERVICE,
          useValue: { uploadFile: jest.fn(), getFileStream: jest.fn() },
        },
        {
          provide: getQueueToken(OnboardingQueues.NEW_ONBOARDING_REQUESTS),
          useValue: { add: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<RegistrationService>(RegistrationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
