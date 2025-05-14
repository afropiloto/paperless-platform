import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { TradeDocumentDto } from './trade-document.dto';
import { IsEnum, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';



export enum SortDirection {
  ASC = 'asc',
  DESC = 'desc'
}

export class SearchQueryDto {
  @ApiProperty({description: "Terms to search for"})
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  queryTerm?: string;

  @ApiProperty({description: "Page number of the results to return"})
  @ApiPropertyOptional({default: 1})
  @IsOptional()
  @IsNumber()
  @Min(1, { message: 'Page number must be greater than 0' })
  page: number = 1;

  @ApiProperty({description: "Size of each page"})
  @ApiPropertyOptional({default: 5})
  @IsOptional()
  @IsNumber()
  @Min(1, { message: 'Page size limit must be greater than 0' })
  @Max(100, { message: 'Page limit size cannot be greater than 100' })
  limit: number = 5;

  @ApiProperty({description: "Field to order by"})
  @ApiPropertyOptional({default: "updatedAt"})
  @IsOptional()
  @IsString()
  orderBy?: string = 'updatedAt';

  @ApiProperty({description: "Direction to sort by. Either 'asc' or 'desc'"})
  @ApiPropertyOptional({default: SortDirection.DESC})
  @IsOptional()
  @IsEnum(SortDirection, { message: 'sortDirection must be either "asc" or "desc"' })
  orderDirection?: SortDirection = SortDirection.DESC;
}

export class SearchResultsMetadata {
  @ApiProperty({description: 'Search results page number'})
  @Expose()
  page: number;

  @ApiProperty({description: 'Total number of matched records'})
  @Expose()
  totalPages: number;

  @ApiProperty({description: 'Number of items per page'})
  @Expose()
  limit: number;

}

export class TradeDocumentsSearchResultsDto {
  @ApiProperty({description: "List of matching trade documents"})
  @Expose()
  data?: TradeDocumentDto[];

  @ApiProperty({description: "Search Results Metadata"})
  @Expose()
  metadata?: SearchResultsMetadata;
}