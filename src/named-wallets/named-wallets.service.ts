import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CreateNamedWalletDto, NamedWalletDto, UpdateNamedWalletDto } from './dtos/named-wallets.dto';
import { NamedWalletsRepository } from './named-wallet.repository';

@Injectable()
export class NamedWalletsService {
  private readonly logger = new Logger(NamedWalletsService.name);
  constructor(
    private readonly namedWalletRepository: NamedWalletsRepository
  ) {}

  async getWalletsForAccountId(accountId: string) {
    return await this.namedWalletRepository.getAccountWallets(accountId);
  }
  
  async getWalletForAccount(accountId: string, walletId: string) {
    const namedWallet = await this.namedWalletRepository.getAccountWalletById(accountId, walletId);
    if (!namedWallet) {throw new NotFoundException('Account Named Wallet not found')}

    return namedWallet;
  }

  async walletAddressExistsForAccount(accountId: string, walletAddress:string):Promise<boolean> {
    return await this.namedWalletRepository.accountWalletAddressExists(accountId, walletAddress);
  }

  async createNamedWallet(accountId: string, createNamedWalletDto: CreateNamedWalletDto): Promise<NamedWalletDto> {
    return await this.namedWalletRepository.createNamedWallet(accountId, createNamedWalletDto);

  }

  async updateNamedWallet(accountId: string, walletId: string, updates: UpdateNamedWalletDto) {
    return await this.namedWalletRepository.updateNamedWallet(accountId, walletId, updates);
  }

  async deleteNamedWallet(accountId: string, walletId: string) {
    return await this.namedWalletRepository.deleteAccountWallet(accountId, walletId);
  }
}
