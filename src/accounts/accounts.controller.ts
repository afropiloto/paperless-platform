import {
  Body,
  Controller,
  Get,
  Logger,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AccountCreationDto, AccountDetailsDto, AccountUpdateDto } from './dtos/accounts.dto';
import { AccountsService } from './accounts.service';

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
  async getAccountById(@Param('accountId') accountId: string): Promise<AccountDetailsDto> {
    const account =  await this.accountsService.findByAccountId(accountId);
    this.logger.debug({account})
    return account;
  }

  @Post()
  @ApiResponse({status: 201, description: 'Account created successfully'})
  @ApiResponse({status: 400, description: 'Account details not valid. Account not created'})
  @ApiResponse({status: 401, description: 'Not authorized to create new accounts'})
  async createNewAccount(@Body() accountDto: AccountCreationDto) : Promise<AccountDetailsDto> {
    return await this.accountsService.createAccount(accountDto);
  }

  @Patch(':id')
  @ApiResponse({status: 200, description: 'Account updated successfully'})
  @ApiResponse({status: 400, description: 'Account details not valid. Account not updated'})
  @ApiResponse({status: 401, description: 'Not authorized to update this accounts'})
  @ApiResponse({status: 404, description: 'Account not found'})
  async updateAccount(@Param('id') accountId: string, @Body() accountDto: AccountUpdateDto) : Promise<AccountDetailsDto> {
    return await this.accountsService.updateAccount(accountId, accountDto)

  }
}
