import { Controller, Get, Logger } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ProviderInfoDto, TenantAppConfigDto, TenantChainConfigDto } from './dtos/tenantAppConfigDto';
import { plainToInstance } from 'class-transformer';
import { ConfigService } from '@nestjs/config';


@ApiTags('Tenant')
@Controller('tenant')
export class TenantController {
  private readonly logger = new Logger(TenantController.name);
  constructor(private configService: ConfigService) {
  }


  @Get('/config')
  @ApiOperation({ summary: 'Gets the current application configuration for a tenant' })
  @ApiResponse({ status: 200, description: 'Tenant configuration retrieved' })
  async getTenantConfig() : Promise<TenantAppConfigDto> {
    const config = new TenantAppConfigDto();
    config.financeModule = this.configService.get<boolean>("tenant.financeModule");
    return plainToInstance(TenantAppConfigDto, config);
  }


  @Get('/chainConfig')
  @ApiOperation({ summary: 'Gets the current blockchain network configuration for the tenant' })
  @ApiResponse({ status: 200, description: 'Tenant network configuration retrieved' })
  async getChainConfig(): Promise<TenantChainConfigDto> {
    const config = new TenantChainConfigDto();
    config.provider = new ProviderInfoDto();
    config.provider.network = this.configService.get<string>('tenant.provider.network');
    config.provider.providerType = this.configService.get<string>('tenant.provider.providerType');
    config.provider.rpcUrl = this.configService.get<string>('tenant.provider.rpcUrl');
    config.tokenRegistryAddress= this.configService.get<string>('tenant.tokenRegistryAddress');
    config.documentStoreAddress = this.configService.get<string>('tenant.documentStoreAddress');
    return plainToInstance(TenantChainConfigDto, config)
  }
}
