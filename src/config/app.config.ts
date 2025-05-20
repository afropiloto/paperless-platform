
export default () => ({
  server: {
    port: process.env.MONGODB_URI || 3002,
  },
  database: {
    connectionString: process.env.MONGODB_URI,
  },
  jwt: {
    secretKey: process.env.JWT_SECRET_KEY,
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  },
  refreshToken: {
    secret: process.env.REFRESH_TOKEN_SECRET,
    expiresIn: process.env.REFRESH_TOKEN_EXPIRATION || '7d',
  },
  tenant: {
    financeModule: false,
    provider: {
      network: process.env.CHAIN,
      providerType: process.env.CHAIN_PROVIDER_TYPE,
      rpcUrl: process.env.CHAIN_RPC_URL
    },
    tokenRegistryAddress:process.env.TOKEN_REGISTRY_ADDRESS,
    documentStoreAddress:process.env.DOCUMENT_STORE_ADDRESS,
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD,
    dataExtractionQueueName: process.env.DATA_EXTRACTION_QUEUE_NAME || "data-extraction",
  },
  environment: process.env.NODE_ENV || 'development',
});
