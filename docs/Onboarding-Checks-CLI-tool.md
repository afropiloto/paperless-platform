# Scripts

This directory contains utility scripts for the Trade Docs Platform.

## Add Onboarding Check CLI

The `add-onboarding-check.ts` script allows you to manually add automated checks to the onboarding-checks-queue for testing and debugging purposes.

### Usage

```bash
pnpm run add-onboarding-check [options]
```

### Options

| Option | Short | Description | Required |
|--------|-------|-------------|----------|
| `--event-type` | `-e` | Event type to process | ✅ |
| `--checklist-instance-id` | `-c` | Checklist instance ID | ✅ |
| `--registration-id` | `-r` | Registration ID | ✅ |
| `--onboarding-processing-id` | `-o` | Onboarding processing ID | ✅ |
| `--section-title` | `-s` | Section title | ✅ |
| `--item-title` | `-i` | Item title | ✅ |
| `--check-config` | `-k` | Check configuration as JSON string | ❌ |
| `--help` | `-h` | Show help message | ❌ |

### Valid Event Types

- `ONBOARDING_CHECK_DUPLICATE_REGISTRATION`
- `ONBOARDING_CHECK_EMAIL_UNIQUENESS`
- `ONBOARDING_CHECK_WALLET_UNIQUENESS`

### Examples

#### Basic Usage

```bash
# Add a duplicate registration check
pnpm run script:add-onboarding-check \
  --event-type ONBOARDING_CHECK_DUPLICATE_REGISTRATION \
  --checklist-instance-id 507f1f77bcf86cd799439011 \
  --registration-id REG-12345 \
  --onboarding-processing-id 507f1f77bcf86cd799439012 \
  --section-title "Company Verification" \
  --item-title "Check for duplicate company registrations"
```

#### With Custom Configuration

```bash
# Add a wallet uniqueness check with custom retry settings
pnpm run add-onboarding-check \
  --event-type ONBOARDING_CHECK_WALLET_UNIQUENESS \
  --checklist-instance-id 507f1f77bcf86cd799439011 \
  --registration-id REG-12345 \
  --onboarding-processing-id 507f1f77bcf86cd799439012 \
  --section-title "Wallet Verification" \
  --item-title "Check wallet address uniqueness" \
  --check-config '{"timeout": 30000, "retryAttempts": 5}'
```

#### Short Form

```bash
# Using short options
pnpm run add-onboarding-check \
  -e ONBOARDING_CHECK_EMAIL_UNIQUENESS \
  -c 507f1f77bcf86cd799439011 \
  -r REG-12345 \
  -o 507f1f77bcf86cd799439012 \
  -s "Contact Verification" \
  -i "Check email uniqueness"
```

### Environment Variables

The script uses the following environment variables for Redis connection:

- `REDIS_HOST` - Redis host (default: localhost)
- `REDIS_PORT` - Redis port (default: 6379)
- `REDIS_PASSWORD` - Redis password (optional)

### Output

The script provides detailed output including:

- ✅ Job addition confirmation
- 📊 Job status after processing
- 🎉 Success messages
- ❌ Error messages with details

### Troubleshooting

#### Connection Issues

If you encounter Redis connection issues:

1. Ensure Redis is running
2. Check environment variables
3. Verify network connectivity

#### Job Processing Issues

If jobs are not being processed:

1. Ensure the application is running
2. Check that processors are registered
3. Verify queue configuration
4. Check application logs

#### Validation Errors

If you get validation errors:

1. Ensure all required parameters are provided
2. Check that event type is valid
3. Verify JSON format for check-config
4. Use `--help` for usage information

### Development

To modify the script:

1. Edit `scripts/add-onboarding-check.ts`
2. Test with various parameter combinations
3. Update this README if adding new features
4. Ensure proper error handling and validation

