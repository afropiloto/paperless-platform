import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Client } from './schemas/client.schema';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { ClientInfo } from './types/api-key-auth.types';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';


@Injectable()
export class ApiKeyAuthService {
  constructor(
    @InjectModel(Client.name) private clientModel: Model<Client>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async validateApiKey(keyId: string, rawKey: string): Promise<ClientInfo | null> {
    const cacheKey = `api-client:${keyId}`;
    const cached = await this.cacheManager.get<ClientInfo & { apiKeyHash: string }>(cacheKey);

    if (cached) {
      const match = await bcrypt.compare(rawKey, cached.apiKeyHash);
      return match ? cached : null;
    }

    const client = await this.clientModel.findOne({ keyId });
    if (!client) return null;

    const valid = await bcrypt.compare(rawKey, client.apiKeyHash);
    if (!valid) return null;

    const clientInfo: ClientInfo & { apiKeyHash: string } = {
      keyId: client.keyId,
      name: client.name,
      accessGroups: client.accessGroups,
      apiKeyHash: client.apiKeyHash,
    };

    await this.cacheManager.set(cacheKey, clientInfo, 600); // cache for 10 min
    return clientInfo;
  }
}
