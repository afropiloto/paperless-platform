import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose, Transform, Type } from 'class-transformer';
import { IsArray, IsEmail, IsEnum, IsMongoId, IsOptional, IsString, ValidateNested, IsBoolean } from 'class-validator';
import { AccountUserStatus } from '../schemas';
import { ApplicationModule, ApplicationRole } from '../schemas';
import { SearchQueryDto } from '../../common/dtos/search.dto';

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

// DTO for configurable permissions (matches validation service)
export class UserPermissionDto {
  @ApiProperty({ 
    description: 'Application module (e.g., DealDesk, Paiperless)',
    example: 'DealDesk'
  })
  @IsString()
  @Expose()
  module: string;

  @ApiProperty({ 
    description: 'User role (e.g., Agent, Supervisor, Manager)',
    example: 'Supervisor'
  })
  @IsString()
  @Expose()
  role: string;
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

  @ApiProperty({ description: 'Ethereum wallet address' })
  @IsString()
  @Expose()
  walletAddress: string;

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
} 