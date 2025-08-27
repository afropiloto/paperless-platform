import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage, Types } from 'mongoose';
import { plainToInstance } from 'class-transformer';
import { SearchResultsMetadata } from '../common/dtos/search.dto';
import { AccountUser, AccountUserDocument, AccountUserStatus } from './schemas';
import { CreateAccountUserDto, UpdateAccountUserDto, AccountUserResponseDto, UserPermissionDto, AccountUsersSearchDto, AccountUserSecurityDetailsDto } from './dtos';
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
      'Portal-DealDesk': ApplicationModule.PORTAL_DEAL_DESK,
      'Portal-OnboardingDesk': ApplicationModule.PORTAL_ONBOARDING_DESK,
      'Portal-Admin': ApplicationModule.PORTAL_ADMIN,
      'Paiperless-Trade-Documents': ApplicationModule.PAIPERLESS_TRADE_DOCUMENTS,
      'Paiperless-Trade-Finance': ApplicationModule.PAIPERLESS_TRADE_FINANCE,
      'Paiperless-Admin': ApplicationModule.PAIPERLESS_ADMIN
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
      [ApplicationModule.PORTAL_DEAL_DESK]: 'Portal-DealDesk',
      [ApplicationModule.PORTAL_ONBOARDING_DESK]: 'Portal-OnboardingDesk',
      [ApplicationModule.PORTAL_ADMIN]: 'Portal-Admin',
      [ApplicationModule.PAIPERLESS_TRADE_DOCUMENTS]: 'Paiperless-Trade-Documents',
      [ApplicationModule.PAIPERLESS_TRADE_FINANCE]: 'Paiperless-Trade-Finance',
      [ApplicationModule.PAIPERLESS_ADMIN]: 'Paiperless-Admin'
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

      const accountUserData: any = {
        accountId: new Types.ObjectId(createAccountUserDto.accountId),
        name: createAccountUserDto.name,
        emailAddress: createAccountUserDto.emailAddress,
        walletAddress: createAccountUserDto.walletAddress,
        status: createAccountUserDto.status || 'Active',
        authMethod: createAccountUserDto.authMethod,
        mfaEnabled: createAccountUserDto.enableMfa,
        permissions: transformedPermissions,
      };

      // Add password-related fields if provided (for email/password auth)
      if (createAccountUserDto.passwordHash) {
        accountUserData.passwordHash = createAccountUserDto.passwordHash;
      }
      if (createAccountUserDto.passwordChanged !== undefined) {
        accountUserData.passwordChanged = createAccountUserDto.passwordChanged;
      }
      if (createAccountUserDto.failedLoginAttempts !== undefined) {
        accountUserData.failedLoginAttempts = createAccountUserDto.failedLoginAttempts;
      }

      const accountUser = new this.accountUserModel(accountUserData);
      
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
        authMethod: accountUserObject.authMethod,
        mfaEnabled: accountUserObject.mfaEnabled,
        mfaSetupRequired: accountUserObject.mfaSetupRequired,
        firstLoginAt: accountUserObject.firstLoginAt,
        passwordChanged: accountUserObject.passwordChanged,
        passwordResetRequired: accountUserObject.passwordResetRequired,
        accountLockedUntil: accountUserObject.accountLockedUntil,
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
        authMethod: accountUserObject.authMethod,
        mfaEnabled: accountUserObject.mfaEnabled,
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

  async updateSecurity(
    id: string, 
    securityUpdates: {
      passwordHash?: string;
      passwordChanged?: boolean;
      passwordResetRequired?: boolean;
      failedLoginAttempts?: number;
      accountLockedUntil?: Date;
      mfaSecret?: string;
      mfaBackupCodes?: string[];
      mfaEnabled?: boolean;
      mfaSetupRequired?: boolean;
      mfaSetupCompleted?: Date;
    }
  ): Promise<AccountUserResponseDto> {
    this.logger.debug({securityUpdates});
    try {
      // Build update object with only provided security fields
      const updateData: any = {};
      
      if (securityUpdates.passwordHash !== undefined) {
        updateData.passwordHash = securityUpdates.passwordHash;
        // Set passwordChanged to true when password is updated
        updateData.passwordChanged = true;
        updateData.lastPasswordChange = new Date();
      }
      if (securityUpdates.passwordChanged !== undefined) {
        updateData.passwordChanged = securityUpdates.passwordChanged;
      }
      if (securityUpdates.passwordResetRequired !== undefined) {
        updateData.passwordResetRequired = securityUpdates.passwordResetRequired;
      }
      if (securityUpdates.failedLoginAttempts !== undefined) {
        updateData.failedLoginAttempts = securityUpdates.failedLoginAttempts;
      }
      if (securityUpdates.accountLockedUntil !== undefined) {
        updateData.accountLockedUntil = securityUpdates.accountLockedUntil;
      }
      if (securityUpdates.mfaSecret !== undefined) {
        updateData.mfaSecret = securityUpdates.mfaSecret;
      }
      if (securityUpdates.mfaBackupCodes !== undefined) {
        updateData.mfaBackupCodes = securityUpdates.mfaBackupCodes;
      }
      if (securityUpdates.mfaEnabled !== undefined) {
        updateData.mfaEnabled = securityUpdates.mfaEnabled;
      }
      if (securityUpdates.mfaSetupRequired !== undefined) {
        updateData.mfaSetupRequired = securityUpdates.mfaSetupRequired;
      }
      if (securityUpdates.mfaSetupCompleted !== undefined) {
        updateData.mfaSetupCompleted = securityUpdates.mfaSetupCompleted;
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
        authMethod: accountUserObject.authMethod,
        mfaEnabled: accountUserObject.mfaEnabled,
        permissions: responsePermissions,
        createdAt: accountUserObject.createdAt,
        updatedAt: accountUserObject.updatedAt,
      }, { excludeExtraneousValues: true });
    } catch (error) {
      this.logger.error({
        msg: 'Failed to update account user security',
        details: error.message,
        id,
        securityUpdates,
      });
      throw new Error('Failed to update account user security. Please try again later.');
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
        authMethod: accountUserObject.authMethod,
        mfaEnabled: accountUserObject.mfaEnabled,
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
        authMethod: accountUserObject.authMethod,
        mfaEnabled: accountUserObject.mfaEnabled,
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

  async findByEmail(email: string): Promise<AccountUserResponseDto | null> {
    try {
      const accountUser = await this.accountUserModel.findOne({ 
        emailAddress: { $regex: new RegExp(`^${email}$`, 'i') },
        status: { $ne: 'Deleted' } // Exclude deleted users
      }).select('+passwordHash +mfaSecret +mfaBackupCodes'); // Include sensitive fields
      
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
        authMethod: accountUserObject.authMethod,
        mfaEnabled: accountUserObject.mfaEnabled,
        mfaSetupRequired: accountUserObject.mfaSetupRequired,
        firstLoginAt: accountUserObject.firstLoginAt,
        passwordChanged: accountUserObject.passwordChanged,
        accountLockedUntil: accountUserObject.accountLockedUntil,
        permissions: responsePermissions,
        createdAt: accountUserObject.createdAt,
        updatedAt: accountUserObject.updatedAt,
      }, { excludeExtraneousValues: true });
    } catch (error) {
      this.logger.error({
        msg: 'Failed to find account user by email',
        details: error.message,
        email,
      });
      throw new Error('Failed to retrieve account user. Please try again later.');
    }
  }

  async findByEmailForAuth(email: string): Promise<any | null> {
    try {
      const accountUser = await this.accountUserModel.findOne({ 
        emailAddress: { $regex: new RegExp(`^${email}$`, 'i') },
        status: { $ne: 'Deleted' } // Exclude deleted users
      }).select('+passwordHash +mfaSecret +mfaBackupCodes'); // Include sensitive fields
      
      if (!accountUser) {
        return null;
      }

      const accountUserObject = accountUser.toObject();

      // Transform permissions back to DTO format for response
      const responsePermissions = this.transformPermissionsToDto(accountUserObject.permissions);

      // Return raw object with sensitive fields for authentication purposes
      return {
        id: accountUserObject._id.toString(),
        accountId: accountUserObject.accountId.toString(),
        name: accountUserObject.name,
        emailAddress: accountUserObject.emailAddress,
        walletAddress: accountUserObject.walletAddress,
        status: accountUserObject.status,
        authMethod: accountUserObject.authMethod,
        mfaEnabled: accountUserObject.mfaEnabled,
        mfaSetupRequired: accountUserObject.mfaSetupRequired,
        firstLoginAt: accountUserObject.firstLoginAt,
        passwordChanged: accountUserObject.passwordChanged,
        passwordResetRequired: accountUserObject.passwordResetRequired,
        accountLockedUntil: accountUserObject.accountLockedUntil,
        failedLoginAttempts: accountUserObject.failedLoginAttempts,
        // Include sensitive fields for authentication
        passwordHash: accountUserObject.passwordHash,
        mfaSecret: accountUserObject.mfaSecret,
        mfaBackupCodes: accountUserObject.mfaBackupCodes,
        permissions: responsePermissions,
        createdAt: accountUserObject.createdAt,
        updatedAt: accountUserObject.updatedAt,
      };
    } catch (error) {
      this.logger.error({
        msg: 'Failed to find account user by email for auth',
        details: error.message,
        email,
      });
      throw new Error('Failed to retrieve account user for authentication. Please try again later.');
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
        authMethod: accountUserObject.authMethod,
        mfaEnabled: accountUserObject.mfaEnabled,
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

  async findSecurityDetailsById(id: string): Promise<AccountUserSecurityDetailsDto | null> {
    try {
      // Use select to explicitly include security fields that are normally excluded
      const accountUser = await this.accountUserModel.findById(id)
        .select('+passwordHash +mfaSecret +mfaBackupCodes')
        .exec();

      if (!accountUser) {
        return null;
      }

      const accountUserObject = accountUser.toObject();

      // Transform permissions from schema format to DTO format
      const responsePermissions = this.transformPermissionsToDto(accountUserObject.permissions);

      return plainToInstance(AccountUserSecurityDetailsDto, {
        id: accountUserObject._id.toString(),
        accountId: accountUserObject.accountId.toString(),
        name: accountUserObject.name,
        emailAddress: accountUserObject.emailAddress,
        walletAddress: accountUserObject.walletAddress,
        status: accountUserObject.status,
        authMethod: accountUserObject.authMethod,
        passwordHash: accountUserObject.passwordHash,
        passwordChanged: accountUserObject.passwordChanged,
        lastPasswordChange: accountUserObject.lastPasswordChange,
        failedLoginAttempts: accountUserObject.failedLoginAttempts,
        accountLockedUntil: accountUserObject.accountLockedUntil,
        mfaSecret: accountUserObject.mfaSecret,
        mfaEnabled: accountUserObject.mfaEnabled,
        mfaBackupCodes: accountUserObject.mfaBackupCodes,
        mfaSetupRequired: accountUserObject.mfaSetupRequired,
        firstLoginAt: accountUserObject.firstLoginAt,
        permissions: responsePermissions,
        createdAt: accountUserObject.createdAt,
        updatedAt: accountUserObject.updatedAt,
      }, { excludeExtraneousValues: true });
    } catch (error) {
      this.logger.error({
        msg: 'Failed to find account user security details by id',
        details: error.message,
        id,
      });
      throw new Error('Failed to retrieve account user security details. Please try again later.');
    }
  }
}
