import { BadRequestException, Controller, HttpCode, HttpStatus, Logger, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { IssueTradeDocumentService } from './issue-trade-document.service';
import { plainToInstance } from 'class-transformer';
import { GeneralResponseDto } from '../common/common-dto';
import { isValidAccountIdFormat, isValidDocumentIdFormat } from '../common/common-validation';

@ApiTags('Issue Trade Documents')
@Controller('issue/trade-documents')
export class IssueTradeDocumentController {
  private readonly logger = new Logger(IssueTradeDocumentController.name);
  constructor(
    private readonly issueTradeDocumentService: IssueTradeDocumentService,){}


    @Post('/:accountId/:documentId')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({summary: 'Issues a verifiable version of a Trade Document'})
    @ApiResponse({status: 200, description:"Trade Document scheduled to be issued"})
    @ApiResponse({status: 400, description:"Trade Document not ready to be issued"})
    async issueTradeDocument(@Param('accountId') accountId: string,
                             @Param('documentId') documentId: string,) {

    if (!isValidAccountIdFormat(accountId) || !isValidDocumentIdFormat(documentId)) {
      throw new BadRequestException('Invalid accountId or documentId provided');
    }
    return plainToInstance(GeneralResponseDto, this.issueTradeDocumentService.issueTradeDocument(accountId, documentId));
  }





}
