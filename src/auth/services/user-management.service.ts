import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AccountUsersService } from '../../account-users/account-users.service';
import { PasswordService } from './password.service';
import { MfaService } from './mfa.service';
import { AuthEmailService } from './auth-email.service';
import { AuditService } from '../../audit/audit.service';
import { 
  CreateUserDto, 
  InviteUserDto, 
  BulkCreateUsersDto, 
  UserStatusDto, 
  UserSearchDto,
  UserResponseDto,
  BulkCreateResponseDto 
} from '../dtos/user-management.dto';
import { CreateAccountUserDto } from '../../account-users/dtos/account-user.dto';
import { AuditEventType, AuditSubject } from '../../audit/audit-event-type.enum';
import { AuthMethod } from '../../account-users/schemas';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class UserManagementService {
  private readonly logger = new Logger(UserManagementService.name);

  constructor(
    private readonly accountUsersService: AccountUsersService,
    private readonly passwordService: PasswordService,
    private readonly mfaService: MfaService,
    private readonly authEmailService: AuthEmailService,
    private readonly auditService: AuditService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Create a new user with optional MFA setup and email invitation
   */
  async createUser(
    createUserDto: CreateUserDto,
    inviterId: string,
    inviterName: string,
  ): Promise<UserResponseDto> {
    try {
      // Generate temporary password if not provided
      let temporaryPassword = createUserDto.temporaryPassword;
      this.logger.debug({createUserDto, temporaryPassword});
      if (!temporaryPassword && createUserDto.authMethod === 'email-password') {
        temporaryPassword = this.passwordService.generateSecurePassword(12);
      }

      // Hash password if provided
      let passwordHash: string | undefined;
      if (temporaryPassword) {
        passwordHash = await this.passwordService.hashPassword(temporaryPassword);
      }

      // Prepare account user creation data
      const createAccountUserDto: CreateAccountUserDto = {
        accountId: createUserDto.accountId,
        name: createUserDto.name,
        emailAddress: createUserDto.emailAddress,
        walletAddress: createUserDto.walletAddress,
        permissions: createUserDto.permissions,
        authMethod: createUserDto.authMethod as AuthMethod || AuthMethod.SIWE,
        enableMfa: createUserDto.enableMfa || false,
        sendInvitation: createUserDto.sendInvitation !== false, // Default to true
        temporaryPassword: temporaryPassword,
      };

      // Create the account user
      const newUser = await this.accountUsersService.createAccountUser(createAccountUserDto);

      // Set up MFA if requested
      if (createUserDto.enableMfa) {
        await this.setupMfaForNewUser(newUser.id);
      }

      // Send invitation email if requested
      if (createUserDto.sendInvitation !== false && temporaryPassword) {
        try {
          await this.authEmailService.sendUserInvitationEmail(
            newUser.emailAddress,
            newUser.name,
            inviterName,
            temporaryPassword,
          );
        } catch (error) {
          this.logger.error(`Failed to send invitation email to ${newUser.emailAddress}:`, error);
          // Continue with user creation even if email fails
        }
      }

      // Log audit event
      await this.auditService.log({
        subject: AuditSubject.USER_MANAGEMENT,
        eventType: AuditEventType.USER_CREATED,
        identifier: newUser.accountId,
        details: { 
          createdUserId: newUser.id,
          createdUserEmail: newUser.emailAddress,
          inviterId,
          authMethod: createUserDto.authMethod,
          mfaEnabled: createUserDto.enableMfa,
        },
      });

      //return this.mapToUserResponseDto(newUser);
      return plainToInstance(UserResponseDto, newUser);
    } catch (error) {
      this.logger.error(`Failed to create user:`, error);
      throw error;
    }
  }

  /**
   * Bulk create multiple users
   */
  async bulkCreateUsers(
    bulkCreateDto: BulkCreateUsersDto,
    inviterId: string,
    inviterName: string,
  ): Promise<BulkCreateResponseDto> {
    const createdUsers: UserResponseDto[] = [];
    const errors: Array<{ email: string; error: string }> = [];

    for (const userDto of bulkCreateDto.users) {
      try {
        const user = await this.createUser(userDto, inviterId, inviterName);
        createdUsers.push(user);
      } catch (error) {
        errors.push({
          email: userDto.emailAddress,
          error: error.message,
        });
      }
    }

    return {
      successCount: createdUsers.length,
      failureCount: errors.length,
      createdUsers,
      errors,
    };
  }

  /**
   * Send invitation email to existing user
   */
  async inviteUser(
    inviteDto: InviteUserDto,
    inviterId: string,
    inviterName: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Get the user
      const user = await this.accountUsersService.getAccountUserById(inviteDto.userId);
      
      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Generate temporary password
      const temporaryPassword = this.passwordService.generateSecurePassword(12);
      const passwordHash = await this.passwordService.hashPassword(temporaryPassword);

      // Update user with new password hash
      await this.accountUsersService.updateAccountUser(inviteDto.userId, {
        passwordHash,
        passwordChanged: false,
      });

      // Send invitation email
      await this.authEmailService.sendUserInvitationEmail(
        user.emailAddress,
        user.name,
        inviterName,
        temporaryPassword,
        inviteDto.message,
      );

      // Log audit event
      await this.auditService.log({
        subject: AuditSubject.USER_MANAGEMENT,
        eventType: AuditEventType.USER_INVITED,
        identifier: user.accountId,
        details: { 
          invitedUserId: user.id,
          invitedUserEmail: user.emailAddress,
          inviterId,
        },
      });

      return { success: true, message: 'Invitation sent successfully' };
    } catch (error) {
      this.logger.error(`Failed to invite user:`, error);
      throw error;
    }
  }

  /**
   * Update user status
   */
  async updateUserStatus(
    statusDto: UserStatusDto,
    updaterId: string,
    updaterName: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const user = await this.accountUsersService.getAccountUserById(statusDto.userId);
      
      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Update user status
      await this.accountUsersService.updateAccountUserStatus(statusDto.userId, statusDto.status as any);

      // Log audit event
      await this.auditService.log({
        subject: AuditSubject.USER_MANAGEMENT,
        eventType: AuditEventType.USER_STATUS_CHANGED,
        identifier: user.accountId,
        details: { 
          userId: user.id,
          userEmail: user.emailAddress,
          oldStatus: user.status,
          newStatus: statusDto.status,
          updaterId,
          reason: statusDto.reason,
        },
      });

      return { success: true, message: 'User status updated successfully' };
    } catch (error) {
      this.logger.error(`Failed to update user status:`, error);
      throw error;
    }
  }

  /**
   * Search users within an account
   */
  async searchUsers(accountId: string, searchDto: UserSearchDto): Promise<UserResponseDto[]> {
    try {
      const searchParams = {
        page: searchDto.page || 1,
        limit: searchDto.limit || 10,
        search: searchDto.name || searchDto.email || '',
        showDeleted: false,
      };

      const results = await this.accountUsersService.findAccountUsersByAccountId(accountId, searchParams);
      
      return results.data.map(user => this.mapToUserResponseDto(user));
    } catch (error) {
      this.logger.error(`Failed to search users:`, error);
      throw error;
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<UserResponseDto> {
    try {
      const user = await this.accountUsersService.getAccountUserById(userId);
      return this.mapToUserResponseDto(user);
    } catch (error) {
      this.logger.error(`Failed to get user by ID:`, error);
      throw error;
    }
  }

  /**
   * Setup MFA for a new user
   */
  private async setupMfaForNewUser(userId: string): Promise<void> {
    try {
      const user = await this.accountUsersService.getAccountUserById(userId);
      
      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Generate MFA setup
      const mfaSetup = await this.mfaService.setupMfa(user.emailAddress);
      this.logger.debug({mfaSetup});

                // Update user with MFA secret and backup codes using security update method
          // Note: mfaSetupRequired is NOT set to true here - user needs to complete setup via API
          await this.accountUsersService.updateAccountUserSecurity(userId, {
            mfaSecret: mfaSetup.secret,
            mfaBackupCodes: mfaSetup.backupCodes,
            mfaEnabled: true,
            mfaSetupRequired: true
          });

      // Send MFA setup email with QR code
      try {
        await this.authEmailService.sendMfaSetupEmail(
          user.emailAddress,
          user.name,
          mfaSetup.backupCodes,
          mfaSetup.qrCodeUrl, // Pass the QR code URL
        );
      } catch (error) {
        this.logger.error(`Failed to send MFA setup email to ${user.emailAddress}:`, error);
        // Continue even if email fails
      }

      this.logger.log(`MFA setup initiated for user ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to setup MFA for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Map account user to user response DTO
   */
  private mapToUserResponseDto(user: any): UserResponseDto {
    return {
      id: user.id,
      accountId: user.accountId,
      name: user.name,
      emailAddress: user.emailAddress,
      walletAddress: user.walletAddress,
      status: user.status,
      authMethod: user.authMethod,
      mfaEnabled: user.mfaEnabled || false,
      mfaSetupRequired: user.mfaSetupRequired || false,
      mfaSetupCompleted: user.mfaSetupCompleted,
      firstLoginAt: user.firstLoginAt,
      passwordChanged: user.passwordChanged || false,
      permissions: user.permissions,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
} 