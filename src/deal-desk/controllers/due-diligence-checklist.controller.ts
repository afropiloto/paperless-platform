import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { DueDiligenceChecklistService } from '../services/due-diligence-checklist.service';
import { CreateChecklistDto } from '../dto/create-checklist.dto';
import { ChecklistResponseDto } from '../dto/checklist-response.dto';

@ApiTags('Due Diligence Checklists')
@Controller('due-diligence-checklists')
export class DueDiligenceChecklistController {
  constructor(
    private readonly checklistService: DueDiligenceChecklistService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new due diligence checklist' })
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
  async createChecklist(
    @Body() createDto: CreateChecklistDto,
  ): Promise<ChecklistResponseDto> {
    return this.checklistService.createChecklist(createDto);
  }

  @Get('latest')
  @ApiOperation({ summary: 'Get the latest due diligence checklist' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns the latest checklist.',
    type: ChecklistResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'No checklist found.',
  })
  async getLatestChecklist(): Promise<ChecklistResponseDto> {
    return this.checklistService.getLatestChecklist();
  }

  @Get(':version')
  @ApiOperation({ summary: 'Get a due diligence checklist by version' })
  @ApiParam({
    name: 'version',
    description: 'Version number of the checklist',
    type: 'number',
    example: 1,
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
    @Param('version', ParseIntPipe) version: number,
  ): Promise<ChecklistResponseDto> {
    return this.checklistService.getChecklistByVersion(version);
  }

  @Get()
  @ApiOperation({ summary: 'Get all due diligence checklists' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns all checklists.',
    type: [ChecklistResponseDto],
  })
  async getAllChecklists(): Promise<ChecklistResponseDto[]> {
    return this.checklistService.getAllChecklists();
  }
} 