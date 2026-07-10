import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Model } from 'mongoose';
import { plainToInstance } from 'class-transformer';
import {
  AttentionConstituent,
  AttentionIndexEvent,
  AttentionMetricsReading,
  AttentionSnapshot,
} from '../schemas/attention-index.schema';
import { AttentionScoringEngine } from '../scoring/attention-scoring.engine';
import {
  AuditEventDto,
  ConstituentDto,
  ConstituentScoreDto,
  DashboardSummaryDto,
  IndexHistoryPointDto,
  IndexSnapshotDto,
  SubIndexDto,
} from '../dtos/attention-index.dto';
import {
  buildConstituentInputs,
  DEFAULT_CONSTITUENTS,
  INDEX_SYMBOL,
  SUB_INDEX_SYMBOLS,
} from '../data/attention-index.seed';
import {
  AttentionSector,
  IndexEventType,
  INDEX_BASE_VALUE,
  IndexCalculationResult,
} from '../types/attention-index.types';

@Injectable()
export class AttentionIndexService implements OnModuleInit {
  private readonly logger = new Logger(AttentionIndexService.name);
  private readonly engine = new AttentionScoringEngine();
  private latestSnapshot: IndexCalculationResult | null = null;

  constructor(
    @InjectModel(AttentionConstituent.name)
    private constituentModel: Model<AttentionConstituent>,
    @InjectModel(AttentionSnapshot.name)
    private snapshotModel: Model<AttentionSnapshot>,
    @InjectModel(AttentionIndexEvent.name)
    private eventModel: Model<AttentionIndexEvent>,
    @InjectModel(AttentionMetricsReading.name)
    private metricsModel: Model<AttentionMetricsReading>,
  ) {}

  async onModuleInit() {
    try {
      await this.seedIfEmpty();
      await this.recalculateIndex();
      await this.seedHistoricalSnapshots();
    } catch (err) {
      this.logger.warn(`Init with in-memory fallback: ${(err as Error).message}`);
      this.latestSnapshot = this.calculateInMemory(0);
    }
  }

  @Cron(CronExpression.EVERY_HOUR)
  async scheduledRecalculation() {
    this.logger.log('Running scheduled ATTN index recalculation');
    await this.recalculateIndex();
  }

  async seedIfEmpty() {
    const count = await this.constituentModel.countDocuments();
    if (count > 0) return;

    this.logger.log('Seeding attention index constituents');
    await this.constituentModel.insertMany(
      DEFAULT_CONSTITUENTS.map((c) => ({ ...c, isActive: true })),
    );
    await this.logEvent(IndexEventType.METHODOLOGY_UPDATE, 'Initial constituent basket seeded', {
      count: DEFAULT_CONSTITUENTS.length,
      version: this.engine.getMethodologyDocumentation().version,
    });
  }

  async seedHistoricalSnapshots() {
    const existing = await this.snapshotModel.countDocuments({ indexSymbol: INDEX_SYMBOL });
    if (existing >= 7) return;

    this.logger.log('Generating historical index snapshots for chart data');
    const snapshots = [];
    for (let day = 30; day >= 0; day--) {
      const result = this.calculateInMemory(day);
      snapshots.push({
        indexSymbol: INDEX_SYMBOL,
        indexValue: result.indexValue,
        previousValue: result.previousValue,
        changePercent: result.changePercent,
        methodologyVersion: result.methodologyVersion,
        dataProvenanceHash: result.dataProvenanceHash,
        calculatedAt: new Date(Date.now() - day * 24 * 60 * 60 * 1000),
        constituents: result.constituents.map((c) => ({
          symbol: c.symbol,
          name: c.name,
          sector: c.sector,
          platform: c.platform,
          rawScore: c.rawScore,
          adjustedScore: c.adjustedScore,
          weight: c.weight,
          mentionVolume: c.metrics.mentionVolume,
          engagementRate: c.metrics.engagementRate,
          uniqueReach: c.metrics.uniqueReach,
          botScore: c.metrics.botScore,
          anomalyFlags: c.anomalyFlags,
        })),
        anomalies: result.anomalies,
      });
    }
    await this.snapshotModel.deleteMany({ indexSymbol: INDEX_SYMBOL });
    await this.snapshotModel.insertMany(snapshots);
  }

  private calculateInMemory(dayOffset: number): IndexCalculationResult {
    const prevDay = dayOffset + 1;
    const prevResult = this.engine.calculate({
      indexSymbol: INDEX_SYMBOL,
      previousValue: INDEX_BASE_VALUE,
      constituents: buildConstituentInputs(prevDay),
      calculatedAt: new Date(Date.now() - prevDay * 24 * 60 * 60 * 1000),
    });

    const previousScores = new Map(
      prevResult.constituents.map((c) => [c.symbol, c.adjustedScore]),
    );

    const constituents = buildConstituentInputs(dayOffset);
    const scored = this.engine.calculate({
      indexSymbol: INDEX_SYMBOL,
      previousValue: prevResult.indexValue,
      constituents,
      calculatedAt: new Date(Date.now() - dayOffset * 24 * 60 * 60 * 1000),
    });

    const indexValue = this.engine.computeIndexValue(
      scored.constituents,
      previousScores,
      prevResult.indexValue,
    );

    return {
      ...scored,
      indexValue: Math.round(indexValue * 100) / 100,
      previousValue: prevResult.indexValue,
      changePercent:
        Math.round(((indexValue - prevResult.indexValue) / prevResult.indexValue) * 10000) / 100,
    };
  }

  async recalculateIndex(): Promise<IndexSnapshotDto> {
    const previousSnapshot = await this.snapshotModel
      .findOne({ indexSymbol: INDEX_SYMBOL })
      .sort({ calculatedAt: -1 });

    const previousValue = previousSnapshot?.indexValue ?? INDEX_BASE_VALUE;
    const previousScores = new Map<string, number>();
    if (previousSnapshot?.constituents) {
      for (const c of previousSnapshot.constituents) {
        previousScores.set(c.symbol, c.adjustedScore);
      }
    }

    const dbConstituents = await this.constituentModel.find({ isActive: true });
    const inputs = await Promise.all(
      dbConstituents.map(async (c) => {
        const latestMetric = await this.metricsModel
          .findOne({ symbol: c.symbol })
          .sort({ recordedAt: -1 });
        const metrics = latestMetric
          ? {
              mentionVolume: latestMetric.mentionVolume,
              engagementRate: latestMetric.engagementRate,
              uniqueReach: latestMetric.uniqueReach,
              previousMentionVolume: latestMetric.previousMentionVolume,
              botScore: latestMetric.botScore,
            }
          : buildConstituentInputs(0).find((i) => i.symbol === c.symbol)!.metrics;

        await this.metricsModel.create({
          symbol: c.symbol,
          ...metrics,
          recordedAt: new Date(),
        });

        return {
          symbol: c.symbol,
          name: c.name,
          sector: c.sector as AttentionSector,
          platform: c.platform,
          metrics,
        };
      }),
    );

    const partial = this.engine.calculate({
      indexSymbol: INDEX_SYMBOL,
      previousValue,
      constituents: inputs,
    });

    const indexValue =
      previousScores.size > 0
        ? this.engine.computeIndexValue(
            partial.constituents,
            previousScores,
            previousValue,
          )
        : partial.indexValue;

    const result: IndexCalculationResult = {
      ...partial,
      indexValue: Math.round(indexValue * 100) / 100,
      previousValue,
      changePercent:
        Math.round(((indexValue - previousValue) / previousValue) * 10000) / 100,
    };

    this.latestSnapshot = result;

    const doc = await this.snapshotModel.create({
      indexSymbol: INDEX_SYMBOL,
      indexValue: result.indexValue,
      previousValue: result.previousValue,
      changePercent: result.changePercent,
      methodologyVersion: result.methodologyVersion,
      dataProvenanceHash: result.dataProvenanceHash,
      calculatedAt: result.calculatedAt,
      constituents: result.constituents.map((c) => ({
        symbol: c.symbol,
        name: c.name,
        sector: c.sector,
        platform: c.platform,
        rawScore: c.rawScore,
        adjustedScore: c.adjustedScore,
        weight: c.weight,
        mentionVolume: c.metrics.mentionVolume,
        engagementRate: c.metrics.engagementRate,
        uniqueReach: c.metrics.uniqueReach,
        botScore: c.metrics.botScore,
        anomalyFlags: c.anomalyFlags,
      })),
      anomalies: result.anomalies,
    });

    await this.logEvent(
      IndexEventType.CALCULATION,
      `ATTN index calculated: ${result.indexValue} (${result.changePercent >= 0 ? '+' : ''}${result.changePercent}%)`,
      { indexValue: result.indexValue, anomalyCount: result.anomalies.length },
      result.dataProvenanceHash,
    );

    for (const anomaly of result.anomalies) {
      await this.logEvent(
        IndexEventType.ANOMALY_DETECTED,
        anomaly.description,
        { symbol: anomaly.symbol, severity: anomaly.severity, type: anomaly.type },
        result.dataProvenanceHash,
      );
    }

    return this.toSnapshotDto(doc);
  }

  async getLatestSnapshot(): Promise<IndexSnapshotDto> {
    const doc = await this.snapshotModel
      .findOne({ indexSymbol: INDEX_SYMBOL })
      .sort({ calculatedAt: -1 });

    if (doc) return this.toSnapshotDto(doc);

    if (this.latestSnapshot) {
      return plainToInstance(IndexSnapshotDto, {
        ...this.latestSnapshot,
        constituents: this.latestSnapshot.constituents.map((c) => ({
          symbol: c.symbol,
          name: c.name,
          sector: c.sector,
          platform: c.platform,
          rawScore: c.rawScore,
          adjustedScore: c.adjustedScore,
          weight: c.weight,
          mentionVolume: c.metrics.mentionVolume,
          engagementRate: c.metrics.engagementRate,
          uniqueReach: c.metrics.uniqueReach,
          botScore: c.metrics.botScore,
          anomalyFlags: c.anomalyFlags,
        })),
      });
    }

    const result = this.calculateInMemory(0);
    return plainToInstance(IndexSnapshotDto, {
      ...result,
      constituents: result.constituents.map((c) => ({
        symbol: c.symbol,
        name: c.name,
        sector: c.sector,
        platform: c.platform,
        rawScore: c.rawScore,
        adjustedScore: c.adjustedScore,
        weight: c.weight,
        mentionVolume: c.metrics.mentionVolume,
        engagementRate: c.metrics.engagementRate,
        uniqueReach: c.metrics.uniqueReach,
        botScore: c.metrics.botScore,
        anomalyFlags: c.anomalyFlags,
      })),
    });
  }

  async getDashboardSummary(): Promise<DashboardSummaryDto> {
    const latest = await this.getLatestSnapshot();
    const history = await this.getHistory(30);

    const change24h = this.computePeriodChange(history, 1);
    const change7d = this.computePeriodChange(history, 7);
    const subIndices = await this.getSubIndices(latest);

    const topMovers = [...latest.constituents]
      .sort((a, b) => b.adjustedScore - a.adjustedScore)
      .slice(0, 5);

    return plainToInstance(DashboardSummaryDto, {
      indexSymbol: latest.indexSymbol,
      indexValue: latest.indexValue,
      changePercent: latest.changePercent,
      change24h,
      change7d,
      calculatedAt: latest.calculatedAt,
      methodologyVersion: latest.methodologyVersion,
      dataProvenanceHash: latest.dataProvenanceHash,
      activeConstituents: latest.constituents.length,
      anomalyCount: latest.anomalies.length,
      subIndices,
      topMovers,
    });
  }

  private computePeriodChange(history: IndexHistoryPointDto[], days: number): number {
    if (history.length < 2) return 0;
    const latest = history[history.length - 1];
    const targetIdx = Math.max(0, history.length - 1 - days);
    const past = history[targetIdx];
    if (!past?.indexValue) return 0;
    return Math.round(((latest.indexValue - past.indexValue) / past.indexValue) * 10000) / 100;
  }

  private async getSubIndices(latest: IndexSnapshotDto): Promise<SubIndexDto[]> {
    return Object.entries(SUB_INDEX_SYMBOLS).map(([symbol, sector]) => {
      const sectorConstituents = latest.constituents.filter((c) => c.sector === sector);
      const totalWeight = sectorConstituents.reduce((s, c) => s + c.weight, 0);
      const weightedScore = sectorConstituents.reduce(
        (s, c) => s + c.adjustedScore * (c.weight / 100),
        0,
      );
      const indexValue = Math.round((INDEX_BASE_VALUE + weightedScore * 10) * 100) / 100;
      const avgEngagement =
        sectorConstituents.length > 0
          ? sectorConstituents.reduce((s, c) => s + c.engagementRate, 0) / sectorConstituents.length
          : 0;
      const changePercent = Math.round((avgEngagement * 100 - 5) * 100) / 100;

      return plainToInstance(SubIndexDto, {
        symbol,
        sector,
        indexValue,
        changePercent,
        constituentCount: sectorConstituents.length,
      });
    });
  }

  async getHistory(days: number): Promise<IndexHistoryPointDto[]> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const docs = await this.snapshotModel
      .find({ indexSymbol: INDEX_SYMBOL, calculatedAt: { $gte: since } })
      .sort({ calculatedAt: 1 });

    if (docs.length > 0) {
      return docs.map((d) =>
        plainToInstance(IndexHistoryPointDto, {
          calculatedAt: d.calculatedAt,
          indexValue: d.indexValue,
          changePercent: d.changePercent,
        }),
      );
    }

    return Array.from({ length: days + 1 }, (_, i) => {
      const result = this.calculateInMemory(days - i);
      return plainToInstance(IndexHistoryPointDto, {
        calculatedAt: new Date(Date.now() - (days - i) * 24 * 60 * 60 * 1000),
        indexValue: result.indexValue,
        changePercent: result.changePercent,
      });
    });
  }

  async getConstituents(): Promise<ConstituentDto[]> {
    const docs = await this.constituentModel.find().sort({ symbol: 1 });
    if (docs.length === 0) {
      return DEFAULT_CONSTITUENTS.map((c) =>
        plainToInstance(ConstituentDto, { ...c, isActive: true }),
      );
    }
    return docs.map((d) => plainToInstance(ConstituentDto, d.toObject()));
  }

  async getAuditTrail(limit: number = 50): Promise<AuditEventDto[]> {
    const events = await this.eventModel
      .find({ indexSymbol: INDEX_SYMBOL })
      .sort({ createdAt: -1 })
      .limit(limit);
    return events.map((e) =>
      plainToInstance(AuditEventDto, {
        eventType: e.eventType,
        description: e.description,
        createdAt: (e as unknown as { createdAt: Date }).createdAt,
        provenanceHash: e.provenanceHash,
        details: e.details,
      }),
    );
  }

  getMethodology() {
    return this.engine.getMethodologyDocumentation();
  }

  private async logEvent(
    eventType: IndexEventType,
    description: string,
    details: Record<string, unknown> = {},
    provenanceHash?: string,
  ) {
    await this.eventModel.create({
      indexSymbol: INDEX_SYMBOL,
      eventType,
      description,
      details,
      provenanceHash,
    });
  }

  private toSnapshotDto(doc: AttentionSnapshot): IndexSnapshotDto {
    return plainToInstance(IndexSnapshotDto, {
      indexSymbol: doc.indexSymbol,
      indexValue: doc.indexValue,
      previousValue: doc.previousValue,
      changePercent: doc.changePercent,
      methodologyVersion: doc.methodologyVersion,
      dataProvenanceHash: doc.dataProvenanceHash,
      calculatedAt: doc.calculatedAt,
      constituents: doc.constituents,
      anomalies: doc.anomalies,
    });
  }
}
