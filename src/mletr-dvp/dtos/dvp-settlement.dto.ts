import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import {
  IsEnum,
  IsEthereumAddress,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { DvpSettlementStatus, StablecoinType } from '../types/dvp-settlement.types';

export class CreateDvpSettlementDto {
  @ApiProperty({ description: 'Trade document ID to settle via DvP' })
  @IsString()
  @IsNotEmpty()
  tradeDocumentId: string;

  @ApiProperty({ description: 'Buyer wallet address for document transfer and payment' })
  @IsEthereumAddress()
  buyerWalletAddress: string;

  @ApiProperty({ description: 'Seller wallet address to receive stablecoin payment' })
  @IsEthereumAddress()
  sellerWalletAddress: string;

  @ApiPropertyOptional({ description: 'Settlement amount (human-readable, e.g. "1500.00")' })
  @IsOptional()
  @IsString()
  amount?: string;

  @ApiPropertyOptional({ enum: StablecoinType, default: StablecoinType.USDC })
  @IsOptional()
  @IsEnum(StablecoinType)
  stablecoin?: StablecoinType;

  @ApiPropertyOptional({ description: 'Governing law jurisdiction for mLETR compliance' })
  @IsOptional()
  @IsString()
  governingLaw?: string;
}

export class ConfirmPaymentDto {
  @ApiProperty({ description: 'On-chain transaction hash of stablecoin payment to escrow' })
  @IsString()
  @IsNotEmpty()
  paymentTxHash: string;
}

export class MletrAttributesDto {
  @Expose()
  @ApiPropertyOptional()
  governingLaw?: string;

  @Expose()
  @ApiProperty()
  isElectronicTransferableRecord: boolean;

  @Expose()
  @ApiProperty()
  controlMethod: string;

  @Expose()
  @ApiPropertyOptional()
  documentReference?: string;

  @Expose()
  @ApiPropertyOptional()
  sellerParty?: string;

  @Expose()
  @ApiPropertyOptional()
  buyerParty?: string;
}

export class SettlementPaymentDto {
  @Expose()
  @ApiProperty({ enum: StablecoinType })
  stablecoin: StablecoinType;

  @Expose()
  @ApiProperty()
  amount: string;

  @Expose()
  @ApiProperty()
  amountAtomic: string;

  @Expose()
  @ApiProperty()
  tokenContractAddress: string;

  @Expose()
  @ApiProperty()
  decimals: number;

  @Expose()
  @ApiProperty()
  buyerWalletAddress: string;

  @Expose()
  @ApiProperty()
  sellerWalletAddress: string;

  @Expose()
  @ApiProperty()
  escrowWalletAddress: string;

  @Expose()
  @ApiPropertyOptional()
  paymentTxHash?: string;

  @Expose()
  @ApiPropertyOptional()
  releaseTxHash?: string;
}

export class SettlementDocumentDto {
  @Expose()
  @ApiProperty()
  tradeDocumentId: string;

  @Expose()
  @ApiProperty()
  documentType: string;

  @Expose()
  @ApiPropertyOptional()
  merkleRoot?: string;

  @Expose()
  @ApiPropertyOptional()
  tokenId?: string;

  @Expose()
  @ApiPropertyOptional()
  transferTxHash?: string;

  @Expose()
  @ApiPropertyOptional()
  beneficiaryAddress?: string;

  @Expose()
  @ApiPropertyOptional()
  holderAddress?: string;
}

export class AgentDecisionDto {
  @Expose()
  @ApiProperty()
  timestamp: Date;

  @Expose()
  @ApiProperty()
  action: string;

  @Expose()
  @ApiProperty()
  reasoning: string;

  @Expose()
  @ApiProperty()
  confidence: number;
}

export class DvpSettlementDto {
  @Expose()
  @ApiProperty()
  id: string;

  @Expose()
  @ApiProperty()
  accountId: string;

  @Expose()
  @ApiProperty()
  settlementReference: string;

  @Expose()
  @ApiProperty({ enum: DvpSettlementStatus })
  status: DvpSettlementStatus;

  @Expose()
  @Type(() => SettlementDocumentDto)
  @ApiProperty({ type: SettlementDocumentDto })
  document: SettlementDocumentDto;

  @Expose()
  @Type(() => SettlementPaymentDto)
  @ApiProperty({ type: SettlementPaymentDto })
  payment: SettlementPaymentDto;

  @Expose()
  @Type(() => MletrAttributesDto)
  @ApiProperty({ type: MletrAttributesDto })
  mletrAttributes: MletrAttributesDto;

  @Expose()
  @ApiPropertyOptional()
  failureReason?: string;

  @Expose()
  @ApiPropertyOptional()
  settledAt?: Date;

  @Expose()
  @Type(() => AgentDecisionDto)
  @ApiProperty({ type: [AgentDecisionDto] })
  agentDecisions: AgentDecisionDto[];

  @Expose()
  @ApiPropertyOptional()
  createdAt?: Date;

  @Expose()
  @ApiPropertyOptional()
  updatedAt?: Date;
}

export class AgentOrchestrationResponseDto {
  @Expose()
  @ApiProperty()
  settlementId: string;

  @Expose()
  @ApiProperty({ enum: DvpSettlementStatus })
  status: DvpSettlementStatus;

  @Expose()
  @ApiProperty()
  compliant: boolean;

  @Expose()
  @ApiProperty({ type: [String] })
  nextActions: string[];

  @Expose()
  @ApiProperty({ type: [String] })
  complianceNotes: string[];

  @Expose()
  @ApiProperty({ type: [AgentDecisionDto] })
  decisions: AgentDecisionDto[];
}

export class PaymentInstructionsDto {
  @Expose()
  @ApiProperty()
  escrowWalletAddress: string;

  @Expose()
  @ApiProperty()
  tokenContractAddress: string;

  @Expose()
  @ApiProperty()
  amount: string;

  @Expose()
  @ApiProperty()
  amountAtomic: string;

  @Expose()
  @ApiProperty()
  stablecoin: string;

  @Expose()
  @ApiProperty()
  settlementReference: string;
}
