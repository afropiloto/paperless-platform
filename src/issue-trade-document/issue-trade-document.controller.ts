import {  Controller, HttpCode, HttpStatus, Logger, Param, Post, Body } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { IssueTradeDocumentService} from './issue-trade-document.service';
import { plainToInstance } from 'class-transformer';
import { GeneralResponseDto } from '../common/common-dto';

@ApiTags('Issue Trade Documents')
@Controller('trade-documents')
export class IssueTradeDocumentController {
  private readonly logger = new Logger(IssueTradeDocumentController.name);
  constructor(private readonly issuanceService: IssueTradeDocumentService) {}

  @Post('/:accountId/:documentId/issue')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({summary: 'Issues a verifiable version of a Trade Document'})
  @ApiResponse({status: 200, description:"Trade Document scheduled to be issued"})
  @ApiResponse({status: 400, description:"Trade Document not ready to be issued"})
  async issueTradeDocument(
    @Param('accountId') accountId: string,
    @Param('documentId') documentId: string
  ) {
    const issuedDocument = await this.issuanceService.issueTradeDocument({
      accountId,
      documentId
    });

    return plainToInstance(GeneralResponseDto, issuedDocument);
  }
}
