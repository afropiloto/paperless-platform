import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ChainLookupDTO {
  @ApiProperty({description: "Name of Chain"})
  @IsNotEmpty()
  @IsString()
  @Expose()
  chainName: string;
  @Expose()
  @ApiProperty({description: "Chain Id"})
  @IsNotEmpty()
  @IsString()
  chainId: string;
  @ApiProperty({description: "RPC Url for Chain"})
  @Expose()
  @IsNotEmpty()
  @IsString()
  rpcUrl: string;
  @ApiProperty({description: "Gas Station for Chain"})
  @Expose()
  @IsNotEmpty()
  @IsString()
  gasStation: string;
}