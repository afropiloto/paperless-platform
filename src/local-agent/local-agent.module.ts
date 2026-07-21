import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bullmq';
import localAgentConfig from './config/local-agent.config';
import { LOCAL_AGENT_QUEUE } from './local-agent.constants';
import { LocalAgentController } from './local-agent.controller';
import { LocalAgentService } from './local-agent.service';
import { VertexAiService } from './gcp/vertex-ai.service';
import { MemoryService } from './memory/memory.service';
import { AgentMemory, AgentMemorySchema } from './memory/schemas/agent-memory.schema';
import { AgentSession, AgentSessionSchema } from './sessions/schemas/agent-session.schema';
import { AgentSessionService } from './sessions/agent-session.service';
import { AgentTask, AgentTaskSchema } from './tasks/schemas/agent-task.schema';
import { AgentTaskService } from './tasks/agent-task.service';
import { RoleRouterService } from './roles/role-router.service';
import { ToolRegistry } from './tools/tool.registry';
import { JwtConfigModule } from '../jwt/jwt-config.module';
import { ApiKeyAuthModule } from '../api-key-auth/api-key-auth.module';

@Module({
  imports: [
    ConfigModule.forFeature(localAgentConfig),
    MongooseModule.forFeature([
      { name: AgentMemory.name, schema: AgentMemorySchema },
      { name: AgentSession.name, schema: AgentSessionSchema },
      { name: AgentTask.name, schema: AgentTaskSchema },
    ]),
    BullModule.registerQueue({ name: LOCAL_AGENT_QUEUE }),
    JwtConfigModule,
    ApiKeyAuthModule,
  ],
  controllers: [LocalAgentController],
  providers: [
    LocalAgentService,
    VertexAiService,
    MemoryService,
    AgentSessionService,
    AgentTaskService,
    RoleRouterService,
    ToolRegistry,
  ],
  exports: [
    LocalAgentService,
    MemoryService,
    AgentTaskService,
    AgentSessionService,
    VertexAiService,
    ToolRegistry,
    RoleRouterService,
    MongooseModule,
    BullModule,
  ],
})
export class LocalAgentModule {}
