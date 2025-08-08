import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class MfaSetupRequestDto {
  // This DTO is no longer needed since userId is extracted from JWT token
  // Keeping for backward compatibility but it's empty
}

export class MfaSetupResponseDto {
  @ApiProperty({
    description: 'Whether MFA setup was successful',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'MFA setup message',
    example: 'MFA setup initiated successfully',
  })
  message: string;

  @ApiProperty({
    description: 'QR code URL for authenticator app',
    example: 'otpauth://totp/TradeDocs:user@example.com?secret=JBSWY3DPEHPK3PXP&issuer=TradeDocs',
  })
  qrCodeUrl: string;

  @ApiProperty({
    description: 'MFA secret for manual entry',
    example: 'JBSWY3DPEHPK3PXP',
  })
  secret: string;

  @ApiProperty({
    description: 'Backup codes for account recovery',
    example: ['ABC123', 'DEF456', 'GHI789'],
  })
  backupCodes: string[];

  @ApiProperty({
    description: 'Whether verification is required to complete setup',
    example: true,
  })
  requiresVerification: boolean;
}

export class MfaVerifySetupDto {
  @ApiProperty({
    description: 'TOTP code from authenticator app',
    example: '123456',
  })
  @IsNotEmpty()
  @IsString()
  totpCode: string;
}

export class MfaVerifySetupResponseDto {
  @ApiProperty({
    description: 'Whether MFA verification was successful',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'MFA verification message',
    example: 'MFA setup completed successfully',
  })
  message: string;
} 