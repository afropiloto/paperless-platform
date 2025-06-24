import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ApplicationModule, ApplicationRole } from '../schemas/application-permissions.schema';
import { UserPermission } from '../types/application-permissions.types';

@Injectable()
export class PermissionsValidationService {
  private readonly logger = new Logger(PermissionsValidationService.name);

  /**
   * Validates a single permission combination
   */
  validatePermission(permission: UserPermission): void {
    const { module, role } = permission;

    // Check if module is valid
    if (!Object.values(ApplicationModule).includes(module as ApplicationModule)) {
      throw new BadRequestException(`Invalid module: ${module}`);
    }

    // Check if role is valid
    if (!Object.values(ApplicationRole).includes(role as ApplicationRole)) {
      throw new BadRequestException(`Invalid role: ${role}`);
    }

    // Check if the combination is valid
    const validCombinations = this.getValidCombinations();
    const isValidCombination = validCombinations.some(
      c => c.module === module && c.role === role
    );
    
    if (!isValidCombination) {
      throw new BadRequestException(
        `Invalid permission combination: ${module} + ${role}. ` +
        `This combination is not allowed.`
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
    const permissionKeys = permissions.map(p => `${p.module}:${p.role}`);
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
    return Object.values(ApplicationModule).map(module => ({
      id: module,
      name: module,
      description: `${module} module`,
      active: true
    }));
  }

  /**
   * Gets all valid roles
   */
  getValidRoles() {
    return Object.values(ApplicationRole).map(role => ({
      id: role,
      name: role,
      description: `${role} role`,
      active: true
    }));
  }

  /**
   * Gets all valid permission combinations
   */
  getValidCombinations() {
    const combinations = [];
    
    // DealDesk combinations
    combinations.push({ module: ApplicationModule.DEAL_DESK, role: ApplicationRole.AGENT });
    combinations.push({ module: ApplicationModule.DEAL_DESK, role: ApplicationRole.SUPERVISOR });
    combinations.push({ module: ApplicationModule.DEAL_DESK, role: ApplicationRole.MANAGER });
    
    // Paiperless combinations
    combinations.push({ module: ApplicationModule.PAIPERLESS, role: ApplicationRole.AGENT });
    combinations.push({ module: ApplicationModule.PAIPERLESS, role: ApplicationRole.SUPERVISOR });
    combinations.push({ module: ApplicationModule.PAIPERLESS, role: ApplicationRole.MANAGER });
    
    // OnboardingDesk combinations
    combinations.push({ module: ApplicationModule.ONBOARDING_DESK, role: ApplicationRole.AGENT });
    combinations.push({ module: ApplicationModule.ONBOARDING_DESK, role: ApplicationRole.SUPERVISOR });
    combinations.push({ module: ApplicationModule.ONBOARDING_DESK, role: ApplicationRole.MANAGER });
    
    // PortalAdmin combinations (more restricted)
    combinations.push({ module: ApplicationModule.PORTAL_ADMIN, role: ApplicationRole.SUPERVISOR });
    combinations.push({ module: ApplicationModule.PORTAL_ADMIN, role: ApplicationRole.MANAGER });
    
    return combinations;
  }

  /**
   * Gets valid roles for a specific module
   */
  getValidRolesForModule(module: string): string[] {
    const validCombinations = this.getValidCombinations();
    return validCombinations
      .filter(c => c.module === module)
      .map(c => c.role);
  }

  /**
   * Gets valid modules for a specific role
   */
  getValidModulesForRole(role: string): string[] {
    const validCombinations = this.getValidCombinations();
    return validCombinations
      .filter(c => c.role === role)
      .map(c => c.module);
  }
} 