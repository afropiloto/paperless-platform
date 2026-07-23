import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { plainToInstance } from 'class-transformer';
import { DvpSettlement } from './schemas/dvp-settlement.schema';
import { DvpSettlementDto } from './dtos/dvp-settlement.dto';
import { DvpSettlementStatus } from './types/dvp-settlement.types';
import { AgentDecisionLog } from './types/dvp-settlement.types';
import { SearchQueryDto } from '../common/dtos/search.dto';

@Injectable()
export class DvpSettlementRepository {
  private readonly logger = new Logger(DvpSettlementRepository.name);

  constructor(
    @InjectModel(DvpSettlement.name)
    private readonly settlementModel: Model<DvpSettlement>,
  ) {}

  private toDto(doc: DvpSettlement & { _id?: unknown }): DvpSettlementDto {
    const obj = doc.toObject ? doc.toObject() : doc;
    return plainToInstance(
      DvpSettlementDto,
      { id: obj._id?.toString(), ...obj },
      { excludeExtraneousValues: true },
    );
  }

  async create(data: Partial<DvpSettlement>): Promise<DvpSettlementDto> {
    const settlement = new this.settlementModel(data);
    const saved = await settlement.save();
    return this.toDto(saved);
  }

  async findById(accountId: string, settlementId: string): Promise<DvpSettlementDto> {
    const doc = await this.settlementModel.findOne({ _id: settlementId, accountId });
    if (!doc) {
      throw new NotFoundException('DvP settlement not found');
    }
    return this.toDto(doc);
  }

  async findByReference(settlementReference: string): Promise<DvpSettlementDto | null> {
    const doc = await this.settlementModel.findOne({ settlementReference });
    return doc ? this.toDto(doc) : null;
  }

  async findByDocumentId(
    accountId: string,
    tradeDocumentId: string,
  ): Promise<DvpSettlementDto | null> {
    const doc = await this.settlementModel.findOne({
      accountId,
      'document.tradeDocumentId': tradeDocumentId,
      status: { $nin: [DvpSettlementStatus.CANCELLED, DvpSettlementStatus.FAILED] },
    });
    return doc ? this.toDto(doc) : null;
  }

  async updateStatus(
    accountId: string,
    settlementId: string,
    status: DvpSettlementStatus,
    extra?: Partial<DvpSettlement>,
  ): Promise<DvpSettlementDto> {
    const doc = await this.settlementModel.findOneAndUpdate(
      { _id: settlementId, accountId },
      { $set: { status, ...extra } },
      { new: true },
    );
    if (!doc) {
      throw new NotFoundException('DvP settlement not found');
    }
    return this.toDto(doc);
  }

  async appendAgentDecision(
    accountId: string,
    settlementId: string,
    decision: AgentDecisionLog,
  ): Promise<DvpSettlementDto> {
    const doc = await this.settlementModel.findOneAndUpdate(
      { _id: settlementId, accountId },
      { $push: { agentDecisions: decision } },
      { new: true },
    );
    if (!doc) {
      throw new NotFoundException('DvP settlement not found');
    }
    return this.toDto(doc);
  }

  async updatePayment(
    accountId: string,
    settlementId: string,
    paymentUpdates: Record<string, unknown>,
  ): Promise<DvpSettlementDto> {
    const setFields: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(paymentUpdates)) {
      setFields[`payment.${key}`] = value;
    }
    const doc = await this.settlementModel.findOneAndUpdate(
      { _id: settlementId, accountId },
      { $set: setFields },
      { new: true },
    );
    if (!doc) {
      throw new NotFoundException('DvP settlement not found');
    }
    return this.toDto(doc);
  }

  async updateDocument(
    accountId: string,
    settlementId: string,
    documentUpdates: Record<string, unknown>,
  ): Promise<DvpSettlementDto> {
    const setFields: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(documentUpdates)) {
      setFields[`document.${key}`] = value;
    }
    const doc = await this.settlementModel.findOneAndUpdate(
      { _id: settlementId, accountId },
      { $set: setFields },
      { new: true },
    );
    if (!doc) {
      throw new NotFoundException('DvP settlement not found');
    }
    return this.toDto(doc);
  }

  async listByAccount(
    accountId: string,
    searchParams: SearchQueryDto,
  ): Promise<{ metadata: Record<string, number>; data: DvpSettlementDto[] }> {
    const query: Record<string, unknown> = { accountId };
    if (searchParams.queryTerm) {
      query.settlementReference = { $regex: searchParams.queryTerm, $options: 'i' };
    }

    const total = await this.settlementModel.countDocuments(query);
    const docs = await this.settlementModel
      .find(query)
      .sort({
        [searchParams.orderBy || 'createdAt']:
          searchParams.orderDirection === 'desc' ? -1 : 1,
      })
      .skip((searchParams.page - 1) * searchParams.limit)
      .limit(searchParams.limit);

    return {
      metadata: {
        totalDocuments: total,
        page: searchParams.page,
        totalPages: Math.ceil(total / searchParams.limit),
        limit: searchParams.limit,
      },
      data: docs.map((d) => this.toDto(d)),
    };
  }
}
