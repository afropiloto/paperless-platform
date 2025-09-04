import { Controller, HttpCode, HttpStatus, Logger, Param, Post, Body, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { IssueTradeDocumentService} from './issue-trade-document.service';
import { plainToInstance } from 'class-transformer';
import { GeneralResponseDto } from '../common/common-dto';
import { JwtGuard } from 'src/auth/guards/jwt-guard';
import { ApiKeyGuard } from 'src/api-key-auth/api-key.guard';
import { ClientAccess } from 'src/api-key-auth/decorators/client-access.decorator';
import { ClientAccessGroup } from 'src/api-key-auth/types/api-key-auth.types';

@ApiTags('Issue Trade Documents')
@Controller('trade-documents')
@UseGuards(JwtGuard, ApiKeyGuard)
@ApiHeader({
  name: 'x-api-key',
  description: 'The Client Application API Key',
  example: '47f19331:86382a9cbeaa603325628d29859b10fa6df94385ef792ea340cb1208ab9fdb6e'
})
@ClientAccess(ClientAccessGroup.SHARED)
@ApiBearerAuth()
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
