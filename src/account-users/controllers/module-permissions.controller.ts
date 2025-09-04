import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ModulePermissionsService } from '../services/module-permissions.service';
import { CreateOrUpdateModulePermissionsDto, ModulePermissionsDto } from 'src/account-users/dtos';
import { JwtGuard } from 'src/auth/guards/jwt-guard';
import { ApiKeyGuard } from 'src/api-key-auth/api-key.guard';
import { ClientAccessGroup } from 'src/api-key-auth/types/api-key-auth.types';
import { ClientAccess } from 'src/api-key-auth/decorators/client-access.decorator';

@ApiTags('Module Permissions')
@Controller('module-permissions')
@UseGuards(JwtGuard, ApiKeyGuard)
@ApiBearerAuth()
@ClientAccess(ClientAccessGroup.SHARED)
@ApiHeader({
  name: 'x-api-key',
  description: 'The Client Application API Key',
  example: '47f19331:86382a9cbeaa603325628d29859b10fa6df94385ef792ea340cb1208ab9fdb6e'
})
export class ModulePermissionsController {
  constructor(private readonly service: ModulePermissionsService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create or update a module permissions document' })
  @ApiResponse({ status: 200, description: 'Created/updated', type: ModulePermissionsDto })
  async upsert(@Body() dto: CreateOrUpdateModulePermissionsDto): Promise<ModulePermissionsDto> {
    return this.service.upsert(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all active module permissions' })
  async findAll() {
    return this.service.findAllActiveCached();
  }

  @Get(':module')
  @ApiOperation({ summary: 'Get module permissions by module id' })
  async findByModule(@Param('module') module: string) {
    return this.service.findByModuleCached(module);
  }
}


