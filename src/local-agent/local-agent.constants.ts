export const LOCAL_AGENT_QUEUE = 'local-agent-queue';
export const LOCAL_AGENT_TASK_EVENT = 'local-agent-task';
export const LOCAL_AGENT_BUILD_EVENT = 'local-agent-build';

export enum AgentRole {
  PA = 'pa',
  PM = 'pm',
  CMO = 'cmo',
  TWIN = 'twin',
  AUTO = 'auto',
}

export enum MemoryKind {
  EPISODIC = 'episodic',
  SEMANTIC = 'semantic',
  WORKING = 'working',
  PROCEDURAL = 'procedural',
  PREFERENCE = 'preference',
}

export enum AgentTaskStatus {
  PENDING = 'pending',
  QUEUED = 'queued',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum AgentTaskType {
  GENERIC = 'generic',
  BUILD = 'build',
  RESEARCH = 'research',
  MARKETING = 'marketing',
  FOLLOW_UP = 'follow_up',
  MEMORY_CONSOLIDATION = 'memory_consolidation',
}

export const AGENT_ROLE_LABELS: Record<AgentRole, string> = {
  [AgentRole.PA]: 'Personal Assistant',
  [AgentRole.PM]: 'Project Manager',
  [AgentRole.CMO]: 'Chief Marketing Officer',
  [AgentRole.TWIN]: 'Digital Twin',
  [AgentRole.AUTO]: 'Auto Router',
};
