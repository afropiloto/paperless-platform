import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  ParseFilePipeBuilder,
  Post,
  UploadedFile, UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBody,
  ApiConsumes, ApiHeader,
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
import { ApiKeyGuard } from 'src/api-key-auth/api-key.guard';
import { ClientAccess } from 'src/api-key-auth/decorators/client-access.decorator';
import { ClientAccessGroup } from 'src/api-key-auth/types/api-key-auth.types';

@Controller('verify/trade-document/')
@ApiTags('Verify Trade Document')
@UseGuards(ApiKeyGuard)
@ApiHeader({
  name: 'x-api-key',
  description: 'The Client Application API Key',
  example: '47f19331:86382a9cbeaa603325628d29859b10fa6df94385ef792ea340cb1208ab9fdb6e'
})
@ClientAccess(ClientAccessGroup.PAPERLESS_APP)
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
    return await this.verifyTradeDocumentService.getTradeDocumentByTrackingId(
      trackingId,
    );
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
      trackingId,
    );
  }

  @Post('/')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: VerifyTradeDocumentFileDto })
  @ApiOperation({
    summary:
      'Verifies the validity of a Trade Document PDF issued by Paperless',
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
    this.logger.debug(file.originalname)
    return plainToInstance(
      TradeDocumentVerificationResultsDto,
      await this.verifyTradeDocumentService.verifyTradeDocument(file),
    );
  }
}
