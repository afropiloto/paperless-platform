import { Module } from '@nestjs/common';
import { ApiKeyAuthService } from './api-key-auth.service';
import { CacheModule } from '@nestjs/cache-manager';
import { Client, ClientSchema } from './schemas/client.schema';
import { MongooseModule } from '@nestjs/mongoose';


@Module({
  imports: [
    MongooseModule.forFeature([{ name: Client.name, schema: ClientSchema }]),
    CacheModule.register()],
  providers: [ApiKeyAuthService],
  exports:[ApiKeyAuthService]
})
export class ApiKeyAuthModule {}
