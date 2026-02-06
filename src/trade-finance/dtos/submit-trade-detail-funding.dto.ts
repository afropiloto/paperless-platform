import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { TradeDetailFundingAction } from '../types/trade-finance.types';


export class SubmitTradeDetailFundingDto {
  @ApiProperty({
    enum: Object.values(TradeDetailFundingAction),
    description: 'The action to perform on the trade detail funding',
    example: TradeDetailFundingAction.FUNDING_REQUEST,
  })
  @IsEnum(TradeDetailFundingAction)
  action: TradeDetailFundingAction;
} 