import { Body, Controller, Delete, Get, HttpException, HttpStatus, Logger, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { NamedWalletsService } from './named-wallets.service';
import {
  CreateNamedWalletDto,
  NamedWalletDto,
  UpdateNamedWalletDto,
} from './dtos/named-wallets.dto';
import mongoose from 'mongoose';
import { AccountsService } from '../accounts/accounts.service';
import { GeneralResponseDto } from '../common/common-dto';

@ApiTags('Named Wallets')
@Controller('named-wallets')
export class NamedWalletsController {
  private readonly logger = new Logger(NamedWalletsController.name);
  constructor(private readonly namedWalletsService: NamedWalletsService,
              private readonly accountService: AccountsService) {}

  @Get('/:accountId')
  @ApiOperation({ summary: 'Retrieves the Named Wallets for an account' })
  @ApiResponse({ status: 200, description: 'Named Wallets for account returned successfully' })
  @ApiResponse({ status: 401, description: 'Not authorised to retrieve Named Wallets for Account' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  async getAccountNamedWallets(@Param('accountId') accountId: string): Promise<NamedWalletDto[]> {
    return await this.namedWalletsService.getWalletsForAccountId(accountId);
  }

  @Get(':accountId/:walletId')
  @ApiOperation({ summary: 'Retrieves details of a Named Wallets for an account' })
  @ApiResponse({ status: 200, description: 'Named Wallet Details for account returned successfully' })
  @ApiResponse({ status: 401, description: 'Not authorised to retrieve Named Wallets for Account' })
  @ApiResponse({ status: 404, description: 'Account or Wallet not found' })
  async getNamedWalletById(@Param('accountId') accountId: string, @Param('walletId') walletId: string): Promise<NamedWalletDto> {
    if (!mongoose.isValidObjectId(walletId)) {
      throw new HttpException("Account or Wallet not found", HttpStatus.NOT_FOUND);
    }
    return await this.namedWalletsService.getWalletForAccount(accountId, walletId);
  }


  @Post(':accountId')
  @ApiOperation({summary: "Creates a new Named Wallet for an account"})
  @ApiResponse({ status: 201, description: 'Named Wallet Created' })
  @ApiResponse({ status: 401, description: 'Not authorised to created Named Wallets for Account' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  async createNamedWallet(@Param('accountId') accountId: string, @Body() createNamedWalletDto: CreateNamedWalletDto) :Promise<NamedWalletDto> {
    // Check if the account id exists
    const accountExists = await this.accountService.accountExists(accountId);
    if (!accountExists) {
      throw new HttpException('Account not found', HttpStatus.NOT_FOUND);
    }
    // Check if the Wallet address exists for the account
    const walletExists = await this.namedWalletsService.walletAddressExistsForAccount(accountId, createNamedWalletDto.walletAddress);
    if (walletExists) {
      throw new HttpException('Wallet Address already assigned to a Named Wallet for this Account', HttpStatus.BAD_REQUEST);
    }
    // Create the named Wallet
    return await this.namedWalletsService.createNamedWallet(accountId, createNamedWalletDto);

  }

  @Patch(':accountId/:walletId')
  @ApiOperation({summary: "Updates an existing Named Wallet for an account"})
  @ApiResponse({ status: 200, description: 'Named Wallet Updated' })
  @ApiResponse({ status: 401, description: 'Not authorised to update Named Wallets for Account' })
  @ApiResponse({ status: 404, description: 'Account or wallet not found' })
  async updateNamedWallet(@Param('accountId') accountId: string, @Param('walletId') walletId: string, @Body() updateNamedWalletDto: UpdateNamedWalletDto) :Promise<NamedWalletDto> {
    if (!mongoose.isValidObjectId(walletId)) {
      throw new HttpException("Account or Wallet not found", HttpStatus.NOT_FOUND);
    }
    // Check if the account id exists
    const accountExists = await this.accountService.accountExists(accountId);
    if (!accountExists) {
      throw new HttpException('Account or Wallet not found', HttpStatus.NOT_FOUND);
    }

    // Update the named Wallet
    return await this.namedWalletsService.updateNamedWallet(accountId, walletId, updateNamedWalletDto);
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
