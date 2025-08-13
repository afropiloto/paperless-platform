# MFA Configuration Guide

## Overview

The Multi-Factor Authentication (MFA) service provides Time-based One-Time Password (TOTP) functionality using the speakeasy library. This guide covers the complete setup and configuration of the MFA service.

## Environment Variables

### Required Environment Variables

The following environment variables must be set to enable and configure the MFA service:

```bash
# MFA Global Configuration
MFA_ENABLED=true                           # Enable/disable MFA globally
MFA_ISSUER=Trade Documents Platform        # Issuer name for authenticator apps
MFA_WINDOW=1                               # Time window for TOTP validation (clock drift tolerance)
MFA_BACKUP_CODES_COUNT=10                  # Number of backup codes to generate

# TOTP Algorithm Configuration
MFA_ALGORITHM=sha256                       # TOTP algorithm: sha1, sha256, or sha512
MFA_DIGITS=6                               # Number of digits in TOTP codes: 6 or 8
MFA_PERIOD=30                              # Time step in seconds (default: 30)
MFA_SECRET_LENGTH=20                       # Secret length in bytes (default: 20)
```

### Environment Variable Details

#### MFA_ENABLED
- **Type**: Boolean
- **Default**: `false`
- **Description**: Master switch to enable/disable MFA functionality globally
- **Values**: `true` or `false`
- **Example**: `MFA_ENABLED=true`

#### MFA_ISSUER
- **Type**: String
- **Default**: `Trade Documents Platform`
- **Description**: The issuer name that appears in authenticator apps
- **Example**: `MFA_ISSUER=My Company Platform`

#### MFA_WINDOW
- **Type**: Integer
- **Default**: `1`
- **Description**: Time window for TOTP validation to handle clock drift
- **Values**: `1` (30 seconds), `2` (60 seconds), etc.
- **Example**: `MFA_WINDOW=2`

#### MFA_BACKUP_CODES_COUNT
- **Type**: Integer
- **Default**: `10`
- **Description**: Number of backup codes to generate for emergency access
- **Range**: `5` to `20`
- **Example**: `MFA_BACKUP_CODES_COUNT=15`

#### MFA_ALGORITHM
- **Type**: String
- **Default**: `sha1`
- **Description**: Cryptographic algorithm used for TOTP generation
- **Values**: `sha1`, `sha256`, `sha512`
- **Example**: `MFA_ALGORITHM=sha256`

#### MFA_DIGITS
- **Type**: Integer
- **Default**: `6`
- **Description**: Number of digits in generated TOTP codes
- **Values**: `6` or `8`
- **Example**: `MFA_DIGITS=8`

#### MFA_PERIOD
- **Type**: Integer
- **Default**: `30`
- **Description**: Time step in seconds for TOTP generation
- **Values**: `30` (standard), `60` (extended)
- **Example**: `MFA_PERIOD=60`

#### MFA_SECRET_LENGTH
- **Type**: Integer
- **Default**: `20`
- **Description**: Length of generated TOTP secrets in bytes
- **Range**: `16` to `32`
- **Example**: `MFA_SECRET_LENGTH=32`

## Configuration Examples

### Basic Configuration (Recommended for Production)

```bash
# Enable MFA with standard settings
MFA_ENABLED=true
MFA_ISSUER=Trade Documents Platform
MFA_WINDOW=1
MFA_BACKUP_CODES_COUNT=10
MFA_ALGORITHM=sha1
MFA_DIGITS=6
MFA_PERIOD=30
MFA_SECRET_LENGTH=20
```

### High Security Configuration

```bash
# Enhanced security with SHA256 and 8-digit codes
MFA_ENABLED=true
MFA_ISSUER=Trade Documents Platform
MFA_WINDOW=1
MFA_BACKUP_CODES_COUNT=15
MFA_ALGORITHM=sha256
MFA_DIGITS=8
MFA_PERIOD=30
MFA_SECRET_LENGTH=32
```

### Development/Testing Configuration

```bash
# Development settings with extended time windows
MFA_ENABLED=true
MFA_ISSUER=Trade Documents Platform (Dev)
MFA_WINDOW=2
MFA_BACKUP_CODES_COUNT=5
MFA_ALGORITHM=sha1
MFA_DIGITS=6
MFA_PERIOD=60
MFA_SECRET_LENGTH=16
```

### Disabled Configuration

```bash
# MFA completely disabled
MFA_ENABLED=false
# Other variables are ignored when MFA_ENABLED=false
```

## Setup Instructions

### 1. Environment Configuration

1. **Copy the environment template**:
   ```bash
   cp env.example .env
   ```

2. **Edit the `.env` file** and set your MFA configuration:
   ```bash
   # MFA Configuration
   MFA_ENABLED=true
   MFA_ISSUER=Your Company Name
   MFA_WINDOW=1
   MFA_BACKUP_CODES_COUNT=10
   MFA_ALGORITHM=sha1
   MFA_DIGITS=6
   MFA_PERIOD=30
   MFA_SECRET_LENGTH=20
   ```

3. **Restart your application** to load the new configuration

### 2. Application Configuration

The MFA service automatically reads configuration from environment variables through the `ConfigService`. No additional code changes are required.

### 3. Database Schema

Ensure your user schema includes the following MFA-related fields:

```typescript
interface User {
  // ... other fields
  mfaEnabled: boolean;           // Whether MFA is enabled for this user
  mfaSecret: string;            // TOTP secret (base32 encoded)
  mfaBackupCodes: string[];     // Array of backup codes
  mfaSetupCompleted?: Date;     // When MFA setup was completed
}
```

## Security Considerations

### Algorithm Selection

- **SHA1**: Fastest, widely supported, sufficient for most use cases
- **SHA256**: Better security, moderate performance impact
- **SHA512**: Highest security, noticeable performance impact

### Time Window Configuration

- **MFA_WINDOW=1**: Standard 30-second window (±30 seconds)
- **MFA_WINDOW=2**: Extended 60-second window (±60 seconds)
- **Higher values**: More permissive but less secure

### Secret Length

- **16 bytes**: Minimum recommended length
- **20 bytes**: Standard length (recommended)
- **32 bytes**: Maximum length for enhanced security

## Testing Configuration

### Test Environment Setup

```bash
# Test-specific MFA configuration
MFA_ENABLED=true
MFA_ISSUER=Test Platform
MFA_WINDOW=1
MFA_BACKUP_CODES_COUNT=5
MFA_ALGORITHM=sha1
MFA_DIGITS=6
MFA_PERIOD=30
MFA_SECRET_LENGTH=20
```

### Running Tests

```bash
# Run all MFA tests
pnpm test -- --testPathPattern=mfa.service.spec.ts

# Run specific test categories
pnpm test -- --testNamePattern="verifyTotp"
```

## Troubleshooting

### Common Issues

#### MFA Not Working
1. **Check MFA_ENABLED**: Ensure it's set to `true`
2. **Verify environment variables**: All required variables must be set
3. **Check application restart**: Configuration changes require restart

#### TOTP Validation Fails
1. **Check MFA_WINDOW**: Increase if clock drift is suspected
2. **Verify MFA_ALGORITHM**: Must match authenticator app settings
3. **Check MFA_DIGITS**: Must match authenticator app display

#### QR Code Generation Fails
1. **Verify MFA_ISSUER**: Must be a valid string
2. **Check MFA_SECRET_LENGTH**: Must be valid (16-32 bytes)
3. **Ensure QRCode library**: Verify `qrcode` package is installed

### Debug Mode

Enable debug logging by setting the log level:

```bash
# In your application configuration
LOG_LEVEL=debug
```

### Configuration Validation

The MFA service includes built-in validation:

- **Secret format validation**: Ensures base32 encoding
- **Algorithm validation**: Verifies supported algorithms
- **Parameter range checking**: Validates numeric parameters

## Migration Guide

### From Previous MFA Implementation

1. **Backup existing configuration**
2. **Set new environment variables**
3. **Update application configuration**
4. **Test with existing users**
5. **Monitor for issues**

### Configuration Changes

When changing MFA configuration:

1. **Notify users** of upcoming changes
2. **Test thoroughly** in staging environment
3. **Deploy during low-traffic periods**
4. **Monitor logs** for errors
5. **Provide user guidance** for reconfiguration

## Best Practices

### Security
- Use SHA256 or SHA512 for high-security applications
- Keep MFA_WINDOW as low as possible
- Regularly rotate backup codes
- Monitor failed MFA attempts

### Performance
- Use SHA1 for high-traffic applications
- Keep MFA_SECRET_LENGTH at 20 bytes
- Use standard 30-second periods
- Implement caching for frequently accessed data

### User Experience
- Provide clear setup instructions
- Include backup code storage guidance
- Offer multiple authenticator app options
- Provide troubleshooting resources

## API Endpoints

The MFA service provides the following endpoints:

- `POST /auth/mfa/setup` - Initialize MFA setup
- `POST /auth/mfa/verify-setup` - Complete MFA setup
- `POST /auth/mfa/verify` - Verify MFA during login
- `POST /auth/mfa/disable` - Disable MFA for user
- `GET /auth/mfa/status` - Get MFA status

## Support

For MFA configuration issues:

1. **Check logs** for error messages
2. **Verify environment variables** are set correctly
3. **Test configuration** with minimal settings
4. **Review security requirements** for your use case
5. **Consult documentation** for advanced configuration

## References

- [RFC 6238 - TOTP Specification](https://tools.ietf.org/html/rfc6238)
- [Speakeasy Library Documentation](https://github.com/speakeasyjs/speakeasy)
- [Google Authenticator](https://github.com/google/google-authenticator)
- [Authy Documentation](https://authy.com/developers/)
