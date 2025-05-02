import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  ParseFilePipeBuilder,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { VerifyTradeDocumentService } from './verify-trade-document.service';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  TradeDocumentVerificationResultsDto,
  VerifyTradeDocumentFileDto,
} from './dtos/verify-trade-document.dto';
import { plainToInstance } from 'class-transformer';
import { TradeDocumentFileDTO } from '../trade-documents/dtos/trade-document.dto';

@Controller('verify/trade-document/')
@ApiTags('Verify Trade Document')
export class VerifyTradeDocumentController {
  private readonly logger = new Logger(VerifyTradeDocumentController.name);

  constructor(
    private readonly verifyTradeDocumentService: VerifyTradeDocumentService,
  ) {}

  @Get('/:trackingId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Retrieves the trade document details using the Document Tracking ID',
  })
  @ApiResponse({ status: 200, description: 'Trade Document File validated' })
  @ApiResponse({ status: 404, description: 'Tracking ID not recognised' })
  async getTradeDocumentByTrackingId(@Param('trackingId') trackingId: string) {
    const document =
      await this.verifyTradeDocumentService.getTradeDocumentByTrackingId(
        trackingId,
      );
    this.logger.debug(document);
    return document;
  }

  @Get('/:trackingId/file')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Retrieves the trade document details using the Document Tracking ID',
  })
  @ApiResponse({ status: 200, description: 'Trade Document File validated' })
  @ApiResponse({ status: 404, description: 'Tracking ID not recognised' })
  async getTradeDocumentFileByTrackingId(
    @Param('trackingId') trackingId: string,
  ) {
    return await this.verifyTradeDocumentService.getTradeDocumentFileByTrackingId(
        trackingId);

  }

  @Post('/')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: VerifyTradeDocumentFileDto })
  @ApiOperation({
    summary:
      'Verifies the validity of a Trade Document PDF issued by Paiperless',
  })
  @ApiResponse({ status: 200, description: 'Trade Document File validated' })
  @ApiResponse({
    status: 422,
    description: 'File type not supported for verification.',
  })
  async verifyTradeDocumentFile(
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({
          fileType: 'application/pdf',
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
    return plainToInstance(
      TradeDocumentVerificationResultsDto,
      await this.verifyTradeDocumentService.verifyTradeDocument(file),
    );
  }
}
