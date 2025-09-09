import { Body, Controller, Get, HttpStatus, Logger, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiHeader, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';;

import { CreateChecklistDto } from './dtos/create-checklist.dto';
import { DueDiligenceChecklistsService } from './due-diligence-checklists.service';
import { DueDiligenceChecklistType, ChecklistUpdateOriginator } from './types/due-diligence-checklists.types';
import { ChecklistItemUpdateDto } from './dtos/update-checklist.dto';
import { ChecklistInstanceDto } from './dtos/checklist-instance.dto';
import { ChecklistResponseDto } from './dtos/checklist-response.dto';
import { JwtGuard } from 'src/auth/guards/jwt-guard';
import { ApiKeyGuard } from 'src/api-key-auth/api-key.guard';
import { ClientAccess } from 'src/api-key-auth/decorators/client-access.decorator';
import { ClientAccessGroup } from 'src/api-key-auth/types/api-key-auth.types';


@ApiTags('Due Diligence Checklists')
@Controller('due-diligence-checklists')
@UseGuards(JwtGuard, ApiKeyGuard)
@ApiHeader({
  name: 'x-api-key',
  description: 'The Client Application API Key',
  example: '47f19331:86382a9cbeaa603325628d29859b10fa6df94385ef792ea340cb1208ab9fdb6e'
})
@ClientAccess(ClientAccessGroup.PAIPERLESS_PORTAL)
@ApiBearerAuth()
export class DueDiligenceChecklistsController {
  private readonly logger = new Logger(DueDiligenceChecklistsController.name);

  constructor(
    private readonly checklistService: DueDiligenceChecklistsService,
  ) {}

  @Post(':checklistType')
  @ApiOperation({ summary: 'Create a new due diligence checklist' })
  @ApiParam({
    name: 'checklistType',
    description: 'The type of the checklist to retrieve',
    type: 'string',
    example: "ONBOARDING",
  })
  @ApiBody({ type: CreateChecklistDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The checklist has been successfully created.',
    type: ChecklistResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data.',
  })
  async createChecklist(@Param('checklistType') checklistType: DueDiligenceChecklistType,
    @Body() createDto: CreateChecklistDto,
  ): Promise<ChecklistResponseDto> {
    return this.checklistService.createChecklist(checklistType, createDto);
  }

  @Get(':checklistType/latest')
  @ApiOperation({ summary: 'Get the latest due diligence checklist' })
  @ApiParam({
    name: 'checklistType',
    description: 'The type of the checklist to retrieve',
    type: 'string',
    example: "ONBOARDING",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns the latest checklist.',
    type: ChecklistResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'No checklist found.',
  })
  async getLatestChecklist(@Param('checklistType') checklistType: DueDiligenceChecklistType): Promise<ChecklistResponseDto> {
    return this.checklistService.getLatestChecklist(checklistType);
  }

  @Get(':checklistType/:version')
  @ApiOperation({ summary: 'Get a due diligence checklist by version' })
  @ApiParam({
    name: 'version',
    description: 'Version number of the checklist',
    type: 'number',
    example: 1,
  })
  @ApiParam({
    name: 'checklistType',
    description: 'The type of the checklist to retrieve',
    type: 'string',
    example: "ONBOARDING",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns the checklist for the specified version.',
    type: ChecklistResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Checklist not found for the specified version.',
  })
  async getChecklistByVersion(
    @Param('checklistType') checklistType: DueDiligenceChecklistType,
    @Param('version', ParseIntPipe) version: number,

  ): Promise<ChecklistResponseDto> {
    return this.checklistService.getChecklistByVersion(checklistType, version);
  }

  @Get(':checklistType')
  @ApiOperation({ summary: 'Get all due diligence due-diligence-checklists by type' })
  @ApiParam({
    name: 'checklistType',
    description: 'The type of the checklist to retrieve',
    type: 'string',
    example: "ONBOARDING",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns all due-diligence-checklists of the specified type',
    type: [ChecklistResponseDto],
  })
  async getAllChecklists(@Param('checklistType') checklistType: DueDiligenceChecklistType,): Promise<ChecklistResponseDto[]> {
    return this.checklistService.getAllChecklists(checklistType);
  }


  @Patch(':id/checklist')
  @ApiOperation({ summary: 'Update a due diligence checklist instance ' })
  @ApiParam({
    name: 'id',
    description: 'ID of the checklist to update',
    type: 'string',
  })
  @ApiBody({
    type: [ChecklistItemUpdateDto],
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Checklist items updated successfully',
    type: ChecklistInstanceDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Deal processing record or checklist item not found',
  })
  async updateChecklist(
    @Param('id') id: string,
    @Body() updates: ChecklistItemUpdateDto[],
  ): Promise<ChecklistInstanceDto> {
    return await this.checklistService.updateChecklistInstance(
      id,
      updates,
      ChecklistUpdateOriginator.MANUAL
    );
  }
}
