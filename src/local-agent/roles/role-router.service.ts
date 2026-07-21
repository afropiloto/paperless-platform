import { Injectable } from '@nestjs/common';
import { AgentRole } from '../local-agent.constants';
import { ROLE_PERSONAS, RolePersona, scoreRoleForMessage } from './role.definitions';

@Injectable()
export class RoleRouterService {
  resolve(role: AgentRole | string | undefined, message: string): RolePersona {
    const requested = (role || AgentRole.AUTO) as AgentRole;

    if (requested !== AgentRole.AUTO && ROLE_PERSONAS[requested as Exclude<AgentRole, AgentRole.AUTO>]) {
      return ROLE_PERSONAS[requested as Exclude<AgentRole, AgentRole.AUTO>];
    }

    const scored = scoreRoleForMessage(message);
    return ROLE_PERSONAS[scored];
  }

  listRoles(): RolePersona[] {
    return Object.values(ROLE_PERSONAS);
  }
}
