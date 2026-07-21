import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  Max,
  ValidateNested,
} from 'class-validator';
import { AgentRole, AgentTaskStatus, AgentTaskType, MemoryKind } from '../local-agent.constants';

export class ToolCallDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  args?: Record<string, unknown>;
}

export class AgentChatRequestDto {
  @ApiProperty({ example: 'Remember that launches should lead with time-to-trust' })
  @IsString()
  @MaxLength(8000)
  message: string;

  @ApiPropertyOptional({ enum: AgentRole, default: AgentRole.AUTO })
  @IsOptional()
  @IsEnum(AgentRole)
  role?: AgentRole;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sessionId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  accountId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ type: [ToolCallDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ToolCallDto)
  toolCalls?: ToolCallDto[];
}

export class AgentChatResponseDto {
  @ApiProperty()
  @Expose()
  sessionId: string;

  @ApiProperty()
  @Expose()
  role: string;

  @ApiProperty()
  @Expose()
  reply: string;

  @ApiProperty()
  @Expose()
  model: string;

  @ApiProperty()
  @Expose()
  provider: string;

  @ApiProperty()
  @Expose()
  memoriesUsed: number;

  @ApiProperty({ type: Array })
  @Expose()
  toolCalls: Array<{ name: string; result: unknown }>;

  @ApiProperty({ type: [String] })
  @Expose()
  taskIds: string[];
}

export class StoreMemoryRequestDto {
  @ApiProperty({ enum: MemoryKind })
  @IsEnum(MemoryKind)
  kind: MemoryKind;

  @ApiProperty()
  @IsString()
  @MaxLength(12000)
  content: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  importance?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  accountId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sessionId?: string;
}

export class RecallMemoryRequestDto {
  @ApiProperty()
  @IsString()
  query: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  topK?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  accountId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  userId?: string;
}

export class CreateAgentTaskRequestDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: AgentTaskType })
  @IsOptional()
  @IsEnum(AgentTaskType)
  type?: AgentTaskType;

  @ApiPropertyOptional({ enum: AgentRole })
  @IsOptional()
  @IsEnum(AgentRole)
  ownerRole?: AgentRole;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  priority?: number;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  accountId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  userId?: string;
}

export class AgentTaskResponseDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  title: string;

  @ApiProperty({ enum: AgentTaskStatus })
  @Expose()
  status: AgentTaskStatus;

  @ApiProperty({ enum: AgentTaskType })
  @Expose()
  type: AgentTaskType;

  @ApiProperty()
  @Expose()
  priority: number;
}

export class MemoryItemDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty({ enum: MemoryKind })
  @Expose()
  kind: MemoryKind;

  @ApiProperty()
  @Expose()
  content: string;

  @ApiPropertyOptional()
  @Expose()
  score?: number;
}
