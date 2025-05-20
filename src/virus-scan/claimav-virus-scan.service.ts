import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import * as clamav from 'clamav.js';
import { VirusScanService } from './virus-scan.interface';
import { Readable } from 'stream';

@Injectable()
export class ClamAvVirusScanService implements VirusScanService {
  private readonly logger = new Logger(ClamAvVirusScanService.name);
  private readonly scannerHost;
  private readonly scannerPort;

  constructor(private readonly configService: ConfigService,
              @InjectQueue('virus-scan') private readonly virusScanQueue: Queue) {
    this.scannerHost = this.configService.get<string>('VIRUS_SCANNER_HOST') || 'localhost';
    this.scannerPort = this.configService.get<number>('VIRUS_SCANNER_PORT')  || 3310;

  }


  async shallowScan(buffer: Buffer): Promise<void> {
    const stream = Readable.from(buffer);

    return new Promise((resolve, reject) => {
      clamav.ping(this.scannerPort, this.scannerHost, 1000, (err) => {
        if (err) return reject(new Error('ClamAV is not reachable'));

        const scanner = clamav.createScanner(this.scannerPort, this.scannerHost);

        scanner.scan(stream, (err, object, malicious) => {
          if (err) return reject(err);
          if (malicious) return reject(new Error('Virus detected'));
          return resolve();
        });
      });
    })
  }

  async queueDeepScan(fileId: string, filePathOrUrl: string): Promise<void> {
    await this.virusScanQueue.add('deep-scan', {
      fileId,
      filePathOrUrl,
    });
  }
}
