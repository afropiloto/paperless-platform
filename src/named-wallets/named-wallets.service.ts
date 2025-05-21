import { HttpException, HttpStatus, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CreateNamedWalletDto, NamedWalletDto, UpdateNamedWalletDto } from './dtos/named-wallets.dto';
import { NamedWalletsRepository } from './named-wallet.repository';
import { SearchQueryDto } from '../trade-documents/dtos/search-trade-documents.dto';
import { plainToInstance } from 'class-transformer';
import { NamedWalletsSearchResultsDto } from './dtos/named-wallets-search-results.dto';
import mongoose from 'mongoose';
import { AccountsService } from '../accounts/accounts.service';

@Injectable()
export class NamedWalletsService {
  private readonly logger = new Logger(NamedWalletsService.name);
  constructor(private readonly accountService: AccountsService,
    private readonly namedWalletRepository: NamedWalletsRepository
  ) {}

  async getWalletsForAccountId(accountId: string, searchParams: SearchQueryDto): Promise<NamedWalletsSearchResultsDto> {
    const results = await this.namedWalletRepository.getAccountWallets(accountId, searchParams);
    this.logger.debug({results})

    return results ? plainToInstance(NamedWalletsSearchResultsDto, results) : undefined;
  }
  
  async getWalletForAccount(accountId: string, walletId: string) {
    if (!mongoose.isValidObjectId(walletId) || !mongoose.isValidObjectId(accountId)) {
      throw new NotFoundException("Account or Wallet not found");
    }
    const namedWallet = await this.namedWalletRepository.getAccountWalletById(accountId, walletId);
    if (!namedWallet) {throw new NotFoundException('Account Named Wallet not found')}

    return namedWallet;
  }

  async walletAddressExistsForAccount(accountId: string, walletAddress:string):Promise<boolean> {
    return await this.namedWalletRepository.accountWalletAddressExists(accountId, walletAddress);
  }

  async createNamedWallet(accountId: string, createNamedWalletDto: CreateNamedWalletDto): Promise<NamedWalletDto> {
    // Check if the account id exists
    const accountExists = await this.accountService.accountExists(accountId);
    if (!accountExists) {
      throw new HttpException('Account not found', HttpStatus.NOT_FOUND);
    }
    // Check if the Wallet address exists for the account
    const walletExists = await this.walletAddressExistsForAccount(accountId, createNamedWalletDto.walletAddress);
    if (walletExists) {
      throw new HttpException('Wallet Address already assigned to a Named Wallet for this Account', HttpStatus.BAD_REQUEST);
    }
    return await this.namedWalletRepository.createNamedWallet(accountId, createNamedWalletDto);

  }

  async updateNamedWallet(accountId: string, walletId: string, updates: UpdateNamedWalletDto) {
    if (!mongoose.isValidObjectId(walletId) || !mongoose.isValidObjectId(accountId)) {
      throw new NotFoundException("Account or Wallet not found");
    }
    // Check if the account id exists
    const accountExists = await this.accountService.accountExists(accountId);
    if (!accountExists) {
      throw new NotFoundException("Account or Wallet not found");
    }
    return await this.namedWalletRepository.updateNamedWallet(accountId, walletId, updates);
  }

  async deleteNamedWallet(accountId: string, walletId: string) {
    return await this.namedWalletRepository.deleteAccountWallet(accountId, walletId);
  }
}
