export interface ApplicationModule {
  id: string;
  name: string;
  description?: string;
  active: boolean;
}

export interface ApplicationRole {
  id: string;
  name: string;
  description?: string;
  active: boolean;
}

export interface PermissionCombination {
  moduleId: string;
  roleId: string;
  active: boolean;
}

export interface ApplicationPermissionsConfig {
  modules: ApplicationModule[];
  roles: ApplicationRole[];
  validCombinations: PermissionCombination[];
}

export interface UserPermission {
  moduleId: string;
  roleId: string;
} 