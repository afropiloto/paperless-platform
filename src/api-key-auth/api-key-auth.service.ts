import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Client } from './schemas/client.schema';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { ClientInfoDetails } from './types/api-key-auth.types';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';


@Injectable()
export class ApiKeyAuthService {
  private readonly logger = new Logger(ApiKeyAuthService.name);
  constructor(
    @InjectModel(Client.name) private clientModel: Model<Client>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async validateApiKey(keyId: string, rawKey: string): Promise<ClientInfoDetails | null> {
    this.logger.debug({rawKey})
    const cacheKey = `api-client:${keyId}`;
    const cached = await this.cacheManager.get<ClientInfoDetails & { apiKeyHash: string }>(cacheKey);

    if (cached) {
      const match = await bcrypt.compare(rawKey, cached.apiKeyHash);
      if (!match) {
        this.logger.warn(`Invalid client key (cached) provided with id ${keyId}`);
      }
      return match ? cached : null;
    }

    const client = await this.clientModel.findOne({ keyId });
    if (!client) {
      this.logger.warn(`No client found with id ${keyId}`);
      return null;
    }

    const valid = await bcrypt.compare(rawKey, client.apiKeyHash);
    if (!valid) {
      this.logger.warn(`Invalid client key provided with id ${keyId}`);
      return null;
    }

    const clientInfo: ClientInfoDetails & { apiKeyHash: string } = {
      keyId: client.keyId,
      name: client.name,
      accessGroups: client.accessGroups,
      apiKeyHash: client.apiKeyHash,
    };

    await this.cacheManager.set(cacheKey, clientInfo, 600); // cache for 10 min
    return clientInfo;
  }
}
