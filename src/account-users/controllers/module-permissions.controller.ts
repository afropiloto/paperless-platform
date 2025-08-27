import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ModulePermissionsService } from '../services/module-permissions.service';
import { CreateOrUpdateModulePermissionsDto, ModulePermissionsDto } from '../dtos/module-permissions.dto';

@ApiTags('Module Permissions')
@Controller('module-permissions')
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


