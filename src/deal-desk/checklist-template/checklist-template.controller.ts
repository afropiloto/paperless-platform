import { Controller, Logger, Post, Get, Param, Body, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ChecklistTemplateService } from './checklist-template.service';
import { CreateChecklistTemplateDto } from './dto/create-checklist-template.dto';
import { ChecklistTemplateResponseDto } from './dto/checklist-template-response.dto';

@ApiTags('Checklist Templates')
@Controller('checklist')
export class ChecklistTemplateController {
  private readonly logger = new Logger(ChecklistTemplateController.name);
  
  constructor(private readonly checklistTemplateService: ChecklistTemplateService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new checklist template version' })
  @ApiResponse({ 
    status: 201, 
    description: 'The template has been successfully created.',
    type: ChecklistTemplateResponseDto 
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  async createTemplateVersion(
    @Body() createDto: CreateChecklistTemplateDto
  ): Promise<ChecklistTemplateResponseDto> {
    return this.checklistTemplateService.createTemplateVersion(createDto);
  }

  @Get('latest')
  @ApiOperation({ summary: 'Get the latest checklist template version' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns the latest template version.',
    type: ChecklistTemplateResponseDto 
  })
  @ApiResponse({ status: 404, description: 'No template found.' })
  async getLatestTemplateVersion(): Promise<ChecklistTemplateResponseDto> {
    return this.checklistTemplateService.getLatestTemplateVersion();
  }

  @Get('version/:version')
  @ApiOperation({ summary: 'Get a specific checklist template version' })
  @ApiParam({ name: 'version', description: 'Template version number' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns the requested template version.',
    type: ChecklistTemplateResponseDto 
  })
  @ApiResponse({ status: 404, description: 'Template version not found.' })
  async getTemplateByVersion(
    @Param('version', ParseIntPipe) version: number
  ): Promise<ChecklistTemplateResponseDto> {
    return this.checklistTemplateService.getTemplateByVersion(version);
  }
}
