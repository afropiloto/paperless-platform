import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { APPLICATION_PERMISSIONS_CONFIG } from '../config/application-permissions.config';
import { UserPermission } from '../types/application-permissions.types';

@Injectable()
export class PermissionsValidationService {
  private readonly logger = new Logger(PermissionsValidationService.name);

  /**
   * Validates a single permission combination
   */
  validatePermission(permission: UserPermission): void {
    const { moduleId, roleId } = permission;

    // Check if module exists and is active
    const module = APPLICATION_PERMISSIONS_CONFIG.modules.find(m => m.id === moduleId);
    if (!module) {
      throw new BadRequestException(`Invalid module: ${moduleId}`);
    }
    if (!module.active) {
      throw new BadRequestException(`Module ${module.name} is not active`);
    }

    // Check if role exists and is active
    const role = APPLICATION_PERMISSIONS_CONFIG.roles.find(r => r.id === roleId);
    if (!role) {
      throw new BadRequestException(`Invalid role: ${roleId}`);
    }
    if (!role.active) {
      throw new BadRequestException(`Role ${role.name} is not active`);
    }

    // Check if the combination is valid and active
    const combination = APPLICATION_PERMISSIONS_CONFIG.validCombinations.find(
      c => c.moduleId === moduleId && c.roleId === roleId
    );
    if (!combination) {
      throw new BadRequestException(
        `Invalid permission combination: ${module.name} + ${role.name}. ` +
        `This combination is not allowed.`
      );
    }
    if (!combination.active) {
      throw new BadRequestException(
        `Permission combination ${module.name} + ${role.name} is not active`
      );
    }
  }

  /**
   * Validates an array of permissions
   */
  validatePermissions(permissions: UserPermission[]): void {
    if (!Array.isArray(permissions)) {
      throw new BadRequestException('Permissions must be an array');
    }

    // Check for duplicate permissions
    const permissionKeys = permissions.map(p => `${p.moduleId}:${p.roleId}`);
    const uniqueKeys = new Set(permissionKeys);
    if (uniqueKeys.size !== permissions.length) {
      throw new BadRequestException('Duplicate permissions are not allowed');
    }

    // Validate each permission
    permissions.forEach(permission => {
      this.validatePermission(permission);
    });
  }

  /**
   * Gets all valid modules
   */
  getValidModules() {
    return APPLICATION_PERMISSIONS_CONFIG.modules.filter(m => m.active);
  }

  /**
   * Gets all valid roles
   */
  getValidRoles() {
    return APPLICATION_PERMISSIONS_CONFIG.roles.filter(r => r.active);
  }

  /**
   * Gets all valid permission combinations
   */
  getValidCombinations() {
    return APPLICATION_PERMISSIONS_CONFIG.validCombinations.filter(c => c.active);
  }

  /**
   * Gets valid roles for a specific module
   */
  getValidRolesForModule(moduleId: string): string[] {
    const validCombinations = this.getValidCombinations();
    return validCombinations
      .filter(c => c.moduleId === moduleId)
      .map(c => c.roleId);
  }

  /**
   * Gets valid modules for a specific role
   */
  getValidModulesForRole(roleId: string): string[] {
    const validCombinations = this.getValidCombinations();
    return validCombinations
      .filter(c => c.roleId === roleId)
      .map(c => c.moduleId);
  }

  /**
   * Converts legacy enum values to new format for backward compatibility
   */
  convertLegacyPermission(module: string, role: string): UserPermission {
    const moduleMap: Record<string, string> = {
      'DealDesk': 'deal-desk',
      'Paiperless': 'paiperless',
      'OnboardingDesk': 'onboarding-desk',
      'PortalAdmin': 'portal-admin'
    };

    const roleMap: Record<string, string> = {
      'Agent': 'agent',
      'Supervisor': 'supervisor',
      'Manager': 'manager'
    };

    const moduleId = moduleMap[module];
    const roleId = roleMap[role];

    if (!moduleId || !roleId) {
      throw new BadRequestException(`Invalid legacy permission: ${module} + ${role}`);
    }

    return { moduleId, roleId };
  }

  /**
   * Converts new format to legacy format for backward compatibility
   */
  convertToLegacyFormat(permission: UserPermission): { module: string; role: string } {
    const module = APPLICATION_PERMISSIONS_CONFIG.modules.find(m => m.id === permission.moduleId);
    const role = APPLICATION_PERMISSIONS_CONFIG.roles.find(r => r.id === permission.roleId);

    if (!module || !role) {
      throw new BadRequestException(`Invalid permission: ${permission.moduleId} + ${permission.roleId}`);
    }

    return { module: module.name, role: role.name };
  }
} 