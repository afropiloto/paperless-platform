import {
  BadRequestException, 
  forwardRef,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  AccountCreationDto,
  AccountStatusUpdateDto,
  AccountUpdateDto,
} from './dtos/accounts.dto';
import { AccountsRepository } from './accounts.repository';
import { isValidObjectId } from 'mongoose';
import { SearchQueryDto } from '../common/dtos/search.dto';
import { AccountStatus } from './types/account.types';
import { AccountUsersService } from '../account-users/account-users.service';
import { AccountUserStatus } from '../account-users/schemas';

@Injectable()
export class AccountsService {
  private readonly logger = new Logger(AccountsService.name);
  constructor(
    @Inject(forwardRef(() => AccountUsersService))
    private readonly accountUsersService: AccountUsersService,
    private readonly accountsRepository: AccountsRepository) {}

  async findByAccountId(accountId: string) {
    if (!isValidObjectId(accountId)) {
      throw new BadRequestException('Invalid account id');
    }
    const account = await this.accountsRepository.findAccountById(accountId);
    this.logger.debug({ accountId, account });
    if (!account) {
      throw new NotFoundException('Account not found');
    }
    return account;
  }

  async createAccount(accountDto: AccountCreationDto) {
    return this.accountsRepository.createAccount(accountDto);
  }

  async accountExists(accountId: string): Promise<boolean> {
    return this.accountsRepository.accountExists(accountId);
  }

  async updateAccountStatus(
    accountId: string,
    updates: AccountStatusUpdateDto,
  ) {
    const exists = await this.accountExists(accountId);

    if (!exists) {
      throw new NotFoundException('Account not found');
    }

    if (updates.status === AccountStatus.SUSPENDED || updates.status === AccountStatus.CLOSED) {
      // Need to ensure all user accounts are suspended to prevent login
      const userAccounts = await this.accountUsersService.findAllAccountUsersByAccountId(accountId);
      await Promise.all(
        userAccounts.map((account) =>
          this.accountUsersService.updateAccountUserStatus(account.id, AccountUserStatus.SUSPENDED)
        )
      );
    }
      return await this.accountsRepository.updateAccount(accountId, updates);
  }

  async updateAccount(accountId: string, updates: AccountUpdateDto) {
    const exists = await this.accountExists(accountId);
    if (!exists) {
      throw new NotFoundException('Account not found');
    }

    return await this.accountsRepository.updateAccount(accountId, updates);
  }

  accountForWalletAddressExists(accountWalletAddress: string) {
    return this.accountsRepository.accountWithWalletAddressExists(
      accountWalletAddress,
    );
  }

  async findByWalletAddress(walletAddress: string) {
    return this.accountsRepository.findByWalletAddress(walletAddress);
  }

  async findByCompanyName(companyName: string) {
    return this.accountsRepository.findByCompanyName(companyName);
  }

  async findContactsByEmail(email: string) {
    return this.accountsRepository.findContactsByEmail(email);
  }

  async findUsersByEmail(email: string) {
    return this.accountsRepository.findUsersByEmail(email);
  }

  async findUsersByWalletAddress(walletAddress: string) {
    return this.accountsRepository.findUsersByWalletAddress(walletAddress);
  }

  searchAccounts(searchParams: SearchQueryDto, includes: string[]) {
    return this.accountsRepository.findAccounts(searchParams, includes);
  }
}
