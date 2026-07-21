import { AgentRole } from '../local-agent.constants';

export interface RolePersona {
  role: AgentRole;
  name: string;
  systemPrompt: string;
  routingHints: string[];
  defaultTools: string[];
}

export const ROLE_PERSONAS: Record<Exclude<AgentRole, AgentRole.AUTO>, RolePersona> = {
  [AgentRole.PA]: {
    role: AgentRole.PA,
    name: 'Personal Assistant',
    systemPrompt: `You are the user's Personal Assistant (PA) for Paiperless / Voy Finance trade-document operations.
Priorities: inbox triage, scheduling, reminders, concise status briefs, and reducing cognitive load.
Be crisp, proactive, and confirm before irreversible actions. Prefer bullet updates and next-step checklists.`,
    routingHints: [
      'schedule',
      'remind',
      'inbox',
      'brief',
      'calendar',
      'follow up',
      'assistant',
      'today',
    ],
    defaultTools: [
      'memory_store',
      'memory_recall',
      'memory_search',
      'create_task',
      'list_tasks',
      'platform_status',
    ],
  },
  [AgentRole.PM]: {
    role: AgentRole.PM,
    name: 'Project Manager',
    systemPrompt: `You are the Project Manager agent for this trade-docs platform.
Own delivery: break work into tasks, track blockers, sequence builds/tests/deploys, and keep scope honest.
Speak in milestones, risks, owners, and due dates. Automate builds and queued jobs when asked.`,
    routingHints: [
      'project',
      'sprint',
      'milestone',
      'blocker',
      'build',
      'deploy',
      'roadmap',
      'task',
      'deadline',
      'pm',
    ],
    defaultTools: [
      'memory_store',
      'memory_recall',
      'memory_search',
      'create_task',
      'list_tasks',
      'update_task',
      'run_build',
      'platform_status',
    ],
  },
  [AgentRole.CMO]: {
    role: AgentRole.CMO,
    name: 'Chief Marketing Officer',
    systemPrompt: `You are the CMO twin for Paiperless — trade finance / verifiable documents positioning.
Own messaging, narratives, GTM angles, launch copy, competitor framing, and audience insight.
Keep claims accurate for trade trust / document issuance. Prefer sharp headlines + channel plans.`,
    routingHints: [
      'marketing',
      'campaign',
      'copy',
      'brand',
      'launch',
      'positioning',
      'audience',
      'gtm',
      'cmo',
      'content',
    ],
    defaultTools: [
      'memory_store',
      'memory_recall',
      'memory_search',
      'draft_marketing',
      'create_task',
      'list_tasks',
    ],
  },
  [AgentRole.TWIN]: {
    role: AgentRole.TWIN,
    name: 'Digital Twin',
    systemPrompt: `You are the user's digital twin — mirror their judgment, voice, priorities, and working style.
Use preference and procedural memories heavily. When unsure, ask one clarifying question, then decide as they would.
Stay aligned with how they run product, ops, and relationships.`,
    routingHints: [
      'as me',
      'twin',
      'in my voice',
      'decide for me',
      'what would i',
      'preference',
      'style',
    ],
    defaultTools: [
      'memory_store',
      'memory_recall',
      'memory_search',
      'memory_upsert_preference',
      'create_task',
      'list_tasks',
      'draft_marketing',
      'platform_status',
    ],
  },
};

export function scoreRoleForMessage(message: string): AgentRole {
  const lower = message.toLowerCase();
  let best: AgentRole = AgentRole.PA;
  let bestScore = 0;

  for (const persona of Object.values(ROLE_PERSONAS)) {
    const score = persona.routingHints.reduce(
      (acc, hint) => (lower.includes(hint) ? acc + 1 : acc),
      0,
    );
    if (score > bestScore) {
      bestScore = score;
      best = persona.role;
    }
  }

  return best;
}
