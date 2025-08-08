import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SiweService } from '../siwe/siwe.service';
import { EmailPasswordLoginDto } from './dtos/email-password-login.dto';
import { ChangePasswordDto } from './dtos/change-password.dto';
import { ForgotPasswordDto } from './dtos';
import { ResetPasswordDto } from './dtos';
import { LoginDto } from './dtos';
import { RefreshTokenDto } from './dtos';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;
  let siweService: SiweService;

  const mockAuthResponse = {
    success: true,
    accessToken: 'mock.access.token',
    refreshToken: 'mock.refresh.token',
    accountId: 'account123',
    accountName: 'Test Account',
    accountEmail: 'account@example.com',
    userId: 'user123',
    userName: 'Test User',
    userEmail: 'test@example.com',
    walletAddress: '0x1234567890abcdef',
    permissions: [{ module: 'DealDesk', role: 'Agent' }],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            login: jest.fn(),
            loginWithEmailPassword: jest.fn(),
            refreshToken: jest.fn(),
            changePassword: jest.fn(),
            forgotPassword: jest.fn(),
            resetPassword: jest.fn(),
          },
        },
        {
          provide: SiweService,
          useValue: {
            generateNonce: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
    siweService = module.get<SiweService>(SiweService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getMessage', () => {
    it('should generate nonce for wallet address', async () => {
      const address = '0x1234567890abcdef';
      const mockNonce = 'mock-nonce-123';
      jest.spyOn(siweService, 'generateNonce').mockResolvedValue(mockNonce);

      const result = await controller.getMessage(address);

      expect(result).toBe(mockNonce);
      expect(siweService.generateNonce).toHaveBeenCalledWith(address);
    });
  });

  describe('login', () => {
    it('should authenticate with SIWE credentials', async () => {
      const loginDto: LoginDto = {
        message: 'mock-siwe-message',
        signature: 'mock-signature',
      };
      jest.spyOn(authService, 'login').mockResolvedValue(mockAuthResponse);

      const result = await controller.login(loginDto);

      expect(result).toEqual(mockAuthResponse);
      expect(authService.login).toHaveBeenCalledWith(loginDto);
    });
  });

  describe('loginWithEmailPassword', () => {
    it('should authenticate with email and password', async () => {
      const loginDto: EmailPasswordLoginDto = {
        email: 'test@example.com',
        password: 'ValidPassword123!',
      };
      jest.spyOn(authService, 'loginWithEmailPassword').mockResolvedValue(mockAuthResponse);

      const result = await controller.loginWithEmailPassword(loginDto);

      expect(result).toEqual(mockAuthResponse);
      expect(authService.loginWithEmailPassword).toHaveBeenCalledWith(loginDto);
    });
  });

  describe('refreshToken', () => {
    it('should refresh JWT token', async () => {
      const refreshTokenDto: RefreshTokenDto = {
        refreshToken: 'mock.refresh.token',
      };
      const mockRefreshResponse = {
        success: true,
        accessToken: 'new.access.token',
      };
      jest.spyOn(authService, 'refreshToken').mockResolvedValue(mockRefreshResponse);

      const result = await controller.refreshToken(refreshTokenDto);

      expect(result).toEqual(mockRefreshResponse);
      expect(authService.refreshToken).toHaveBeenCalledWith(refreshTokenDto.refreshToken);
    });
  });

  describe('changePassword', () => {
    it('should change user password', async () => {
      const userId: string = 'user123';
      const changePasswordDto: ChangePasswordDto  = {
        currentPassword: 'OldPassword123!',
        newPassword: 'NewPassword456!',
      };
      const mockResponse = { success: true, message: 'Password changed successfully' };
      jest.spyOn(authService, 'changePassword').mockResolvedValue(mockResponse);

      const result = await controller.changePassword(userId, changePasswordDto);

      expect(result).toEqual(mockResponse);
      expect(authService.changePassword).toHaveBeenCalledWith('user123', {
        currentPassword: 'OldPassword123!',
        newPassword: 'NewPassword456!',
      });
    });

    it('should throw error when userId is missing', async () => {
      const userId: string = 'user123';
      const changePasswordDto: ChangePasswordDto = {
        currentPassword: 'OldPassword123!',
        newPassword: 'NewPassword456!',
      };

      await expect(controller.changePassword(userId, changePasswordDto)).rejects.toThrow('userId is required');
    });
  });

  describe('forgotPassword', () => {
    it('should initiate password reset process', async () => {
      const forgotPasswordDto: ForgotPasswordDto = {
        email: 'test@example.com',
      };
      const mockResponse = { success: true, message: 'If the email exists, a reset link will be sent.' };
      jest.spyOn(authService, 'forgotPassword').mockResolvedValue(mockResponse);

      const result = await controller.forgotPassword(forgotPasswordDto);

      expect(result).toEqual(mockResponse);
      expect(authService.forgotPassword).toHaveBeenCalledWith(forgotPasswordDto);
    });
  });

  describe('resetPassword', () => {
    it('should reset password with valid token', async () => {
      const resetPasswordDto: ResetPasswordDto = {
        token: 'valid-reset-token',
        newPassword: 'NewPassword456!',
      };
      const mockResponse = { success: true, message: 'Password has been reset successfully' };
      jest.spyOn(authService, 'resetPassword').mockResolvedValue(mockResponse);

      const result = await controller.resetPassword(resetPasswordDto);

      expect(result).toEqual(mockResponse);
      expect(authService.resetPassword).toHaveBeenCalledWith(resetPasswordDto);
    });
  });
});
