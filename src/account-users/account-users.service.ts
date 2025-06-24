import {
  BadRequestException,
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
} from './dtos/account-user.dto';
import { AccountUsersSearchResultsDto } from './dtos/account-users-search-results.dto';
import { PermissionsValidationService } from './services/permissions-validation.service';

@Injectable()
export class AccountUsersService {
  private readonly logger = new Logger(AccountUsersService.name);

  constructor(
    private readonly accountUsersRepository: AccountUsersRepository,
    private readonly permissionsValidationService: PermissionsValidationService,
  ) {}

  async createAccountUser(
    createAccountUserDto: CreateAccountUserDto,
  ): Promise<AccountUserResponseDto> {
    this.logger.debug({ createAccountUserDto });

    // Validate accountId format
    if (!isValidObjectId(createAccountUserDto.accountId)) {
      throw new BadRequestException('Invalid account ID format');
    }

    // Validate permissions
    if (
      createAccountUserDto.permissions &&
      createAccountUserDto.permissions.length > 0
    ) {
      this.permissionsValidationService.validatePermissions(
        createAccountUserDto.permissions,
      );
    }

    return await this.accountUsersRepository.create(createAccountUserDto);
  }

  async updateAccountUser(
    id: string,
    updateAccountUserDto: UpdateAccountUserDto,
  ): Promise<AccountUserResponseDto> {
    this.logger.debug({ id, updateAccountUserDto });

    // Validate id format
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid account user ID format');
    }

    // Check if account user exists
    const existingUser = await this.accountUsersRepository.findById(id);
    if (!existingUser) {
      throw new NotFoundException('Account user not found');
    }

    // Validate permissions if they are being updated
    if (
      updateAccountUserDto.permissions &&
      updateAccountUserDto.permissions.length > 0
    ) {
      this.permissionsValidationService.validatePermissions(
        updateAccountUserDto.permissions,
      );
    }

    return await this.accountUsersRepository.update(id, updateAccountUserDto);
  }

  async getAccountUserById(id: string): Promise<AccountUserResponseDto> {
    this.logger.debug({ id });

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

  async getAccountUsersByAccountId(
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
    this.logger.debug({ walletAddress });

    if (!walletAddress) {
      throw new BadRequestException('Wallet address is required');
    }

    return await this.accountUsersRepository.findByWalletAddress(walletAddress);
  }

  // Helper methods for getting permission configuration
  getValidModules() {
    return this.permissionsValidationService.getValidModules();
  }

  getValidRoles() {
    return this.permissionsValidationService.getValidRoles();
  }

  getValidCombinations() {
    return this.permissionsValidationService.getValidCombinations();
  }

  getValidRolesForModule(moduleId: string): string[] {
    return this.permissionsValidationService.getValidRolesForModule(moduleId);
  }

  getValidModulesForRole(roleId: string): string[] {
    return this.permissionsValidationService.getValidModulesForRole(roleId);
  }
}
