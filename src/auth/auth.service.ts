import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AccountsService } from '../accounts/accounts.service';
import { AuthResponseDto } from './dtos/auth-response.dto';
import { plainToInstance } from 'class-transformer';
import { LoginDto } from './dtos/login.dto';
import { SiweService } from '../siwe/siwe.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(private readonly jwtService: JwtService,
              private readonly siweService: SiweService,
              private readonly accountsService: AccountsService,
              private readonly configService: ConfigService) {}



  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    try {
      this.logger.debug('Attempting login', { loginDto });
      
      if (!loginDto?.message || !loginDto?.signature) {
        throw new UnauthorizedException("Missing login credentials");
      }

      const walletAddress = await this.siweService.verifyMessage(loginDto.message, loginDto.signature);

      this.logger.debug('Checking account existence', { walletAddress });
      const accountExists = await this.accountsService.accountForWalletAddressExists(walletAddress);
      
      if (!accountExists) {
        this.logger.warn('Login attempt for unauthorized account', { walletAddress });
        throw new UnauthorizedException("Account not authorized");
      }

      // Generate JWT + Refresh Token
      const payload = { wallet: walletAddress };
      const accessToken = this.jwtService.sign(payload, { expiresIn: this.configService.get<string>('jwt.expiresIn') });
      const refreshToken = this.jwtService.sign(payload, { expiresIn: this.configService.get<string>('refreshToken.expiresIn')});

      this.logger.debug('Login successful', { walletAddress });
      return plainToInstance(AuthResponseDto, { success: true, accessToken, refreshToken });
    } catch (error) {
      this.logger.error('Login failed', {
        error: error.message,
        stack: error.stack,
        loginDto
      });
      throw error; // Re-throw to maintain the original error type
    }
  }

  async refreshToken(token: string) {
    try {
      const decoded = this.jwtService.verify(token);
      const payload = { wallet: decoded.wallet };
      const newAccessToken = this.jwtService.sign(payload, { expiresIn: '15m' });

      return { success: true, accessToken: newAccessToken };
    } catch (error) {
      this.logger.error({message: 'Error verifying refresh token', error});
      throw new UnauthorizedException("Invalid refresh token.");
    }
  }
}
