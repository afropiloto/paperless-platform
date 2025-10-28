import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Logger,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody, ApiHeader,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserManagementService } from '../services/user-management.service';
import { 
  CreateUserDto, 
  InviteUserDto, 
  BulkCreateUsersDto, 
  UserStatusDto, 
  UserSearchDto,
  UserResponseDto,
  BulkCreateResponseDto 
} from '../dtos/user-management.dto';
import { JwtGuard } from '../guards/jwt-guard';
import { ApiKeyGuard } from 'src/api-key-auth/api-key.guard';
import { ClientAccess } from 'src/api-key-auth/decorators/client-access.decorator';
import { ClientAccessGroup } from 'src/api-key-auth/types/api-key-auth.types';

@ApiTags('User Management')
@Controller('auth/users')
@UseGuards(JwtGuard, ApiKeyGuard)
@ApiHeader({
  name: 'x-api-key',
  description: 'The Client Application API Key',
  example: '47f19331:86382a9cbeaa603325628d29859b10fa6df94385ef792ea340cb1208ab9fdb6e'
})
@ClientAccess(ClientAccessGroup.SHARED)
@ApiBearerAuth()
export class UserManagementController {
  private readonly logger = new Logger(UserManagementController.name);

  constructor(private readonly userManagementService: UserManagementService) {}

  @Post()
  @ApiOperation({ 
    summary: 'Create a new user',
    description: 'Creates a new user with optional MFA setup and email invitation. Only authenticated users can create new users. The system will generate a temporary password if not provided and send an invitation email if requested.'
  })
  @ApiBody({ 
    type: CreateUserDto,
    description: 'User creation data including inviter information',
    examples: {
      'email-password-user': {
        summary: 'Create email/password user with MFA',
        value: {
          accountId: '507f1f77bcf86cd799439011',
          name: 'John Doe',
          emailAddress: 'john.doe@example.com',
          walletAddress: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
          permissions: [
            { module: 'DealDesk', role: 'Supervisor' },
            { module: 'Paperless', role: 'Agent' }
          ],
          authMethod: 'email-password',
          enableMfa: true,
          sendInvitation: true,
          inviterId: '507f1f77bcf86cd799439012',
          inviterName: 'Admin User'
        }
      },
      'siwe-user': {
        summary: 'Create SIWE user without MFA',
        value: {
          accountId: '507f1f77bcf86cd799439011',
          name: 'Jane Smith',
          emailAddress: 'jane.smith@example.com',
          walletAddress: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
          permissions: [
            { module: 'DealDesk', role: 'Agent' }
          ],
          authMethod: 'siwe',
          enableMfa: false,
          sendInvitation: false,
          inviterId: '507f1f77bcf86cd799439012',
          inviterName: 'Admin User'
        }
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'User successfully created',
    type: UserResponseDto
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data or account ID format'
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'User not authenticated'
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Email address already exists'
  })
  async createUser(
    @Body() createUserDto: CreateUserDto & { inviterId: string; inviterName: string },
  ): Promise<UserResponseDto> {
    this.logger.log(`Creating user ${createUserDto.emailAddress} by ${createUserDto.inviterName}`);
    
    const response = await this.userManagementService.createUser(
      createUserDto,
      createUserDto.inviterId,
      createUserDto.inviterName,
    );
    return response as UserResponseDto;
  }

  @Post('bulk')
  @ApiOperation({ 
    summary: 'Bulk create users',
    description: 'Creates multiple users in a single operation. Returns detailed results for each user creation attempt, including success/failure counts and error details.'
  })
  @ApiBody({ 
    type: BulkCreateUsersDto,
    description: 'Bulk user creation data with inviter information',
    examples: {
      'bulk-email-users': {
        summary: 'Bulk create email/password users',
        value: {
          accountId: '507f1f77bcf86cd799439011',
          users: [
            {
              name: 'John Doe',
              emailAddress: 'john.doe@example.com',
              walletAddress: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
              permissions: [{ module: 'DealDesk', role: 'Supervisor' }],
              authMethod: 'email-password',
              enableMfa: true,
              sendInvitation: true
            },
            {
              name: 'Jane Smith',
              emailAddress: 'jane.smith@example.com',
              walletAddress: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b7',
              permissions: [{ module: 'Paperless', role: 'Agent' }],
              authMethod: 'email-password',
              enableMfa: false,
              sendInvitation: true
            }
          ],
          sendInvitations: true,
          inviterId: '507f1f77bcf86cd799439012',
          inviterName: 'Admin User'
        }
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Bulk user creation completed',
    type: BulkCreateResponseDto
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data or account ID format'
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'User not authenticated'
  })
  async bulkCreateUsers(
    @Body() bulkCreateDto: BulkCreateUsersDto & { inviterId: string; inviterName: string },
  ): Promise<BulkCreateResponseDto> {
    this.logger.log(`Bulk creating ${bulkCreateDto.users.length} users by ${bulkCreateDto.inviterName}`);
    
    return await this.userManagementService.bulkCreateUsers(
      bulkCreateDto,
      bulkCreateDto.inviterId,
      bulkCreateDto.inviterName,
    );
  }

  @Post('invite')
  @ApiOperation({ 
    summary: 'Send invitation to existing user',
    description: 'Sends an invitation email to an existing user with a new temporary password. This is useful for re-inviting users who have not completed their account setup.'
  })
  @ApiBody({ 
    type: InviteUserDto,
    description: 'User invitation data with inviter information',
    examples: {
      'basic-invitation': {
        summary: 'Send basic invitation',
        value: {
          userId: '507f1f77bcf86cd799439011',
          inviterId: '507f1f77bcf86cd799439012',
          inviterName: 'Admin User'
        }
      },
      'custom-message': {
        summary: 'Send invitation with custom message',
        value: {
          userId: '507f1f77bcf86cd799439011',
          message: 'Welcome to our platform! Please complete your account setup.',
          inviterId: '507f1f77bcf86cd799439012',
          inviterName: 'Admin User'
        }
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Invitation sent successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Invitation sent successfully' }
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found'
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'User not authenticated'
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid user ID format'
  })
  async inviteUser(
    @Body() inviteDto: InviteUserDto & { inviterId: string; inviterName: string },
  ): Promise<{ success: boolean; message: string }> {
    this.logger.log(`Inviting user ${inviteDto.userId} by ${inviteDto.inviterName}`);
    
    return await this.userManagementService.inviteUser(
      inviteDto,
      inviteDto.inviterId,
      inviteDto.inviterName,
    );
  }

  @Put('status')
  @ApiOperation({ 
    summary: 'Update user status',
    description: 'Updates the status of a user (active, inactive, locked). This operation is logged for audit purposes.'
  })
  @ApiBody({ 
    type: UserStatusDto,
    description: 'User status update data with updater information',
    examples: {
      'activate-user': {
        summary: 'Activate a user',
        value: {
          userId: '507f1f77bcf86cd799439011',
          status: 'active',
          reason: 'User account approved',
          updaterId: '507f1f77bcf86cd799439012',
          updaterName: 'Admin User'
        }
      },
      'lock-user': {
        summary: 'Lock a user account',
        value: {
          userId: '507f1f77bcf86cd799439011',
          status: 'locked',
          reason: 'Security concerns - multiple failed login attempts',
          updaterId: '507f1f77bcf86cd799439012',
          updaterName: 'Admin User'
        }
      },
      'deactivate-user': {
        summary: 'Deactivate a user',
        value: {
          userId: '507f1f77bcf86cd799439011',
          status: 'inactive',
          reason: 'User left the organization',
          updaterId: '507f1f77bcf86cd799439012',
          updaterName: 'Admin User'
        }
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User status updated successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'User status updated successfully' }
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found'
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'User not authenticated'
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid user ID format or status value'
  })
  async updateUserStatus(
    @Body() statusDto: UserStatusDto & { updaterId: string; updaterName: string },
  ): Promise<{ success: boolean; message: string }> {
    this.logger.log(`Updating status for user ${statusDto.userId} by ${statusDto.updaterName}`);
    
    return await this.userManagementService.updateUserStatus(
      statusDto,
      statusDto.updaterId,
      statusDto.updaterName,
    );
  }

  @Get('search')
  @ApiOperation({ 
    summary: 'Search users',
    description: 'Search for users within an account with optional filters. Supports pagination and multiple search criteria.'
  })
  @ApiQuery({ 
    name: 'accountId', 
    description: 'Account ID to search within', 
    type: String,
    example: '507f1f77bcf86cd799439011',
    required: true
  })
  @ApiQuery({ 
    name: 'name', 
    description: 'Search by user name (partial match)', 
    required: false, 
    type: String,
    example: 'John'
  })
  @ApiQuery({ 
    name: 'email', 
    description: 'Search by email address (partial match)', 
    required: false, 
    type: String,
    example: 'john@example.com'
  })
  @ApiQuery({ 
    name: 'authMethod', 
    description: 'Filter by authentication method', 
    required: false, 
    enum: ['siwe', 'email-password'],
    example: 'email-password'
  })
  @ApiQuery({ 
    name: 'mfaEnabled', 
    description: 'Filter by MFA status', 
    required: false, 
    type: Boolean,
    example: true
  })
  @ApiQuery({ 
    name: 'status', 
    description: 'Filter by user status', 
    required: false, 
    enum: ['active', 'inactive', 'locked'],
    example: 'active'
  })
  @ApiQuery({ 
    name: 'page', 
    description: 'Page number (starts from 1)', 
    required: false, 
    type: Number,
    example: 1
  })
  @ApiQuery({ 
    name: 'limit', 
    description: 'Items per page (max 100)', 
    required: false, 
    type: Number,
    example: 10
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Users retrieved successfully',
    type: [UserResponseDto]
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid search parameters'
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'User not authenticated'
  })
  async searchUsers(
    @Query('accountId') accountId: string,
    @Query() searchDto: UserSearchDto,
  ): Promise<UserResponseDto[]> {
    this.logger.log(`Searching users in account ${accountId}`);
    
    return await this.userManagementService.searchUsers(accountId, searchDto);
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'Get user by ID',
    description: 'Retrieves a specific user by their ID. Returns complete user information including permissions, MFA status, and account details.'
  })
  @ApiParam({
    name: 'id',
    description: 'User ID (MongoDB ObjectId)',
    type: 'string',
    example: '507f1f77bcf86cd799439011'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User retrieved successfully',
    type: UserResponseDto
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found'
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'User not authenticated'
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid user ID format'
  })
  async getUserById(@Param('id') id: string): Promise<UserResponseDto> {
    this.logger.log(`Getting user by ID: ${id}`);
    
    return await this.userManagementService.getUserById(id);
  }
} 