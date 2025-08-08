import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class MfaDisableDto {
  @ApiProperty({
    description: 'Current password for verification',
    example: 'CurrentPassword123!',
  })
  @IsNotEmpty()
  @IsString()
  currentPassword: string;

  @ApiProperty({
    description: 'TOTP code or backup code for verification',
    example: '123456',
  })
  @IsNotEmpty()
  @IsString()
  verificationCode: string;
}

export class MfaDisableResponseDto {
  @ApiProperty({
    description: 'Whether MFA disable was successful',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'MFA disable message',
    example: 'MFA has been disabled successfully',
  })
  message: string;
}

export class RegenerateBackupCodesDto {
  @ApiProperty({
    description: 'Current password for verification',
    example: 'CurrentPassword123!',
  })
  @IsNotEmpty()
  @IsString()
  currentPassword: string;

  @ApiProperty({
    description: 'TOTP code for verification',
    example: '123456',
  })
  @IsNotEmpty()
  @IsString()
  totpCode: string;
}

export class RegenerateBackupCodesResponseDto {
  @ApiProperty({
    description: 'Whether backup codes regeneration was successful',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Backup codes regeneration message',
    example: 'Backup codes regenerated successfully',
  })
  message: string;

  @ApiProperty({
    description: 'New backup codes',
    example: ['ABC123', 'DEF456', 'GHI789', 'JKL012', 'MNO345'],
  })
  backupCodes: string[];

  @ApiProperty({
    description: 'Warning about invalidating old backup codes',
    example: 'Previous backup codes are no longer valid',
  })
  warning: string;
} 