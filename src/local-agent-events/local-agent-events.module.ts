import { Module } from '@nestjs/common';
import { LocalAgentModule } from '../local-agent/local-agent.module';
import { LocalAgentTaskProcessor } from '../local-agent/tasks/agent-task.processor';

/**
 * Worker-side local agent processors (builds, queued tasks, memory consolidation jobs).
 */
@Module({
  imports: [LocalAgentModule],
  providers: [LocalAgentTaskProcessor],
})
export class LocalAgentEventsModule {}
