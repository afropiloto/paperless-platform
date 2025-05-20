import { Injectable, Logger } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { NonceRepository } from './nonce.repository';



const NONCE_EXPIRATION_MS = 12 * 60 * 60 * 1000; // Expires after 12 hr)

@Injectable()
export class NonceService {
  private readonly logger = new Logger(NonceService.name);
  constructor(private readonly nonceRepository: NonceRepository) {}

  async generateNonce(wallet: string): Promise<string> {
    const nonceRecord = await this.nonceRepository.findNonceByWallet(wallet)

    if (nonceRecord) {
      const isExpired = Date.now() - nonceRecord.createdAt.getTime() > NONCE_EXPIRATION_MS;

      if (!isExpired) {
        return nonceRecord.nonce; // Return existing nonce if still valid
      }

      // Delete expired nonce
      await this.nonceRepository.deleteNonceByWallet(wallet);
    }


    // Generate and store new nonce
    const nonce = randomBytes(16).toString('hex');
    this.logger.debug({message: "creating a new Nonce", wallet, nonce});
    const newRecord = await this.nonceRepository.addNonceForWallet(wallet, nonce);

    return newRecord.nonce;
  }

  async verifyNonce(wallet: string, nonce: string): Promise<boolean> {
    const record = await this.nonceRepository.findNonceByWallet(wallet);

    if (!record) return false; // Nonce not found
    if (record.nonce !== nonce) return false; // Invalid Nonce


    const isExpired = Date.now() - record.createdAt.getTime() > NONCE_EXPIRATION_MS;
    if (isExpired) {
      await this.nonceRepository.deleteNonceByWallet( wallet );
      return false; // Nonce expired
    }

    // Delete nonce after verification (prevent reuse)
    await this.nonceRepository.deleteNonceByWallet( wallet );
    return true;
  }
}
