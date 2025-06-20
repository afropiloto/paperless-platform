import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { NamedWalletDto } from './named-wallets.dto';
import { SearchResultsMetadata } from '../../common/dtos/search.dto';

export class NamedWalletsSearchResultsDto {
  @ApiProperty({description: "List of matching trade documents"})
  @Expose()
  @Type(() => NamedWalletDto)
  data?: NamedWalletDto[];

  @ApiProperty({description: "Search Results Metadata"})
  @Expose()
  @Type(() => SearchResultsMetadata)
  metadata?: SearchResultsMetadata;
}