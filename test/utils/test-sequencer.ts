import { TestSequencer } from '@jest/test-sequencer';

/**
 * Custom Test Sequencer for Optimized Test Execution
 * 
 * This sequencer optimizes test execution order to:
 * 1. Run faster, isolated tests first
 * 2. Run integration tests after unit tests
 * 3. Run performance tests last
 * 4. Group related tests together
 */
export default class CustomTestSequencer extends TestSequencer {
  sort(tests: any[]): any[] {
    // Define test execution priority
    const testPriority = {
      // High priority - fast, isolated tests
      'healthcheck': 1,
      'auth-controller': 2,
      'accounts-controller': 3,
      'account-users-controller': 4,
      
      // Medium priority - module-specific tests
      'trade-documents-controller': 10,
      'document-signing-controller': 11,
      'verify-trade-document-controller': 12,
      'issue-trade-document-controller': 13,
      'share-links-controller': 14,
      
      // Medium priority - finance tests
      'trade-finance-controller': 20,
      'deal-processing-controller': 21,
      'onboarding-controller': 22,
      'due-diligence-checklists-controller': 23,
      
      // Medium priority - management tests
      'user-management-controller': 30,
      'module-permissions-controller': 31,
      'named-wallets-controller': 32,
      'analytics-controller': 33,
      'audit-controller': 34,
      
      // Lower priority - integration tests
      'registration-controller': 40,
      'tenant-controller': 41,
      
      // Lowest priority - comprehensive integration tests
      'end-to-end-workflows': 50,
      'test-scenarios': 51,
    };

    // Sort tests by priority
    const sortedTests = tests.sort((a, b) => {
      const aPath = a.path;
      const bPath = b.path;
      
      // Extract test category from path
      const getTestCategory = (path: string): string => {
        if (path.includes('healthcheck')) return 'healthcheck';
        if (path.includes('auth-controller')) return 'auth-controller';
        if (path.includes('accounts-controller')) return 'accounts-controller';
        if (path.includes('account-users-controller')) return 'account-users-controller';
        if (path.includes('trade-documents-controller')) return 'trade-documents-controller';
        if (path.includes('document-signing-controller')) return 'document-signing-controller';
        if (path.includes('verify-trade-document-controller')) return 'verify-trade-document-controller';
        if (path.includes('issue-trade-document-controller')) return 'issue-trade-document-controller';
        if (path.includes('share-links-controller')) return 'share-links-controller';
        if (path.includes('trade-finance-controller')) return 'trade-finance-controller';
        if (path.includes('deal-processing-controller')) return 'deal-processing-controller';
        if (path.includes('onboarding-controller')) return 'onboarding-controller';
        if (path.includes('due-diligence-checklists-controller')) return 'due-diligence-checklists-controller';
        if (path.includes('user-management-controller')) return 'user-management-controller';
        if (path.includes('module-permissions-controller')) return 'module-permissions-controller';
        if (path.includes('named-wallets-controller')) return 'named-wallets-controller';
        if (path.includes('analytics-controller')) return 'analytics-controller';
        if (path.includes('audit-controller')) return 'audit-controller';
        if (path.includes('registration-controller')) return 'registration-controller';
        if (path.includes('tenant-controller')) return 'tenant-controller';
        if (path.includes('end-to-end-workflows')) return 'end-to-end-workflows';
        if (path.includes('test-scenarios')) return 'test-scenarios';
        
        return 'unknown';
      };

      const aCategory = getTestCategory(aPath);
      const bCategory = getTestCategory(bPath);
      
      const aPriority = testPriority[aCategory] || 999;
      const bPriority = testPriority[bCategory] || 999;
      
      // If same priority, sort alphabetically
      if (aPriority === bPriority) {
        return aPath.localeCompare(bPath);
      }
      
      return aPriority - bPriority;
    });

    // Log test execution order for debugging
    if (process.env.JEST_VERBOSE === 'true') {
      console.log('\n📋 Test Execution Order:');
      sortedTests.forEach((test, index) => {
        const category = getTestCategory(test.path);
        console.log(`${index + 1}. ${category} - ${test.path.split('/').pop()}`);
      });
      console.log('');
    }

    return sortedTests;
  }
}

// Helper function to get test category (duplicated for use in logging)
function getTestCategory(path: string): string {
  if (path.includes('healthcheck')) return 'healthcheck';
  if (path.includes('auth-controller')) return 'auth-controller';
  if (path.includes('accounts-controller')) return 'accounts-controller';
  if (path.includes('account-users-controller')) return 'account-users-controller';
  if (path.includes('trade-documents-controller')) return 'trade-documents-controller';
  if (path.includes('document-signing-controller')) return 'document-signing-controller';
  if (path.includes('verify-trade-document-controller')) return 'verify-trade-document-controller';
  if (path.includes('issue-trade-document-controller')) return 'issue-trade-document-controller';
  if (path.includes('share-links-controller')) return 'share-links-controller';
  if (path.includes('trade-finance-controller')) return 'trade-finance-controller';
  if (path.includes('deal-processing-controller')) return 'deal-processing-controller';
  if (path.includes('onboarding-controller')) return 'onboarding-controller';
  if (path.includes('due-diligence-checklists-controller')) return 'due-diligence-checklists-controller';
  if (path.includes('user-management-controller')) return 'user-management-controller';
  if (path.includes('module-permissions-controller')) return 'module-permissions-controller';
  if (path.includes('named-wallets-controller')) return 'named-wallets-controller';
  if (path.includes('analytics-controller')) return 'analytics-controller';
  if (path.includes('audit-controller')) return 'audit-controller';
  if (path.includes('registration-controller')) return 'registration-controller';
  if (path.includes('tenant-controller')) return 'tenant-controller';
  if (path.includes('end-to-end-workflows')) return 'end-to-end-workflows';
  if (path.includes('test-scenarios')) return 'test-scenarios';
  
  return 'unknown';
}
