import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';


export class SubmitTradeDetailFundingDto {
  @ApiProperty({
    enum: TradeDetailFundingAction,
    description: 'The action to perform on the trade detail funding',
    example: TradeDetailFundingAction.FUNDING_REQUEST,
  })
  @IsEnum(TradeDetailFundingAction)
  action: TradeDetailFundingAction;
} 