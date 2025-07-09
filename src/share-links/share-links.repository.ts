import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ShareLink, ShareLinkDocument } from './schemas/share-link.schema';

@Injectable()
export class ShareLinksRepository {
  constructor(
    @InjectModel(ShareLink.name)
    private readonly shareLinkModel: Model<ShareLinkDocument>,
  ) {}

  async createShareLink(shareLinkData: Partial<ShareLink>): Promise<ShareLink> {
    const shareLink = new this.shareLinkModel(shareLinkData);
    return await shareLink.save();
  }

  async findByLinkId(linkId: string): Promise<ShareLink | null> {
    return await this.shareLinkModel.findOne({ linkId }).exec();
  }

  async updateAccessCount(linkId: string): Promise<void> {
    await this.shareLinkModel.updateOne(
      { linkId },
      {
        $inc: { accessCount: 1 },
        $set: { lastAccessedAt: new Date() },
      },
    );
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
    accountId: string,
    documentId: string,
  ): Promise<ShareLink[]> {
    return await this.shareLinkModel
      .find({ accountId, documentId })
      .sort({ createdAt: -1 })
      .exec();
  }
} 