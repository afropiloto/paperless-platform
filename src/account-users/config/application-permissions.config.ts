import { ApplicationPermissionsConfig } from '../types/application-permissions.types';

export const APPLICATION_PERMISSIONS_CONFIG: ApplicationPermissionsConfig = {
  modules: [
    {
      id: 'deal-desk',
      name: 'DealDesk',
      description: 'Deal processing and management',
      active: true
    },
    {
      id: 'paiperless',
      name: 'Paiperless',
      description: 'Document management and processing',
      active: true
    },
    {
      id: 'onboarding-desk',
      name: 'OnboardingDesk',
      description: 'Account onboarding and verification',
      active: true
    },
    {
      id: 'portal-admin',
      name: 'PortalAdmin',
      description: 'Portal administration and system management',
      active: true
    }
  ],
  roles: [
    {
      id: 'agent',
      name: 'Agent',
      description: 'Basic user with limited permissions',
      active: true
    },
    {
      id: 'supervisor',
      name: 'Supervisor',
      description: 'Supervisor with elevated permissions',
      active: true
    },
    {
      id: 'manager',
      name: 'Manager',
      description: 'Manager with full permissions',
      active: true
    }
  ],
  validCombinations: [
    // DealDesk combinations
    { moduleId: 'deal-desk', roleId: 'agent', active: true },
    { moduleId: 'deal-desk', roleId: 'supervisor', active: true },
    { moduleId: 'deal-desk', roleId: 'manager', active: true },
    
    // Paiperless combinations
    { moduleId: 'paiperless', roleId: 'agent', active: true },
    { moduleId: 'paiperless', roleId: 'supervisor', active: true },
    { moduleId: 'paiperless', roleId: 'manager', active: true },
    
    // OnboardingDesk combinations
    { moduleId: 'onboarding-desk', roleId: 'agent', active: true },
    { moduleId: 'onboarding-desk', roleId: 'supervisor', active: true },
    { moduleId: 'onboarding-desk', roleId: 'manager', active: true },
    
    // PortalAdmin combinations (more restricted)
    { moduleId: 'portal-admin', roleId: 'supervisor', active: true },
    { moduleId: 'portal-admin', roleId: 'manager', active: true },
    // Note: PortalAdmin doesn't allow 'agent' role for security
  ]
}; 