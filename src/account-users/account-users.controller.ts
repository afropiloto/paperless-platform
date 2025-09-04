import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Logger,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody, ApiHeader,
  ApiOperation,
  ApiParam,

  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AccountUsersService } from './account-users.service';
import { 
  CreateAccountUserDto, 
  UpdateAccountUserDto, 
  AccountUserResponseDto, 
  AccountUsersSearchDto 
} from './dtos';
import { AccountUsersSearchResultsDto } from './dtos';
import { JwtGuard } from 'src/auth/guards/jwt-guard';
import { ApiKeyGuard } from 'src/api-key-auth/api-key.guard';
import { ClientAccess } from 'src/api-key-auth/decorators/client-access.decorator';
import { ClientAccessGroup } from 'src/api-key-auth/types/api-key-auth.types';

@ApiTags('Account Users')
@Controller('account-users')
@UseGuards(JwtGuard, ApiKeyGuard)
@ApiBearerAuth()
@ClientAccess(ClientAccessGroup.SHARED)
@ApiHeader({
  name: 'x-api-key',
  description: 'The Client Application API Key',
  example: '47f19331:86382a9cbeaa603325628d29859b10fa6df94385ef792ea340cb1208ab9fdb6e'
})
export class AccountUsersController {
  private readonly logger = new Logger(AccountUsersController.name);

  constructor(private readonly accountUsersService: AccountUsersService) {}

  @Post('/account/:accountId')

  @ApiOperation({ 
    summary: 'Create account user',
    description: 'Creates a new account user with the specified permissions and details'
  })
  @ApiBody({ 
    type: CreateAccountUserDto,
    description: 'Account user creation data'
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Account user successfully created',
    type: AccountUserResponseDto
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data or account ID format'
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Email address already exists'
  })
  async createAccountUser(
    @Body() createAccountUserDto: CreateAccountUserDto
  ): Promise<AccountUserResponseDto> {
    return  await this.accountUsersService.createAccountUser(createAccountUserDto);
  }

  @Get('account/:accountId')
  @ApiOperation({
    summary: 'Get account users by account ID',
    description: 'Retrieves a paginated list of account users for a specific account with optional search and filtering'
  })
  @ApiParam({
    name: 'accountId',
    description: 'Account ID',
    type: 'string',
    example: '507f1f77bcf86cd799439011'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Account users retrieved successfully',
    type: AccountUsersSearchResultsDto
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid account ID format'
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Account not found'
  })
  async getAccountUsersByAccountId(
    @Param('accountId') accountId: string,
    @Query() searchParams: AccountUsersSearchDto,
  ): Promise<AccountUsersSearchResultsDto> {
    return await this.accountUsersService.findAccountUsersByAccountId(accountId, searchParams);
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'Get account user by ID',
    description: 'Retrieves a specific account user by their unique ID'
  })
  @ApiParam({
    name: 'id',
    description: 'Account user ID',
    type: 'string',
    example: '507f1f77bcf86cd799439011'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Account user retrieved successfully',
    type: AccountUserResponseDto
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid account user ID format'
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Account user not found'
  })
  async getAccountUserById(@Param('id') id: string): Promise<AccountUserResponseDto> {

    return await this.accountUsersService.getAccountUserById(id);
  }

  @Get('wallet/:walletAddress')
  @ApiOperation({ 
    summary: 'Get account user by wallet address',
    description: 'Retrieves an account user by their Ethereum wallet address'
  })
  @ApiParam({
    name: 'walletAddress',
    description: 'Ethereum wallet address',
    type: 'string',
    example: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Account user retrieved successfully',
    type: AccountUserResponseDto
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid wallet address format'
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Account user not found'
  })
  async getAccountUserByWalletAddress(
    @Param('walletAddress') walletAddress: string
  ): Promise<AccountUserResponseDto> {
    return await this.accountUsersService.findAccountUserByWalletAddress(walletAddress);
  }

  @Patch(':id')
  @ApiOperation({ 
    summary: 'Update account user (partial update)',
    description: 'Updates specific fields of an existing account user. Only provided fields will be updated. Permissions can be partially updated by providing only the permissions you want to change.'
  })
  @ApiParam({
    name: 'id',
    description: 'Account user ID',
    type: 'string',
    example: '507f1f77bcf86cd799439011'
  })
  @ApiBody({ 
    type: UpdateAccountUserDto,
    description: 'Partial account user update data - only include fields you want to update'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Account user successfully updated',
    type: AccountUserResponseDto
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data or account user ID format'
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Account user not found'
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Email address already exists (if email is being updated)'
  })
  async updateAccountUser(
    @Param('id') id: string,
    @Body() updateAccountUserDto: UpdateAccountUserDto
  ): Promise<AccountUserResponseDto> {
    return await this.accountUsersService.updateAccountUser(id, updateAccountUserDto);
  }

  // Permission configuration endpoints
  @Get('permissions/modules')
  @ApiOperation({ 
    summary: 'Get all valid modules',
    description: 'Retrieves all valid application modules that can be assigned to users'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Valid modules retrieved successfully'
  })
  async getValidModules() {
    return this.accountUsersService.getValidModules();
  }

  @Get('permissions/roles')
  @ApiOperation({ 
    summary: 'Get all valid roles',
    description: 'Retrieves all valid application roles that can be assigned to users'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Valid roles retrieved successfully'
  })
  async getValidRoles() {
    return this.accountUsersService.getValidRoles();
  }

  @Get('permissions/combinations')
  @ApiOperation({ 
    summary: 'Get all valid permission combinations',
    description: 'Retrieves all valid module-role combinations that can be assigned to users'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Valid combinations retrieved successfully'
  })
  async getValidCombinations() {
    return this.accountUsersService.getValidCombinations();
  }

  @Get('permissions/modules/:moduleId/roles')
  @ApiOperation({ 
    summary: 'Get valid roles for a specific module',
    description: 'Retrieves all valid roles that can be assigned for a specific application module'
  })
  @ApiParam({
    name: 'moduleId',
    description: 'Module ID',
    type: 'string',
    example: 'DealDesk'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Valid roles for module retrieved successfully'
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Module not found'
  })
  async getValidRolesForModule(@Param('moduleId') moduleId: string) {
    return this.accountUsersService.getValidRolesForModule(moduleId);
  }

  @Get('permissions/roles/:roleId/modules')
  @ApiOperation({ 
    summary: 'Get valid modules for a specific role',
    description: 'Retrieves all valid modules that can be assigned for a specific application role'
  })
  @ApiParam({
    name: 'roleId',
    description: 'Role ID',
    type: 'string',
    example: 'Supervisor'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Valid modules for role retrieved successfully'
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Role not found'
  })
  async getValidModulesForRole(@Param('roleId') roleId: string) {
    return this.accountUsersService.getValidModulesForRole(roleId);
  }
}
