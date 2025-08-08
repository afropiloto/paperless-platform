import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PasswordResetToken } from '../schemas/password-reset-token.schema';
import { 
  CreatePasswordResetTokenDto, 
  PasswordResetTokenDto
} from '../dtos/password-reset-token.dto';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class PasswordResetTokenRepository {
  private readonly logger = new Logger(PasswordResetTokenRepository.name);

  constructor(
    @InjectModel(PasswordResetToken.name)
    private readonly passwordResetTokenModel: Model<PasswordResetToken>,
  ) {}

  async create(createDto: CreatePasswordResetTokenDto): Promise<PasswordResetTokenDto> {
    this.logger.debug(`Creating password reset token for user ${createDto.userId}`);
    
    const token = new this.passwordResetTokenModel({
      ...createDto,
      userId: new Types.ObjectId(createDto.userId),
    });
    
    const savedToken = await token.save();
    return plainToInstance(PasswordResetTokenDto, savedToken, { excludeExtraneousValues: true });
  }

  async findByToken(token: string): Promise<PasswordResetTokenDto | null> {
    this.logger.debug(`Finding password reset token: ${token}`);
    
    const foundToken = await this.passwordResetTokenModel.findOne({ 
      token, 
      used: false,
      expiresAt: { $gt: new Date() }
    }).lean().exec();
    
    if (!foundToken) {
      this.logger.warn('Failed to find password reset token', token);
      return null;
    }
    const response = plainToInstance(PasswordResetTokenDto, foundToken, { excludeExtraneousValues: true });
    return response
  }

  async findByUserId(userId: string): Promise<PasswordResetTokenDto[]> {
    this.logger.debug(`Finding password reset tokens for user ${userId}`);
    
    const tokens = await this.passwordResetTokenModel.find({ 
      userId: new Types.ObjectId(userId),
      used: false,
      expiresAt: { $gt: new Date() }
    }).exec();
    
    return plainToInstance(PasswordResetTokenDto, tokens, { excludeExtraneousValues: true });
  }

  async markAsUsed(token: string): Promise<PasswordResetTokenDto | null> {
    this.logger.debug(`Marking password reset token as used: ${token}`);
    
    const updatedToken = await this.passwordResetTokenModel.findOneAndUpdate(
      { token, used: false },
      { 
        used: true, 
        usedAt: new Date() 
      },
      { new: true }
    ).exec();
    
    if (!updatedToken) {
      return null;
    }
    
    return plainToInstance(PasswordResetTokenDto, updatedToken, { excludeExtraneousValues: true });
  }

  async deleteByToken(token: string): Promise<boolean> {
    this.logger.debug(`Deleting password reset token: ${token}`);
    
    const result = await this.passwordResetTokenModel.deleteOne({ token }).exec();
    return result.deletedCount > 0;
  }

  async deleteByUserId(userId: string): Promise<number> {
    this.logger.debug(`Deleting all password reset tokens for user ${userId}`);
    
    const result = await this.passwordResetTokenModel.deleteMany({ 
      userId: new Types.ObjectId(userId) 
    }).exec();
    
    return result.deletedCount;
  }

  async deleteExpiredTokens(): Promise<number> {
    this.logger.debug('Deleting expired password reset tokens');
    
    const result = await this.passwordResetTokenModel.deleteMany({ 
      expiresAt: { $lt: new Date() } 
    }).exec();
    
    this.logger.log(`Deleted ${result.deletedCount} expired password reset tokens`);
    return result.deletedCount;
  }

  async cleanupUsedTokens(): Promise<number> {
    this.logger.debug('Cleaning up used password reset tokens');
    
    // Delete tokens that have been used for more than 24 hours
    const cutoffDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const result = await this.passwordResetTokenModel.deleteMany({ 
      used: true,
      usedAt: { $lt: cutoffDate }
    }).exec();
    
    this.logger.log(`Deleted ${result.deletedCount} used password reset tokens`);
    return result.deletedCount;
  }
} 