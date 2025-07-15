# API Key Authentication Module

This module provides API key-based authentication for securing endpoints that need to be accessed by external services, integrations, or automated systems.

## Overview

The API Key Authentication module consists of:

1. **ApiKeyGuard** - Validates API keys and enforces access group permissions
2. **ApiKeyAuthService** - Handles API key validation and caching
3. **ClientAccess decorator** - Defines required access groups for endpoints
4. **Utility functions** - For generating secure API keys

## How It Works

### API Key Format
API keys follow the format: `keyId:rawKey`
- **keyId**: 8-character hexadecimal identifier
- **rawKey**: 32-character hexadecimal secret key
- **Example**: `a1b2c3d4:e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6`

### Authentication Flow
1. Client sends API key in `X-API-Key` header
2. Guard extracts and validates the key format
3. Service validates the key against stored hash
4. Access groups are checked against endpoint requirements
5. Client information is attached to the request

## Usage

### Basic API Key Protection

**Controller-level protection:**
```typescript
import { Controller, UseGuards } from '@nestjs/common';
import { ApiKeyGuard } from '../api-key-auth/api-key.guard';

@Controller('external-api')
@UseGuards(ApiKeyGuard) // All endpoints require valid API key
export class ExternalApiController {
  // All methods here require API key authentication
}
```

**Endpoint-level protection:**
```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiKeyGuard } from '../api-key-auth/api-key.guard';

@Controller('mixed-api')
export class MixedApiController {
  
  @Get('public')
  getPublicData() {
    // No authentication required
  }

  @Get('protected')
  @UseGuards(ApiKeyGuard) // Only this endpoint requires API key
  getProtectedData() {
    // Requires valid API key
  }
}
```

### Access Group-Based Authorization

**Single access group requirement:**
```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiKeyGuard } from '../api-key-auth/api-key.guard';
import { ClientAccess } from '../api-key-auth/decorators/client-access.decorator';

@Controller('trade-documents')
@UseGuards(ApiKeyGuard)
export class TradeDocumentsController {
  
  @Get()
  @ClientAccess('trade-documents')
  getDocuments() {
    // Only clients with 'trade-documents' access group can access
  }
}
```

**Multiple access group requirements:**
```typescript
@Post()
@ClientAccess('trade-documents', 'write-access')
createDocument() {
  // Client must have BOTH 'trade-documents' AND 'write-access' groups
}
```

**Controller-level access group:**
```typescript
@Controller('admin-api')
@UseGuards(ApiKeyGuard)
@ClientAccess('admin')
export class AdminApiController {
  // All endpoints require 'admin' access group
}
```

### Accessing Client Information

**In controllers:**
```typescript
@Get()
@UseGuards(ApiKeyGuard)
@ClientAccess('trade-documents')
getDocuments(@Req() req) {
  // Access client information
  const client = req.client;
  
  // Available properties:
  // - client.keyId: string
  // - client.name: string
  // - client.accessGroups: string[]
  // - client.originator: string (same as name)
  
  return this.service.getDocumentsForClient(client.keyId);
}
```

**In services:**
```typescript
@Injectable()
export class TradeDocumentsService {
  async getDocumentsForClient(clientKeyId: string) {
    // Use client information for business logic
    return this.repository.findByClientId(clientKeyId);
  }
}
```

## Client Configuration

### Client Schema
```typescript
interface Client {
  keyId: string;           // Unique identifier
  apiKeyHash: string;      // Bcrypt hash of the raw key
  accessGroups: string[];  // Array of access groups
  name: string;           // Human-readable client name
}
```

### Access Groups
Access groups are custom strings that define what resources a client can access:

```typescript
// Example access groups
const accessGroups = [
  'trade-documents',    // Can access trade document endpoints
  'analytics',         // Can access analytics endpoints
  'admin',            // Full administrative access
  'read-only',        // Read-only access to all resources
  'integration',      // Integration-specific access
];
```

## API Key Generation

### Using the Utility Function
```typescript
import { generateApiKey } from '../api-key-auth/api-key-auth.utils';

async function createNewClient() {
  const apiKey = await generateApiKey();
  
  console.log('Generated API Key:', apiKey.fullKey);
  console.log('Key ID:', apiKey.keyId);
  console.log('Raw Key:', apiKey.rawKey);
  console.log('Hashed Key:', apiKey.hashedKey);
  
  // Store in database
  const client = new Client({
    keyId: apiKey.keyId,
    apiKeyHash: apiKey.hashedKey,
    name: 'My Integration',
    accessGroups: ['trade-documents', 'read-only']
  });
  
  await client.save();
  
  // Return the full key to the client (only once!)
  return apiKey.fullKey;
}
```

### Manual Generation
```typescript
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

async function generateApiKeyManually() {
  const keyId = crypto.randomBytes(4).toString('hex'); // 8 characters
  const rawKey = crypto.randomBytes(16).toString('hex'); // 32 characters
  const fullKey = `${keyId}:${rawKey}`;
  const hashedKey = await bcrypt.hash(rawKey, 10);
  
  return { keyId, rawKey, fullKey, hashedKey };
}
```

## Error Handling

### Authentication Errors
- **No API Key**: Returns `false` (403 Forbidden)
- **Invalid Format**: Returns `false` (403 Forbidden)
- **Invalid Key**: Returns `false` (403 Forbidden)
- **Expired/Revoked**: Returns `false` (403 Forbidden)

### Authorization Errors
- **Insufficient Access Groups**: Returns `false` (403 Forbidden)

## Best Practices

### 1. Key Security
```typescript
// ✅ Good: Use environment variables for sensitive keys
const apiKey = process.env.API_KEY;

// ❌ Bad: Hardcode API keys
const apiKey = 'a1b2c3d4:e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6';
```

### 2. Access Group Design
```typescript
// ✅ Good: Specific, descriptive access groups
@ClientAccess('trade-documents', 'write-access')

// ❌ Bad: Too broad or unclear
@ClientAccess('all', 'admin')
```

### 3. Client Isolation
```typescript
@Injectable()
export class TradeDocumentsService {
  async getDocumentsForClient(clientKeyId: string) {
    // Always filter by client to ensure data isolation
    return this.repository.findByClientId(clientKeyId);
  }
}
```

### 4. Key Rotation
```typescript
// Implement key rotation strategy
async function rotateApiKey(clientId: string) {
  const newApiKey = await generateApiKey();
  
  // Update database with new hash
  await this.clientModel.updateOne(
    { keyId: clientId },
    { apiKeyHash: newApiKey.hashedKey }
  );
  
  // Clear cache
  await this.cacheManager.del(`api-client:${clientId}`);
  
  return newApiKey.fullKey;
}
```

## Caching

The module uses Redis caching to improve performance:

- **Cache Key**: `api-client:${keyId}`
- **Cache Duration**: 10 minutes
- **Cache Content**: Client info including hashed API key

### Cache Invalidation
```typescript
// Clear cache when client is updated
async function updateClient(clientId: string, updates: Partial<Client>) {
  await this.clientModel.updateOne({ keyId: clientId }, updates);
  await this.cacheManager.del(`api-client:${clientId}`);
}
```

## Testing

### Testing Protected Endpoints
```typescript
describe('TradeDocumentsController', () => {
  it('should require API key', async () => {
    const response = await request(app.getHttpServer())
      .get('/trade-documents')
      .expect(403);
  });

  it('should require proper access groups', async () => {
    const apiKey = 'valid-key-id:valid-raw-key';
    
    const response = await request(app.getHttpServer())
      .get('/trade-documents')
      .set('X-API-Key', apiKey)
      .expect(403); // If client doesn't have 'trade-documents' access group
  });

  it('should allow access with valid API key and permissions', async () => {
    const apiKey = 'valid-key-id:valid-raw-key';
    
    const response = await request(app.getHttpServer())
      .get('/trade-documents')
      .set('X-API-Key', apiKey)
      .expect(200);
  });
});
```

### Mocking API Key Authentication
```typescript
describe('TradeDocumentsService', () => {
  it('should filter by client', async () => {
    const mockClient = {
      keyId: 'test-client',
      name: 'Test Client',
      accessGroups: ['trade-documents'],
      originator: 'Test Client'
    };

    // Mock the guard to inject client info
    const req = { client: mockClient };
    
    const result = await service.getDocumentsForClient(req.client.keyId);
    expect(result.every(doc => doc.clientId === 'test-client')).toBe(true);
  });
});
```

## Configuration

### Module Setup
```typescript
@Module({
  imports: [
    MongooseModule.forFeature([{ name: Client.name, schema: ClientSchema }]),
    CacheModule.register()
  ],
  providers: [ApiKeyAuthService],
  exports: [ApiKeyAuthService]
})
export class ApiKeyAuthModule {}
```

### Environment Variables
```bash
# Redis cache configuration (if using Redis)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-password

# MongoDB connection (for client storage)
MONGODB_URI=mongodb://localhost:27017/your-database
```

## Security Considerations

1. **Key Storage**: API keys are hashed using bcrypt before storage
2. **Key Transmission**: Use HTTPS to protect API keys in transit
3. **Key Rotation**: Implement regular key rotation policies
4. **Access Groups**: Use principle of least privilege for access groups
5. **Rate Limiting**: Consider implementing rate limiting per API key
6. **Audit Logging**: Log all API key usage for security monitoring
7. **Key Expiration**: Consider implementing key expiration policies

## Integration Examples

### cURL Example
```bash
curl -X GET \
  https://api.example.com/trade-documents \
  -H 'X-API-Key: a1b2c3d4:e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6'
```

### JavaScript/TypeScript Example
```typescript
const response = await fetch('https://api.example.com/trade-documents', {
  method: 'GET',
  headers: {
    'X-API-Key': 'a1b2c3d4:e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6',
    'Content-Type': 'application/json'
  }
});
```

### Python Example
```python
import requests

headers = {
    'X-API-Key': 'a1b2c3d4:e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6'
}

response = requests.get('https://api.example.com/trade-documents', headers=headers)
```

## Module Structure
├── api-key.guard.ts # API key validation guard
├── api-key-auth.service.ts # Authentication service
├── api-key-auth.module.ts # Module configuration
├── api-key-auth.utils.ts # Key generation utilities
├── decorators/
│ └── client-access.decorator.ts # Access group decorator
├── types/
│ └── api-key-auth.types.ts # Type definitions
├── schemas/
│ └── client.schema.ts # MongoDB client schema
└── README.md # This file
