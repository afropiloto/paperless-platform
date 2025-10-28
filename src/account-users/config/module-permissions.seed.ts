export const MODULE_PERMISSIONS_SEED = [
  {
    module: 'Portal-DealDesk',
    description: 'Deal processing and management',
    allowableRoles: [
      { role: 'Agent', description: 'Can process and complete due diligence tasks for a Deal.' },
      { role: 'Supervisor', description: 'Can make decisions about deals.' },
      { role: 'Manager', description: 'Can sign Promissory Notes for Trade Deals' },
    ],
    active: true,
  },
  {
    module: 'Portal-OnboardingDesk',
    description: 'Account onboarding and verification',
    allowableRoles: [
      { role: 'Agent', description: 'Can process Due Diligence tasks for an Onboarding request.' },
      { role: 'Manager', description: 'Can make decisions about Onboarding requests' },
    ],
    active: true,
  },
  {
    module: 'Portal-Admin',
    description: 'Portal administration and system management',
    allowableRoles: [
      { role: 'Manager', description: 'Can manage Paperless Portal Users. Can manage Customer Accounts.' },
    ],
    active: true,
  },
  {
    module: 'Paperless-Trade-Documents',
    description: 'Document management and processing',
    allowableRoles: [
      { role: 'Agent', description: 'Can view, create and edit Trade Documents' },
      { role: 'Supervisor', description: 'Can delete Trade Documents. Can Issue Trade Documents' },
    ],
    active: true,
  },
  {
    module: 'Paperless-Trade-Finance',
    description: 'Trade finance processing',
    allowableRoles: [
      { role: 'Supervisor', description: 'Can create and submit trade finance requests.' },
      { role: 'Manager', description: 'Can sign promissory notes for Trade Finance. Can withdraw Trade Finance Requests.' },
    ],
    active: true,
  },
  {
    module: 'Paperless-Admin',
    description: 'Account administration and user management',
    allowableRoles: [
      { role: 'Manager', description: 'Can manage Account Users. Can manage Named Wallets for the Account.' },
    ],
    active: true,
  },
];


