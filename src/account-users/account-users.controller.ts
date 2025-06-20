import { 
  Body, 
  Controller, 
  Get, 
  HttpStatus, 
  Logger, 
  Param, 
  Patch, 
  Post, 
  Query 
} from '@nestjs/common';
import { 
  ApiBody, 
  ApiOperation, 
  ApiParam, 
  ApiQuery, 
  ApiResponse, 
  ApiTags 
} from '@nestjs/swagger';
import { AccountUsersService } from './account-users.service';
import { 
  CreateAccountUserDto, 
  UpdateAccountUserDto, 
  AccountUserResponseDto 
} from './dtos/account-user.dto';
import { AccountUsersSearchResultsDto } from './dtos/account-users-search-results.dto';
import { SearchQueryDto } from '../common/dtos/search.dto';
import { plainToInstance } from 'class-transformer';

@ApiTags('Account Users')
@Controller('account-users')
export class AccountUsersController {
  private readonly logger = new Logger(AccountUsersController.name);

  constructor(private readonly accountUsersService: AccountUsersService) {}

  @Post()
  @ApiOperation({ 
    summary: 'Create a new account user',
    description: 'Creates a new user associated with an account with specified permissions and details'
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
    this.logger.debug({ createAccountUserDto });
    return await this.accountUsersService.createAccountUser(createAccountUserDto);
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'Get account user by ID',
    description: 'Retrieves a specific account user by their unique identifier'
  })
  @ApiParam({
    name: 'id',
    description: 'Account user ID',
    type: 'string',
    example: '507f1f77bcf86cd799439011'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Account user details retrieved successfully',
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
  async getAccountUserById(
    @Param('id') id: string
  ): Promise<AccountUserResponseDto> {
    this.logger.debug({ id });
    return await this.accountUsersService.getAccountUserById(id);
  }

  @Patch(':id')
  @ApiOperation({ 
    summary: 'Update account user',
    description: 'Updates an existing account user with new information'
  })
  @ApiParam({
    name: 'id',
    description: 'Account user ID',
    type: 'string',
    example: '507f1f77bcf86cd799439011'
  })
  @ApiBody({ 
    type: UpdateAccountUserDto,
    description: 'Account user update data'
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
    this.logger.debug({ id, updateAccountUserDto });
    return await this.accountUsersService.updateAccountUser(id, updateAccountUserDto);
  }

  @Get('account/:accountId')
  @ApiOperation({ 
    summary: 'Get account users by account ID',
    description: 'Retrieves all users associated with a specific account with search, pagination, and ordering capabilities'
  })
  @ApiParam({
    name: 'accountId',
    description: 'Account ID',
    type: 'string',
    example: '507f1f77bcf86cd799439011'
  })
  @ApiQuery({ 
    name: 'queryTerm', 
    required: false, 
    description: 'Search term for name, email address, wallet address, or status',
    type: 'string'
  })
  @ApiQuery({ 
    name: 'page', 
    required: false, 
    description: 'Page number', 
    type: 'number',
    example: 1
  })
  @ApiQuery({ 
    name: 'limit', 
    required: false, 
    description: 'Number of items per page', 
    type: 'number',
    example: 10
  })
  @ApiQuery({ 
    name: 'orderBy', 
    required: false, 
    description: 'Field to order by', 
    type: 'string',
    example: 'name'
  })
  @ApiQuery({ 
    name: 'orderDirection', 
    required: false, 
    description: 'Sort direction (asc or desc)', 
    type: 'string',
    example: 'asc'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Account users retrieved successfully with pagination metadata',
    type: AccountUsersSearchResultsDto
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid account ID format'
  })
  async getAccountUsersByAccountId(
    @Param('accountId') accountId: string,
    @Query() searchParams: SearchQueryDto
  ): Promise<AccountUsersSearchResultsDto> {
    this.logger.debug({ accountId, searchParams });
    const results = await this.accountUsersService.getAccountUsersByAccountId(accountId, searchParams);
    return plainToInstance(AccountUsersSearchResultsDto, results, {
      excludeExtraneousValues: true,
    });
  }

  // Permission configuration endpoints
  @Get('permissions/modules')
  @ApiOperation({ 
    summary: 'Get all valid application modules',
    description: 'Retrieves all active application modules that can be assigned to users'
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
    summary: 'Get all valid application roles',
    description: 'Retrieves all active application roles that can be assigned to users'
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
    example: 'deal-desk'
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
    example: 'supervisor'
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
