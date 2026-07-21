import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InjectQueue } from '@nestjs/bullmq';
import { Model } from 'mongoose';
import { Queue } from 'bullmq';
import { AgentTask } from './schemas/agent-task.schema';
import {
  AgentRole,
  AgentTaskStatus,
  AgentTaskType,
  LOCAL_AGENT_QUEUE,
  LOCAL_AGENT_TASK_EVENT,
  LOCAL_AGENT_BUILD_EVENT,
} from '../local-agent.constants';
import { entityId } from '../local-agent.utils';

export interface CreateTaskInput {
  title: string;
  description?: string;
  type?: AgentTaskType;
  ownerRole?: AgentRole;
  accountId?: string;
  userId?: string;
  sessionId?: string;
  priority?: number;
  payload?: Record<string, unknown>;
  dueAt?: Date;
  enqueue?: boolean;
}

@Injectable()
export class AgentTaskService {
  private readonly logger = new Logger(AgentTaskService.name);

  constructor(
    @InjectModel(AgentTask.name)
    private readonly taskModel: Model<AgentTask>,
    @InjectQueue(LOCAL_AGENT_QUEUE)
    private readonly agentQueue: Queue,
  ) {}

  async create(input: CreateTaskInput): Promise<AgentTask> {
    const task = await this.taskModel.create({
      title: input.title,
      description: input.description,
      type: input.type || AgentTaskType.GENERIC,
      ownerRole: input.ownerRole || AgentRole.PM,
      accountId: input.accountId,
      userId: input.userId,
      sessionId: input.sessionId,
      priority: input.priority ?? 3,
      payload: input.payload || {},
      status: input.enqueue === false ? AgentTaskStatus.PENDING : AgentTaskStatus.QUEUED,
    });

    if (input.enqueue !== false) {
      const event =
        task.type === AgentTaskType.BUILD
          ? LOCAL_AGENT_BUILD_EVENT
          : LOCAL_AGENT_TASK_EVENT;
      const id = entityId(task);
      await this.agentQueue.add(
        event,
        { taskId: id },
        {
          jobId: `agent-task-${id}`,
          priority: 6 - (task.priority || 3),
        },
      );
      this.logger.log(`Queued agent task ${id} (${event})`);
    }

    return task;
  }

  async list(filters: {
    accountId?: string;
    userId?: string;
    status?: AgentTaskStatus;
    limit?: number;
  }): Promise<AgentTask[]> {
    const query: Record<string, unknown> = {};
    if (filters.accountId) query.accountId = filters.accountId;
    if (filters.userId) query.userId = filters.userId;
    if (filters.status) query.status = filters.status;

    return this.taskModel
      .find(query)
      .sort({ priority: -1, createdAt: -1 })
      .limit(filters.limit ?? 50)
      .exec();
  }

  async getById(taskId: string): Promise<AgentTask> {
    const task = await this.taskModel.findById(taskId).exec();
    if (!task) throw new NotFoundException(`Agent task ${taskId} not found`);
    return task;
  }

  async updateStatus(
    taskId: string,
    status: AgentTaskStatus,
    patch: { result?: Record<string, unknown>; error?: string } = {},
  ): Promise<AgentTask> {
    const update: Record<string, unknown> = { status };
    if (status === AgentTaskStatus.RUNNING) update.startedAt = new Date();
    if (
      status === AgentTaskStatus.COMPLETED ||
      status === AgentTaskStatus.FAILED ||
      status === AgentTaskStatus.CANCELLED
    ) {
      update.completedAt = new Date();
    }
    if (patch.result) update.result = patch.result;
    if (patch.error !== undefined) update.error = patch.error;

    const task = await this.taskModel
      .findByIdAndUpdate(taskId, { $set: update }, { new: true })
      .exec();
    if (!task) throw new NotFoundException(`Agent task ${taskId} not found`);
    return task;
  }
}
