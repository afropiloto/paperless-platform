import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { UserPermission } from '../types';
import { plainToInstance } from 'class-transformer';
import { ModuleRoleCombinationDto, ModulesDto, RolesDto } from '../dtos/permissions.dto';
import { ModulePermissionsService } from './module-permissions.service';

@Injectable()
export class PermissionsValidationService {
  private readonly logger = new Logger(PermissionsValidationService.name);
  constructor(private readonly modulePermissionsService: ModulePermissionsService) {}

  /**
   * Validates a single permission combination
   */
  async validatePermission(permission: UserPermission): Promise<void> {
    const { module, role } = permission;

    // Validate against configured module-permissions
    const validCombinations = await this.getValidCombinations();
    const modules = await this.getValidModules();
    const roles = await this.getValidRoles();
    const moduleValid = modules.some(m => m.id === module);
    const roleValid = roles.some(r => r.id === role);
    if (!moduleValid) {
      throw new BadRequestException(`Invalid module: ${module}`);
    }
    if (!roleValid) {
      throw new BadRequestException(`Invalid role: ${role}`);
    }
    const isValidCombination = validCombinations.some(c => c.module === module && c.role === role);
    
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
  async validatePermissions(permissions: UserPermission[]): Promise<void> {
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
    for (const permission of permissions) {
      await this.validatePermission(permission);
    }
  }

  /**
   * Gets all valid modules
   */
  async getValidModules() {
    const modules = await this.modulePermissionsService.getValidModules();
    return plainToInstance(ModulesDto, modules);
  }

  /**
   * Gets all valid roles
   */
  async getValidRoles() {
    const roles = await this.modulePermissionsService.getValidRoles();
    return plainToInstance(RolesDto, roles);
  }

  /**
   * Gets all valid permission combinations
   */
  async getValidCombinations() {
    const combos = await this.modulePermissionsService.getValidCombinations();
    return plainToInstance(ModuleRoleCombinationDto, combos);
  }

  /**
   * Gets valid roles for a specific module
   */
  async getValidRolesForModule(module: string): Promise<string[]> {
    const validCombinations = await this.getValidCombinations();
    return validCombinations.filter(c => c.module === module).map(c => c.role);
  }

  /**
   * Gets valid modules for a specific role
   */
  async getValidModulesForRole(role: string): Promise<string[]> {
    const validCombinations = await this.getValidCombinations();
    return validCombinations.filter(c => c.role === role).map(c => c.module);
  }
} 