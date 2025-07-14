import {
  Body,
  Controller,
  Get,
  Logger,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  AccountCreationDto,
  AccountDetailsDto,
  AccountStatusUpdateDto,
  AccountUpdateDto,
} from './dtos/accounts.dto';
import { AccountsService } from './accounts.service';
import { SearchQueryDto } from '../common/dtos/search.dto';
import { ACCOUNT_SUMMARY_INCLUDE_FIELDS } from './accounts.constants';

@ApiTags('Accounts')
@Controller('accounts')
export class AccountsController {
  private readonly logger = new Logger(AccountsController.name);
  constructor(private readonly accountsService: AccountsService) {}

  @Get(':accountId')
  @ApiOperation({
    summary: 'Retrieves account details by the Account ID',
  })
  @ApiResponse({ status: 200, description: 'Account details retrieved' })
  @ApiResponse({ status: 404, description: 'Account could not be found' })
  @ApiResponse({
    status: 401,
    description: 'Not authorized to retrieve account',
  })
  async getAccountById(
    @Param('accountId') accountId: string,
  ): Promise<AccountDetailsDto> {
    return await this.accountsService.findByAccountId(accountId);
  }

  @Get()
  @ApiOperation({
    summary: 'Retrieves the list of account details',
  })
  @ApiResponse({
    status: 200,
    description: 'List of Account details retrieved',
  })
  @ApiResponse({
    status: 401,
    description: 'Not authorized to retrieve account',
  })
  async getAccountsList(@Query() searchParams: SearchQueryDto) {
    return this.accountsService.searchAccounts(
      searchParams,
      ACCOUNT_SUMMARY_INCLUDE_FIELDS,
    );
  }

  @Post()
  @ApiResponse({ status: 201, description: 'Account created successfully' })
  @ApiResponse({
    status: 400,
    description: 'Account details not valid. Account not created',
  })
  @ApiResponse({
    status: 401,
    description: 'Not authorized to create new accounts',
  })
  async createNewAccount(
    @Body() accountDto: AccountCreationDto,
  ): Promise<AccountDetailsDto> {
    return await this.accountsService.createAccount(accountDto);
  }

  @Patch(':id')
  @ApiResponse({ status: 200, description: 'Account updated successfully' })
  @ApiResponse({
    status: 400,
    description: 'Account details not valid. Account not updated',
  })
  @ApiResponse({
    status: 401,
    description: 'Not authorized to update this accounts',
  })
  @ApiResponse({ status: 404, description: 'Account not found' })
  async updateAccount(
    @Param('id') accountId: string,
    @Body() accountDto: AccountUpdateDto,
  ): Promise<AccountDetailsDto> {
    return await this.accountsService.updateAccount(accountId, accountDto);
  }

  @Patch(':id/status')
  @ApiResponse({
    status: 200,
    description: 'Account status updated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Account details not valid. Account not updated',
  })
  @ApiResponse({
    status: 401,
    description: 'Not authorized to update this accounts',
  })
  @ApiResponse({ status: 404, description: 'Account not found' })
  async updateAccountStatus(
    @Param('id') accountId: string,
    @Body() accountDto: AccountStatusUpdateDto,
  ): Promise<AccountDetailsDto> {
    return await this.accountsService.updateAccountStatus(accountId, accountDto);
  }
}
