import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthResponseDto } from './dtos/auth-response.dto';
import { plainToInstance } from 'class-transformer';
import { LoginDto } from './dtos/login.dto';
import { SiweService } from '../siwe/siwe.service';
import { ConfigService } from '@nestjs/config';
import { AccountUsersService } from '../account-users/account-users.service';
import { AccountsService } from '../accounts/accounts.service';
import { JwtPayload } from './types/jwt-payload.types';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly siweService: SiweService,
    private readonly accountUsersService: AccountUsersService,
    private readonly accountsService: AccountsService,
    private readonly configService: ConfigService
  ) {}

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    try {
      if (!loginDto?.message || !loginDto?.signature) {
        throw new UnauthorizedException("Missing login credentials");
      }

      // Verify the SIWE message and get wallet address
      const walletAddress = await this.siweService.verifyMessage(loginDto.message, loginDto.signature);

      // Find the account user by wallet address
      const accountUser = await this.accountUsersService.findAccountUserByWalletAddress(walletAddress);
      
      if (!accountUser) {
        this.logger.warn('Login attempt for unauthorized wallet address', { walletAddress });
        throw new UnauthorizedException("Account user not authorized");
      }

      // Get account details for additional information
      const accountDetails = await this.accountsService.findByWalletAddress(walletAddress);
      if (!accountDetails) {
        this.logger.warn('Account not found for  user', { walletAddress, userId: accountUser.id });
        throw new UnauthorizedException("Account not found");
      }

      // Generate JWT payload with user permissions
      const jwtPayload: JwtPayload = {
        accountId: accountUser.accountId,
        userId: accountUser.id,
        walletAddress: accountUser.walletAddress,
        permissions: accountUser.permissions
      };
      // Generate JWT tokens
      const accessToken = this.jwtService.sign(jwtPayload, { 
        expiresIn: this.configService.get<string>('jwt.expiresIn') 
      });
      const refreshToken = this.jwtService.sign(jwtPayload, { 
        expiresIn: this.configService.get<string>('refreshToken.expiresIn')
      });

      return plainToInstance(AuthResponseDto, {
        success: true,
        accessToken,
        refreshToken,
        accountId: accountUser.accountId,
        accountName: accountDetails.accountName,
        accountEmail: accountDetails.contact.emailAddress,
        userId: accountUser.id,
        userName: accountUser.name,
        userEmail: accountUser.emailAddress,
        walletAddress: accountUser.walletAddress,
        permissions: accountUser.permissions
      }, { excludeExtraneousValues: true });

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
      const decoded = this.jwtService.verify(token) as JwtPayload;
      
      // Validate that the user still exists and is active
      const accountUser = await this.accountUsersService.getAccountUserById(decoded.userId);
      
      // Update the payload with current permissions (in case they changed)
      const updatedPayload: JwtPayload = {
        accountId: decoded.accountId,
        userId: decoded.userId,
        walletAddress: decoded.walletAddress,
        permissions: accountUser.permissions
      };

      const newAccessToken = this.jwtService.sign(updatedPayload, { 
        expiresIn: this.configService.get<string>('jwt.expiresIn') 
      });

      return { success: true, accessToken: newAccessToken };
    } catch (error) {
      this.logger.error({message: 'Error verifying refresh token', error});
      throw new UnauthorizedException("Invalid refresh token.");
    }
  }
}
