import { Test, TestingModule } from '@nestjs/testing';
import { AccountUsersService } from './account-users.service';

describe('AccountUsersService', () => {
  let service: AccountUsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AccountUsersService],
    }).compile();

    service = module.get<AccountUsersService>(AccountUsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
