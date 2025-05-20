import { Module } from '@nestjs/common';
import { SiweService } from './siwe.service';
import { AccountsModule } from '../accounts/accounts.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Nonce, NonceSchema } from './schemas/nonce.schema';
import { NonceRepository } from './nonce.repository';
import { NonceService } from './nonce.service';

@Module({
  imports: [
    AccountsModule,
    MongooseModule.forFeature([{ name: Nonce.name, schema: NonceSchema }]),
  ],
  providers: [SiweService, NonceRepository, NonceService],
  exports:[SiweService, NonceService],
})
export class SiweModule {}
