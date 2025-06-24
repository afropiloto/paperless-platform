import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';

interface AuditContext {
  clientLabel?: string;
  userId?: string;
  requestId?: string;
}

@Injectable()
export class AuditContextService {
  private storage = new AsyncLocalStorage<AuditContext>();

  runWithContext<T>(context: AuditContext, fn: () => T) {
    return this.storage.run(context, fn);
  }

  get context(): AuditContext {
    return this.storage.getStore() ?? {};
  }
}
