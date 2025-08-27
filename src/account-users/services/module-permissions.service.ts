import {  Inject, Injectable, Logger } from '@nestjs/common';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { plainToInstance } from 'class-transformer';
import { ModulePermissionsRepository } from '../repositories/module-permissions.repository';
import { AllowableRoleDto, CreateOrUpdateModulePermissionsDto, ModulePermissionsDto } from '../dtos/module-permissions.dto';

@Injectable()
export class ModulePermissionsService {
  private readonly logger = new Logger(ModulePermissionsService.name);
  private readonly cacheKeyAll = 'module-permissions:all';
  private readonly cacheTtlSeconds = 3600;

  constructor(
    private readonly repository: ModulePermissionsRepository,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  async upsert(dto: CreateOrUpdateModulePermissionsDto): Promise<ModulePermissionsDto> {
    const saved = await this.repository.upsert(dto);
    await this.cache.del(this.cacheKeyAll);
    await this.cache.del(this.getModuleCacheKey(saved.module));
    return saved;
  }

  private getModuleCacheKey(module: string): string {
    return `module-permissions:module:${module}`;
  }

  async findAllActiveCached(): Promise<ModulePermissionsDto[]> {
    const cached = await this.cache.get<ModulePermissionsDto[]>(this.cacheKeyAll);
    if (cached) return cached;
    const fresh = await this.repository.findAllActive();
    await this.cache.set(this.cacheKeyAll, fresh, this.cacheTtlSeconds);
    return fresh;
  }

  async findByModuleCached(module: string): Promise<ModulePermissionsDto | null> {
    const key = this.getModuleCacheKey(module);
    const cached = await this.cache.get<ModulePermissionsDto>(key);
    if (cached) return cached;
    const fresh = await this.repository.findByModule(module);
    if (fresh) await this.cache.set(key, fresh, this.cacheTtlSeconds);
    return fresh;
  }

  async getValidCombinations(): Promise<Array<{ module: string; role: string; description?: string }>> {
    const modules = await this.findAllActiveCached();
    const combos: Array<{ module: string; role: string; description?: string }> = [];
    modules.forEach(m => {
      m.allowableRoles
        .filter((r: AllowableRoleDto) => !!r)
        .forEach((r: AllowableRoleDto) => {
          combos.push({ module: m.module, role: r.role, description: r.description });
        });
    });
    return combos;
  }

  async getValidModules(): Promise<Array<{ id: string; name: string; description?: string; active: boolean }>> {
    const modules = await this.findAllActiveCached();
    return modules.map(m => ({ id: m.module, name: m.module, description: m.description, active: m.active }));
  }

  async getValidRoles(): Promise<Array<{ id: string; name: string; description?: string; active: boolean }>> {
    const modules = await this.findAllActiveCached();
    const roleMap = new Map<string, { id: string; name: string; description?: string; active: boolean }>();
    modules.forEach(m => {
      m.allowableRoles.forEach(r => {
        if (!roleMap.has(r.role)) {
          roleMap.set(r.role, { id: r.role, name: r.role, description: r.description, active: true });
        }
      });
    });
    return Array.from(roleMap.values());
  }
}


