import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Param, 
  Body, 
  Query, 
  HttpStatus,
  ParseIntPipe,
  ValidationPipe
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiParam, 
  ApiQuery, 
  ApiBody,
  ApiProperty 
} from '@nestjs/swagger';
import { DocumentSigningService } from './document-signing.service';
import { 
  DocumentSigningDetailsDto, 
  DocumentSigningSearchResultsDto, 
  DocumentSigningCreationDetailsDto 
} from './dtos/document-signing.dto';
import { DocumentSigningStatus } from './types/document-signing.types';
import { SearchQueryDto } from 'src/common/dtos/search.dto';

@ApiTags('Document Signing')
@Controller('document-signing')
export class DocumentSigningController {
  constructor(
    private readonly documentSigningService: DocumentSigningService,
  ) {}

  @Get(':id')
  @ApiOperation({
    summary: 'Find document signing by ID',
    description: 'Retrieves a specific document signing record by its unique identifier'
  })
  @ApiParam({
    name: 'id',
    description: 'The unique identifier of the document signing record',
    example: '507f1f77bcf86cd799439011'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Document signing record found successfully',
    type: DocumentSigningDetailsDto
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Document signing record not found'
  })
  async findById(@Param('id') id: string): Promise<DocumentSigningDetailsDto> {
    return await this.documentSigningService.findById(id);
  }

  @Get('wallet/:walletAddress')
  @ApiOperation({
    summary: 'Find document signings by wallet address',
    description: 'Retrieves document signing records where the specified wallet address is in the list of signers. Supports pagination, filtering, and sorting.'
  })
  @ApiParam({
    name: 'walletAddress',
    description: 'The Ethereum wallet address to search for',
    example: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6'
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number for pagination',
    example: 1
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of items per page (max 100)',
    example: 10
  })
  @ApiQuery({
    name: 'queryTerm',
    required: false,
    description: 'Search term to filter by description',
    example: 'Promissory Note'
  })
  @ApiQuery({
    name: 'orderBy',
    required: false,
    description: 'Field to sort by',
    example: 'createdAt'
  })
  @ApiQuery({
    name: 'orderDirection',
    required: false,
    description: 'Sort direction (asc or desc)',
    example: 'desc'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Document signing records found successfully',
    type: DocumentSigningSearchResultsDto
  })
  async findByWalletAddress(
    @Param('walletAddress') walletAddress: string,
    @Query(ValidationPipe) searchQuery: SearchQueryDto
  ): Promise<DocumentSigningSearchResultsDto> {
    return await this.documentSigningService.findByWalletAddress(walletAddress, searchQuery);
  }

  @Get('wallet/:walletAddress/expiring')
  @ApiOperation({
    summary: 'Find expiring document signings by wallet address',
    description: 'Retrieves document signing records that are expiring soon for the specified wallet address. Only returns records with PENDING status.'
  })
  @ApiParam({
    name: 'walletAddress',
    description: 'The Ethereum wallet address to search for',
    example: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6'
  })
  @ApiQuery({
    name: 'daysUntilExpiry',
    required: false,
    description: 'Number of days to look ahead for expiring documents',
    example: 7
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Expiring document signing records found successfully',
    type: [DocumentSigningDetailsDto]
  })
  async findExpiringSoonByWalletAddress(
    @Param('walletAddress') walletAddress: string,
    @Query('daysUntilExpiry', new ParseIntPipe({ optional: true })) daysUntilExpiry: number = 7
  ): Promise<DocumentSigningDetailsDto[]> {
    return await this.documentSigningService.findExpiringSoonByWalletAddress(walletAddress, daysUntilExpiry);
  }

  @Put(':id/status')
  @ApiOperation({
    summary: 'Update document signing status',
    description: 'Updates the last known status of a document signing record. This is the only property that can be updated.'
  })
  @ApiParam({
    name: 'id',
    description: 'The unique identifier of the document signing record',
    example: '507f1f77bcf86cd799439011'
  })
  @ApiBody({
    description: 'The new status to set for the document signing',
    schema: {
      type: 'object',
      properties: {
        lastKnownStatus: {
          type: 'string',
          enum: Object.values(DocumentSigningStatus),
          description: 'The new status for the document signing'
        }
      },
      required: ['lastKnownStatus']
    }
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Document signing status updated successfully',
    type: DocumentSigningDetailsDto
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Document signing record not found'
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid status value provided'
  })
  async updateLastKnownStatus(
    @Param('id') id: string,
    @Body('lastKnownStatus') lastKnownStatus: DocumentSigningStatus
  ): Promise<DocumentSigningDetailsDto> {
    return await this.documentSigningService.updateLastKnownStatus(id, lastKnownStatus);
  }

  @Post()
  @ApiOperation({
    summary: 'Create new document signing record',
    description: 'Creates a new document signing record with the specified parties and details'
  })
  @ApiBody({
    description: 'Document signing creation details',
    type: DocumentSigningCreationDetailsDto
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Document signing record created successfully',
    type: DocumentSigningDetailsDto
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data provided'
  })
  async create(
    @Body(ValidationPipe) creationDetails: DocumentSigningCreationDetailsDto
  ): Promise<DocumentSigningDetailsDto> {
    return await this.documentSigningService.create(creationDetails);
  }
}
