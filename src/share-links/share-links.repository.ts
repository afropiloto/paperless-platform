import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ShareLink, ShareLinkDocument } from './schemas/share-link.schema';
import { ShareLinkDto } from './dtos/share-link.dto';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class ShareLinksRepository {
  constructor(
    @InjectModel(ShareLink.name)
    private readonly shareLinkModel: Model<ShareLinkDocument>,
  ) {}

  async createShareLink(shareLinkData: Partial<ShareLink>): Promise<ShareLinkDto> {
    const shareLink = new this.shareLinkModel(shareLinkData);
    const savedShareLink = await shareLink.save();
    return plainToInstance(ShareLinkDto, savedShareLink.toObject());
  }

  async findByLinkId(linkId: string): Promise<ShareLinkDto | null> {
    const shareLink = await this.shareLinkModel.findOne({ linkId }).exec();
    return shareLink ? plainToInstance(ShareLinkDto, shareLink.toObject()) : null;
  }

  async updateAccessCount(linkId: string, email?: string): Promise<void> {
    const updateData: any = {
      $inc: { accessCount: 1 },
      $set: { lastAccessedAt: new Date() },
    };

    if (email) {
      updateData.$push = {
        accessHistory: {
          email: email.toLowerCase(),
          accessedAt: new Date(),
        },
      };
    }

    await this.shareLinkModel.updateOne({ linkId }, updateData);
  }

  async markAsExpired(linkId: string): Promise<void> {
    await this.shareLinkModel.updateOne(
      { linkId },
      { $set: { isExpired: true } },
    );
  }

  async deleteShareLink(linkId: string): Promise<void> {
    await this.shareLinkModel.deleteOne({ linkId });
  }

  async findByAccountAndDocument(
    documentId: string,
  ): Promise<ShareLinkDto[]> {
    const shareLinks = await this.shareLinkModel
      .find({ documentId })
      .sort({ createdAt: -1 })
      .exec();
    
    return shareLinks.map(shareLink => 
      plainToInstance(ShareLinkDto, shareLink.toObject())
    );
  }
} 