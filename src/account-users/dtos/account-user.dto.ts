import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';
import { IsArray, IsEmail, IsEnum, IsMongoId, IsOptional, IsString, ValidateNested } from 'class-validator';
import { AccountUserStatus } from '../schemas/account-user.schema';
import { UserPermission } from '../types/application-permissions.types';

// Legacy enums for backward compatibility
export enum ApplicationModule {
  DEAL_DESK = 'DealDesk',
  PAIPERLESS = 'Paiperless',
  ONBOARDING_DESK = 'OnboardingDesk',
  PORTAL_ADMIN = 'PortalAdmin',
}

export enum ApplicationRole {
  AGENT = 'Agent',
  SUPERVISOR = 'Supervisor',
  MANAGER = 'Manager',
}

// Legacy DTO for backward compatibility
export class ApplicationPermissionsDto {
  @ApiProperty({ 
    description: 'Application module', 
    enum: ApplicationModule 
  })
  @IsEnum(ApplicationModule)
  @Expose()
  module: ApplicationModule;

  @ApiProperty({ 
    description: 'User role in the module', 
    enum: ApplicationRole 
  })
  @IsEnum(ApplicationRole)
  @Expose()
  role: ApplicationRole;
}

// New DTO for configurable permissions
export class UserPermissionDto {
  @ApiProperty({ 
    description: 'Application module ID (e.g., deal-desk, paiperless)',
    example: 'deal-desk'
  })
  @IsString()
  @Expose()
  moduleId: string;

  @ApiProperty({ 
    description: 'User role ID (e.g., agent, supervisor, manager)',
    example: 'supervisor'
  })
  @IsString()
  @Expose()
  roleId: string;
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

  @ApiProperty({ description: 'Ethereum wallet address' })
  @IsString()
  @Expose()
  walletAddress: string;

  @ApiProperty({ 
    description: 'User permissions (new format)', 
    type: [UserPermissionDto],
    example: [
      { moduleId: 'deal-desk', roleId: 'supervisor' },
      { moduleId: 'paiperless', roleId: 'agent' }
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
    description: 'User permissions (new format)', 
    type: [UserPermissionDto],
    example: [
      { moduleId: 'deal-desk', roleId: 'supervisor' },
      { moduleId: 'paiperless', roleId: 'agent' }
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

  @ApiProperty({ 
    description: 'User permissions (new format)', 
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
} 