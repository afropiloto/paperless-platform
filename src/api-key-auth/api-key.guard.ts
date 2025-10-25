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
    if (!rawHeader || typeof rawHeader !== 'string') {
      this.logger.warn({message:"No Client Access Key provided for request"});
      return false;
    }

    const [keyId, rawKey] = rawHeader.split(':');
    if (!keyId || !rawKey) {
      this.logger.warn({message:`Invalid format for Client Access Key provided for request`, rawHeader});
      return false;
    }

    const requiredGroups =
      this.reflector.getAllAndMerge<string[]>('accessGroups', [
        context.getHandler(),
        context.getClass(),
      ]) ?? [];

    const client = await this.apiKeyService.validateApiKey(keyId, rawKey);

    if (!client) {
      this.logger.warn({message:"Provided access key does not validate", keyId, rawKey})
      return false;
    }

    const hasAccess =
      requiredGroups.length === 0 ||
      requiredGroups.some((g) => client.accessGroups.includes(g));

    if (hasAccess) req.client ={ ...client, originator: client.name};
    return hasAccess;
  }
}
