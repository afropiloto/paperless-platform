import { Expose, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { UserPermissionDto } from '../../account-users/dtos';

export class TokenRefreshResponseDto {
  @ApiProperty({ description: 'Authentication success status' })
  @Expose()
  success: boolean;

  @ApiProperty({ description: 'JWT access token' })
  @Expose()
  accessToken: string;

}

export class AuthResponseDto {
  @ApiProperty({ description: 'Authentication success status' })
  @Expose()
  success: boolean;

  @ApiProperty({ 
    description: 'Whether MFA verification is required to complete login',
    required: false,
  })
  @Expose()
  mfaRequired?: boolean;

  @ApiProperty({ 
    description: 'Whether MFA setup is required before login',
    required: false,
  })
  @Expose()
  mfaSetupRequired?: boolean;

  @ApiProperty({ 
    description: 'Whether password reset is required before login',
    required: false,
  })
  @Expose()
  passwordResetRequired?: boolean;

  @ApiProperty({ description: 'JWT access token' })
  @Expose()
  accessToken: string;

  @ApiProperty({ description: 'JWT refresh token' })
  @Expose()
  refreshToken: string;

  @ApiProperty({ description: 'Account ID' })
  @Expose()
  accountId: string;

  @ApiProperty({ description: 'Account name' })
  @Expose()
  accountName: string;

  @ApiProperty({ description: 'Account email address' })
  @Expose()
  accountEmail: string;

  @ApiProperty({ description: 'User ID' })
  @Expose()
  userId: string;

  @ApiProperty({ description: 'User name' })
  @Expose()
  userName: string;

  @ApiProperty({ description: 'User email address' })
  @Expose()
  userEmail: string;

  @ApiProperty({ description: 'User wallet address' })
  @Expose()
  walletAddress: string;

  @ApiProperty({ 
    description: 'User application permissions', 
    type: [UserPermissionDto] 
  })
  @Expose()
  @Type(() => UserPermissionDto)
  permissions: UserPermissionDto[];
}