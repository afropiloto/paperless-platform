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
} from './dtos';
import { AccountUsersSearchResultsDto } from './dtos';
import { PermissionsValidationService } from './services/permissions-validation.service';
import { AccountsService } from '../accounts/accounts.service';
import { AccountUserStatus } from './schemas';

@Injectable()
export class AccountUsersService {
  private readonly logger = new Logger(AccountUsersService.name);

  constructor(
    private readonly accountUsersRepository: AccountUsersRepository,
    private readonly permissionsValidationService: PermissionsValidationService,
    @Inject(forwardRef(() => AccountsService))
    private readonly accountService: AccountsService
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
      this.permissionsValidationService.validatePermissions(
        createAccountUserDto.permissions,
      );
    }

    // Check the Account exists
    if (!(await this.accountService.accountExists(createAccountUserDto.accountId))) {
      throw new NotFoundException('Linked AccountID not found');
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

  async findAllAccountUsersByAccountId(accountId: string) {
    return this.accountUsersRepository.findAllByAccountId(accountId);
  }

  updateAccountUserStatus(accountUserId: string, newStatus: AccountUserStatus) {
    return this.accountUsersRepository.updateAccountUserStatus(accountUserId, newStatus);

  }
}
