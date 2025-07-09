import { Controller, Get, Logger } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ProviderInfoDto, TenantAppConfigDto, TenantChainConfigDto } from './dtos/tenantAppConfigDto';
import { plainToInstance } from 'class-transformer';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';
import { DidDto } from './dtos/DidDto';
import { SUPPORTED_CHAINS } from '@trustvc/trustvc';


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
    const chainId =this.configService.get<number>('tenant.provider.chainId');
    const chainInfo = SUPPORTED_CHAINS[chainId];

    const config = new TenantChainConfigDto();
    config.provider = new ProviderInfoDto();
    config.provider.network = chainInfo.name;
    config.provider.chainId = chainId;
    config.provider.rpcUrl = chainInfo.rpcUrl;
    config.tokenRegistryAddress= this.configService.get<string>('tenant.tokenRegistryAddress');
    config.documentStoreAddress = this.configService.get<string>('tenant.documentStoreAddress');
    return plainToInstance(TenantChainConfigDto, config)
  }
  
  @Get('/did')
  @ApiOperation({summary: 'Returns the DID JSON file for the tenant' })
  @ApiResponse({status: 200, description: 'The DID JSON file for the tenant was returned' })
  async getDidJson(): Promise<DidDto> {

    const baseDir = process.env.NODE_ENV === 'production'
      ? path.resolve(__dirname, '..', '..', 'static-files')
      : path.resolve(process.cwd(), 'src', 'static-files');


    const didJsonPath = path.resolve(baseDir, 'did.json');

    try {
      const fileContents = await fs.readFile(didJsonPath, 'utf-8');

      return plainToInstance(DidDto, JSON.parse(fileContents));
    } catch (error) {
      this.logger.error({ message: `Failed to read DID file from ${didJsonPath.toString()}`, error: error.message });
    }  
  }
}
