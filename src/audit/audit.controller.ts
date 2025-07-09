import { Controller, Get, Logger, Param } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { AccountDetailsDto } from '../accounts/dtos/accounts.dto';
import { AuditEventDto } from './dtos/audit-event.dto';
import { AuditSubject } from './audit-event-type.enum';


@ApiTags('Audit')
@Controller('audit')
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
