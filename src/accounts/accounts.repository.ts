import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Account } from './schemas/account.schema';
import { isValidObjectId, Model, PipelineStage, HydratedDocument } from 'mongoose';
import { AccountCreationDto, AccountDetailsDto, AccountStatusUpdateDto, AccountUpdateDto } from './dtos/accounts.dto';
import { plainToInstance } from 'class-transformer';
import { AccountsSearchResultsDto } from './dtos/search-accounts.dto';
import { SearchQueryDto } from '../common/dtos/search.dto';


@Injectable()
export class AccountsRepository {
  private readonly logger = new Logger(AccountsRepository.name);
  constructor(@InjectModel(Account.name) private accountModel: Model<Account>) {}


  async findAccountById(accountId: string): Promise<AccountDetailsDto> {
    const accountDetails = await this.accountModel.findById(accountId).lean().exec();
    if (!accountDetails) return null;
    
    // Create a new object with id property
    const transformedObject = {
      id: accountDetails._id,
      ...accountDetails
    };
    
    return plainToInstance(AccountDetailsDto, transformedObject, { 
      excludeExtraneousValues: true 
    });
  }

  async createAccount(accountDetails: AccountCreationDto): Promise<AccountDetailsDto> {
    const newAccountDetails = await this.accountModel.create(accountDetails as any) as HydratedDocument<Account>;
    if (!newAccountDetails) {
      throw new BadRequestException('Failed to create account');
    }
    return plainToInstance(AccountDetailsDto, {
      id: newAccountDetails._id.toString(), 
      ...newAccountDetails.toObject()
    });
  }

  async accountExists(accountId: string): Promise<boolean> {
    if (!isValidObjectId(accountId)) {throw new BadRequestException('Invalid account id provided');}
    return (await this.accountModel.exists({_id: accountId})) !== null;
  }

  async updateAccount(accountId: string, updates: AccountUpdateDto|AccountStatusUpdateDto): Promise<AccountDetailsDto> {
    const updatedAccountDetails = await this.accountModel.findOneAndUpdate({_id: accountId}, updates, {returnDocument: "after"});

    return plainToInstance(AccountDetailsDto, updatedAccountDetails.toObject());
  }

  async accountWithWalletAddressExists(accountWalletAddress: string) {
    return (await this.accountModel.exists({walletAddress: accountWalletAddress})) !== null;

  }

  async findByWalletAddress(walletAddress: string): Promise<AccountDetailsDto> {
    const accountDetails = await this.accountModel.findOne({ walletAddress: walletAddress });
    return accountDetails ? plainToInstance(AccountDetailsDto, {id: accountDetails._id, ...accountDetails.toObject()}) : null;
  }

  async findAccounts(searchParams: SearchQueryDto, includes: string[]): Promise<AccountsSearchResultsDto> {
    
    const includesProjection = { id: '$_id', createdAt: 1, updatedAt: 1 };
    includes.forEach((include) => {
      includesProjection[include] = 1;
    });
    const dataFacet = [];
    if (searchParams.orderBy !== undefined && searchParams.orderBy.length > 0) {
      dataFacet.push({
        $sort: {
          [searchParams.orderBy]:
            searchParams.orderDirection === 'desc' ? -1 : 1,
        },
      });
    }
    dataFacet.push({ $skip: (searchParams.page - 1) * searchParams.limit });
    dataFacet.push({ $limit: searchParams.limit });
    const searchableFields = ['status', 'accountName'];

    const aggregationPipeline: PipelineStage[] = [];
    // Add filter to restrict data to the account wallet address

    aggregationPipeline.push(
      { $project: includesProjection },
    );
    // Add filter criteria if a query term is provided
    if (
      searchParams.queryTerm !== undefined &&
      searchParams.queryTerm.length > 0
    ) {
      aggregationPipeline.push({
        $match: {
          $or: searchableFields.map((field) => ({
            [field]: { $regex: searchParams.queryTerm, $options: 'i' },
          })),
        },
      });
    }
    aggregationPipeline.push({
      $sort: { lastModified: -1 },
    });
    aggregationPipeline.push({
      $facet: {
        metadata: [
          {
            $count: 'totalDocuments',
          },
          {
            $addFields: {
              page: searchParams.page,
              totalPages: {
                $ceil: { $divide: ['$totalDocuments', searchParams.limit] },
              },
              limit: searchParams.limit,
            },
          },
        ],
        data: dataFacet,
      },
    });

    try {
      const result = (await this.accountModel.aggregate(aggregationPipeline))[0];

      // Deal with no data
      if (result['data'].length === 0) {
        result['metadata'] = {
          totalDocuments: 0,
          page: searchParams.page,
          totalPages: 0,
          limit: searchParams.limit,
        };
        result['data'] = [];
      } else {
        result['metadata'] = { ...result['metadata'][0] };
      }
      return plainToInstance(AccountsSearchResultsDto, result);

    } catch (error) {
      this.logger.error({
        msg: 'Failed to retrieve Account details',
        details: error.message,
        searchParams,
      });
      throw new Error(
        'We encountered an problem retrieving Account Details. We have logged this issue please try again later',
      );
    }

  }

  async findByCompanyName(companyName: string): Promise<AccountDetailsDto[]> {
    const accounts = await this.accountModel.find({ 
      'company.name': { $regex: new RegExp(companyName, 'i') } 
    }).lean().exec();
    
    return accounts.map(account => {
      const transformedObject = {
        id: account._id,
        ...account
      };
      return plainToInstance(AccountDetailsDto, transformedObject, { 
        excludeExtraneousValues: true 
      });
    });
  }

  async findContactsByEmail(email: string): Promise<AccountDetailsDto[]> {
    const accounts = await this.accountModel.find({ 
      'contact.emailAddress': { $regex: new RegExp(email, 'i') } 
    }).lean().exec();
    
    return accounts.map(account => {
      const transformedObject = {
        id: account._id,
        ...account
      };
      return plainToInstance(AccountDetailsDto, transformedObject, { 
        excludeExtraneousValues: true 
      });
    });
  }

  async findUsersByEmail(email: string): Promise<AccountDetailsDto[]> {
    // This would need to be implemented based on the account-users relationship
    // For now, returning empty array as we need to understand the relationship structure
    return [];
  }

  async findUsersByWalletAddress(walletAddress: string): Promise<AccountDetailsDto[]> {
    // This would need to be implemented based on the account-users relationship
    // For now, returning empty array as we need to understand the relationship structure
    return [];
  }
}