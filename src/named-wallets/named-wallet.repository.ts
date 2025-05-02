import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { NamedWallet } from './schemas/named-wallet.schema';
import { CreateNamedWalletDto, NamedWalletDto, UpdateNamedWalletDto } from './dtos/named-wallets.dto';
import { plainToInstance } from 'class-transformer';


@Injectable()
export class NamedWalletsRepository {
  private readonly logger = new Logger(NamedWalletsRepository.name);

  constructor(@InjectModel(NamedWallet.name) private namedWalletModel: Model<NamedWallet>) {}


  async getAccountWallets(accountId: string): Promise<NamedWalletDto[]> {
    const results = await this.namedWalletModel.find({accountId})
      .lean().exec();
    this.logger.debug(results)
    return results ? plainToInstance(NamedWalletDto, results) : [];
  }

  async accountWalletAddressExists(accountId: string, walletAddress: string): Promise<boolean> {
    return (await this.namedWalletModel.exists({accountId, walletAddress})) !== null;
  }


  async getAccountWalletById(accountId: string, walletId: string): Promise<NamedWalletDto> {
    const results = await this.namedWalletModel.findOne({accountId, _id: walletId})
      .lean().exec();

    return results ? plainToInstance(NamedWalletDto, results): null;
  }

  async createNamedWallet(accountId: string, newWalletDetails: CreateNamedWalletDto) {
    const namedWallet =  await this.namedWalletModel.create({ accountId, ...newWalletDetails });
    return plainToInstance(NamedWalletDto, namedWallet);
  }

  async updateNamedWallet(accountId: string, walletId: string, updates: UpdateNamedWalletDto) {
    const updatedWalletDetails = await this.namedWalletModel.findOneAndUpdate({
      accountId,
      _id: walletId
    }, { ...updates }, { returnDocument: "after" });

    return plainToInstance(NamedWalletDto, updatedWalletDetails)
  }


  async deleteAccountWallet(accountId: string, walletId: string) {
    const result = await this.namedWalletModel.deleteOne({
      accountId,
      _id: walletId
    })
    return result.deletedCount !== 0;
  }
}