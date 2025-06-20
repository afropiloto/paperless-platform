import { Module } from '@nestjs/common';
import { RegistrationService } from './registration.service';
import { RegistrationController } from './registration.controller';
import { FileStorageModule } from '../file-storage/file-storage.module';
import { RegistrationRepository } from './registration.repository';
import { MongooseModule } from '@nestjs/mongoose';
import { Registration, RegistrationSchema } from './schemas/registration.schema';
import { AccountsModule } from '../accounts/accounts.module';

@Module({
  imports:[
    MongooseModule.forFeature([{ name: Registration.name, schema: RegistrationSchema }]),
    FileStorageModule,
    AccountsModule,
  ],
  providers: [RegistrationService, RegistrationRepository],
  controllers: [RegistrationController],
  exports: [RegistrationService],
})
export class RegistrationModule {}
