import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { TradeDocument, TradeDocumentFile } from './schema/trade-document.schema';
import { Model } from 'mongoose';
import {
  IssueDetailsDto,
  TradeDocumentDto,
  TradeDocumentFileDTO,
  UpsertTradeDocumentDto,
} from './dtos/trade-document.dto';
import { TradeDocumentFileDetails, TradeDocumentStatus } from '../types/trade-documents.types';
import { getUnsets } from './utils/trade-document.utils';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class TradeDocumentsRepository {

  private readonly logger = new Logger(TradeDocumentsRepository.name);

  constructor( @InjectModel(TradeDocument.name)
               private tradeDocumentModel: Model<TradeDocument>) {}

  async createTradeDocument(accountId: string, createTradeDocumentDto: UpsertTradeDocumentDto, initialStatus: TradeDocumentStatus) {
    const response =  this.tradeDocumentModel.create({accountId, status: initialStatus, ...createTradeDocumentDto})
    return plainToInstance(TradeDocumentDto, response);
  }

  async updateTradeDocumentById(
    accountId: string,
    documentId: string,
    tradeDocument: UpsertTradeDocumentDto,
  ) {
    const filter = { accountId: accountId, _id: documentId };
    const unsets = getUnsets(tradeDocument.documentType);

    this.logger.debug({ accountId, documentId, tradeDocument, unsets });

    const updatedDocument = await this.tradeDocumentModel.findOneAndUpdate(
      filter,
      {
        $set: tradeDocument,
        $unset: unsets,
      },
      { returnDocument: 'after' },
    );
    if (!updatedDocument) {
      throw new Error('Failed to update Trade Document');
    }
    return plainToInstance(TradeDocumentDto, updatedDocument);
  }

  async updateTradeDocumentStatus(accountId: string, documentId: string, newStatus: TradeDocumentStatus) {
    const updatedDocument = await this.tradeDocumentModel.updateOne(
      { _id: documentId, accountId },
      {
        $set: {status: newStatus}
      },
      { returnDocument: 'after' }
    );
    return plainToInstance(TradeDocumentDto, updatedDocument);
  }

  async updateTradeDocumentFileById(accountId: string, documentId: string, tradeDocumentFile: TradeDocumentFileDetails) {
    const updatedDocument =  this.tradeDocumentModel.updateOne(
      { _id: documentId, accountId },
      {
        $set: {tradeDocumentFile}
      },
      { returnDocument: 'after' }
    );
    return plainToInstance(TradeDocumentDto, updatedDocument);
  }

  private getSelections(includes: string[] = [], excludes: string[] = []) {
    return `${includes.length > 0 ? includes.join(" "): ''} ${excludes.length > 0 ? '-' + excludes.join(" -"): ''}`
  }
  async getDocumentById(accountId: string, documentId: string, includes: string[] = [], excludes: string[] = []): Promise<TradeDocumentDto> {
    const selections = this.getSelections(includes, excludes)
    this.logger.debug({selections });
    const document = await this.tradeDocumentModel.findOne({
      accountId: accountId,
      _id: documentId,
    }).select(selections).lean().exec();
    return document ? plainToInstance(TradeDocumentDto, {id: document._id, ...document}): null;
  }

  async getDocumentsByType(accountId: string, documentType: DocumentType, includes: string[] = [], excludes: string[] = []): Promise<TradeDocumentDto[]> {
    const selections = this.getSelections(includes, excludes)
    const documents = await this.tradeDocumentModel.find({
      accountId,
      documentType,
    }).select(selections).lean().exec();
    return plainToInstance(TradeDocumentDto, documents);
  }

  async deleteDocumentById(accountId: string, documentId: string): Promise<boolean> {
    const result = await this.tradeDocumentModel.deleteOne({
      accountId: accountId,
      _id: documentId,
    });
    return result.deletedCount !== 0;
  }

  async getDocumentFileById(accountId: string, documentId: string) {
    const result = await this.tradeDocumentModel.findOne({
      accountId: accountId,
      _id: documentId,
    }).select("tradeDocumentFile").lean().exec();

    return result ? plainToInstance(TradeDocumentFile, result.tradeDocumentFile) : null;
  }

  async getDocumentByTrackingId(trackingId: string, includes: string[] = [], excludes: string[] = []): Promise<TradeDocumentDto> {
    const selections = this.getSelections(includes, excludes)
    const document = await this.tradeDocumentModel.findOne({
      documentTrackingId: trackingId
    }).select(selections).lean().exec();
    return plainToInstance(TradeDocumentDto, document);
  }

  async getDocumentFileDetailsByTrackingId(trackingId: string) {
    const document = await this.tradeDocumentModel.findOne({
      documentTrackingId: trackingId
    }).select('accountId tradeDocumentFile').lean().exec();
    return plainToInstance(TradeDocumentFileDTO, {trackingId, accountId: document.accountId, _id: document._id, ...document.tradeDocumentFile});
  }

  async updateTradeDocumentIssueDetailsById(accountId: string, documentId: string, issueDetails: IssueDetailsDto) {
    const updatedDocument =  this.tradeDocumentModel.updateOne(
      { _id: documentId, accountId },
      {
        $set: {issueDetails}
      },
      { returnDocument: 'after' }
    );
    return plainToInstance(TradeDocumentDto, updatedDocument);
  }
}