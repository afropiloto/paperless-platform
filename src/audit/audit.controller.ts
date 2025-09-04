import { Controller, Get, Logger, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { AuditEventDto } from './dtos/audit-event.dto';
import { AuditSubject } from './audit-event-type.enum';
import { JwtGuard } from 'src/auth/guards/jwt-guard';
import { ApiKeyGuard } from 'src/api-key-auth/api-key.guard';
import { ClientAccess } from 'src/api-key-auth/decorators/client-access.decorator';
import { ClientAccessGroup } from 'src/api-key-auth/types/api-key-auth.types';


@ApiTags('Audit')
@Controller('audit')
@UseGuards(JwtGuard, ApiKeyGuard)
@ApiHeader({
  name: 'x-api-key',
  description: 'The Client Application API Key',
  example: '47f19331:86382a9cbeaa603325628d29859b10fa6df94385ef792ea340cb1208ab9fdb6e'
})
@ClientAccess(ClientAccessGroup.SHARED)
@ApiBearerAuth()
export class AuditController {
  private readonly logger = new Logger(AuditController.name);
  constructor(private readonly auditService: AuditService) {
  }
  
  @Get(':subject/:resourceId')
  @ApiOperation({ summary: 'Returns a list of audit events for a resource' })
  @ApiResponse({ status: 200, description: 'Audit Events retrieved' })
  @ApiResponse({
    status: 401,
    description: 'Not authorized to retrieve audit events for this resource',
  })
  async getAccountById(
    @Param('subject') subject: AuditSubject,
    @Param('resourceId') identifier: string,
  ): Promise<AuditEventDto[]> {
    return await this.auditService.getResourceAuditEventsBySubject({
      subject, identifier});
  }
}
