import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsEmail, IsMongoId, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Expose, Type } from 'class-transformer';
import { UserPermissionDto } from '../../account-users/dtos/account-user.dto';

export class CreateUserDto {
  @ApiProperty({ 
    description: 'Account ID (MongoDB ObjectId)',
    example: '507f1f77bcf86cd799439011'
  })
  @IsMongoId()
  accountId: string;

  @ApiProperty({ 
    description: 'User full name',
    example: 'John Doe'
  })
  @IsString()
  name: string;

  @ApiProperty({ 
    description: 'User email address (must be unique)',
    example: 'john.doe@example.com'
  })
  @IsEmail()
  emailAddress: string;

  @ApiProperty({ 
    description: 'Ethereum wallet address (must be unique)',
    example: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6'
  })
  @IsString()
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
  permissions: UserPermissionDto[];

  @ApiPropertyOptional({ 
    description: 'Authentication method for the user',
    enum: ['siwe', 'email-password'],
    default: 'siwe',
    example: 'email-password'
  })
  @IsOptional()
  @IsString()
  authMethod?: 'siwe' | 'email-password';

  @ApiPropertyOptional({ 
    description: 'Enable MFA for this user during creation. If true, user will receive MFA setup email.',
    default: false,
    example: true
  })
  @IsOptional()
  @IsBoolean()
  enableMfa?: boolean;

  @ApiPropertyOptional({ 
    description: 'Send invitation email to the user with temporary password',
    default: true,
    example: true
  })
  @IsOptional()
  @IsBoolean()
  sendInvitation?: boolean;

  @ApiPropertyOptional({ 
    description: 'Temporary password for email/password users (if not sending invitation)',
    example: 'TempPass123!' 
  })
  @IsOptional()
  @IsString()
  temporaryPassword?: string;
}

export class InviteUserDto {
  @ApiProperty({ description: 'User ID to send invitation to' })
  @IsMongoId()
  userId: string;

  @ApiPropertyOptional({ 
    description: 'Custom invitation message',
    example: 'Welcome to our platform! Please set up your account.' 
  })
  @IsOptional()
  @IsString()
  message?: string;
}

export class BulkCreateUsersDto {
  @ApiProperty({ description: 'Account ID' })
  @IsMongoId()
  accountId: string;

  @ApiProperty({ 
    description: 'List of users to create', 
    type: [CreateUserDto] 
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateUserDto)
  users: CreateUserDto[];

  @ApiPropertyOptional({ 
    description: 'Send invitation emails to all users',
    default: true 
  })
  @IsOptional()
  @IsBoolean()
  sendInvitations?: boolean;
}

export class UserStatusDto {
  @ApiProperty({ description: 'User ID' })
  @IsMongoId()
  userId: string;

  @ApiProperty({ 
    description: 'New user status', 
    enum: ['active', 'inactive', 'locked'] 
  })
  @IsString()
  status: 'active' | 'inactive' | 'locked';

  @ApiPropertyOptional({ 
    description: 'Reason for status change',
    example: 'User requested account deactivation' 
  })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class UserSearchDto {
  @ApiPropertyOptional({ description: 'Search by user name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Search by email address' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Filter by authentication method' })
  @IsOptional()
  @IsString()
  authMethod?: 'siwe' | 'email-password';

  @ApiPropertyOptional({ description: 'Filter by MFA status' })
  @IsOptional()
  @IsBoolean()
  mfaEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Filter by user status' })
  @IsOptional()
  @IsString()
  status?: 'active' | 'inactive' | 'locked';

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page', default: 10 })
  @IsOptional()
  limit?: number;
}

export class UserResponseDto {
  @ApiProperty({ description: 'User ID' })
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

  @ApiProperty({ description: 'User status' })
  @Expose()
  status: string;

  @ApiProperty({ description: 'Authentication method' })
  @Expose()
  authMethod: string;

  @ApiProperty({ description: 'Whether MFA is enabled' })
  @Expose()
  mfaEnabled: boolean;

  @ApiProperty({ description: 'Whether MFA setup is required' })
  @Expose()
  mfaSetupRequired: boolean;

  @ApiPropertyOptional({ description: 'Date when MFA setup was completed' })
  @Expose()
  mfaSetupCompleted?: Date;

  @ApiPropertyOptional({ description: 'Date when user first logged in' })
  @Expose()
  firstLoginAt?: Date;

  @ApiProperty({ description: 'Whether user has changed their initial password' })
  @Expose()
  passwordChanged: boolean;

  @ApiProperty({ description: 'User permissions' })
  @Expose()
  permissions: UserPermissionDto[];

  @ApiProperty({ description: 'Creation timestamp' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @Expose()
  updatedAt: Date;
}

export class BulkCreateResponseDto {
  @ApiProperty({ description: 'Number of users successfully created' })
  successCount: number;

  @ApiProperty({ description: 'Number of users that failed to create' })
  failureCount: number;

  @ApiProperty({ description: 'List of successfully created users' })
  createdUsers: UserResponseDto[];

  @ApiProperty({ description: 'List of errors for failed creations' })
  errors: Array<{
    email: string;
    error: string;
  }>;
} 