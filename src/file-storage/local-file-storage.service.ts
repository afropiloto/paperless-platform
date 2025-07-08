import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { FileStorageService, StoredFileDetails } from './file-storage.interface';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as fsSync from 'fs';
import { ReadStream } from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import {extension} from 'mime-types';

@Injectable()
export class LocalFileStorageService implements FileStorageService {
  private readonly uploadDir: string;
  private readonly logger = new Logger(LocalFileStorageService.name);

  constructor(private readonly configService: ConfigService) {
    this.uploadDir = this.configService.get<string>('LOCAL_FILE_STORAGE_PATH') ||
      path.join(__dirname, '../../../storage/uploads');
    this.ensureUploadDirExists()
      .then(()=>{

      });
  }

  private async ensureUploadDirExists() {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
    } catch (err) {
      throw new InternalServerErrorException(`Failed to initialize upload directory: ${err.message}`);
    }
  }



  public getStorageDetails() {
    return {storageType: "local", storagePath: this.uploadDir}
  }
  async deleteFile(filePathOrUrl: string): Promise<void> {
    try {
      // Overwrite file before deletion (cryptographic erase)
      const fileStat = await fs.stat(filePathOrUrl);
      const fileSize = fileStat.size;
      const buffer = crypto.randomBytes(fileSize);
      await fs.writeFile(filePathOrUrl, buffer);

      // Delete file securely
      await fs.unlink(path.join(this.uploadDir, filePathOrUrl));
      this.logger.log({message: `File securely deleted: ${filePathOrUrl}`});
    } catch (error) {
      this.logger.error({message: `Failed to delete file: ${filePathOrUrl}`, error: error.message});
    }
  }

  async downloadFile(filePathOrUrl: string): Promise<Buffer> {
    const fullPath = path.join(this.uploadDir, filePathOrUrl);

    try {
      return await fs.readFile(fullPath);
    } catch (err) {
      this.logger.error({ message: `Failed to download the file ${filePathOrUrl}`, error: err.message })
      throw new InternalServerErrorException(`Failed to read file: ${err.message}`);
    }
  }
  streamFile(filePathOrUrl: string): ReadStream {
    const fullPath = path.join(this.uploadDir, filePathOrUrl);

    try {
      return fsSync.createReadStream(fullPath);
    } catch (err) {
      this.logger.error({ message: `Failed to download the file ${filePathOrUrl}`, error: err.message })
      throw new InternalServerErrorException(`Failed to read file: ${err.message}`);
    }
  }

  async uploadFile(buffer: Buffer, filename: string, mimetype: string): Promise<StoredFileDetails> {
    const safeFilename = `${uuidv4()}.${extension(mimetype)}`; // create a unique filename with the correct extension
    const filePath = path.join(this.uploadDir, safeFilename);
    await fs.writeFile(filePath, buffer);
    return {storedFileName: safeFilename, storedFilePath: filePath};
  }

}