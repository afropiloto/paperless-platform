import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Logger,
  Param,
  Patch,
  Post,
  Query, UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { NamedWalletsService } from './named-wallets.service';
import {
  CreateNamedWalletDto,
  NamedWalletDto,
  UpdateNamedWalletDto,
} from './dtos/named-wallets.dto';
import mongoose from 'mongoose';
import { GeneralResponseDto } from '../common/common-dto';
import { NamedWalletsSearchResultsDto } from './dtos/named-wallets-search-results.dto';
import { SearchQueryDto } from '../common/dtos/search.dto';
import { JwtGuard } from 'src/auth/guards/jwt-guard';
import { ApiKeyGuard } from 'src/api-key-auth/api-key.guard';
import { ClientAccess } from 'src/api-key-auth/decorators/client-access.decorator';
import { ClientAccessGroup } from 'src/api-key-auth/types/api-key-auth.types';

@ApiTags('Named Wallets')
@Controller('named-wallets')
@UseGuards(JwtGuard, ApiKeyGuard)
@ApiHeader({
  name: 'x-api-key',
  description: 'The Client Application API Key',
  example: '47f19331:86382a9cbeaa603325628d29859b10fa6df94385ef792ea340cb1208ab9fdb6e'
})
@ClientAccess(ClientAccessGroup.PAPERLESS_APP)
@ApiBearerAuth()
export class NamedWalletsController {
  private readonly logger = new Logger(NamedWalletsController.name);
  constructor(private readonly namedWalletsService: NamedWalletsService) {}

  @Get('/:accountId')
  @ApiOperation({ summary: 'Retrieves the Named Wallets for an account' })
  @ApiResponse({ status: 200, description: 'Named Wallets for account returned successfully' })
  @ApiResponse({ status: 401, description: 'Not authorised to retrieve Named Wallets for Account' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  async getAccountNamedWallets(@Param('accountId') accountId: string,
                               @Query() searchParams: SearchQueryDto): Promise<NamedWalletsSearchResultsDto> {
    return await this.namedWalletsService.getWalletsForAccountId(accountId, searchParams);
  }

  @Get(':accountId/:walletId')
  @ApiOperation({ summary: 'Retrieves details of a Named Wallets for an account' })
  @ApiResponse({ status: 200, description: 'Named Wallet Details for account returned successfully' })
  @ApiResponse({ status: 401, description: 'Not authorised to retrieve Named Wallets for Account' })
  @ApiResponse({ status: 404, description: 'Account or Wallet not found' })
  async getNamedWalletById(@Param('accountId') accountId: string, @Param('walletId') walletId: string): Promise<NamedWalletDto> {
    return await this.namedWalletsService.getWalletForAccount(accountId, walletId);
  }


  @Post(':accountId')
  @ApiOperation({summary: "Creates a new Named Wallet for an account"})
  @ApiResponse({ status: 201, description: 'Named Wallet Created' })
  @ApiResponse({ status: 401, description: 'Not authorised to created Named Wallets for Account' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  async createNamedWallet(@Param('accountId') accountId: string, @Body() createNamedWalletDto: CreateNamedWalletDto) :Promise<NamedWalletDto> {

    // Create the named Wallet
    return await this.namedWalletsService.createNamedWallet(accountId, createNamedWalletDto);

  }

  @Patch(':accountId/:walletId')
  @ApiOperation({summary: "Updates an existing Named Wallet for an account"})
  @ApiResponse({ status: 200, description: 'Named Wallet Updated' })
  @ApiResponse({ status: 401, description: 'Not authorised to update Named Wallets for Account' })
  @ApiResponse({ status: 404, description: 'Account or wallet not found' })
  async updateNamedWallet(@Param('accountId') accountId: string, @Param('walletId') walletId: string, @Body() updateNamedWalletDto: UpdateNamedWalletDto) :Promise<NamedWalletDto> {

    const response =  await this.namedWalletsService.updateNamedWallet(accountId, walletId, updateNamedWalletDto);

    return response;
  }


  @Delete(':accountId/:walletId')
  @ApiOperation({summary: "Deletes a  Named Wallet for an account"})
  @ApiResponse({ status: 200, description: 'Named Wallet Deleted' })
  @ApiResponse({ status: 401, description: 'Not authorised to delete Named Wallets for Account' })
  @ApiResponse({ status: 404, description: 'Account or wallet not found' })
  async deleteNamedWallet(@Param('accountId') accountId: string, @Param('walletId') walletId: string) :Promise<GeneralResponseDto> {
    if (!mongoose.isValidObjectId(walletId)) {
      throw new HttpException("Account or Wallet not found", HttpStatus.NOT_FOUND);
    }
    // delete the named Wallet
    const walletDeleted = await this.namedWalletsService.deleteNamedWallet(accountId, walletId);
    return {
      success: walletDeleted,
      message: walletDeleted ? "Wallet Deleted" : "Failed to delete Wallet",
    } as GeneralResponseDto
  }
}
