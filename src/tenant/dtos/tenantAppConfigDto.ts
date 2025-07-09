import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class TenantAppConfigDto {
  @ApiProperty({description: "Finance Module Available"})
  @Expose()
  financeModule: boolean;
}

export class ProviderInfoDto {
  @ApiProperty({description: "Blockchain Network"})
  @Expose()
  network: string;

  @ApiProperty({description: "Chain ID for network"})
  @Expose()
  chainId: number;

  @ApiProperty({description: "Network RPC Url"})
  @Expose()
  rpcUrl: string;
}

export class TenantChainConfigDto {
  @ApiProperty({description: "Finance Module Available"})
  @Expose()
  provider: ProviderInfoDto

@ApiProperty({description: "Token Registry Address"})
@Expose()
  tokenRegistryAddress: string;

  @ApiProperty({description: "Document Store Address"})
  @Expose()
  documentStoreAddress: string;
}