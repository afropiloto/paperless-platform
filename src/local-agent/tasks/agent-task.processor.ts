import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job } from 'bullmq';
import { execFile } from 'child_process';
import { promisify } from 'util';
import {
  AgentTaskStatus,
  LOCAL_AGENT_BUILD_EVENT,
  LOCAL_AGENT_QUEUE,
  LOCAL_AGENT_TASK_EVENT,
  MemoryKind,
} from '../local-agent.constants';
import { AgentTaskService } from './agent-task.service';
import { MemoryService } from '../memory/memory.service';
import type { LocalAgentConfig } from '../config/local-agent.config';
import { entityId } from '../local-agent.utils';

const execFileAsync = promisify(execFile);

@Processor(LOCAL_AGENT_QUEUE)
export class LocalAgentTaskProcessor extends WorkerHost {
  private readonly logger = new Logger(LocalAgentTaskProcessor.name);

  constructor(
    private readonly taskService: AgentTaskService,
    private readonly memoryService: MemoryService,
    private readonly configService: ConfigService,
  ) {
    super();
  }

  private get config(): LocalAgentConfig {
    return this.configService.get<LocalAgentConfig>('localAgent')!;
  }

  async process(job: Job<{ taskId: string }>) {
    switch (job.name) {
      case LOCAL_AGENT_BUILD_EVENT:
        return this.processBuild(job);
      case LOCAL_AGENT_TASK_EVENT:
        return this.processGenericTask(job);
      default:
        this.logger.warn(`Unknown local-agent job: ${job.name}`);
        return;
    }
  }

  private async processGenericTask(job: Job<{ taskId: string }>) {
    const task = await this.taskService.getById(job.data.taskId);
    const taskId = entityId(task);
    await this.taskService.updateStatus(taskId, AgentTaskStatus.RUNNING);

    const summary = `Completed agent task "${task.title}" (${task.type}).`;
    await this.taskService.updateStatus(taskId, AgentTaskStatus.COMPLETED, {
      result: {
        summary,
        processedAt: new Date().toISOString(),
      },
    });

    await this.memoryService.store({
      kind: MemoryKind.EPISODIC,
      content: summary,
      accountId: task.accountId,
      userId: task.userId,
      sessionId: task.sessionId,
      role: task.ownerRole,
      tags: ['task', task.type],
      importance: 0.45,
    });

    return { taskId, status: AgentTaskStatus.COMPLETED };
  }

  private async processBuild(job: Job<{ taskId: string }>) {
    const task = await this.taskService.getById(job.data.taskId);
    const taskId = entityId(task);
    await this.taskService.updateStatus(taskId, AgentTaskStatus.RUNNING);

    const script = String(task.payload?.script || 'build');
    const allowed = ['build', 'build:strict', 'lint', 'test'];
    if (!allowed.includes(script)) {
      await this.taskService.updateStatus(taskId, AgentTaskStatus.FAILED, {
        error: `Script not allowed: ${script}`,
      });
      return;
    }

    if (!this.config.allowLocalBuilds) {
      await this.taskService.updateStatus(taskId, AgentTaskStatus.COMPLETED, {
        result: {
          mode: 'dry-run',
          script,
          message:
            'Build not executed. Set LOCAL_AGENT_ALLOW_BUILDS=true to run pnpm scripts from the worker.',
        },
      });
      return { dryRun: true, script };
    }

    try {
      const { stdout, stderr } = await execFileAsync('pnpm', ['run', script], {
        cwd: process.cwd(),
        timeout: 15 * 60 * 1000,
        maxBuffer: 8 * 1024 * 1024,
      });

      await this.taskService.updateStatus(taskId, AgentTaskStatus.COMPLETED, {
        result: {
          mode: 'executed',
          script,
          stdout: stdout.slice(-6000),
          stderr: stderr.slice(-3000),
        },
      });

      await this.memoryService.store({
        kind: MemoryKind.PROCEDURAL,
        content: `Build script pnpm run ${script} completed successfully.`,
        accountId: task.accountId,
        userId: task.userId,
        tags: ['build', script],
        importance: 0.6,
      });

      return { taskId, script, ok: true };
    } catch (error) {
      const err = error as Error & { stdout?: string; stderr?: string };
      await this.taskService.updateStatus(taskId, AgentTaskStatus.FAILED, {
        error: err.message,
        result: {
          stdout: err.stdout?.slice(-4000),
          stderr: err.stderr?.slice(-4000),
        },
      });
      throw error;
    }
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(
      `Local agent job failed id=${job?.id} name=${job?.name}: ${error.message}`,
    );
  }
}
