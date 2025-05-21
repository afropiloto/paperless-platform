import { Injectable, Logger } from '@nestjs/common';
import { AccountCreationDto, AccountUpdateDto } from './dtos/accounts.dto';
import { AccountsRepository } from './accounts.repository';

@Injectable()
export class AccountsService {
  private readonly logger = new Logger(AccountsService.name);
  constructor(
   private readonly accountsRepository: AccountsRepository,
  ) {}

  async findByAccountId(accountId: string) {
    return await this.accountsRepository.findAccountById(accountId);
  }

  async createAccount(accountDto: AccountCreationDto) {
    return this.accountsRepository.createAccount(accountDto);
  }

  async accountExists(accountId: string) : Promise<boolean> {
    return this.accountsRepository.accountExists(accountId);
  }

  updateAccount(accountId: string, updates: AccountUpdateDto) {
    return this.accountsRepository.updateAccount(accountId, updates);
  }

  accountForWalletAddressExists(accountWalletAddress: string) {
    return this.accountsRepository.accountWithWalletAddressExists(accountWalletAddress);
  }

  async findByWalletAddress(walletAddress: string) {
    return this.accountsRepository.findByWalletAddress(walletAddress);
  }
}
