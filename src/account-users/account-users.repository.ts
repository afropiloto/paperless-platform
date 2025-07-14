import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage, Types } from 'mongoose';
import { plainToInstance } from 'class-transformer';
import { SearchResultsMetadata } from '../common/dtos/search.dto';
import { AccountUser, AccountUserDocument, AccountUserStatus } from './schemas';
import { CreateAccountUserDto, UpdateAccountUserDto, AccountUserResponseDto, UserPermissionDto, AccountUsersSearchDto } from './dtos';
import { AccountUsersSearchResultsDto } from './dtos';
import { ApplicationModule, ApplicationRole, ApplicationPermissions } from './schemas';

@Injectable()
export class AccountUsersRepository {
  private readonly logger = new Logger(AccountUsersRepository.name);

  constructor(
    @InjectModel(AccountUser.name) private accountUserModel: Model<AccountUserDocument>,
  ) {}

  /**
   * Transforms DTO format (moduleId/roleId) to schema format (module/role)
   */
  private transformPermissionsToSchema(permissions: UserPermissionDto[]): ApplicationPermissions[] {
    const moduleMap: Record<string, ApplicationModule> = {
      'DealDesk': ApplicationModule.DEAL_DESK,
      'Paiperless': ApplicationModule.PAIPERLESS,
      'OnboardingDesk': ApplicationModule.ONBOARDING_DESK,
      'PortalAdmin': ApplicationModule.PORTAL_ADMIN,
    };

    const roleMap: Record<string, ApplicationRole> = {
      'Agent': ApplicationRole.AGENT,
      'Supervisor': ApplicationRole.SUPERVISOR,
      'Manager': ApplicationRole.MANAGER,
    };

    return permissions.map(permission => ({
      module: moduleMap[permission.module],
      role: roleMap[permission.role],
    }));
  }

  /**
   * Transforms schema format (module/role) to DTO format (moduleId/roleId)
   */
  private transformPermissionsToDto(permissions: ApplicationPermissions[]): UserPermissionDto[] {
    const moduleMap: Record<ApplicationModule, string> = {
      [ApplicationModule.DEAL_DESK]: 'DealDesk',
      [ApplicationModule.PAIPERLESS]: 'Paiperless',
      [ApplicationModule.ONBOARDING_DESK]: 'OnboardingDesk',
      [ApplicationModule.PORTAL_ADMIN]: 'PortalAdmin',
    };

    const roleMap: Record<ApplicationRole, string> = {
      [ApplicationRole.AGENT]: 'Agent',
      [ApplicationRole.SUPERVISOR]: 'Supervisor',
      [ApplicationRole.MANAGER]: 'Manager',
    };

    return permissions.map(permission => ({
      module: moduleMap[permission.module],
      role: roleMap[permission.role],
    }));
  }

  async create(createAccountUserDto: CreateAccountUserDto): Promise<AccountUserResponseDto> {
    try {
      // Transform permissions from DTO format to schema format
      const transformedPermissions = this.transformPermissionsToSchema(createAccountUserDto.permissions);

      const accountUser = new this.accountUserModel({
        accountId: new Types.ObjectId(createAccountUserDto.accountId),
        name: createAccountUserDto.name,
        emailAddress: createAccountUserDto.emailAddress,
        walletAddress: createAccountUserDto.walletAddress,
        status: createAccountUserDto.status || 'Active',
        permissions: transformedPermissions,
      });
      
      const savedAccountUser = await accountUser.save();
      const accountUserObject = savedAccountUser.toObject();
      
      // Transform permissions back to DTO format for response
      const responsePermissions = this.transformPermissionsToDto(accountUserObject.permissions);
      
      return plainToInstance(AccountUserResponseDto, {
        id: accountUserObject._id.toString(),
        accountId: accountUserObject.accountId.toString(),
        name: accountUserObject.name,
        emailAddress: accountUserObject.emailAddress,
        walletAddress: accountUserObject.walletAddress,
        status: accountUserObject.status,
        permissions: responsePermissions,
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
      // Build update object with only provided fields
      const updateData: any = {};
      
      // Only include fields that are actually provided
      if (updateAccountUserDto.name !== undefined) {
        updateData.name = updateAccountUserDto.name;
      }
      if (updateAccountUserDto.emailAddress !== undefined) {
        updateData.emailAddress = updateAccountUserDto.emailAddress;
      }
      if (updateAccountUserDto.walletAddress !== undefined) {
        updateData.walletAddress = updateAccountUserDto.walletAddress;
      }
      if (updateAccountUserDto.status !== undefined) {
        updateData.status = updateAccountUserDto.status;
      }
      
      // Handle permissions - if provided, transform and include; if not provided, don't touch existing permissions
      if (updateAccountUserDto.permissions !== undefined) {
        updateData.permissions = this.transformPermissionsToSchema(updateAccountUserDto.permissions);
      }

      const accountUser = await this.accountUserModel.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
      );

      if (!accountUser) {
        throw new Error('Account user not found');
      }

      const accountUserObject = accountUser.toObject();

      // Transform permissions back to DTO format for response
      const responsePermissions = this.transformPermissionsToDto(accountUserObject.permissions);

      return plainToInstance(AccountUserResponseDto, {
        id: accountUserObject._id.toString(),
        accountId: accountUserObject.accountId.toString(),
        name: accountUserObject.name,
        emailAddress: accountUserObject.emailAddress,
        walletAddress: accountUserObject.walletAddress,
        status: accountUserObject.status,
        permissions: responsePermissions,
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

      // Transform permissions back to DTO format for response
      const responsePermissions = this.transformPermissionsToDto(accountUserObject.permissions);

      return plainToInstance(AccountUserResponseDto, {
        id: accountUserObject._id.toString(),
        accountId: accountUserObject.accountId.toString(),
        name: accountUserObject.name,
        emailAddress: accountUserObject.emailAddress,
        walletAddress: accountUserObject.walletAddress,
        status: accountUserObject.status,
        permissions: responsePermissions,
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

  async findByWalletAddress(walletAddress: string): Promise<AccountUserResponseDto | null> {
    try {
      const accountUser = await this.accountUserModel.findOne({ 
        walletAddress: { $regex: new RegExp(`^${walletAddress}$`, 'i') },
        status: { $ne: 'Deleted' } // Exclude deleted users
      });
      
      if (!accountUser) {
        return null;
      }

      const accountUserObject = accountUser.toObject();

      // Transform permissions back to DTO format for response
      const responsePermissions = this.transformPermissionsToDto(accountUserObject.permissions);

      return plainToInstance(AccountUserResponseDto, {
        id: accountUserObject._id.toString(),
        accountId: accountUserObject.accountId.toString(),
        name: accountUserObject.name,
        emailAddress: accountUserObject.emailAddress,
        walletAddress: accountUserObject.walletAddress,
        status: accountUserObject.status,
        permissions: responsePermissions,
        createdAt: accountUserObject.createdAt,
        updatedAt: accountUserObject.updatedAt,
      }, { excludeExtraneousValues: true });
    } catch (error) {
      this.logger.error({
        msg: 'Failed to find account user by wallet address',
        details: error.message,
        walletAddress,
      });
      throw new Error('Failed to retrieve account user. Please try again later.');
    }
  }

  async findByAccountId(accountId: string, searchParams: AccountUsersSearchDto): Promise<AccountUsersSearchResultsDto> {
    try {
      const {
        queryTerm,
        page = 1,
        limit = 10,
        orderBy = 'updatedAt',
        orderDirection = 'desc',
        showDeleted = false
      } = searchParams;

      const skip = (page - 1) * limit;
      const sortDirection = orderDirection === 'asc' ? 1 : -1;

      // Build match stage for search
      const matchStage: any = { accountId: new Types.ObjectId(accountId) };
      
      // Handle deleted users filtering
      if (showDeleted) {
        matchStage.status = { $eq: AccountUserStatus.DELETED };
      } else {
        matchStage.status = { $ne: AccountUserStatus.DELETED };
      }
      
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

      const data = results.map(result => {
        // Transform permissions from schema format to DTO format
        const transformedPermissions = this.transformPermissionsToDto(result.permissions);
        
        return plainToInstance(AccountUserResponseDto, {
          ...result,
          permissions: transformedPermissions,
        }, {
          excludeExtraneousValues: true,
        });
      });

      const metadata: SearchResultsMetadata = {
        page,
        totalPages,
        limit
      };

      return plainToInstance(AccountUsersSearchResultsDto, {
        data,
        metadata
      } )
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

  async findAllByAccountId(accountId: string): Promise<AccountUserResponseDto[]> {
    try {
      const accountUsers = await this.accountUserModel.find({ accountId: new Types.ObjectId(accountId) });
      return accountUsers.map(accountUser => plainToInstance(AccountUserResponseDto, {id: accountUser._id.toString(), accountId: accountUser.accountId.toString(), ...accountUser}, { excludeExtraneousValues: true }));
    } catch (error) {
      this.logger.error({
        msg: 'Failed to find all account users by account id',
        details: error.message,
        accountId,});
      throw new Error('Failed to retrieve account users. Please try again later.');
    }
  }

  async updateAccountUserStatus(accountUserId: string, newStatus: AccountUserStatus) {
    try {
      const accountUser = await this.accountUserModel.findByIdAndUpdate(
        accountUserId,
        { $set: { status: newStatus } },
        { new: true }
      );
      if (!accountUser) {
        throw new Error('Account user not found');
      }

      const accountUserObject = accountUser.toObject();

      // Transform permissions back to DTO format for response
      const responsePermissions = this.transformPermissionsToDto(accountUserObject.permissions);

      return plainToInstance(AccountUserResponseDto, {
        id: accountUserObject._id.toString(),
        accountId: accountUserObject.accountId.toString(),
        name: accountUserObject.name,
        emailAddress: accountUserObject.emailAddress,
        walletAddress: accountUserObject.walletAddress,
        status: accountUserObject.status,
        permissions: responsePermissions,
        createdAt: accountUserObject.createdAt,
        updatedAt: accountUserObject.updatedAt,
      }, { excludeExtraneousValues: true });
    } catch (error) {
      this.logger.error({
        msg: 'Failed to update account user status',
        details: error.message,
        accountUserId,
        newStatus,
      });
      throw new Error('Failed to update account user. Please try again later.');
    }

  }
}
