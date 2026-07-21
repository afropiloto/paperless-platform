import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { JwtGuard } from 'src/auth/guards/jwt-guard';
import { ApiKeyGuard } from 'src/api-key-auth/api-key.guard';
import { ClientAccess } from 'src/api-key-auth/decorators/client-access.decorator';
import { ClientAccessGroup } from 'src/api-key-auth/types/api-key-auth.types';
import { LocalAgentService } from './local-agent.service';
import { MemoryService } from './memory/memory.service';
import { AgentTaskService } from './tasks/agent-task.service';
import {
  AgentChatRequestDto,
  AgentChatResponseDto,
  AgentTaskResponseDto,
  CreateAgentTaskRequestDto,
  MemoryItemDto,
  RecallMemoryRequestDto,
  StoreMemoryRequestDto,
} from './dto/local-agent.dto';
import { AgentTaskStatus } from './local-agent.constants';
import { entityId } from './local-agent.utils';

@ApiTags('Local Agent')
@Controller('local-agent')
@UseGuards(JwtGuard, ApiKeyGuard)
@ApiHeader({
  name: 'x-api-key',
  description: 'The Client Application API Key',
})
@ClientAccess(ClientAccessGroup.SHARED)
@ApiBearerAuth()
export class LocalAgentController {
  constructor(
    private readonly localAgentService: LocalAgentService,
    private readonly memoryService: MemoryService,
    private readonly taskService: AgentTaskService,
  ) {}

  @Get('status')
  @ApiOperation({ summary: 'Local agent + GCP provider status and role map' })
  @ApiResponse({ status: 200, description: 'Agent status' })
  getStatus() {
    return this.localAgentService.getStatus();
  }

  @Post('chat')
  @ApiOperation({
    summary: 'Chat with PA / PM / CMO / Twin (auto-routed or explicit role)',
  })
  @ApiResponse({ status: 201, type: AgentChatResponseDto })
  async chat(@Body() body: AgentChatRequestDto): Promise<AgentChatResponseDto> {
    const result = await this.localAgentService.chat(body);
    return plainToInstance(AgentChatResponseDto, result);
  }

  @Post('memory')
  @ApiOperation({ summary: 'Store a memory entry' })
  @ApiResponse({ status: 201, type: MemoryItemDto })
  async storeMemory(@Body() body: StoreMemoryRequestDto): Promise<MemoryItemDto> {
    const memory = await this.memoryService.store(body);
    return plainToInstance(MemoryItemDto, {
      id: entityId(memory),
      kind: memory.kind,
      content: memory.content,
    });
  }

  @Post('memory/recall')
  @ApiOperation({ summary: 'Semantic + lexical memory recall' })
  @ApiResponse({ status: 201, type: [MemoryItemDto] })
  async recall(@Body() body: RecallMemoryRequestDto): Promise<MemoryItemDto[]> {
    const results = await this.memoryService.recall(body);
    return results.map((r) =>
      plainToInstance(MemoryItemDto, {
        id: entityId(r.memory),
        kind: r.memory.kind,
        content: r.memory.content,
        score: r.score,
      }),
    );
  }

  @Post('tasks')
  @ApiOperation({ summary: 'Create and enqueue an agent task / build' })
  @ApiResponse({ status: 201, type: AgentTaskResponseDto })
  async createTask(
    @Body() body: CreateAgentTaskRequestDto,
  ): Promise<AgentTaskResponseDto> {
    const task = await this.taskService.create(body);
    return plainToInstance(AgentTaskResponseDto, {
      id: entityId(task),
      title: task.title,
      status: task.status,
      type: task.type,
      priority: task.priority,
    });
  }

  @Get('tasks')
  @ApiOperation({ summary: 'List agent tasks' })
  @ApiResponse({ status: 200, type: [AgentTaskResponseDto] })
  async listTasks(
    @Query('accountId') accountId?: string,
    @Query('userId') userId?: string,
    @Query('status') status?: AgentTaskStatus,
  ): Promise<AgentTaskResponseDto[]> {
    const tasks = await this.taskService.list({ accountId, userId, status });
    return tasks.map((task) =>
      plainToInstance(AgentTaskResponseDto, {
        id: entityId(task),
        title: task.title,
        status: task.status,
        type: task.type,
        priority: task.priority,
      }),
    );
  }
}
