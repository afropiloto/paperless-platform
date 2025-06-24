import { SetMetadata } from '@nestjs/common';
import { Role } from '../types/auth-roles.types';

export interface ModuleRoleThreshold {
  module: string;
  minRole: keyof typeof Role;
}

export const UserAccess = (...rules: ModuleRoleThreshold[]) =>
  SetMetadata('userPermissions', rules);
