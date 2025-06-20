import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage, Types } from 'mongoose';
import { plainToInstance } from 'class-transformer';
import { SearchQueryDto, SearchResultsMetadata } from '../common/dtos/search.dto';
import { AccountUser, AccountUserDocument } from './schemas/account-user.schema';
import { CreateAccountUserDto, UpdateAccountUserDto, AccountUserResponseDto } from './dtos/account-user.dto';
import { AccountUsersSearchResultsDto } from './dtos/account-users-search-results.dto';

@Injectable()
export class AccountUsersRepository {
  private readonly logger = new Logger(AccountUsersRepository.name);

  constructor(
    @InjectModel(AccountUser.name) private accountUserModel: Model<AccountUserDocument>,
  ) {}

  async create(createAccountUserDto: CreateAccountUserDto): Promise<AccountUserResponseDto> {
    try {
      const accountUser = new this.accountUserModel({
        ...createAccountUserDto,
        accountId: new Types.ObjectId(createAccountUserDto.accountId),
      });
      
      const savedAccountUser = await accountUser.save();
      const accountUserObject = savedAccountUser.toObject();
      
      return plainToInstance(AccountUserResponseDto, {
        id: accountUserObject._id.toString(),
        accountId: accountUserObject.accountId.toString(),
        name: accountUserObject.name,
        emailAddress: accountUserObject.emailAddress,
        walletAddress: accountUserObject.walletAddress,
        status: accountUserObject.status,
        permissions: accountUserObject.permissions,
        createdAt: accountUserObject.createdAt,
        updatedAt: accountUserObject.updatedAt,
      }, { excludeExtraneousValues: true });
    } catch (error) {
      this.logger.error({
        msg: 'Failed to create account user',
        details: error.message,
        createAccountUserDto,
      });
      throw new Error('Failed to create account user. Please try again later.');
    }
  }

  async update(id: string, updateAccountUserDto: UpdateAccountUserDto): Promise<AccountUserResponseDto> {
    try {
      const accountUser = await this.accountUserModel.findByIdAndUpdate(
        id,
        { $set: updateAccountUserDto },
        { new: true, runValidators: true }
      );

      if (!accountUser) {
        throw new Error('Account user not found');
      }

      const accountUserObject = accountUser.toObject();

      return plainToInstance(AccountUserResponseDto, {
        id: accountUserObject._id.toString(),
        accountId: accountUserObject.accountId.toString(),
        name: accountUserObject.name,
        emailAddress: accountUserObject.emailAddress,
        walletAddress: accountUserObject.walletAddress,
        status: accountUserObject.status,
        permissions: accountUserObject.permissions,
        createdAt: accountUserObject.createdAt,
        updatedAt: accountUserObject.updatedAt,
      }, { excludeExtraneousValues: true });
    } catch (error) {
      this.logger.error({
        msg: 'Failed to update account user',
        details: error.message,
        id,
        updateAccountUserDto,
      });
      throw new Error('Failed to update account user. Please try again later.');
    }
  }

  async findById(id: string): Promise<AccountUserResponseDto | null> {
    try {
      const accountUser = await this.accountUserModel.findById(id);
      
      if (!accountUser) {
        return null;
      }

      const accountUserObject = accountUser.toObject();

      return plainToInstance(AccountUserResponseDto, {
        id: accountUserObject._id.toString(),
        accountId: accountUserObject.accountId.toString(),
        name: accountUserObject.name,
        emailAddress: accountUserObject.emailAddress,
        walletAddress: accountUserObject.walletAddress,
        status: accountUserObject.status,
        permissions: accountUserObject.permissions,
        createdAt: accountUserObject.createdAt,
        updatedAt: accountUserObject.updatedAt,
      }, { excludeExtraneousValues: true });
    } catch (error) {
      this.logger.error({
        msg: 'Failed to find account user by id',
        details: error.message,
        id,
      });
      throw new Error('Failed to retrieve account user. Please try again later.');
    }
  }

  async findByAccountId(accountId: string, searchParams: SearchQueryDto): Promise<AccountUsersSearchResultsDto> {
    try {
      const {
        queryTerm,
        page = 1,
        limit = 10,
        orderBy = 'updatedAt',
        orderDirection = 'desc'
      } = searchParams;

      const skip = (page - 1) * limit;
      const sortDirection = orderDirection === 'asc' ? 1 : -1;

      // Build match stage for search
      const matchStage: any = { accountId: new Types.ObjectId(accountId) };
      
      if (queryTerm && queryTerm.length > 0) {
        matchStage.$or = [
          { name: { $regex: queryTerm, $options: 'i' } },
          { emailAddress: { $regex: queryTerm, $options: 'i' } },
          { walletAddress: { $regex: queryTerm, $options: 'i' } },
          { status: { $regex: queryTerm, $options: 'i' } }
        ];
      }

      // Base pipeline with field additions
      const basePipeline: PipelineStage[] = [
        { $match: matchStage },
        {
          $addFields: {
            id: { $toString: '$_id' },
            accountIdString: { $toString: '$accountId' }
          }
        },
        {
          $project: {
            _id: 0,
            id: 1,
            accountId: '$accountIdString',
            name: 1,
            emailAddress: 1,
            walletAddress: 1,
            status: 1,
            permissions: 1,
            createdAt: 1,
            updatedAt: 1
          }
        }
      ];

      // Get total count for pagination
      const countPipeline = [...basePipeline, { $count: 'total' }];
      const totalRecords = await this.accountUserModel
        .aggregate(countPipeline)
        .exec();

      const total = totalRecords[0]?.total || 0;
      const totalPages = Math.ceil(total / limit);

      // Build data pipeline with sorting and pagination
      const dataPipeline: PipelineStage[] = [
        ...basePipeline,
        { $sort: { [orderBy]: sortDirection as 1 | -1 } },
        { $skip: skip },
        { $limit: limit }
      ];

      const results = await this.accountUserModel
        .aggregate(dataPipeline)
        .exec();

      const data = results.map(result =>
        plainToInstance(AccountUserResponseDto, result, {
          excludeExtraneousValues: true,
        })
      );

      const metadata: SearchResultsMetadata = {
        page,
        totalPages,
        limit
      };

      return {
        data,
        metadata
      };
    } catch (error) {
      this.logger.error({
        msg: 'Failed to find account users by account id',
        details: error.message,
        accountId,
        searchParams,
      });
      throw new Error('Failed to retrieve account users. Please try again later.');
    }
  }
}