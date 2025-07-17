import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { TradeDocument } from './schema/trade-document.schema';
import { isValidObjectId, Model, PipelineStage } from 'mongoose';
import {
  IssueDetailsDto,
  TradeDocumentDto,
  UpsertTradeDocumentDto,
} from './dtos/trade-document.dto';
import {
  TradeDocumentStatus,
} from '../types/trade-documents.types';
import { getUnsets } from './utils/trade-document.utils';
import { plainToInstance } from 'class-transformer';
import { TradeDocumentFileVariant } from './trade-document-file.types';
import { TradeDocumentFileDTO } from './dtos/trade-document-file.dto';
import { TradeDocumentProtectedAttributesUpdateDto } from './dtos/trade-document-protected-attributes-update.dto';
import { SearchQueryDto } from '../common/dtos/search.dto';

@Injectable()
export class TradeDocumentsRepository {
  private readonly logger = new Logger(TradeDocumentsRepository.name);

  constructor(
    @InjectModel(TradeDocument.name)
    private tradeDocumentModel: Model<TradeDocument>,
  ) {}

  async createTradeDocument(
    accountId: string,
    createTradeDocumentDto: UpsertTradeDocumentDto,
    initialStatus: TradeDocumentStatus,
  ) {
    const response = await this.tradeDocumentModel.create({
      accountId,
      status: initialStatus,
      ...createTradeDocumentDto,
    });
    return plainToInstance(TradeDocumentDto, {id: response._id, ...response.toObject()});
  }

  async updateTradeDocumentById(
    accountId: string,
    documentId: string,
    tradeDocument: UpsertTradeDocumentDto,
  ) {
    const filter = { accountId: accountId, _id: documentId };
    const unsets = getUnsets(tradeDocument.documentType);

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
    return plainToInstance(TradeDocumentDto, {id: updatedDocument._id, ...updatedDocument.toObject()});
  }

  async updateTradeDocumentStatus(
    accountId: string,
    documentId: string,
    newStatus: TradeDocumentStatus,
  ) {
    const updatedDocument = await this.tradeDocumentModel.findOneAndUpdate(
      { _id: documentId, accountId },
      {
        $set: { status: newStatus },
      },
      { new: true },
    );
    return plainToInstance(TradeDocumentDto, {id: updatedDocument._id, ...updatedDocument.toObject()});
  }

  async updateTradeDocumentFileById(
    accountId: string,
    documentId: string,
    fileVariant: TradeDocumentFileVariant,
    tradeDocumentFile: TradeDocumentFileDTO,
  ) {
    const variantField = this.getFileVariantField(fileVariant);
    const updatedDocument = await this.tradeDocumentModel.findByIdAndUpdate(
      { _id: documentId, accountId },
      {
        $set: { [variantField]: tradeDocumentFile },
      },
      {new:true}
    );
    return plainToInstance(TradeDocumentDto, {id: updatedDocument._id, ...updatedDocument.toObject()});
  }

  private getSelections(includes: string[] = [], excludes: string[] = []) {
    return `${includes.length > 0 ? includes.join(' ') : ''} ${excludes.length > 0 ? '-' + excludes.join(' -') : ''}`;
  }


  async getDocumentById(
    accountId: string,
    documentId: string,
    includes: string[] = []
  ): Promise<TradeDocumentDto> {
    if (!isValidObjectId(documentId) || !isValidObjectId(accountId)) {
      throw new BadRequestException('Invalid document identifier');
    }

    const selections = this.getSelections(includes, []);

    const document = await this.tradeDocumentModel
      .findOne({
        accountId: accountId,
        _id: documentId,
      })
      .select(selections)

    if (!document) {
      return null;
    }

    return plainToInstance(TradeDocumentDto, {id: document.id, ...document.toObject()});
  }


  async getDocumentsByType(
    accountId: string,
    documentType: DocumentType,
    includes: string[] = [],
    excludes: string[] = [],
  ): Promise<TradeDocumentDto[]> {
    const selections = this.getSelections(includes, excludes);
    const documents = await this.tradeDocumentModel
      .find({
        accountId,
        documentType,
      })
      .select(selections)
      .lean()
      .exec();
    return plainToInstance(TradeDocumentDto, documents);
  }

  async deleteDocumentById(
    accountId: string,
    documentId: string,
  ): Promise<boolean> {
    const result = await this.tradeDocumentModel.deleteOne({
      accountId: accountId,
      _id: documentId,
    });
    return result.deletedCount !== 0;
  }

  private getFileVariantField(fileVariant: TradeDocumentFileVariant) {
    switch (fileVariant.toUpperCase()) {
      case TradeDocumentFileVariant.ISSUED:
        return 'issuedFile';
      case TradeDocumentFileVariant.ORIGINAL:
        return 'originalFile';
      case TradeDocumentFileVariant.TRADE_TRUST:
        return 'tradeTrustFile';
      default:
        return 'originalFile';
    }
  }

  async getDocumentFileById(
    accountId: string,
    documentId: string,
    fileVariant: TradeDocumentFileVariant,
  ): Promise<TradeDocumentFileDTO> {
    const variantField = this.getFileVariantField(fileVariant);
    if (!isValidObjectId(documentId) || !isValidObjectId(accountId)) {
      throw new BadRequestException('Invalid document file request');
    }

    const result = await this.tradeDocumentModel
      .findOne({
        accountId: accountId,
        _id: documentId,
      })
      .select(variantField)
      .lean()
      .exec();

    return result
      ? plainToInstance(TradeDocumentFileDTO, result[variantField])
      : null;
  }

  async getDocumentByTrackingId(
    trackingId: string,
    includes: string[] = [],
    excludes: string[] = [],
  ): Promise<TradeDocumentDto> {
    const selections = this.getSelections(includes, excludes);
    const document = await this.tradeDocumentModel
      .findOne({
        documentTrackingId: trackingId,
      })
      .select(selections)
    return plainToInstance(TradeDocumentDto, {id: document._id, ...document.toObject()});
  }

  async getDocumentFileDetailsByTrackingId(
    trackingId: string,
    fileVariant: TradeDocumentFileVariant,
  ) {
    const variantField = this.getFileVariantField(fileVariant);
    const document = await this.tradeDocumentModel
      .findOne({
        documentTrackingId: trackingId,
      })
      .select(`accountId ${variantField}`)
      .lean()
      .exec();
    return plainToInstance(TradeDocumentFileDTO, {
      trackingId,
      accountId: document.accountId,
      _id: document._id,
      ...document[variantField],
    });
  }

  async updateTradeDocumentIssueDetailsById(
    accountId: string,
    documentId: string,
    issueDetails: IssueDetailsDto,
  ) {
    issueDetails.dateIssued = new Date();
    const updatedDocument = await this.tradeDocumentModel.findOneAndUpdate(
      { _id: documentId, accountId },
      {
        $set: { issueDetails },
      },
      { new: true },
    );
    return plainToInstance(TradeDocumentDto, {id: updatedDocument._id, ...updatedDocument.toObject()});
  }

  async retrieveTradeDocumentsByAccountId(
    accountId: string,
    searchParams: SearchQueryDto,
    includes: string[],
    excludes: string[],
  ) {
    const includesProjection = { id: '$_id', createdAt: 1, updatedAt: 1 };
    includes.forEach((include) => {
      includesProjection[include] = 1;
    });

    const excludesProjection = { __v: 0, _id: 0 };
    excludes.forEach((exclude) => {
      excludesProjection[exclude] = 0;
    });

    const dataFacet = [];
    if (searchParams.orderBy !== undefined && searchParams.orderBy.length > 0) {
      dataFacet.push({
        $sort: {
          [searchParams.orderBy]:
            searchParams.orderDirection === 'desc' ? -1 : 1,
        },
      });
    }
    dataFacet.push({ $skip: (searchParams.page - 1) * searchParams.limit });
    dataFacet.push({ $limit: searchParams.limit });
    const searchableFields = ['status', 'documentType', 'documentReference'];

    const aggregationPipeline: PipelineStage[] = [];
    // Add filter to restrict data to the account wallet address

    aggregationPipeline.push(
      { $match: { accountId: accountId } },
      { $project: includesProjection },
      { $project: excludesProjection },
    );
    // Add filter criteria if a query term is provided
    if (
      searchParams.queryTerm !== undefined &&
      searchParams.queryTerm.length > 0
    ) {
      aggregationPipeline.push({
        $match: {
          $or: searchableFields.map((field) => ({
            [field]: { $regex: searchParams.queryTerm, $options: 'i' },
          })),
        },
      });
    }
    aggregationPipeline.push({
      $sort: { lastModified: -1 },
    });
    aggregationPipeline.push({
      $facet: {
        metadata: [
          {
            $count: 'totalDocuments',
          },
          {
            $addFields: {
              page: searchParams.page,
              totalPages: {
                $ceil: { $divide: ['$totalDocuments', searchParams.limit] },
              },
              limit: searchParams.limit,
            },
          },
        ],
        data: dataFacet,
      },
    });

    try {
      let result = await this.tradeDocumentModel.aggregate(aggregationPipeline);
      result = result[0];
      // Deal with no data
      if (result['data'].length === 0) {
        result['metadata'] = {
          totalDocuments: 0,
          page: searchParams.page,
          totalPages: 0,
          limit: searchParams.limit,
        };
        result['data'] = [];
        return result;
      }
      result['metadata'] = { ...result['metadata'][0] };
      this.logger.debug({result})
      return result;
    } catch (error) {
      this.logger.error({
        msg: 'Failed to retrieve Trade Documents for account',
        details: error.message,
        accountWallet: accountId,
        searchParams,
      });
      throw new Error(
        'We encountered an problem retrieving your trade documents. We have logged this issue please try again later',
      );
    }
  }

  async tradeDocumentExists(accountId: string, tradeDocumentId: string) {
    if (!isValidObjectId(accountId) || !isValidObjectId(tradeDocumentId)) {
      throw new BadRequestException('Invalid trade document identifier');
    }
    return (
      (await this.tradeDocumentModel.exists({
        _id: tradeDocumentId,
        accountId,
      })) !== null
    );
  }

  async updateProtectedTradeDocumentAttributesById(accountId: string, documentId: string, updates: TradeDocumentProtectedAttributesUpdateDto) {
    if (!isValidObjectId(accountId) || !isValidObjectId(documentId)) {
      throw new BadRequestException('Invalid trade document identifier');
    }
    const updatedDocument =  await this.tradeDocumentModel.findOneAndUpdate({ accountId, _id: documentId }, updates, { new: true })
    return plainToInstance(TradeDocumentDto, {id: updatedDocument._id, ...updatedDocument.toObject()});

  }
}