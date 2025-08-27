import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { isValidObjectId } from 'mongoose';
import { AccountUsersRepository } from './account-users.repository';
import {
  AccountUserResponseDto,
  AccountUsersSearchDto,
  CreateAccountUserDto,
  UpdateAccountUserDto,
  AccountUserSecurityDetailsDto,
} from './dtos';
import { AccountUsersSearchResultsDto } from './dtos';
import { PermissionsValidationService } from './services/permissions-validation.service';
import { AccountsService } from '../accounts/accounts.service';
import { AccountUserStatus, AuthMethod } from './schemas';
import { PasswordService } from '../auth/services/password.service';

@Injectable()
export class AccountUsersService {
  private readonly logger = new Logger(AccountUsersService.name);

  constructor(
    private readonly accountUsersRepository: AccountUsersRepository,
    private readonly permissionsValidationService: PermissionsValidationService,
    @Inject(forwardRef(() => AccountsService))
    private readonly accountService: AccountsService,
    private readonly passwordService: PasswordService
  ) {}

  async createAccountUser(
    createAccountUserDto: CreateAccountUserDto,
  ): Promise<AccountUserResponseDto> {

    // Validate accountId format
    if (!isValidObjectId(createAccountUserDto.accountId)) {
      throw new BadRequestException('Invalid account ID format');
    }

    // Validate permissions
    if (
      createAccountUserDto.permissions &&
      createAccountUserDto.permissions.length > 0
    ) {
      await this.permissionsValidationService.validatePermissions(
        createAccountUserDto.permissions,
      );
    }

    // Check the Account exists
    if (!(await this.accountService.accountExists(createAccountUserDto.accountId))) {
      throw new NotFoundException('Linked AccountID not found');
    }

    // Handle email/password authentication setup
    if (createAccountUserDto.authMethod === AuthMethod.EMAIL_PASSWORD || 
        createAccountUserDto.authMethod === AuthMethod.BOTH) {
      
      let temporaryPassword = createAccountUserDto.temporaryPassword;
      
      // Generate temporary password if not provided
      if (!temporaryPassword) {
        temporaryPassword = this.passwordService.generateSecurePassword();
        this.logger.log(`Generated temporary password for user ${createAccountUserDto.emailAddress}`);
      }
      
      // Validate temporary password if provided
      if (temporaryPassword) {
        const validation = this.passwordService.validatePassword(temporaryPassword);
        if (!validation.isValid) {
          throw new BadRequestException(`Temporary password does not meet policy: ${validation.errors.join(', ')}`);
        }
      }
      
      // Hash the temporary password
      const passwordHash = await this.passwordService.hashPassword(temporaryPassword);
      
      // Add password hash and related fields to the DTO
      const enrichedDto = {
        ...createAccountUserDto,
        passwordHash,
        passwordChanged: false, // User must change password on first login
        failedLoginAttempts: 0,
      };
      
      return await this.accountUsersRepository.create(enrichedDto);
    }

    return await this.accountUsersRepository.create(createAccountUserDto);
  }

  async updateAccountUser(
    id: string,
    updateAccountUserDto: UpdateAccountUserDto,
  ): Promise<AccountUserResponseDto> {

    // Validate id format
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid account user ID format');
    }

    // Check if account user exists
    this.logger.debug({id, updateAccountUserDto});
    const existingUser = await this.accountUsersRepository.findById(id);
    if (!existingUser) {
      throw new NotFoundException('Account user not found');
    }

    // Validate permissions if they are being updated
    if (
      updateAccountUserDto.permissions &&
      updateAccountUserDto.permissions.length > 0
    ) {
      this.logger.debug({permissions: updateAccountUserDto.permissions})
      await this.permissionsValidationService.validatePermissions(
        updateAccountUserDto.permissions,
      );
    }

    return await this.accountUsersRepository.update(id, updateAccountUserDto);
  }

  async updateAccountUserSecurity(
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
    },
  ): Promise<AccountUserResponseDto> {
    // Validate id format
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid account user ID format');
    }

    // Check if account user exists
    this.logger.debug({id, securityUpdates});
    const existingUser = await this.accountUsersRepository.findById(id);
    if (!existingUser) {
      throw new NotFoundException('Account user not found');
    }

    return await this.accountUsersRepository.updateSecurity(id, securityUpdates);
  }

  async getAccountUserById(id: string): Promise<AccountUserResponseDto> {

    // Validate id format
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid account user ID format');
    }

    const accountUser = await this.accountUsersRepository.findById(id);
    if (!accountUser) {
      throw new NotFoundException('Account user not found');
    }

    return accountUser;
  }

  async findAccountUsersByAccountId(
    accountId: string,
    searchParams: AccountUsersSearchDto,
  ): Promise<AccountUsersSearchResultsDto> {
    // Validate accountId format
    if (!isValidObjectId(accountId)) {
      throw new BadRequestException('Invalid account ID format');
    }

    return await this.accountUsersRepository.findByAccountId(
      accountId,
      searchParams,
    );
  }

  async findAccountUserByWalletAddress(
    walletAddress: string,
  ): Promise<AccountUserResponseDto | null> {


    if (!walletAddress) {
      throw new BadRequestException('Wallet address is required');
    }

    return await this.accountUsersRepository.findByWalletAddress(walletAddress);
  }

  async findAccountUserByEmail(
    email: string,
  ): Promise<AccountUserResponseDto | null> {
    if (!email) {
      throw new BadRequestException('Email address is required');
    }

    return await this.accountUsersRepository.findByEmail(email);
  }

  async findAccountUserByEmailForAuth(
    email: string,
  ): Promise<any | null> {
    if (!email) {
      throw new BadRequestException('Email address is required');
    }

    return await this.accountUsersRepository.findByEmailForAuth(email);
  }

  // Helper methods for getting permission configuration
  getValidModules(): Promise<any> {
    return this.permissionsValidationService.getValidModules();
  }

  getValidRoles(): Promise<any> {
    return this.permissionsValidationService.getValidRoles();
  }

  getValidCombinations(): Promise<any> {
    return this.permissionsValidationService.getValidCombinations();
  }

  getValidRolesForModule(moduleId: string): Promise<string[]> {
    return this.permissionsValidationService.getValidRolesForModule(moduleId);
  }

  getValidModulesForRole(roleId: string): Promise<string[]> {
    return this.permissionsValidationService.getValidModulesForRole(roleId);
  }

  async findAllAccountUsersByAccountId(accountId: string) {
    return this.accountUsersRepository.findAllByAccountId(accountId);
  }

  updateAccountUserStatus(accountUserId: string, newStatus: AccountUserStatus) {
    return this.accountUsersRepository.updateAccountUserStatus(accountUserId, newStatus);

  }

  async getAccountUserSecurityDetailsById(id: string): Promise<AccountUserSecurityDetailsDto> {
    // Validate id format
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid account user ID format');
    }

    const accountUser = await this.accountUsersRepository.findSecurityDetailsById(id);
    if (!accountUser) {
      throw new NotFoundException('Account user not found');
    }

    return accountUser;
  }
}
