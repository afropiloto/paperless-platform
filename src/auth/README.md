# Authentication & Authorization Module

This module provides comprehensive authentication and authorization capabilities for the Trade Documents Platform using JWT tokens and role-based access control.

## Overview

The auth module consists of two main security components:

1. **JwtGuard** - Handles JWT token validation and authentication
2. **UserPermissionGuard** - Manages role-based authorization using user permissions

## JWT Authentication

### JwtGuard

The `JwtGuard` validates JWT tokens and makes user information available in your controllers.

#### How it works

1. Extracts the JWT token from the `Authorization: Bearer <token>` header
2. Verifies the token signature and expiration
3. Decodes the token payload and attaches it to `req.user`
4. Provides specific error messages for different validation failures:
   - `TokenExpiredError` → "Token has expired."
   - `JsonWebTokenError` → "Invalid token format."
   - Other errors → "Invalid token."

#### JWT Payload Structure

```typescript
interface JwtPayload {
  accountId: string;
  userId: string;
  walletAddress: string;
  permissions: UserPermission[];
  iat?: number; // Issued at
  exp?: number; // Expires at
}
```

#### Usage Examples

**Controller-level protection:**
```typescript
import { Controller, UseGuards } from '@nestjs/common';
import { JwtGuard } from '../auth/guards/jwt-guard';

@Controller('trade-documents')
@UseGuards(JwtGuard) // All endpoints require authentication
export class TradeDocumentsController {
  // All methods here will have access to req.user
}
```

**Endpoint-level protection:**
```typescript
import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { JwtGuard } from '../auth/guards/jwt-guard';

@Controller('trade-documents')
export class TradeDocumentsController {
  
  @Get('public')
  getPublicDocuments() {
    // No authentication required
  }

  @Get('private')
  @UseGuards(JwtGuard) // Only this endpoint requires authentication
  getPrivateDocuments(@Req() req) {
    const { userId, accountId, walletAddress, permissions } = req.user;
    // Use user information...
  }
}
```

**Accessing user information:**
```typescript
@Get()
@UseGuards(JwtGuard)
getDocuments(@Req() req) {
  // Full user object
  const user = req.user;
  
  // Specific properties
  const { userId, accountId, walletAddress, permissions } = req.user;
  
  // Use in business logic
  return this.service.getDocumentsForUser(userId, accountId);
}
```

## Role-Based Authorization

### UserPermissionGuard

The `UserPermissionGuard` enforces role-based access control using the `@UserAccess` decorator.

#### Permission Structure

```typescript
interface UserPermission {
  module: string;
  role: string;
}

enum Role {
  Agent = 1,
  Supervisor = 2,
  Manager = 3,
}

const ROLE_RANK = {
  Agent: 1,
  Supervisor: 2,
  Manager: 3,
};
```

#### How it works

1. Extracts user permissions from `req.user.permissions`
2. Reads required permissions from the `@UserAccess` decorator metadata
3. Compares user's role rank against required minimum role for each module
4. Returns `true` if user has sufficient permissions, `false` otherwise

#### Usage Examples

**Basic permission check:**
```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtGuard } from '../auth/guards/jwt-guard';
import { UserPermissionGuard } from '../auth/guards/user-permission.guard';
import { UserAccess } from '../auth/decorators/user-access.decorator';

@Controller('trade-documents')
@UseGuards(JwtGuard, UserPermissionGuard)
export class TradeDocumentsController {
  
  @Get()
  @UserAccess({ module: 'trade-documents', minRole: 'Agent' })
  getDocuments() {
    // Only users with Agent+ role in trade-documents module can access
  }
}
```

**Multiple permission requirements:**
```typescript
@Post()
@UserAccess(
  { module: 'trade-documents', minRole: 'Supervisor' },
  { module: 'compliance', minRole: 'Agent' }
)
createDocument() {
  // User must have Supervisor+ in trade-documents AND Agent+ in compliance
}
```

**Manager-only endpoint:**
```typescript
@Delete(':id')
@UserAccess({ module: 'trade-documents', minRole: 'Manager' })
deleteDocument() {
  // Only users with Manager role in trade-documents module can access
}
```

**Role hierarchy example:**
```typescript
@Get('reports')
@UserAccess({ module: 'analytics', minRole: 'Supervisor' })
getReports() {
  // Users with Supervisor or Manager role can access
  // Agent role users will be denied access
}
```

## Combined Security Patterns

### 1. Public Endpoints
```typescript
@Get('public')
getPublicData() {
  // No guards needed - accessible to everyone
}
```

### 2. Authenticated Endpoints
```typescript
@Get('user-data')
@UseGuards(JwtGuard)
getUserData(@Req() req) {
  // Requires valid JWT, no specific permissions needed
  return this.service.getDataForUser(req.user.userId);
}
```

### 3. Role-Protected Endpoints
```typescript
@Post('admin-action')
@UseGuards(JwtGuard, UserPermissionGuard)
@UserAccess({ module: 'administration', minRole: 'Manager' })
performAdminAction() {
  // Requires valid JWT + Manager role in administration module
}
```

### 4. Multi-Module Permissions
```typescript
@Post('complex-operation')
@UseGuards(JwtGuard, UserPermissionGuard)
@UserAccess(
  { module: 'trade-documents', minRole: 'Supervisor' },
  { module: 'risk-management', minRole: 'Agent' }
)
performComplexOperation() {
  // Requires Supervisor+ in trade-documents AND Agent+ in risk-management
}
```

## Error Handling

### Authentication Errors (JwtGuard)

- **401 Unauthorized** - Missing authentication token
- **401 Unauthorized** - Token has expired
- **401 Unauthorized** - Invalid token format
- **401 Unauthorized** - Invalid token

### Authorization Errors (UserPermissionGuard)

- **403 Forbidden** - User lacks required permissions (when guard returns `false`)

## Best Practices

### 1. Guard Order
Always apply guards in this order:
```typescript
@UseGuards(JwtGuard, UserPermissionGuard)
```

The `JwtGuard` must run first to populate `req.user` before the `UserPermissionGuard` can access user permissions.

### 2. Permission Granularity
Use specific modules and appropriate role levels:
```typescript
// Good - specific module and role
@UserAccess({ module: 'trade-documents', minRole: 'Supervisor' })

// Avoid - too broad
@UserAccess({ module: '*', minRole: 'Manager' })
```

### 3. Service Layer Security
Always validate permissions in your services as well:
```typescript
@Injectable()
export class TradeDocumentsService {
  async getDocument(id: string, user: JwtPayload) {
    // Additional business logic validation
    if (!this.hasDocumentAccess(user, id)) {
      throw new ForbiddenException('Access denied to this document');
    }
    return this.repository.findById(id);
  }
}
```

### 4. Account Isolation
Use `accountId` to ensure data isolation:
```typescript
async getDocumentsForUser(user: JwtPayload) {
  return this.repository.findByAccountId(user.accountId);
}
```

### 5. Permission Checking in Services
```typescript
@Injectable()
export class TradeDocumentsService {
  async createDocument(user: JwtPayload, createDto: CreateDocumentDto) {
    // Check if user has permission for this account
    if (user.accountId !== createDto.accountId) {
      throw new ForbiddenException('Cannot create documents for other accounts');
    }
    
    // Additional permission checks
    const hasCreatePermission = user.permissions.some(p => 
      p.module === 'trade-documents' && 
      ['Supervisor', 'Manager'].includes(p.role)
    );
    
    if (!hasCreatePermission) {
      throw new ForbiddenException('Insufficient permissions to create documents');
    }
    
    return this.repository.create(createDto);
  }
}
```

## Testing

### Testing Protected Endpoints

```typescript
describe('TradeDocumentsController', () => {
  it('should require authentication', async () => {
    const response = await request(app.getHttpServer())
      .get('/trade-documents')
      .expect(401);
  });

  it('should require proper permissions', async () => {
    const token = generateJwtToken({ 
      userId: 'user1', 
      accountId: 'account1',
      permissions: [{ module: 'other-module', role: 'Agent' }]
    });

    const response = await request(app.getHttpServer())
      .get('/trade-documents')
      .set('Authorization', `Bearer ${token}`)
      .expect(403);
  });

  it('should allow access with proper permissions', async () => {
    const token = generateJwtToken({ 
      userId: 'user1', 
      accountId: 'account1',
      permissions: [{ module: 'trade-documents', role: 'Supervisor' }]
    });

    const response = await request(app.getHttpServer())
      .get('/trade-documents')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
  });
});
```

### Mocking User Context in Tests

```typescript
describe('TradeDocumentsService', () => {
  it('should filter documents by account', async () => {
    const mockUser: JwtPayload = {
      userId: 'user1',
      accountId: 'account1',
      walletAddress: '0x123...',
      permissions: [{ module: 'trade-documents', role: 'Agent' }]
    };

    const result = await service.getDocumentsForUser(mockUser);
    expect(result.every(doc => doc.accountId === 'account1')).toBe(true);
  });
});
```

## Configuration

The JWT configuration is handled in the `AuthModule`:

```typescript
JwtModule.registerAsync({
  imports: [ConfigModule],
  useFactory: async (configService: ConfigService) => ({
    secret: configService.get<string>('jwt.secretKey'),
    signOptions: { expiresIn: '15m' },
  }),
  inject: [ConfigService],
}),
```

## Security Considerations

1. **Token Expiration**: Access tokens expire after 15 minutes
2. **Refresh Tokens**: Use refresh tokens for longer sessions
3. **Permission Validation**: Always validate permissions server-side
4. **Account Isolation**: Use `accountId` to prevent cross-account access
5. **Audit Logging**: All authentication events are logged for audit purposes
6. **Role Hierarchy**: Higher roles inherit permissions from lower roles
7. **Module Isolation**: Permissions are scoped to specific modules

## Module Structure
src/auth/
├── guards/
│ ├── jwt-guard.ts # JWT token validation
│ └── user-permission.guard.ts # Role-based authorization
├── decorators/
│ └── user-access.decorator.ts # Permission decorator
├── types/
│ ├── jwt-payload.types.ts # JWT payload interface
│ └── auth-roles.types.ts # Role definitions
├── auth.service.ts # Authentication business logic
├── auth.controller.ts # Authentication endpoints
├── auth.module.ts # Module configuration
└── README.md # This file


## Related Files

- `guards/jwt-guard.ts` - JWT token validation
- `guards/user-permission.guard.ts` - Role-based authorization
- `decorators/user-access.decorator.ts` - Permission decorator
- `types/jwt-payload.types.ts` - JWT payload interface
- `types/auth-roles.types.ts` - Role definitions
- `auth.service.ts` - Authentication business logic

## Migration Guide

### From Basic JWT to Role-Based Access

If you're migrating from basic JWT authentication to role-based access:

1. **Add UserPermissionGuard to existing endpoints:**
```typescript
// Before
@UseGuards(JwtGuard)
@Get()
getDocuments() { }

// After
@UseGuards(JwtGuard, UserPermissionGuard)
@UserAccess({ module: 'trade-documents', minRole: 'Agent' })
@Get()
getDocuments() { }
```

2. **Update JWT payload to include permissions:**
```typescript
// Ensure your JWT payload includes permissions
const jwtPayload: JwtPayload = {
  accountId: accountUser.accountId,
  userId: accountUser.id,
  walletAddress: accountUser.walletAddress,
  permissions: accountUser.permissions, // Add this
};
```

3. **Add permission checks in services:**
```typescript
// Add account isolation and permission validation
async getDocuments(user: JwtPayload) {
  return this.repository.findByAccountId(user.accountId);
}
```

This comprehensive README provides everything needed to understand and implement secure authentication and authorization in your Trade Documents Platform.