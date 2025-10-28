import { Body, Controller, Get, HttpStatus, Logger, Param, Post, UseGuards } from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
  ApiBearerAuth, ApiHeader,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RefreshTokenDto } from './dtos';
import { LoginDto } from './dtos';
import { AuthResponseDto, TokenRefreshResponseDto } from './dtos';
import { SiweService } from '../siwe/siwe.service';
import { EmailPasswordLoginDto } from './dtos';
import { ChangePasswordDto } from './dtos';
import { ForgotPasswordDto } from './dtos';
import { ResetPasswordDto } from './dtos';
import { MfaSetupResponseDto, MfaVerifySetupDto, MfaVerifySetupResponseDto } from './dtos/mfa-setup.dto';
import { MfaVerificationDto, MfaStatusDto } from './dtos/mfa-verification.dto';
import { MfaDisableDto, MfaDisableResponseDto, RegenerateBackupCodesDto, RegenerateBackupCodesResponseDto } from './dtos/mfa-management.dto';
import { GeneralResponseDto } from '../common/common-dto';
import { JwtGuard } from './guards/jwt-guard';
import { UserPermissionGuard } from './guards/user-permission.guard';
import { UserAccess } from './decorators/user-access.decorator';
import { User } from './decorators/user.decorator';
import { ForcePasswordResetDto, ForcePasswordResetResponseDto } from 'src/auth/dtos';
import { ForcedPasswordResetDto, ForcedPasswordResetResponseDto } from 'src/auth/dtos';
import { ApiKeyGuard } from 'src/api-key-auth/api-key.guard';
import { ClientInfo } from 'src/api-key-auth/decorators/client-info.decorator';
import { ClientAccessGroup, ClientInfoDetails } from 'src/api-key-auth/types/api-key-auth.types';
import { ClientAccess } from 'src/api-key-auth/decorators/client-access.decorator';

@ApiTags('Authentication')
@Controller('auth')
@UseGuards(ApiKeyGuard)
@ApiHeader({
  name: 'x-api-key',
  description: 'The Client Application API Key',
  example: '47f19331:86382a9cbeaa603325628d29859b10fa6df94385ef792ea340cb1208ab9fdb6e'
})
@ClientAccess(ClientAccessGroup.SHARED)
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
  constructor(
    private readonly authService: AuthService,
    private readonly siweService: SiweService,
  ) {}

  @Get('nonce/:address')
  @ApiOperation({ 
    summary: 'Get SIWE nonce for wallet address',
    description: 'Generates a unique nonce for Sign-In with Ethereum (SIWE) authentication. This nonce is required for creating a valid SIWE message.'
  })
  @ApiParam({
    name: 'address',
    description: 'Ethereum wallet address',
    type: 'string',
    example: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Nonce generated successfully',
    schema: {
      type: 'object',
      properties: {
        nonce: { type: 'string', example: 'abc123def456' },
        message: { type: 'string', example: 'Sign this message to authenticate...' }
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid wallet address format'
  })
  async getMessage(@Param('address') address: string) {
    return this.siweService.generateNonce(address);
  }

  @Post('login')
  @ApiOperation({ 
    summary: 'Login with SIWE',
    description: 'Authenticate using Sign-In with Ethereum (SIWE). Requires a signed message from the user\'s wallet.'
  })
  @ApiBody({ 
    type: LoginDto,
    description: 'SIWE login credentials',
    examples: {
      'siwe-login': {
        summary: 'SIWE Login',
        value: {
          message: 'Sign this message to authenticate...',
          signature: '0x1234567890abcdef...'
        }
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Login successful',
    type: AuthResponseDto
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid credentials or signature'
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid request format'
  })
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    return await this.authService.login(loginDto);
  }

  @UseGuards(ApiKeyGuard)
  @Post('login/email')
  @ApiOperation({ 
    summary: 'Login with email and password',
    description: 'Authenticate using email address and password. Supports MFA verification and first login detection.'
  })
  @ApiBody({ 
    type: EmailPasswordLoginDto,
    description: 'Email/password login credentials',
    examples: {
      'email-login': {
        summary: 'Email/Password Login',
        value: {
          email: 'john.doe@example.com',
          password: 'SecurePass123!'
        }
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Login successful',
    type: AuthResponseDto
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid credentials or account locked'
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid email format or missing fields'
  })
  @ApiResponse({
    status: HttpStatus.TOO_MANY_REQUESTS,
    description: 'Too many failed login attempts'
  })
  @ApiHeader({
    name: 'x-api-key',
    description: 'The Client Application API Key',
    example: '47f19331:86382a9cbeaa603325628d29859b10fa6df94385ef792ea340cb1208ab9fdb6e'
  })
  @ClientAccess(ClientAccessGroup.SHARED)
  async loginWithEmailPassword(@ClientInfo() client: ClientInfoDetails, @Body() loginDto: EmailPasswordLoginDto): Promise<AuthResponseDto> {
    const response = await this.authService.loginWithEmailPassword(loginDto, client.name);
    this.logger.debug({response})
    return response;
  }

  @Post('refresh')
  @ApiOperation({
    summary: 'Refreshes the user\'s access token',
    description: 'Refresh the user\'s access token using the saved refresh token'
  })
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) :Promise<TokenRefreshResponseDto> {
    return this.authService.refreshToken(refreshTokenDto.refreshToken);
  }

  @Post('password/change')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Change user password',
    description: 'Change the current user\'s password. Requires authentication via JWT token.'
  })
  @ApiBody({ 
    type: ChangePasswordDto,
    description: 'Password change data'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Password changed successfully',
    type: GeneralResponseDto
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid current password or not authenticated'
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'New password does not meet policy requirements'
  })
  async changePassword(
    @User('userId') userId: string,
    @Body() dto: ChangePasswordDto
  ): Promise<GeneralResponseDto> {
    return this.authService.changePassword(userId, {
      currentPassword: dto.currentPassword,
      newPassword: dto.newPassword,
    });
  }

  @Post('password/forgot')
  async forgotPassword(@Body() dto: ForgotPasswordDto): Promise<GeneralResponseDto> {
    return this.authService.forgotPassword(dto);

  }

  @Post('password/reset')
  async resetPassword(@Body() dto: ResetPasswordDto): Promise<GeneralResponseDto> {
    return this.authService.resetPassword(dto);
  }

  @Post('password/forced-reset')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Reset password when forced by administrator',
    description: 'Reset password for users who have been forced to change their password by an administrator. This endpoint is public and does not require authentication.'
  })
  @ApiBody({ 
    type: ForcedPasswordResetDto,
    description: 'Forced password reset data'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Password reset successfully',
    type: ForcedPasswordResetResponseDto
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid credentials or password reset not required'
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid email format or new password does not meet policy'
  })
  async forcedPasswordReset(@Body() dto: ForcedPasswordResetDto): Promise<ForcedPasswordResetResponseDto> {
    return this.authService.forcedPasswordReset(dto);
  }

  @Post('force-password-reset')
  @UseGuards(JwtGuard, UserPermissionGuard)
  @ApiBearerAuth()
  @UserAccess(
    { module: 'Paperless-Admin', roles: ['Manager'] },
    { module: 'Portal-Admin', roles: ['Manager'] }
  )
  @ApiOperation({ 
    summary: 'Force password reset for a user',
    description: 'Force a user to reset their password on next login. Requires Manager role in Paperless-Admin or Portal-Admin.'
  })
  @ApiBody({ 
    type: ForcePasswordResetDto,
    description: 'User email to force password reset for'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Password reset requirement set successfully',
    type: ForcePasswordResetResponseDto
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Not authenticated or insufficient permissions'
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid email format or user not found'
  })
  async forcePasswordReset(
    @User('userId') userId: string,
    @Body() dto: ForcePasswordResetDto
  ): Promise<ForcePasswordResetResponseDto> {
    return this.authService.forcePasswordReset(userId, dto.email, dto.reason, dto.sendEmail);
  }

  // MFA Setup and Management Endpoints
  @Post('mfa/setup')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Setup MFA for user',
    description: 'Initiates MFA setup for the authenticated user. Generates a secret, QR code URL, and backup codes. User must verify with TOTP code to complete setup.'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'MFA setup initiated successfully',
    type: MfaSetupResponseDto
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'MFA already enabled'
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Not authenticated'
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found'
  })
  async setupMfa(@User('userId') userId: string): Promise<MfaSetupResponseDto> {
    return this.authService.setupMfa(userId);
  }

  @Post('mfa/verify-setup')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Verify MFA setup',
    description: 'Verify MFA setup with TOTP code to complete the setup process.'
  })
  @ApiBody({ 
    type: MfaVerifySetupDto,
    description: 'MFA verification data'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'MFA setup verified successfully',
    type: MfaVerifySetupResponseDto
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid TOTP code or not authenticated'
  })
  async verifyMfaSetup(
    @User('userId') userId: string,
    @Body() dto: MfaVerifySetupDto
  ): Promise<MfaVerifySetupResponseDto> {
    return this.authService.verifyMfaSetup(userId, dto.totpCode);

  }

  @Post('mfa/verify')
  @ApiOperation({ 
    summary: 'Verify MFA code',
    description: 'Verify MFA code during login process.'
  })
  @ApiBody({ 
    type: MfaVerificationDto,
    description: 'MFA verification data'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'MFA verification successful',
    type: AuthResponseDto
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid MFA code'
  })
  async verifyMfa(@Body() dto: MfaVerificationDto): Promise<AuthResponseDto> {
    const response = await this.authService.verifyMfa(dto.userId, dto.code, dto.isBackupCode);
    this.logger.debug({response})
    return response
  }

  @Post('mfa/disable')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Disable MFA',
    description: 'Disable MFA for the authenticated user. Requires current password and verification code.'
  })
  @ApiBody({ 
    type: MfaDisableDto,
    description: 'MFA disable data'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'MFA disabled successfully',
    type: MfaDisableResponseDto
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid password or verification code'
  })
  async disableMfa(
    @User('userId') userId: string,
    @Body() dto: MfaDisableDto
  ): Promise<MfaDisableResponseDto> {
    return this.authService.disableMfa(userId, dto.currentPassword, dto.verificationCode);
  }

  @Post('mfa/regenerate-backup-codes')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Regenerate MFA backup codes',
    description: 'Generate new backup codes for the authenticated user. Previous codes become invalid.'
  })
  @ApiBody({ 
    type: RegenerateBackupCodesDto,
    description: 'Backup codes regeneration data'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Backup codes regenerated successfully',
    type: RegenerateBackupCodesResponseDto
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid password or TOTP code'
  })
  async regenerateBackupCodes(
    @User('userId') userId: string,
    @Body() dto: RegenerateBackupCodesDto
  ): Promise<RegenerateBackupCodesResponseDto> {
    return this.authService.regenerateBackupCodes(userId, dto.currentPassword, dto.totpCode);
  }

  @Get('mfa/status')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Get MFA status',
    description: 'Get MFA status for the authenticated user.'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'MFA status retrieved successfully',
    type: MfaStatusDto
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Not authenticated'
  })
  async getMfaStatus(@User('userId') userId: string): Promise<MfaStatusDto> {
    return this.authService.getMfaStatus(userId);
  }
}
