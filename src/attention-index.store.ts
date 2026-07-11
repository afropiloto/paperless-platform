import { AttentionScoringEngine } from './scoring/attention-scoring.engine.js';
import {
  buildConstituentInputs,
  DEFAULT_CONSTITUENTS,
  INDEX_SYMBOL,
  SUB_INDEX_SYMBOLS,
} from './data/attention-index.seed.js';
import {
  IndexEventType,
  INDEX_BASE_VALUE,
  IndexCalculationResult,
} from './types/attention-index.types.js';

export interface AuditEvent {
  eventType: string;
  description: string;
  createdAt: Date;
  provenanceHash?: string;
  details: Record<string, unknown>;
}

export interface SnapshotRecord {
  indexSymbol: string;
  indexValue: number;
  previousValue: number;
  changePercent: number;
  methodologyVersion: string;
  dataProvenanceHash: string;
  calculatedAt: Date;
  constituents: Array<{
    symbol: string;
    name: string;
    sector: string;
    platform: string;
    rawScore: number;
    adjustedScore: number;
    weight: number;
    mentionVolume: number;
    engagementRate: number;
    uniqueReach: number;
    botScore: number;
    anomalyFlags: string[];
  }>;
  anomalies: IndexCalculationResult['anomalies'];
}

function toConstituentRows(result: IndexCalculationResult): SnapshotRecord['constituents'] {
  return result.constituents.map((c) => ({
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
  }));
}

export class AttentionIndexStore {
  private readonly engine = new AttentionScoringEngine();
  private snapshots: SnapshotRecord[] = [];
  private auditEvents: AuditEvent[] = [];

  constructor() {
    this.seedHistory();
    this.recalculate();
    this.logEvent(IndexEventType.METHODOLOGY_UPDATE, 'ATTN index service initialized', {
      constituents: DEFAULT_CONSTITUENTS.length,
      version: this.engine.getMethodologyDocumentation().version,
    });
  }

  private seedHistory() {
    this.snapshots = [];
    for (let day = 30; day >= 0; day--) {
      const result = this.calculateForDay(day);
      this.snapshots.push({
        indexSymbol: INDEX_SYMBOL,
        indexValue: result.indexValue,
        previousValue: result.previousValue,
        changePercent: result.changePercent,
        methodologyVersion: result.methodologyVersion,
        dataProvenanceHash: result.dataProvenanceHash,
        calculatedAt: new Date(Date.now() - day * 24 * 60 * 60 * 1000),
        constituents: toConstituentRows(result),
        anomalies: result.anomalies,
      });
    }
  }

  private calculateForDay(dayOffset: number): IndexCalculationResult {
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

    const scored = this.engine.calculate({
      indexSymbol: INDEX_SYMBOL,
      previousValue: prevResult.indexValue,
      constituents: buildConstituentInputs(dayOffset),
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

  recalculate(): SnapshotRecord {
    const previous = this.snapshots[this.snapshots.length - 1];
    const previousValue = previous?.indexValue ?? INDEX_BASE_VALUE;
    const previousScores = new Map<string, number>();
    if (previous) {
      for (const c of previous.constituents) {
        previousScores.set(c.symbol, c.adjustedScore);
      }
    }

    const partial = this.engine.calculate({
      indexSymbol: INDEX_SYMBOL,
      previousValue,
      constituents: buildConstituentInputs(0),
    });

    const indexValue =
      previousScores.size > 0
        ? Math.round(
            this.engine.computeIndexValue(
              partial.constituents,
              previousScores,
              previousValue,
            ) * 100,
          ) / 100
        : partial.indexValue;

    const result: IndexCalculationResult = {
      ...partial,
      indexValue,
      previousValue,
      changePercent: Math.round(((indexValue - previousValue) / previousValue) * 10000) / 100,
    };

    const snapshot: SnapshotRecord = {
      indexSymbol: INDEX_SYMBOL,
      indexValue: result.indexValue,
      previousValue: result.previousValue,
      changePercent: result.changePercent,
      methodologyVersion: result.methodologyVersion,
      dataProvenanceHash: result.dataProvenanceHash,
      calculatedAt: result.calculatedAt,
      constituents: toConstituentRows(result),
      anomalies: result.anomalies,
    };

    this.snapshots.push(snapshot);
    if (this.snapshots.length > 365) this.snapshots.shift();

    this.logEvent(
      IndexEventType.CALCULATION,
      `ATTN index calculated: ${result.indexValue} (${result.changePercent >= 0 ? '+' : ''}${result.changePercent}%)`,
      { indexValue: result.indexValue, anomalyCount: result.anomalies.length },
      result.dataProvenanceHash,
    );

    for (const anomaly of result.anomalies) {
      this.logEvent(
        IndexEventType.ANOMALY_DETECTED,
        anomaly.description,
        { symbol: anomaly.symbol, severity: anomaly.severity, type: anomaly.type },
        result.dataProvenanceHash,
      );
    }

    return snapshot;
  }

  getLatestSnapshot(): SnapshotRecord {
    return this.snapshots[this.snapshots.length - 1];
  }

  getHistory(days: number) {
    const since = Date.now() - days * 24 * 60 * 60 * 1000;
    return this.snapshots
      .filter((s) => s.calculatedAt.getTime() >= since)
      .map((s) => ({
        calculatedAt: s.calculatedAt,
        indexValue: s.indexValue,
        changePercent: s.changePercent,
      }));
  }

  getDashboardSummary() {
    const latest = this.getLatestSnapshot();
    const history = this.getHistory(30);

    const change24h = this.periodChange(history, 1);
    const change7d = this.periodChange(history, 7);

    const subIndices = Object.entries(SUB_INDEX_SYMBOLS).map(([symbol, sector]) => {
      const sectorConstituents = latest.constituents.filter((c) => c.sector === sector);
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

      return {
        symbol,
        sector,
        indexValue,
        changePercent,
        constituentCount: sectorConstituents.length,
      };
    });

    const topMovers = [...latest.constituents]
      .sort((a, b) => b.adjustedScore - a.adjustedScore)
      .slice(0, 5);

    return {
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
    };
  }

  private periodChange(history: { indexValue: number }[], days: number): number {
    if (history.length < 2) return 0;
    const latest = history[history.length - 1];
    const past = history[Math.max(0, history.length - 1 - days)];
    if (!past?.indexValue) return 0;
    return Math.round(((latest.indexValue - past.indexValue) / past.indexValue) * 10000) / 100;
  }

  getConstituents() {
    return DEFAULT_CONSTITUENTS.map((c) => ({ ...c, isActive: true }));
  }

  getAuditTrail(limit = 50): AuditEvent[] {
    return this.auditEvents.slice(-limit).reverse();
  }

  getMethodology() {
    return this.engine.getMethodologyDocumentation();
  }

  private logEvent(
    eventType: IndexEventType,
    description: string,
    details: Record<string, unknown> = {},
    provenanceHash?: string,
  ) {
    this.auditEvents.push({
      eventType,
      description,
      createdAt: new Date(),
      provenanceHash,
      details,
    });
    if (this.auditEvents.length > 1000) this.auditEvents.shift();
  }
}
