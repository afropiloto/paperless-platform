# Role System Migration Guide

## Overview

The role-based access control (RBAC) system has been migrated from a **hierarchical role system** to a **cumulative role system**. This change allows users to have multiple roles for a module, providing more flexible and granular permission control.

## What Changed

### Before: Hierarchical Roles
- Roles were hierarchical: `Agent (1) < Supervisor (2) < Manager (3)`
- A user with `Supervisor` role automatically had `Agent` permissions
- The system used `minRole` to specify minimum required role level
- Access was granted if user's role rank was >= required rank

### After: Cumulative Roles
- Roles are now independent and cumulative
- A user can have multiple roles for a module (e.g., both `Agent` and `Supervisor`)
- The system uses `roles` array to specify acceptable roles
- Access is granted if user has any of the specified roles for the required module

## Code Changes Required

### 1. Update `@UserAccess` Decorator Usage

**Before:**
```typescript
@UserAccess({ module: 'trade-documents', minRole: 'Supervisor' })
```

**After:**
```typescript
@UserAccess({ module: 'trade-documents', roles: ['Supervisor', 'Manager'] })
```

### 2. Common Migration Patterns

#### Single Role Endpoint
**Before:**
```typescript
@UserAccess({ module: 'finance', minRole: 'Manager' })
```

**After:**
```typescript
@UserAccess({ module: 'finance', roles: ['Manager'] })
```

#### Multiple Role Endpoint (Equivalent to old minRole)
**Before:**
```typescript
@UserAccess({ module: 'trade-documents', minRole: 'Supervisor' })
// This allowed Supervisor and Manager
```

**After:**
```typescript
@UserAccess({ module: 'trade-documents', roles: ['Supervisor', 'Manager'] })
// Explicitly specify all allowed roles
```

#### Multi-Module Endpoint
**Before:**
```typescript
@UserAccess(
  { module: 'trade-documents', minRole: 'Supervisor' },
  { module: 'compliance', minRole: 'Agent' }
)
```

**After:**
```typescript
@UserAccess(
  { module: 'trade-documents', roles: ['Supervisor', 'Manager'] },
  { module: 'compliance', roles: ['Agent', 'Supervisor', 'Manager'] }
)
```

## Migration Steps

### Step 1: Update Decorator Usage
Search your codebase for `@UserAccess` decorators and update them:

```bash
# Find all usages
grep -r "@UserAccess" src/

# Update each usage from minRole to roles array
```

### Step 2: Update Role Definitions
If you have custom role definitions, update them to use string values instead of numeric ranks:

**Before:**
```typescript
enum Role {
  Agent = 1,
  Supervisor = 2,
  Manager = 3,
}
```

**After:**
```typescript
enum Role {
  Agent = 'Agent',
  Supervisor = 'Supervisor',
  Manager = 'Manager',
}
```

### Step 3: Remove Role Ranking Logic
Remove any code that compares role ranks:

**Before:**
```typescript
const hasAccess = userRole >= requiredRole;
```

**After:**
```typescript
const hasAccess = allowedRoles.includes(userRole);
```

## Benefits of the New System

1. **Flexibility**: Users can have multiple roles for a module
2. **Granular Control**: More precise permission management
3. **Clarity**: Explicit role requirements instead of implicit hierarchy
4. **Scalability**: Easier to add new roles without breaking existing logic

## Testing

After migration, test your endpoints to ensure:

1. Users with the correct roles can access endpoints
2. Users without the required roles are denied access
3. Multi-role scenarios work correctly
4. Edge cases (no roles, invalid roles) are handled properly

## Rollback Plan

If you need to rollback:

1. Revert the decorator changes
2. Restore the old `minRole` interface
3. Update the guard to use role ranking again
4. Restore the `ROLE_RANK` constant

## Support

For questions or issues with the migration, refer to:
- Updated README files
- Code examples in the auth module
- Test cases for role validation
