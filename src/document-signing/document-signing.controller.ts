import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Logger,
  Param,
  Post,
  Put,
  Query, UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBody, ApiHeader,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { DocumentSigningService } from './document-signing.service';
import {
  DocumentSigningCreationDetailsDto,
  DocumentSigningDetailsDto,
  DocumentSigningSearchResultsDto,
} from './dtos/document-signing.dto';
import { DocumentSigningStatus } from './types/document-signing.types';
import { SearchQueryDto } from 'src/common/dtos/search.dto';
import { GeneralResponseDto } from '../common/common-dto';
import { JwtGuard } from 'src/auth/guards/jwt-guard';
import { ApiKeyGuard } from 'src/api-key-auth/api-key.guard';
import { ClientAccess } from 'src/api-key-auth/decorators/client-access.decorator';
import { ClientAccessGroup } from 'src/api-key-auth/types/api-key-auth.types';

@ApiTags('Document Signing')
@Controller('document-signing')
@UseGuards(JwtGuard, ApiKeyGuard)
@ApiHeader({
  name: 'x-api-key',
  description: 'The Client Application API Key',
  example: '47f19331:86382a9cbeaa603325628d29859b10fa6df94385ef792ea340cb1208ab9fdb6e'
})
@ClientAccess(ClientAccessGroup.SHARED)
export class DocumentSigningController {
  private readonly logger = new Logger(DocumentSigningController.name);

  constructor(
    private readonly documentSigningService: DocumentSigningService,
  ) {}

  @Get(':id')
  @ApiOperation({
    summary: 'Find document signing by ID',
    description:
      'Retrieves a specific document signing record by its unique identifier',
  })
  @ApiParam({
    name: 'id',
    description: 'The unique identifier of the document signing record',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Document signing record found successfully',
    type: DocumentSigningDetailsDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Document signing record not found',
  })
  async findById(@Param('id') id: string): Promise<DocumentSigningDetailsDto> {
    return await this.documentSigningService.findById(id);
  }

  @Get('/trade-document/:id')
  @ApiOperation({
    summary: 'Find document signing associated with a Trade Document',
    description:
      'Retrieves a specific document signing record related to a trade document',
  })
  @ApiParam({
    name: 'id',
    description: 'The unique identifier of the document document record',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Document signing record found successfully',
    type: DocumentSigningDetailsDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Document signing record not found',
  })
  async findByTradeDocumentId(@Param('id') id: string): Promise<DocumentSigningDetailsDto> {
    return await this.documentSigningService.findByTradeDocumentId(id);
  }

  @Get('wallet/:walletAddress')
  @ApiOperation({
    summary: 'Find document signings by wallet address',
    description:
      'Retrieves document signing records where the specified wallet address is in the list of signers. Supports pagination, filtering, and sorting.',
  })
  @ApiParam({
    name: 'walletAddress',
    description: 'The Ethereum wallet address to search for',
    example: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number for pagination',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of items per page (max 100)',
    example: 10,
  })
  @ApiQuery({
    name: 'queryTerm',
    required: false,
    description: 'Search term to filter by description',
    example: 'Promissory Note',
  })
  @ApiQuery({
    name: 'orderBy',
    required: false,
    description: 'Field to sort by',
    example: 'createdAt',
  })
  @ApiQuery({
    name: 'orderDirection',
    required: false,
    description: 'Sort direction (asc or desc)',
    example: 'desc',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Document signing records found successfully',
    type: DocumentSigningSearchResultsDto,
  })
  async findByWalletAddress(
    @Param('walletAddress') walletAddress: string,
    @Query(ValidationPipe) searchQuery: SearchQueryDto,
  ): Promise<DocumentSigningSearchResultsDto> {
    return await this.documentSigningService.findByIdentifier(
      {walletAddress: walletAddress},
      searchQuery,
    );
  }

  @Get('account/:accountId')
  @ApiOperation({
    summary: 'Find document signings by wallet address',
    description:
      'Retrieves document signing records where the specified wallet address is in the list of signers. Supports pagination, filtering, and sorting.',
  })
  @ApiParam({
    name: 'accountId',
    description: 'The id of the account to find document signings for',
    example: '0532925a3b8D4C9db96C4b4d8b6',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number for pagination',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of items per page (max 100)',
    example: 10,
  })
  @ApiQuery({
    name: 'queryTerm',
    required: false,
    description: 'Search term to filter by description',
    example: 'Promissory Note',
  })
  @ApiQuery({
    name: 'orderBy',
    required: false,
    description: 'Field to sort by',
    example: 'createdAt',
  })
  @ApiQuery({
    name: 'orderDirection',
    required: false,
    description: 'Sort direction (asc or desc)',
    example: 'desc',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Document signing records found successfully',
    type: DocumentSigningSearchResultsDto,
  })
  async findByAccountId(
    @Param('accountId') accountId: string,
    @Query(ValidationPipe) searchQuery: SearchQueryDto,
  ): Promise<DocumentSigningSearchResultsDto> {
    return await this.documentSigningService.findByIdentifier(
      { accountId: accountId},
      searchQuery,
    );
  }

  @Put(':id/status')
  @ApiOperation({
    summary: 'Update document signing status',
    description:
      'Updates the last known status of a document signing record. This is the only property that can be updated.',
  })
  @ApiParam({
    name: 'id',
    description: 'The unique identifier of the document signing record',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiBody({
    description: 'The new status to set for the document signing',
    schema: {
      type: 'object',
      properties: {
        lastKnownStatus: {
          type: 'string',
          enum: Object.values(DocumentSigningStatus),
          description: 'The new status for the document signing',
        },
      },
      required: ['lastKnownStatus'],
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Document signing status updated successfully',
    type: DocumentSigningDetailsDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Document signing record not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid status value provided',
  })
  async updateLastKnownStatus(
    @Param('id') id: string,
    @Body('lastKnownStatus') lastKnownStatus: DocumentSigningStatus,
  ): Promise<DocumentSigningDetailsDto> {
    return await this.documentSigningService.updateLastKnownStatus(
      id,
      lastKnownStatus,
    );
  }

  @Post()
  @ApiOperation({
    summary: 'Create new document signing record',
    description:
      'Creates a new document signing record with the specified parties and details',
  })
  @ApiBody({
    description: 'Document signing creation details',
    type: DocumentSigningCreationDetailsDto,
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Document signing record created successfully',
    type: DocumentSigningDetailsDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data provided',
  })
  async create(
    @Body(ValidationPipe) creationDetails: DocumentSigningCreationDetailsDto,
  ): Promise<GeneralResponseDto> {
    return await this.documentSigningService.createDocumentSigningEvent(
      creationDetails,
    );
  }
}
