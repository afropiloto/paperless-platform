import { Body, Controller, Get, Logger, Param, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RefreshTokenDto } from './dtos/refresh-token.dto';
import { LoginDto } from './dtos/login.dto';
import { AuthResponseDto, TokenRefreshResponseDto } from './dtos/auth-response.dto';
import { SiweService } from '../siwe/siwe.service';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
  constructor(
    private readonly authService: AuthService,
    private readonly siweService: SiweService,
  ) {}

  @Get('nonce/:address')
  async getMessage(@Param('address') address: string) {
    return this.siweService.generateNonce(address);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    return await this.authService.login(loginDto);
  }

  @Post('refresh')
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) :Promise<TokenRefreshResponseDto> {
    return this.authService.refreshToken(refreshTokenDto.refreshToken);
  }
}
