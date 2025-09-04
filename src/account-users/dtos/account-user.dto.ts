import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose, Transform, Type } from 'class-transformer';
import { IsArray, IsEmail, IsEnum, IsMongoId, IsOptional, IsString, ValidateNested, IsBoolean } from 'class-validator';
import { AccountUserStatus, AuthMethod } from '../schemas';
import { SearchQueryDto } from 'src/common/dtos/search.dto';
import { Optional } from '@nestjs/common';
import { Role } from 'src/auth/types/auth-roles.types';

// DTO for configurable permissions (matches validation service)
export class UserPermissionDto {
  @ApiProperty({ 
    description: 'Application module', 
    example: 'Portal-DealDesk'
  })
  @IsString()
  @Expose()
  module: string;

  @ApiProperty({ 
    description: 'User role in the module', 
    enum: Role
  })
  @IsEnum(Role)
  @Expose()
  role: keyof typeof Role;
}

// Extended search DTO for account users endpoint
export class AccountUsersSearchDto extends SearchQueryDto {
  @ApiPropertyOptional({ 
    description: 'Include deleted users in the results',
    default: false,
    example: false
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value; // Let validation handle invalid values
  })
  @Expose()
  showDeleted?: boolean;
}

export class CreateAccountUserDto {
  @ApiProperty({ description: 'Account ID' })
  @IsMongoId()
  @Expose()
  accountId: string;

  @ApiProperty({ description: 'User name' })
  @IsString()
  @Expose()
  name: string;

  @ApiProperty({ description: 'User email address' })
  @IsEmail()
  @Expose()
  emailAddress: string;

  @ApiPropertyOptional({ description: 'Ethereum wallet address' })
  @IsString()
  @Expose()
  @Optional()
  walletAddress?: string;

  @ApiProperty({ 
    description: 'User permissions', 
    type: [UserPermissionDto],
    example: [
      { module: 'DealDesk', role: 'Supervisor' },
      { module: 'Paiperless', role: 'Agent' }
    ]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UserPermissionDto)
  @Expose()
  permissions: UserPermissionDto[];

  @ApiPropertyOptional({ 
    description: 'User status', 
    enum: AccountUserStatus,
    default: AccountUserStatus.ACTIVE 
  })
  @IsOptional()
  @IsEnum(AccountUserStatus)
  @Expose()
  status?: AccountUserStatus;

  @ApiPropertyOptional({ 
    description: 'Authentication method', 
    enum: AuthMethod,
    default: AuthMethod.SIWE 
  })
  @IsOptional()
  @IsEnum(AuthMethod)
  @Expose()
  authMethod?: AuthMethod;

  @ApiPropertyOptional({ 
    description: 'Enable MFA for this user during creation',
    default: false 
  })
  @IsOptional()
  @IsBoolean()
  @Expose()
  enableMfa?: boolean;

  @ApiPropertyOptional({ 
    description: 'Send invitation email to the user',
    default: true 
  })
  @IsOptional()
  @IsBoolean()
  @Expose()
  sendInvitation?: boolean;

  @ApiPropertyOptional({ 
    description: 'Temporary password for email/password users (if not sending invitation)',
    example: 'TempPass123!' 
  })
  @IsOptional()
  @IsString()
  @Expose()
  temporaryPassword?: string;

  @ApiPropertyOptional({
    description: 'Password hash for email/password authentication (internal use)',
    example: '$2b$12$...'
  })
  @IsOptional()
  @Expose()
  passwordHash?: string;

  @ApiPropertyOptional({
    description: 'Whether user has changed their initial password (internal use)',
    default: false
  })
  @IsOptional()
  @Expose()
  passwordChanged?: boolean;

  @ApiPropertyOptional({
    description: 'Number of failed login attempts (internal use)',
    example: 0
  })
  @IsOptional()
  @Expose()
  failedLoginAttempts?: number;
}

export class UpdateAccountUserDto {
  @ApiPropertyOptional({ description: 'User name' })
  @IsOptional()
  @IsString()
  @Expose()
  name?: string;

  @ApiPropertyOptional({ description: 'User email address' })
  @IsOptional()
  @IsEmail()
  @Expose()
  emailAddress?: string;

  @ApiPropertyOptional({ description: 'Ethereum wallet address' })
  @IsOptional()
  @IsString()
  @Expose()
  walletAddress?: string;

  @ApiPropertyOptional({ 
    description: 'User permissions (partial update - only provided permissions will be updated)', 
    type: [UserPermissionDto],
    example: [
      { module: 'DealDesk', role: 'Supervisor' },
      { module: 'Paiperless', role: 'Agent' }
    ]
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UserPermissionDto)
  @Expose()
  permissions?: UserPermissionDto[];

  @ApiPropertyOptional({ 
    description: 'User status', 
    enum: AccountUserStatus 
  })
  @IsOptional()
  @IsEnum(AccountUserStatus)
  @Expose()
  status?: AccountUserStatus;

  @ApiPropertyOptional({
    description: 'Number of failed login attempts',
    example: 0
  })
  @IsOptional()
  @Expose()
  failedLoginAttempts?: number;

  @ApiPropertyOptional({
    description: 'Account lockout expiration timestamp',
    example: '2024-01-01T00:00:00.000Z'
  })
  @IsOptional()
  @Expose()
  accountLockedUntil?: Date;

  @ApiPropertyOptional({
    description: 'Password hash for email/password authentication',
    example: '$2b$12$...'
  })
  @IsOptional()
  @Expose()
  passwordHash?: string;

  @ApiPropertyOptional({
    description: 'MFA secret for two-factor authentication',
    example: 'JBSWY3DPEHPK3PXP'
  })
  @IsOptional()
  @Expose()
  mfaSecret?: string;

  @ApiPropertyOptional({
    description: 'MFA backup codes',
    type: [String],
    example: ['ABC123', 'DEF456']
  })
  @IsOptional()
  @Expose()
  mfaBackupCodes?: string[];

  @ApiPropertyOptional({
    description: 'Whether MFA is enabled',
    default: false
  })
  @IsOptional()
  @Expose()
  mfaEnabled?: boolean;

  @ApiPropertyOptional({
    description: 'Whether MFA setup is required',
    default: false
  })
  @IsOptional()
  @Expose()
  mfaSetupRequired?: boolean;

  @ApiPropertyOptional({
    description: 'Date when MFA setup was completed',
    example: '2024-01-01T00:00:00.000Z'
  })
  @IsOptional()
  @Expose()
  mfaSetupCompleted?: Date;

  @ApiPropertyOptional({
    description: 'Date when user first logged in',
    example: '2024-01-01T00:00:00.000Z'
  })
  @IsOptional()
  @Expose()
  firstLoginAt?: Date;

  @ApiPropertyOptional({
    description: 'Whether user has changed their initial password',
    default: false
  })
  @IsOptional()
  @Expose()
  passwordChanged?: boolean;

  @ApiPropertyOptional({
    description: 'Whether user is required to reset their password on next login',
    default: false
  })
  @Expose()
  passwordResetRequired?: boolean;
}

@Exclude()
export class AccountUserResponseDto {
  @ApiProperty({ description: 'Account User ID' })
  @Expose()
  id: string;

  @ApiProperty({ description: 'Account ID' })
  @Expose()
  accountId: string;

  @ApiProperty({ description: 'User name' })
  @Expose()
  name: string;

  @ApiProperty({ description: 'User email address' })
  @Expose()
  emailAddress: string;

  @ApiProperty({ description: 'Ethereum wallet address' })
  @Expose()
  walletAddress: string;

  @ApiProperty({ 
    description: 'User status', 
    enum: AccountUserStatus 
  })
  @Expose()
  status: AccountUserStatus;

  @ApiPropertyOptional({ 
    description: 'Authentication method', 
    enum: AuthMethod,
    default: AuthMethod.SIWE
  })
  @Expose()
  authMethod?: AuthMethod;

  @ApiPropertyOptional({ 
    description: 'Whether MFA is enabled for this user',
    default: false
  })
  @Expose()
  mfaEnabled?: boolean;

  @ApiPropertyOptional({ 
    description: 'Whether MFA setup is required for this user',
    default: false
  })
  @Expose()
  mfaSetupRequired?: boolean;

  @ApiPropertyOptional({ 
    description: 'Date when MFA setup was completed',
    example: '2024-01-01T00:00:00.000Z'
  })
  @Expose()
  mfaSetupCompleted?: Date;

  @ApiPropertyOptional({ 
    description: 'Date when user first logged in',
    example: '2024-01-01T00:00:00.000Z'
  })
  @Expose()
  firstLoginAt?: Date;

  @ApiPropertyOptional({ 
    description: 'Whether user has changed their initial password',
    default: false
  })
  @Expose()
  passwordChanged?: boolean;

  @ApiPropertyOptional({
    description: 'Whether user is required to reset their password on next login',
    default: false
  })
  @Expose()
  passwordResetRequired?: boolean;

  @ApiProperty({ 
    description: 'User permissions (configurable format)', 
    type: [UserPermissionDto] 
  })
  @Expose()
  @Type(() => UserPermissionDto)
  permissions: UserPermissionDto[];

  @ApiProperty({ description: 'Creation timestamp' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @Expose()
  updatedAt: Date;

  @ApiPropertyOptional({
    description: 'Account lockout expiration timestamp',
    example: '2024-01-01T00:00:00.000Z'
  })
  @Expose()
  accountLockedUntil?: Date;
} 

@Exclude()
export class AccountUserSecurityDetailsDto {
  @ApiProperty({ description: 'Account User ID' })
  @Expose()
  id: string;

  @ApiProperty({ description: 'Account ID' })
  @Expose()
  accountId: string;

  @ApiProperty({ description: 'User name' })
  @Expose()
  name: string;

  @ApiProperty({ description: 'User email address' })
  @Expose()
  emailAddress: string;

  @ApiProperty({ description: 'Ethereum wallet address' })
  @Expose()
  walletAddress: string;

  @ApiProperty({ 
    description: 'User status', 
    enum: AccountUserStatus 
  })
  @Expose()
  status: AccountUserStatus;

  @ApiPropertyOptional({ 
    description: 'Authentication method', 
    enum: AuthMethod,
    default: AuthMethod.SIWE
  })
  @Expose()
  authMethod?: AuthMethod;

  @ApiPropertyOptional({
    description: 'Password hash for email/password authentication (internal use)',
    example: '$2b$12$...'
  })
  @Expose()
  passwordHash?: string;

  @ApiPropertyOptional({
    description: 'Whether user has changed their initial password',
    default: false
  })
  @Expose()
  passwordChanged?: boolean;

  @ApiPropertyOptional({
    description: 'Whether user is required to reset their password on next login',
    default: false
  })
  @Expose()
  passwordResetRequired?: boolean;

  @ApiPropertyOptional({
    description: 'Date when password was last changed',
    example: '2024-01-01T00:00:00.000Z'
  })
  @Expose()
  lastPasswordChange?: Date;

  @ApiPropertyOptional({
    description: 'Number of failed login attempts',
    example: 0
  })
  @Expose()
  failedLoginAttempts?: number;

  @ApiPropertyOptional({
    description: 'Account lockout expiration timestamp',
    example: '2024-01-01T00:00:00.000Z'
  })
  @Expose()
  accountLockedUntil?: Date;

  @ApiPropertyOptional({
    description: 'MFA secret for two-factor authentication (internal use)',
    example: 'JBSWY3DPEHPK3PXP'
  })
  @Expose()
  mfaSecret?: string;

  @ApiPropertyOptional({
    description: 'Whether MFA is enabled',
    default: false
  })
  @Expose()
  mfaEnabled?: boolean;

  @ApiPropertyOptional({
    description: 'MFA backup codes (internal use)',
    type: [String],
    example: ['ABC123', 'DEF456']
  })
  @Expose()
  mfaBackupCodes?: string[];

  @ApiPropertyOptional({
    description: 'Whether MFA setup is required',
    default: false
  })
  @Expose()
  mfaSetupRequired?: boolean;

  @ApiPropertyOptional({
    description: 'Date when MFA setup was completed',
    example: '2024-01-01T00:00:00.000Z'
  })
  @Expose()
  mfaSetupCompleted?: Date;

  @ApiPropertyOptional({ 
    description: 'Date when user first logged in',
    example: '2024-01-01T00:00:00.000Z'
  })
  @Expose()
  firstLoginAt?: Date;

  @ApiProperty({ description: 'Creation timestamp' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @Expose()
  updatedAt: Date;

  @ApiProperty({ 
    description: 'User permissions (configurable format)', 
    type: [UserPermissionDto] 
  })
  @Expose()
  @Type(() => UserPermissionDto)
  permissions: UserPermissionDto[];
} 