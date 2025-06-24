import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ApiKeyAuthService } from './api-key-auth.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  private readonly logger = new Logger(ApiKeyGuard.name);
  constructor(
    private readonly reflector: Reflector,
    private readonly apiKeyService: ApiKeyAuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const rawHeader = req.headers['x-api-key'];
    if (!rawHeader || typeof rawHeader !== 'string') return false;

    const [keyId, rawKey] = rawHeader.split(':');
    if (!keyId || !rawKey) return false;

    const requiredGroups =
      this.reflector.getAllAndOverride<string[]>('accessGroups', [
        context.getHandler(),
        context.getClass(),
      ]) ?? [];

    const client = await this.apiKeyService.validateApiKey(keyId, rawKey);
    if (!client) return false;

    const hasAccess =
      requiredGroups.length === 0 ||
      requiredGroups.some((g) => client.accessGroups.includes(g));

    if (hasAccess) req.client ={ ...client, originator: client.name};
    return hasAccess;
  }
}
