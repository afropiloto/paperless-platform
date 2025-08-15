import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class MfaVerificationDto {
  @ApiProperty({
    description: 'User ID for MFA verification',
    example: 'user123',
  })
  @IsNotEmpty()
  @IsString()
  userId: string;

  @ApiProperty({
    description: 'TOTP code from authenticator app or backup code',
    example: '123456',
  })
  @IsNotEmpty()
  @IsString()
  code: string;

  @ApiProperty({
    description: 'Whether this is a backup code (optional)',
    example: false,
    required: false,
  })
  @IsOptional()
  isBackupCode?: boolean;
}

export class MfaVerificationResponseDto {
  @ApiProperty({
    description: 'Whether MFA verification was successful',
    example: true,
  })
  @Expose()
  success: boolean;

  @ApiProperty({
    description: 'MFA verification message',
    example: 'MFA verification successful',
  })
  @Expose()
  message: string;

  @ApiProperty({
    description: 'JWT access token (if verification successful)',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    required: false,
  })
  @Expose()
  accessToken?: string;

  @ApiProperty({
    description: 'JWT refresh token (if verification successful)',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    required: false,
  })
  @Expose()
  refreshToken?: string;
}

export class MfaStatusDto {
  @ApiProperty({
    description: 'Whether MFA is enabled for the user',
    example: true,
  })
  mfaEnabled: boolean;

  @ApiProperty({
    description: 'Whether MFA is globally enabled',
    example: true,
  })
  mfaGloballyEnabled: boolean;

  @ApiProperty({
    description: 'Whether MFA is required for this user',
    example: true,
  })
  mfaRequired: boolean;
} 