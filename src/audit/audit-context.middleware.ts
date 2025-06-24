import { Injectable, NestMiddleware } from '@nestjs/common';
import { AuditContextService } from './audit-context.service';
import { NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuditContextMiddleware implements NestMiddleware {
  constructor(private auditContext: AuditContextService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const context = {
      clientLabel: (req as any).client?.label,
      userId: (req as any).user?.sub,
      requestId: req.headers['x-request-id'] || uuidv4(),
    };

    this.auditContext.runWithContext(context, () => {
      next();
    });
  }
}
