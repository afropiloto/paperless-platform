import { Module } from '@nestjs/common';
import { LocalFileStorageService } from './local-file-storage.service';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: LocalFileStorageService,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return configService.get('NODE_ENV') === 'production'
        ? new LocalFileStorageService(configService) // ToDo: Need to provide a Production version of the service
          : new LocalFileStorageService(configService);
      }
    }
  ],
  exports: [LocalFileStorageService],
})
export class FileStorageModule {}
