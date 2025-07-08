import { BadRequestException, HttpException, HttpStatus, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { AccountCreationDto, AccountStatusUpdateDto, AccountUpdateDto } from './dtos/accounts.dto';
import { AccountsRepository } from './accounts.repository';
import { isValidObjectId } from 'mongoose';
import { SearchQueryDto } from '../common/dtos/search.dto';

@Injectable()
export class AccountsService {
  private readonly logger = new Logger(AccountsService.name);
  constructor(
   private readonly accountsRepository: AccountsRepository,
  ) {}

  async findByAccountId(accountId: string) {
    if (!isValidObjectId(accountId)) {
      throw new BadRequestException("Invalid account id");
    }
    const account =  await this.accountsRepository.findAccountById(accountId);
    if (!account) {
      throw new NotFoundException('Account not found');
    }
    return account;
  }

  async createAccount(accountDto: AccountCreationDto) {
    return this.accountsRepository.createAccount(accountDto);
  }

  async accountExists(accountId: string) : Promise<boolean> {
    return this.accountsRepository.accountExists(accountId);
  }

  async updateAccount(accountId: string, updates: AccountUpdateDto | AccountStatusUpdateDto) {

    const exists = await this.accountExists(accountId);
    if (!exists) {
      throw new NotFoundException('Account not found');
    }

    return await this.accountsRepository.updateAccount(accountId, updates);
  }

  accountForWalletAddressExists(accountWalletAddress: string) {
    return this.accountsRepository.accountWithWalletAddressExists(accountWalletAddress);
  }

  async findByWalletAddress(walletAddress: string) {
    return this.accountsRepository.findByWalletAddress(walletAddress);
  }

  searchAccounts(searchParams: SearchQueryDto, includes: string[]) {
   return this.accountsRepository.findAccounts(searchParams, includes);
  }
}
