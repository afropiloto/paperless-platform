import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { SearchResultsMetadata } from '../../trade-documents/dtos/search-trade-documents.dto';
import { NamedWalletDto } from './named-wallets.dto';

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