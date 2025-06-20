import { Test, TestingModule } from '@nestjs/testing';
import { AccountUsersController } from './account-users.controller';

describe('AccountUsersController', () => {
  let controller: AccountUsersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AccountUsersController],
    }).compile();

    controller = module.get<AccountUsersController>(AccountUsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
