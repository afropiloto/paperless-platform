import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LocalFileStorageService } from './local-file-storage.service';
import { FILE_STORAGE_SERVICE } from './file-storage.constants';

@Module({
  imports: [ConfigModule],
  providers: [
    LocalFileStorageService,
    {
      provide: FILE_STORAGE_SERVICE,
      inject: [ConfigService, LocalFileStorageService],
      useFactory: (configService: ConfigService,
                   local: LocalFileStorageService) => {
        return configService.get('NODE_ENV') === 'production'
        ? local // ToDo: Need to provide a Production version of the service
          : local;
      }
    },
  ],
  exports: [FILE_STORAGE_SERVICE],
})
export class FileStorageModule {}
