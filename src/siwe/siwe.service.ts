import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { SiweMessage } from 'siwe';
import { NonceService } from './nonce.service';

@Injectable()
export class SiweService {
  private readonly logger = new Logger(SiweService.name);

  constructor(private nonceService: NonceService) {}

  async verifyMessage(message: string, signature: string) {
    try {
      this.logger.debug('Verifying SIWE message', {
        message,
        signature
      });

      if (!message || !signature) {
        throw new UnauthorizedException("Missing SIWE message or signature");
      }

      const siweMessage = new SiweMessage(message);
      this.logger.debug('Parsed SIWE message', {
        address: siweMessage.address,
        domain: siweMessage.domain,
        uri: siweMessage.uri,
        version: siweMessage.version,
        chainId: siweMessage.chainId,
        nonce: siweMessage.nonce,
        issuedAt: siweMessage.issuedAt,
        expirationTime: siweMessage.expirationTime,
        statement: siweMessage.statement,
      });

      // EXPIRATION TIME CONTROLS before verifying signature

      // 1. Verify expiration time exists
      if (!siweMessage.expirationTime) {
        throw new UnauthorizedException("Missing SIWE message expiration time");
      }

      // 2. Check if message has expired
      const currentTime = new Date();
      const expirationTime = new Date(siweMessage.expirationTime);

      if (expirationTime < currentTime) {
        if (!siweMessage.expirationTime) {
          throw new UnauthorizedException("SIWE message has expired");
        }
      }

      // 3. Enforce maximum allowed expiration window (e.g., 15 minutes)
      const issuedAt = new Date(siweMessage.issuedAt || currentTime);
      const maxAllowedExpiration = new Date(issuedAt.getTime() + (15 * 60 * 1000)); // 15 minutes

      if (expirationTime > maxAllowedExpiration) {
        if (!siweMessage.expirationTime) {
          throw new UnauthorizedException("SIWE message expiration time exceeds max expiration window");
        }
      }

      const verified = await siweMessage.verify({ signature });

      this.logger.debug('SIWE verification result', {
        verified,
        success: verified.success,
        error: verified.error,
        recoveredAddress: verified.data?.address,
        messageAddress: siweMessage.address
      });

      if (!verified.success) {
        this.logger.warn('SIWE verification failed', {
          error: verified.error,
          message: message,
          recoveredAddress: verified.data?.address,
          messageAddress: siweMessage.address
        });
        throw new UnauthorizedException("Invalid SIWE authentication.");
      }

      return siweMessage.address;

    } catch (error) {
      const errorMessage = error.message || error.error
      this.logger.error('Error in verifySiwe', {
        error: errorMessage,
        stack: error.stack,
        message
      });
      throw new UnauthorizedException(`Failed to verify SIWE message: ${errorMessage}`);
    }
  }


  generateNonce(address: string) {
    return this.nonceService.generateNonce(address);
  }
}
