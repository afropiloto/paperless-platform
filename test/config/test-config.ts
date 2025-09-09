/**
 * Test Configuration
 * 
 * Centralized configuration for all test settings including:
 * - Test timeouts
 * - Database settings
 * - API endpoints
 * - Performance thresholds
 * - Environment variables
 */

export interface TestConfig {
  // Test execution settings
  timeouts: {
    default: number;
    integration: number;
    performance: number;
    database: number;
    api: number;
  };

  // Database settings
  database: {
    mongoUri: string;
    redisUrl: string;
    cleanupInterval: number;
    maxConnections: number;
  };

  // API settings
  api: {
    baseUrl: string;
    timeout: number;
    retries: number;
    retryDelay: number;
  };

  // Performance thresholds
  performance: {
    maxTestTime: number;
    maxMemoryUsage: number;
    maxApiResponseTime: number;
    maxDbOperationTime: number;
  };

  // Test data settings
  testData: {
    maxRecords: number;
    cleanupAfterTests: boolean;
    useRealData: boolean;
  };

  // Reporting settings
  reporting: {
    generateHtml: boolean;
    generateJson: boolean;
    generateMarkdown: boolean;
    includeScreenshots: boolean;
  };

  // CI/CD settings
  ci: {
    parallelWorkers: number;
    retryFailedTests: boolean;
    maxRetries: number;
    bailOnFailure: boolean;
  };
}

/**
 * Default test configuration
 */
export const defaultTestConfig: TestConfig = {
  timeouts: {
    default: 30000,        // 30 seconds
    integration: 60000,    // 1 minute
    performance: 300000,   // 5 minutes
    database: 10000,       // 10 seconds
    api: 15000,           // 15 seconds
  },

  database: {
    mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/test-db',
    redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
    cleanupInterval: 5000,  // 5 seconds
    maxConnections: 10,
  },

  api: {
    baseUrl: process.env.API_BASE_URL || 'http://localhost:3000',
    timeout: 15000,        // 15 seconds
    retries: 3,
    retryDelay: 1000,      // 1 second
  },

  performance: {
    maxTestTime: 10000,    // 10 seconds
    maxMemoryUsage: 512 * 1024 * 1024, // 512MB
    maxApiResponseTime: 5000,  // 5 seconds
    maxDbOperationTime: 2000,  // 2 seconds
  },

  testData: {
    maxRecords: 1000,
    cleanupAfterTests: true,
    useRealData: false,
  },

  reporting: {
    generateHtml: true,
    generateJson: true,
    generateMarkdown: true,
    includeScreenshots: false,
  },

  ci: {
    parallelWorkers: 4,
    retryFailedTests: true,
    maxRetries: 2,
    bailOnFailure: false,
  },
};

/**
 * Environment-specific configurations
 */
export const testConfigs: Record<string, Partial<TestConfig>> = {
  development: {
    timeouts: {
      default: 30000,
      integration: 60000,
      performance: 300000,
      database: 10000,
      api: 15000,
    },
    database: {
      mongoUri: 'mongodb://localhost:27017/test-db-dev',
      redisUrl: 'redis://localhost:6379',
      cleanupInterval: 5000,
      maxConnections: 5,
    },
    performance: {
      maxTestTime: 15000,
      maxMemoryUsage: 256 * 1024 * 1024, // 256MB
      maxApiResponseTime: 8000,
      maxDbOperationTime: 3000,
    },
  },

  staging: {
    timeouts: {
      default: 45000,
      integration: 90000,
      performance: 600000,
      database: 15000,
      api: 20000,
    },
    database: {
      mongoUri: process.env.MONGO_URI || 'mongodb://staging-mongo:27017/test-db',
      redisUrl: process.env.REDIS_URL || 'redis://staging-redis:6379',
      cleanupInterval: 10000,
      maxConnections: 20,
    },
    performance: {
      maxTestTime: 20000,
      maxMemoryUsage: 1024 * 1024 * 1024, // 1GB
      maxApiResponseTime: 10000,
      maxDbOperationTime: 5000,
    },
  },

  production: {
    timeouts: {
      default: 60000,
      integration: 120000,
      performance: 900000,
      database: 20000,
      api: 30000,
    },
    database: {
      mongoUri: process.env.MONGO_URI || 'mongodb://prod-mongo:27017/test-db',
      redisUrl: process.env.REDIS_URL || 'redis://prod-redis:6379',
      cleanupInterval: 15000,
      maxConnections: 50,
    },
    performance: {
      maxTestTime: 30000,
      maxMemoryUsage: 2048 * 1024 * 1024, // 2GB
      maxApiResponseTime: 15000,
      maxDbOperationTime: 8000,
    },
  },
};

/**
 * Get test configuration for current environment
 */
export function getTestConfig(): TestConfig {
  const environment = process.env.NODE_ENV || 'development';
  const envConfig = testConfigs[environment] || {};
  
  return {
    ...defaultTestConfig,
    ...envConfig,
    timeouts: {
      ...defaultTestConfig.timeouts,
      ...envConfig.timeouts,
    },
    database: {
      ...defaultTestConfig.database,
      ...envConfig.database,
    },
    api: {
      ...defaultTestConfig.api,
      ...envConfig.api,
    },
    performance: {
      ...defaultTestConfig.performance,
      ...envConfig.performance,
    },
    testData: {
      ...defaultTestConfig.testData,
      ...envConfig.testData,
    },
    reporting: {
      ...defaultTestConfig.reporting,
      ...envConfig.reporting,
    },
    ci: {
      ...defaultTestConfig.ci,
      ...envConfig.ci,
    },
  };
}

/**
 * Test configuration validation
 */
export function validateTestConfig(config: TestConfig): string[] {
  const errors: string[] = [];

  // Validate timeouts
  if (config.timeouts.default <= 0) {
    errors.push('Default timeout must be greater than 0');
  }
  if (config.timeouts.integration < config.timeouts.default) {
    errors.push('Integration timeout must be greater than or equal to default timeout');
  }
  if (config.timeouts.performance < config.timeouts.integration) {
    errors.push('Performance timeout must be greater than or equal to integration timeout');
  }

  // Validate database settings
  if (!config.database.mongoUri) {
    errors.push('MongoDB URI is required');
  }
  if (!config.database.redisUrl) {
    errors.push('Redis URL is required');
  }
  if (config.database.maxConnections <= 0) {
    errors.push('Max connections must be greater than 0');
  }

  // Validate API settings
  if (!config.api.baseUrl) {
    errors.push('API base URL is required');
  }
  if (config.api.timeout <= 0) {
    errors.push('API timeout must be greater than 0');
  }
  if (config.api.retries < 0) {
    errors.push('API retries must be non-negative');
  }

  // Validate performance thresholds
  if (config.performance.maxTestTime <= 0) {
    errors.push('Max test time must be greater than 0');
  }
  if (config.performance.maxMemoryUsage <= 0) {
    errors.push('Max memory usage must be greater than 0');
  }
  if (config.performance.maxApiResponseTime <= 0) {
    errors.push('Max API response time must be greater than 0');
  }
  if (config.performance.maxDbOperationTime <= 0) {
    errors.push('Max database operation time must be greater than 0');
  }

  // Validate test data settings
  if (config.testData.maxRecords <= 0) {
    errors.push('Max records must be greater than 0');
  }

  // Validate CI settings
  if (config.ci.parallelWorkers <= 0) {
    errors.push('Parallel workers must be greater than 0');
  }
  if (config.ci.maxRetries < 0) {
    errors.push('Max retries must be non-negative');
  }

  return errors;
}

/**
 * Load test configuration from environment variables
 */
export function loadTestConfigFromEnv(): TestConfig {
  const config = getTestConfig();

  // Override with environment variables if present
  if (process.env.TEST_TIMEOUT) {
    config.timeouts.default = parseInt(process.env.TEST_TIMEOUT);
  }
  if (process.env.TEST_INTEGRATION_TIMEOUT) {
    config.timeouts.integration = parseInt(process.env.TEST_INTEGRATION_TIMEOUT);
  }
  if (process.env.TEST_PERFORMANCE_TIMEOUT) {
    config.timeouts.performance = parseInt(process.env.TEST_PERFORMANCE_TIMEOUT);
  }
  if (process.env.TEST_MAX_MEMORY) {
    config.performance.maxMemoryUsage = parseInt(process.env.TEST_MAX_MEMORY);
  }
  if (process.env.TEST_PARALLEL_WORKERS) {
    config.ci.parallelWorkers = parseInt(process.env.TEST_PARALLEL_WORKERS);
  }

  return config;
}

export default getTestConfig;
