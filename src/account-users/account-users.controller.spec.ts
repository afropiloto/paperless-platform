import { Test, TestingModule } from '@nestjs/testing';
import { AccountUsersController } from './account-users.controller';
import { AccountUsersService } from './account-users.service';
import { JwtGuard } from '../auth/guards/jwt-guard';
import { ApiKeyGuard } from '../api-key-auth/api-key.guard';

describe('AccountUsersController', () => {
  let controller: AccountUsersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AccountUsersController],
      providers: [
        {
          provide: AccountUsersService,
          useValue: {},
        },
      ],
    })
      .overrideGuard(JwtGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(ApiKeyGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AccountUsersController>(AccountUsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
