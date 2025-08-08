import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PasswordResetTokenRepository } from '../repositories/password-reset-token.repository';

@Injectable()
export class PasswordResetCleanupService {
  private readonly logger = new Logger(PasswordResetCleanupService.name);

  constructor(
    private readonly passwordResetTokenRepository: PasswordResetTokenRepository,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async cleanupExpiredTokens() {
    this.logger.log('Starting scheduled cleanup of expired password reset tokens');
    
    try {
      const deletedCount = await this.passwordResetTokenRepository.deleteExpiredTokens();
      this.logger.log(`Successfully cleaned up ${deletedCount} expired password reset tokens`);
    } catch (error) {
      this.logger.error('Failed to cleanup expired password reset tokens', error);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupUsedTokens() {
    this.logger.log('Starting scheduled cleanup of used password reset tokens');
    
    try {
      const deletedCount = await this.passwordResetTokenRepository.cleanupUsedTokens();
      this.logger.log(`Successfully cleaned up ${deletedCount} used password reset tokens`);
    } catch (error) {
      this.logger.error('Failed to cleanup used password reset tokens', error);
    }
  }

  // Manual cleanup methods for testing or on-demand use
  async manualCleanupExpiredTokens(): Promise<number> {
    this.logger.log('Manual cleanup of expired password reset tokens requested');
    return await this.passwordResetTokenRepository.deleteExpiredTokens();
  }

  async manualCleanupUsedTokens(): Promise<number> {
    this.logger.log('Manual cleanup of used password reset tokens requested');
    return await this.passwordResetTokenRepository.cleanupUsedTokens();
  }
} 