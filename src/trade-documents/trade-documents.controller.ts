import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Logger,
  Param,
  ParseFilePipeBuilder,
  Patch,
  Post,
  Put,
  Query,
  Res,
  UploadedFile, UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes, ApiHeader,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { TradeDocumentsService } from './trade-documents.service';
import {
  CreateTradeDocumentFromFileDto,
  TradeDocumentDto,
  UpsertTradeDocumentDto,
  UpsertTradeDocumentFileDto,
} from './dtos/trade-document.dto';
import { TradeDocumentType } from '../types/trade-documents.types';
import { FileInterceptor } from '@nestjs/platform-express';
import { GeneralResponseDto } from '../common/common-dto';
import { TRADE_DOCUMENT_SUMMARY_INCLUDE_FIELDS } from './trade-document.constants';
import { TradeDocumentFileVariant } from './trade-document-file.types';
import { Response } from 'express';
import { plainToInstance } from 'class-transformer';
import { SearchQueryDto } from '../common/dtos/search.dto';
import { JwtGuard } from 'src/auth/guards/jwt-guard';
import { ApiKeyGuard } from 'src/api-key-auth/api-key.guard';
import { ClientAccess } from 'src/api-key-auth/decorators/client-access.decorator';
import { ClientAccessGroup } from 'src/api-key-auth/types/api-key-auth.types';

@ApiTags('Trade Documents')
@Controller('trade-documents')
@UseGuards(JwtGuard, ApiKeyGuard)
@ApiHeader({
  name: 'x-api-key',
  description: 'The Client Application API Key',
  example: '47f19331:86382a9cbeaa603325628d29859b10fa6df94385ef792ea340cb1208ab9fdb6e'
})
@ClientAccess(ClientAccessGroup.PAIPERLESS_APP)
@ApiBearerAuth()
export class TradeDocumentsController {
  private readonly logger = new Logger(TradeDocumentsController.name);
  constructor(
    private readonly tradeDocumentsService: TradeDocumentsService,
  ) {}

  // *******************************************************************************************************************
  // Trade Document File endpoints
  // *******************************************************************************************************************
  @Get('/:accountId/:documentId/file/:fileVariant')
  @ClientAccess(ClientAccessGroup.PAIPERLESS_PORTAL)
  @ApiOperation({
    summary:
      'Retrieves the trade document file content an account by document Id',
  })
  @ApiResponse({ status: 200, description: 'Trade Document File retrieved' })
  @ApiResponse({
    status: 400,
    description: 'AccountId or DocumentId is invalid',
  })
  @ApiResponse({
    status: 404,
    description: 'Trade Document details could not be found',
  })
  @ApiResponse({
    status: 403,
    description: 'Not authorized to retrieve Trade Document details',
  })
  async getTradeDocumentFileById(
    @Param('accountId') accountId: string,
    @Param('documentId') documentId: string,
    @Param('fileVariant') fileVariant: TradeDocumentFileVariant,
    @Res() res: Response,
  ) {
    const { stream, headers } =
      await this.tradeDocumentsService.getTradeDocumentFileStream(
        accountId,
        documentId,
        fileVariant,
      );
    res.set(headers);

    return stream.pipe(res);
  }

  @Put('/:accountId/:documentId/file')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UpsertTradeDocumentFileDto })
  @ApiOperation({
    summary: 'Updates or sets the  file associated with a Trade Document',
  })
  @ApiResponse({
    status: 200,
    description: 'File was added to the Trade Document',
  })
  @ApiResponse({
    status: 422,
    description: 'File type not supported',
  })
  @ApiResponse({
    status: 404,
    description: 'Trade Document details could not be found',
  })
  @ApiResponse({
    status: 403,
    description: 'Not authorized to access Trade Document',
  })
  async uploadTradeDocumentFile(
    @Param('accountId') accountId: string,
    @Param('documentId') documentId: string,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({
          fileType: /(jpg|jpeg|png|pdf|doc|docx)$/,
        })
        .addMaxSizeValidator({
          maxSize: 10 * 1024 * 1024, // 10MB
        })
        .build({
          errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        }),
    )
    file: Express.Multer.File,
  ) {
    await this.tradeDocumentsService.updateTradeDocumentFileById(
      accountId,
      documentId,
      file,
    );
    return {
      success: true,
      message: 'Trade Document file uploaded',
    } as GeneralResponseDto;
  }

  @Post('/:accountId/file')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'The file to upload (jpg, jpeg, png, pdf, doc, docx)',
        },
        documentReference: {
          type: 'string',
          description: 'Reference identifier for the document',
        },
        documentType: {
          type: 'string',
          enum: Object.values(TradeDocumentType),
          description: 'Type of trade document',
        },
      },
      required: ['file', 'documentReference', 'documentType'],
    },
  })
  @ApiOperation({
    summary: 'Creates a new trade document with an uploaded file',
    description:
      'Upload a file and provide metadata to create a new trade document',
  })
  @ApiResponse({
    status: 200,
    description: 'Trade document created successfully with file',
  })
  @ApiResponse({
    status: 422,
    description: 'File type not supported or file too large',
  })
  @ApiResponse({
    status: 400,
    description: 'Missing required fields or invalid data',
  })
  @ApiResponse({
    status: 404,
    description: 'Account not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Not authorized to access Trade Document',
  })
  async createTradeDocumentFromFile(
    @Param('accountId') accountId: string,
    @Body() createFromFile: CreateTradeDocumentFromFileDto,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({
          fileType: /(jpg|jpeg|png|pdf|doc|docx)$/,
        })
        .addMaxSizeValidator({
          maxSize: 10 * 1024 * 1024, // 10MB
        })
        .build({
          errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        }),
    )
    file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    if (!createFromFile.documentReference || !createFromFile.documentType) {
      throw new BadRequestException(
        'Missing required fields: documentReference and documentType are required',
      );
    }

    const newDocument =
      await this.tradeDocumentsService.createTradeDocumentFromFile(
        accountId,
        file,
        createFromFile,
      );

    return newDocument;
  }

  // *******************************************************************************************************************
  // Trade Document endpoints
  // *******************************************************************************************************************
  @Get(':accountId/:documentId')
  @ClientAccess(ClientAccessGroup.PAIPERLESS_PORTAL)
  @ApiOperation({
    summary: 'Retrieves a trade document for an account by document Id',
  })
  @ApiResponse({ status: 200, description: 'Trade Document details retrieved' })
  @ApiResponse({
    status: 400,
    description: 'AccountId or DocumentId is invalid',
  })
  @ApiResponse({
    status: 404,
    description: 'Trade Document details could not be found',
  })
  @ApiResponse({
    status: 403,
    description: 'Not authorized to retrieve Trade Document details',
  })
  async getTradeDocumentById(
    @Param('accountId') accountId: string,
    @Param('documentId') documentId: string,
  ): Promise<TradeDocumentDto> {

    return await this.tradeDocumentsService.getDocumentById(
      accountId,
      documentId,
    );
  }

  @Get(':accountId/')
  @ClientAccess(ClientAccessGroup.PAIPERLESS_PORTAL)
  @ApiOperation({
    summary:
      'Retrieves summary information about existing trade document for an account based on a search criteria.',
  })
  @ApiResponse({ status: 200, description: 'Trade Documents retrieved' })
  @ApiResponse({
    status: 400,
    description: 'Account details or search parameters are invalid',
  })
  @ApiResponse({
    status: 404,
    description: 'Account not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Not authorized to retrieve Trade Document details',
  })
  @ApiQuery({ type: SearchQueryDto })
  async getTradeDocumentsForAccount(
    @Param('accountId') accountId: string,
    @Query() searchParams: SearchQueryDto,
  ) {
    return this.tradeDocumentsService.searchTradeDocumentsByAccountId(
      accountId,
      searchParams,
      TRADE_DOCUMENT_SUMMARY_INCLUDE_FIELDS,
    );
  }

  @Delete(':accountId/:documentId')
  @ApiOperation({
    summary: 'Deletes an existing trade document for an account',
  })
  @ApiResponse({ status: 200, description: 'Trade Document deleted' })
  @ApiResponse({
    status: 400,
    description: ' Account or document details are invalid',
  })
  @ApiResponse({
    status: 404,
    description: 'Trade Document or account not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Not authorized to retrieve Trade Document details',
  })
  async deleteTradeDocumentById(
    @Param('accountId') accountId: string,
    @Param('documentId') documentId: string,
  ): Promise<GeneralResponseDto> {
    // Proceed to delete document
    await this.tradeDocumentsService.deleteDocumentById(accountId, documentId);

    return plainToInstance(GeneralResponseDto, {
      success: true,
      message: 'Successfully deleted document',
    });
  }

  @Patch(':accountId/:documentId')
  @ApiOperation({
    summary: 'Updates an existing trade document for an account',
  })
  @ApiResponse({ status: 200, description: 'Trade Document details updated' })
  @ApiResponse({
    status: 400,
    description: ' Account or document details are invalid',
  })
  @ApiResponse({
    status: 404,
    description: 'Trade Document details could not be found',
  })
  @ApiResponse({
    status: 403,
    description: 'Not authorized to retrieve Trade Document details',
  })
  async updateTradeDocumentById(
    @Param('accountId') accountId: string,
    @Param('documentId') documentId: string,
    @Body() tradeDocument: UpsertTradeDocumentDto,
  ): Promise<TradeDocumentDto> {
    // Proceed to update document
    return await this.tradeDocumentsService.updateTradeDocumentById(
      accountId,
      documentId,
      tradeDocument,
    );
  }

  @Post(':accountId')
  @ApiBody({ type: UpsertTradeDocumentDto })
  @ApiOperation({ summary: 'Creates a new trade document for an account' })
  @ApiResponse({ status: 200, description: 'Trade Document details retrieved' })
  @ApiResponse({
    status: 400,
    description: ' Account or document details are invalid',
  })
  @ApiResponse({
    status: 404,
    description: 'Trade Document details could not be found',
  })
  @ApiResponse({
    status: 403,
    description: 'Not authorized to retrieve Trade Document details',
  })
  async createTradeDocument(
    @Param('accountId') accountId: string,
    @Body() content: UpsertTradeDocumentDto,
  ): Promise<TradeDocumentDto> {
    return await this.tradeDocumentsService.createTradeDocument(
      accountId,
      content,
    );
  }

}


