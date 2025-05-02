import {
  Body,
  Controller,
  Get,
  Logger,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LookupService } from './lookup.service';
import { plainToInstance } from 'class-transformer';
import { ChainLookupDTO } from './dtos/chain-lookup.dto';
import { UpsertTradeDocumentFileDto } from '../trade-documents/dtos/trade-document.dto';

@ApiTags('Data Lookup')
@Controller('lookup')
export class LookupController {
  private readonly logger = new Logger(LookupController.name);

  constructor(private readonly lookupService: LookupService) {}

  @Get('chain-details/:chainId')
  @ApiOperation({
    summary: 'Gets the chain details for the given ChainId',
  })
  @ApiResponse({ status: 200, description: 'Chain Details successfully retrieved' })
  @ApiResponse({
    status: 404,
    description: 'Chain Not Found',
  })
  @ApiResponse({
    status: 401,
    description: 'Not authorized to retrieve Chain Details',
  })
  async getChainById(@Param('chainId') chainId: string, @Query('getBy') getByParam: string) {

    if (getByParam && getByParam.toLowerCase() === "chainname") {
      return plainToInstance(ChainLookupDTO, this.lookupService.getChainDetailsByName(chainId));
    }
    return plainToInstance(ChainLookupDTO, this.lookupService.getChainDetailsByChainId(chainId));

  }


  @Post('chain-details')
  @ApiOperation({summary: "Adds a new supported chain"})
  @ApiResponse({ status: 201, description: 'Chain Details successfully created' })
  @ApiResponse({
    status: 400,
    description: 'Invalid chain details',
  })
  @ApiResponse({
    status: 401,
    description: 'Not authorized to add new supported Chain Details',
  })
  @ApiBody({type: ChainLookupDTO})
  async addNewSupportedChain(@Body() chainDetails: ChainLookupDTO) {
    return this.lookupService.addSupportedChain(chainDetails);
  }

}
