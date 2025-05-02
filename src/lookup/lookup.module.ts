import { Global, Module } from '@nestjs/common';
import { LookupService } from './lookup.service';
import { LookupRepository } from './lookup.repository';
import { CacheModule } from '@nestjs/cache-manager';
import { LookupController } from './lookup.controller';
import { ChainLookup, ChainLookupSchema } from './schema/chain-lookup.schema';
import { MongooseModule } from '@nestjs/mongoose';


export const DEFAULT_LOOKUP_TTL_MS = 10 * 60 * 1000; // Cache expires after 10 minutes

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([{ name: ChainLookup.name, schema: ChainLookupSchema }]),
    CacheModule.register({
    ttl: DEFAULT_LOOKUP_TTL_MS,
  })],
  providers: [LookupService, LookupRepository],
  exports: [LookupService],
  controllers: [LookupController],

})
export class LookupModule {


}
