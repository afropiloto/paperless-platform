import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { SearchResultsMetadata } from '../../common/dtos/search.dto';
import { AccountUserResponseDto } from './account-user.dto';

export class AccountUsersSearchResultsDto {
  @ApiProperty({ description: 'List of matching account users' })
  @Expose()
  @Type(() => AccountUserResponseDto)
  data?: AccountUserResponseDto[];

  @ApiProperty({ description: 'Search Results Metadata' })
  @Expose()
  @Type(() => SearchResultsMetadata)
  metadata?: SearchResultsMetadata;
} 