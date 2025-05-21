import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus, Inject,
  Logger,
  NotFoundException,
  Param,
  ParseFilePipeBuilder,
  Post,
  Put, Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation, ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { TradeDocumentsService } from './trade-documents.service';
import mongoose from 'mongoose';
import { AccountsService } from '../accounts/accounts.service';
import { plainToInstance } from 'class-transformer';
import {
  TradeDocumentDto,
  TradeDocumentFileDTO,
  UpsertTradeDocumentDto,
  UpsertTradeDocumentFileDto,
} from './dtos/trade-document.dto';
import { TradeDocumentStatus } from '../types/trade-documents.types';
import { FileInterceptor } from '@nestjs/platform-express';
import { GeneralResponseDto } from '../common/common-dto';
import { TRADE_DOCUMENT_SUMMARY_INCLUDE_FIELDS } from './trade-document.constants';
import { SearchQueryDto } from './dtos/search-trade-documents.dto';
import { FileStorageService } from '../file-storage/file-storage.interface';
import { FILE_STORAGE_SERVICE } from '../file-storage/file-storage.constants';

@ApiTags('Trade Documents')
@Controller('trade-documents')
export class TradeDocumentsController {
  private readonly logger = new Logger(TradeDocumentsController.name);
  constructor(
    private readonly tradeDocumentsService: TradeDocumentsService,
    private readonly accountService: AccountsService,
    @Inject(FILE_STORAGE_SERVICE)
    private readonly fileStorageService: FileStorageService,
  ) {}

  // *******************************************************************************************************************
  // Trade Document File endpoints
  // *******************************************************************************************************************
  @Get(':accountId/:documentId/file')
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
    status: 401,
    description: 'Not authorized to retrieve Trade Document details',
  })
  async getTradeDocumentFileById(
    @Param('accountId') accountId: string,
    @Param('documentId') documentId: string,
  ): Promise<TradeDocumentFileDTO> {
    if (!mongoose.Types.ObjectId.isValid(documentId)) {
      throw new HttpException(
        'The documentId is invalid',
        HttpStatus.BAD_REQUEST,
      );
    }
    const result = await this.tradeDocumentsService.getDocumentFileById(
      accountId,
      documentId,
    );
    return plainToInstance(TradeDocumentFileDTO, {
      accountId,
      documentId,
      fileName: result.fileName,
      dataUrl: result.dataUrl,
      fileSize: result.fileSize,
      mimeType: result.mimeType,
    });
  }

  @Put(':accountId/:documentId/file')
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
    status: 401,
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
    return {success: true, message: "Trade Document file uploaded"} as GeneralResponseDto
  }

  // *******************************************************************************************************************
  // Trade Document Content endpoints
  // *******************************************************************************************************************
  @Get(':accountId/:documentId')
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
    status: 401,
    description: 'Not authorized to retrieve Trade Document details',
  })
  async getTradeDocumentById(
    @Param('accountId') accountId: string,
    @Param('documentId') documentId: string,
  ): Promise<TradeDocumentDto> {
    if (!mongoose.Types.ObjectId.isValid(documentId)) {
      throw new HttpException(
        'The documentId is invalid',
        HttpStatus.BAD_REQUEST,
      );
    }

    return await this.tradeDocumentsService.getDocumentById(
      accountId,
      documentId,
    );
  }

  @Get(':accountId/')
  @ApiOperation({
    summary: 'Retrieves summary information about existing trade document for an account based on a search criteria.',
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
    status: 401,
    description: 'Not authorized to retrieve Trade Document details',
  })
  @ApiQuery({type: SearchQueryDto})
  async getTradeDocumentsForAccount(@Param('accountId') accountId: string,
                                    @Query() searchParams: SearchQueryDto

  ){
    return this.tradeDocumentsService.searchTradeDocumentsByAccountId(accountId, searchParams, TRADE_DOCUMENT_SUMMARY_INCLUDE_FIELDS);
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
    status: 401,
    description: 'Not authorized to retrieve Trade Document details',
  })
  async deleteTradeDocumentById(
    @Param('accountId') accountId: string,
    @Param('documentId') documentId: string,
  ) {
    if (!mongoose.Types.ObjectId.isValid(documentId)) {
      this.logger.debug({
        message: 'Invalid Object Id',
        accountId,
        documentId,
      });
      throw new BadRequestException('The documentId is invalid');
    }
    const document = await this.tradeDocumentsService.getDocumentById(
      accountId,
      documentId, [], ['wrappedContent', 'tradeDocumentFile', 'merkleRoot']
    );
    if (!document) {
      throw new NotFoundException('The document not found for account');
    }
    // Check if the document is in a deletable state
    if (!this.documentIsDeletable(document.status)) {
      this.logger.debug({
        message: 'Document not deletable',
        accountId,
        documentId,
        status: document.status,
      });
      throw new BadRequestException('The document could not be deleted');
    }
    // Proceed to delete document
    await this.tradeDocumentsService.deleteDocumentById(accountId, documentId);
    return {
      status: 200,
      description: 'Successfully deleted document',
    };
  }

  @Put(':accountId/:documentId')
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
    status: 401,
    description: 'Not authorized to retrieve Trade Document details',
  })
  async updateTradeDocumentById(
    @Param('accountId') accountId: string,
    @Param('documentId') documentId: string,
    @Body() tradeDocument: UpsertTradeDocumentDto,
  ): Promise<TradeDocumentDto> {
    if (!mongoose.Types.ObjectId.isValid(documentId)) {
      throw new BadRequestException('The documentId is invalid');
    }
    const document = await this.tradeDocumentsService.getDocumentById(
      accountId,
      documentId, [], ['wrappedContent', 'tradeDocumentFile', 'merkleRoot']
    );
    if (!document) {
      throw new NotFoundException('The document not found for account');
    }
    // Check if the document is in an updatable state
    if (!this.documentIsUpdatable(document.status)) {
      throw new BadRequestException('The document could not be updated');
    }
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
    status: 401,
    description: 'Not authorized to retrieve Trade Document details',
  })
  async createTradeDocument(
    @Param('accountId') accountId: string,
    @Body() content: UpsertTradeDocumentDto,
  ): Promise<TradeDocumentDto> {
    if (!(await this.accountService.accountExists(accountId))) {
      throw new HttpException('Invalid Account', HttpStatus.BAD_REQUEST);
    }

    return await this.tradeDocumentsService.createTradeDocument(
      accountId,
      content,
    );
  }

  private documentIsDeletable(status: string) {
    switch (status.toLowerCase()) {
      case TradeDocumentStatus.IN_PROGRESS.toLowerCase():
        return true;
      case TradeDocumentStatus.ISSUED.toLowerCase():
        return false;
      default:
        return false;
    }
  }

  private documentIsUpdatable(status: string) {
    switch (status.toLowerCase()) {
      case TradeDocumentStatus.IN_PROGRESS.toLowerCase():
        return true;
      case TradeDocumentStatus.ISSUED.toLowerCase():
        return false;
      default:
        return false;
    }
  }
}
