import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Account } from './schemas/account.schema';
import { Model } from 'mongoose';
import { AccountCreationDto, AccountDetailsDto, AccountUpdateDto } from './dtos/accounts.dto';
import { plainToInstance } from 'class-transformer';


@Injectable()
export class AccountsRepository {
  private readonly logger = new Logger(AccountsRepository.name);
  constructor(@InjectModel(Account.name) private accountModel: Model<Account>) {}


  async findAccountById(accountId: string): Promise<AccountDetailsDto> {
    const accountDetails = await this.accountModel.findOne({accountId});
    return accountDetails ? plainToInstance(AccountDetailsDto, accountDetails) : null;
  }

  async createAccount(accountDetails: AccountCreationDto): Promise<AccountDetailsDto> {
    const newAccountDetails = await this.accountModel.create(accountDetails);
    return plainToInstance(AccountDetailsDto, newAccountDetails);
  }

  async accountExists(accountId: string): Promise<boolean> {
    return (await this.accountModel.exists({_id: accountId})) !== null;
  }

  async updateAccount(accountId: string, updates: AccountUpdateDto): Promise<AccountDetailsDto> {
    const updatedAccountDetails = await this.accountModel.findOneAndUpdate({_id: accountId}, updates, {returnDocument: "after"});
    return plainToInstance(AccountDetailsDto, updatedAccountDetails);
  }

  async accountWithWalletAddressExists(accountWalletAddress: string) {
    return (await this.accountModel.exists({walletAddress: accountWalletAddress})) !== null;

  }

  async findByWalletAddress(walletAddress: string): Promise<AccountDetailsDto> {
    const accountDetails = await this.accountModel.findOne({ walletAddress: walletAddress });
    return accountDetails ? plainToInstance(AccountDetailsDto, accountDetails) : null;
  }
}